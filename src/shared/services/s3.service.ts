import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as colors from 'colors';

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
    const bucketName = this.config.get('AWS_S3_BUCKET');
    const region = this.config.get('AWS_REGION');
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');

    if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required AWS S3 configuration. Please check your .env file.');
    }

    this.bucketName = bucketName;
    this.region = region;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(colors.green(`✅ S3 Service initialized for bucket: ${this.bucketName} in region: ${this.region}`));
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
    
    this.logger.log(colors.cyan(`🚀 Starting S3 upload: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`));
    
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
          Metadata: {
            originalName: file.originalname,
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
      
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      
      this.logger.log(colors.green(`✅ S3 upload successful: ${file.originalname}`));
      this.logger.log(colors.blue(`   - URL: ${url}`));
      this.logger.log(colors.blue(`   - ETag: ${result.ETag || result.ETag?.toString?.() || ''}`));
      
      return {
        url,
        key,
        bucket: this.bucketName,
        etag: result.ETag || '',
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ S3 upload failed: ${error.message}`));
      throw new Error(`S3 upload failed: ${error.message}`);
    }
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
   */
  getFileUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
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
