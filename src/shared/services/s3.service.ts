import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as colors from 'colors';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface S3UploadResult {
  url: string;
  key: string;
  bucket: string;
  etag: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private config: ConfigService) {
    const region = this.config.get('AWS_REGION');
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');
    const nodeEnv = this.config.get('NODE_ENV') || 'development';

    // Dynamically select bucket based on environment
    const bucketName = this.getBucketNameForEnvironment(nodeEnv);

    if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required AWS S3 configuration. Please check your .env file.');
    }

    this.bucketName = bucketName;
    this.region = region;

    // Get optional endpoint override (useful for custom S3-compatible services or specific regions)
    const endpoint = this.config.get('AWS_S3_ENDPOINT');
    
    const s3ClientConfig: Record<string, any> = {
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    // Add endpoint if specified (useful for custom S3 endpoints or specific region requirements)
    if (endpoint) {
      s3ClientConfig.endpoint = endpoint;
      this.logger.log(colors.cyan(`   - Using custom endpoint: ${endpoint}`));
    }

    // Force path-style addressing if needed (some buckets require this)
    const forcePathStyle = this.config.get('AWS_S3_FORCE_PATH_STYLE') === 'true';
    if (forcePathStyle) {
      s3ClientConfig.forcePathStyle = true;
      this.logger.log(colors.cyan(`   - Using path-style addressing`));
    }

    this.s3Client = new S3Client(s3ClientConfig);
  }

  /**
   * Log S3 service status (called from main.ts after startup)
   */
  logStatus(): void {
    this.logger.log(colors.green(`✅ S3 Service initialized for bucket: ${this.bucketName} in region: ${this.region}`));
  }

  /**
   * Get the bucket name (for status logging)
   */
  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Get the region (for status logging)
   */
  getRegion(): string {
    return this.region;
  }

  /**
   * Get the appropriate S3 bucket name based on the current environment
   */
  private getBucketNameForEnvironment(nodeEnv: string): string {
    switch (nodeEnv.toLowerCase()) {
      case 'production':
      case 'prod':
        return this.config.get('AWS_S3_BUCKET_PROD') || this.config.get('AWS_S3_BUCKET') || '';
      
      case 'staging':
        return this.config.get('AWS_S3_BUCKET_STAGING') || this.config.get('AWS_S3_BUCKET') || '';
      
      case 'development':
      case 'dev':
      case 'local':
        return this.config.get('AWS_S3_BUCKET_DEV') || this.config.get('AWS_S3_BUCKET') || '';
      
      default:
        // Fallback to default bucket or environment-specific if available
        return this.config.get('AWS_S3_BUCKET_DEV') || 
               this.config.get('AWS_S3_BUCKET') || 
               this.config.get('AWS_S3_BUCKET_STAGING') || 
               this.config.get('AWS_S3_BUCKET_PROD') || 
               '';
    }
  }

  /**
   * Upload file directly to S3 (fastest method)
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    fileName?: string,
    onProgress?: (loadedBytes: number, totalBytes?: number) => void
  ): Promise<S3UploadResult> {
    const key = fileName || `${folder}/${Date.now()}_${file.originalname}`;
    const resolvedContentType = this.resolveContentType(file);
    
    this.logger.log(colors.cyan(`🚀 Starting S3 upload: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`));
    
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: resolvedContentType,
          ContentDisposition: 'inline',
          // ACL removed - bucket uses "Bucket owner enforced" which disables ACLs
          // Use bucket policies for public access instead
          Metadata: {
            // Encode originalName to handle special characters (spaces, unicode, etc.)
            // HTTP headers cannot contain certain characters
            originalName: encodeURIComponent(file.originalname),
            size: file.size.toString(),
            uploadedAt: new Date().toISOString(),
          },
        },
        queueSize: 4,
        partSize: 5 * 1024 * 1024,
        leavePartsOnError: false,
      });

      if (onProgress) {
        upload.on('httpUploadProgress', (evt: any) => {
          if (typeof evt?.loaded === 'number') {
            onProgress(evt.loaded, evt.total);
          }
        });
      }

      const result: any = await upload.done();
      
      // Generate URL based on endpoint configuration
      const url = this.getFileUrl(key);
      
      this.logger.log(colors.green(`✅ S3 upload successful: ${file.originalname}`));
      this.logger.log(colors.blue(`   - URL: ${url}`));
      this.logger.log(colors.blue(`   - ETag: ${result.ETag || result.ETag?.toString?.() || ''}`));
      
      return {
        url,
        key,
        bucket: this.bucketName,
        etag: result.ETag || '',
      };
    } catch (error: any) {
      // Enhanced error handling for region/endpoint issues
      if (error.message?.includes('must be addressed using the specified endpoint')) {
        this.logger.error(colors.red(`❌ S3 region/endpoint mismatch detected`));
        this.logger.error(colors.yellow(`   - Configured region: ${this.region}`));
        this.logger.error(colors.yellow(`   - Bucket: ${this.bucketName}`));
        this.logger.error(colors.yellow(`   - Tip: Check if AWS_REGION matches the bucket's actual region`));
        this.logger.error(colors.yellow(`   - Tip: Or set AWS_S3_ENDPOINT in .env if using custom endpoint`));
        throw new Error(`S3 upload failed: Region/endpoint mismatch. Please verify AWS_REGION matches the bucket's region. Original error: ${error.message}`);
      }
      this.logger.error(colors.red(`❌ S3 upload failed: ${error.message}`));
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Download an S3 object to a temporary file and return its path and contentType
   */
  async downloadToTempFile(key: string): Promise<{ filePath: string; contentType?: string }> {
    try {
      const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
      const res: any = await this.s3Client.send(command);
      const tmpPath = path.join(os.tmpdir(), `s3_${Date.now()}_${path.basename(key)}`);
      await new Promise<void>((resolve, reject) => {
        const write = fs.createWriteStream(tmpPath);
        res.Body.pipe(write);
        res.Body.on('error', reject);
        write.on('finish', () => resolve());
        write.on('error', reject);
      });
      return { filePath: tmpPath, contentType: res.ContentType };
    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to download S3 object ${key}: ${error.message}`));
      throw error;
    }
  }

  /**
   * Upload a local file stream to S3 with explicit content type
   */
  async uploadLocalFile(
    localFilePath: string,
    folder: string,
    fileName: string,
    contentType: string
  ): Promise<S3UploadResult> {
    const key = `${folder}/${fileName}`;
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: fs.createReadStream(localFilePath),
          ContentType: contentType,
          ContentDisposition: 'inline',
          // ACL removed - bucket uses "Bucket owner enforced" which disables ACLs
          // Use bucket policies for public access instead
          Metadata: { uploadedAt: new Date().toISOString() },
        },
        queueSize: 4,
        partSize: 5 * 1024 * 1024,
      });
      const result: any = await upload.done();
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      return { url, key, bucket: this.bucketName, etag: result.ETag || '' };
    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to upload local file ${localFilePath}: ${error.message}`));
      throw error;
    }
  }

  // Infer a better Content-Type when multer supplies generic application/octet-stream
  private resolveContentType(file: Express.Multer.File): string {
    const fallback = 'application/octet-stream';
    if (file.mimetype && file.mimetype !== fallback) return file.mimetype;
    const name = file.originalname?.toLowerCase() || '';
    if (name.endsWith('.mp4')) return 'video/mp4';
    if (name.endsWith('.mkv')) return 'video/x-matroska';
    if (name.endsWith('.mov')) return 'video/quicktime';
    if (name.endsWith('.webm')) return 'video/webm';
    if (name.endsWith('.m4v')) return 'video/x-m4v';
    if (name.endsWith('.mp3')) return 'audio/mpeg';
    if (name.endsWith('.aac')) return 'audio/aac';
    if (name.endsWith('.wav')) return 'audio/wav';
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
    if (name.endsWith('.gif')) return 'image/gif';
    return fallback;
  }

  /**
   * Generate presigned URL for direct upload (alternative method)
   */
  async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      this.logger.log(colors.blue(`🔗 Generated presigned URL for: ${key}`));
      return presignedUrl;
    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to generate presigned URL: ${error.message}`));
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(colors.green(`🗑️ File deleted from S3: ${key}`));
    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to delete file from S3: ${error.message}`));
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Get file URL from S3
   * Handles different URL formats based on endpoint configuration
   */
  getFileUrl(key: string): string {
    const endpoint = this.config.get('AWS_S3_ENDPOINT');
    const forcePathStyle = this.config.get('AWS_S3_FORCE_PATH_STYLE') === 'true';
    
    // If custom endpoint is set, use it
    if (endpoint) {
      if (forcePathStyle) {
        // Path-style: https://endpoint/bucket/key
        const baseUrl = endpoint.replace(/\/$/, ''); // Remove trailing slash
        return `${baseUrl}/${this.bucketName}/${key}`;
      } else {
        // Virtual-hosted-style with custom endpoint
        return `${endpoint}/${key}`;
      }
    }
    
    // Default AWS S3 URL format
    // Handle special cases for certain regions
    if (this.region === 'us-east-1') {
      // us-east-1 uses s3.amazonaws.com (no region in URL)
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } else {
      // Other regions use s3.region.amazonaws.com
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
  }

  /**
   * Generate presigned URL for reading files (expires in 1 hour by default)
   */
  async generateReadPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      this.logger.log(colors.blue(`🔗 Generated read presigned URL for: ${key}`));
      return presignedUrl;
    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to generate read presigned URL: ${error.message}`));
      throw new Error(`Failed to generate read presigned URL: ${error.message}`);
    }
  }

  /**
   * Check if S3 is properly configured
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to list objects in bucket (limited to 1)
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: 'test-connection',
      });
      
      // This will fail but confirms S3 client is working
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        // This is expected - means S3 client is working
        return true;
      }
      this.logger.error(colors.red(`❌ S3 connection test failed: ${error.message}`));
      return false;
    }
  }
}
