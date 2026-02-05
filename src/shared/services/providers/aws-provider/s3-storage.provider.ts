import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand, DeleteObjectsCommand, GetBucketLocationCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as colors from 'colors';
import { IStorageProvider, StorageUploadResult } from '../storage-provider.interface';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private s3Client: S3Client;
  private readonly bucketName: string;
  private region: string;

  constructor(private config: ConfigService) {
    const region = this.config.get('AWS_REGION') || 'us-east-1'; // Default to us-east-1
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');
    const nodeEnv = this.config.get('NODE_ENV') || 'staging';

    const bucketName = this.getBucketNameForEnvironment(nodeEnv);

    if (!bucketName || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required AWS S3 configuration. Please check your .env file.');
    }

    this.bucketName = bucketName;
    this.region = region;

    // Initialize S3 client with the configured region
    // Note: If bucket is in different region, we'll detect and recreate client
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(colors.green(`✅ S3 Storage Provider initialized for bucket: ${this.bucketName} in region: ${this.region}`));
  }

  /**
   * Get the actual region of the bucket and update client if needed
   */
  private async ensureCorrectRegion(): Promise<void> {
    try {
      const command = new GetBucketLocationCommand({
        Bucket: this.bucketName,
      });
      
      // Use us-east-1 for GetBucketLocation (special case - this API always uses us-east-1)
      const locationClient = new S3Client({
        region: 'us-east-1',
        credentials: this.s3Client.config.credentials,
      });
      
      const response = await locationClient.send(command);
      // AWS returns null/undefined for us-east-1, actual string for other regions
      const locationConstraint = response.LocationConstraint;
      const bucketRegion = !locationConstraint 
        ? 'us-east-1' 
        : String(locationConstraint);
      
      // If bucket region differs from configured region, update client
      if (bucketRegion !== this.region) {
        this.logger.warn(colors.yellow(`⚠️ Bucket region mismatch detected. Bucket is in ${bucketRegion}, but configured region is ${this.region}. Updating client...`));
        this.region = bucketRegion;
        this.s3Client = new S3Client({
          region: this.region,
          credentials: this.s3Client.config.credentials,
        });
        this.logger.log(colors.green(`✅ S3 client updated to use region: ${this.region}`));
      }
    } catch (error) {
      // If we can't detect region, continue with configured region
      // This might fail if bucket doesn't exist or permissions are insufficient
      this.logger.warn(colors.yellow(`⚠️ Could not detect bucket region: ${error.message}. Using configured region: ${this.region}`));
    }
  }

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
        return this.config.get('AWS_S3_BUCKET_DEV') || 
               this.config.get('AWS_S3_BUCKET_STAGING') || 
               this.config.get('AWS_S3_BUCKET_PROD') || 
               this.config.get('AWS_S3_BUCKET') || '';
    }
  }

  private resolveContentType(file: Express.Multer.File): string {
    if (file.mimetype) {
      return file.mimetype;
    }
    
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
    };
    
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    fileName?: string,
    onProgress?: (loadedBytes: number, totalBytes?: number) => void
  ): Promise<StorageUploadResult> {
    // Ensure we're using the correct region for the bucket
    await this.ensureCorrectRegion();
    
    // Combine folder path with fileName if provided, otherwise generate filename
    const key = fileName 
      ? `${folder}/${fileName}` 
      : `${folder}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
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
          // Note: ACL removed - bucket uses "Bucket owner enforced" which disables ACLs
          // Files will be accessible based on bucket policy instead
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
      
      // Generate public URL (requires bucket policy for public read access)
      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      
      this.logger.log(colors.green(`✅ S3 upload successful: ${file.originalname}`));
      this.logger.log(colors.blue(`   - Public URL: ${publicUrl}`));
      
      return {
        url: publicUrl,
        key,
        bucket: this.bucketName,
        etag: result.ETag || '',
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ S3 upload failed: ${error.message}`));
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

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
   * Delete all objects in a folder/prefix
   * Used for deleting HLS folders which contain multiple .ts and .m3u8 files
   * @param prefix - The folder prefix to delete (e.g., "library/videos-hls/abc123/")
   */
  async deleteFolder(prefix: string): Promise<void> {
    try {
      // Ensure prefix ends with "/" for proper folder matching
      const folderPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
      
      this.logger.log(colors.cyan(`🗑️ Deleting folder from S3: ${folderPrefix}`));
      
      let continuationToken: string | undefined;
      let deletedCount = 0;
      
      do {
        // List all objects with this prefix
        const listCommand = new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: folderPrefix,
          ContinuationToken: continuationToken,
        });
        
        const listResponse = await this.s3Client.send(listCommand);
        
        if (listResponse.Contents && listResponse.Contents.length > 0) {
          // Delete objects in batches (S3 allows max 1000 objects per delete request)
          const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key! }));
          
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
              Objects: objectsToDelete,
              Quiet: true,
            },
          });
          
          await this.s3Client.send(deleteCommand);
          deletedCount += objectsToDelete.length;
        }
        
        continuationToken = listResponse.NextContinuationToken;
      } while (continuationToken);
      
      this.logger.log(colors.green(`✅ Folder deleted from S3: ${folderPrefix} (${deletedCount} files)`));
    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to delete folder from S3: ${error.message}`));
      throw new Error(`Failed to delete folder from S3: ${error.message}`);
    }
  }

  /**
   * Generate a presigned URL for accessing a file
   * @param key - The S3 key
   * @param expiresIn - Expiration time in seconds (default: 7 days)
   */
  async getPresignedUrl(key: string, expiresIn: number = 7 * 24 * 60 * 60): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return presignedUrl;
    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to generate presigned URL: ${error.message}`));
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  getFileUrl(key: string): string {
    // Return public URL (requires bucket policy for public read access)
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

