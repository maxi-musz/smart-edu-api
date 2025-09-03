import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as colors from "colors"
import { ResponseHelper } from '../helper-functions/response.helpers';

interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    original_filename: string;
}

interface UploadError {
    filename: string;
    error: string;
}

@Injectable()
export class CloudinaryService {
    private readonly ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'pdf'];
    private readonly ALLOWED_VIDEO_FORMATS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];

    constructor(private config: ConfigService) {
        cloudinary.config({
            cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.config.get('CLOUDINARY_API_KEY'),
            api_secret: this.config.get('CLOUDINARY_API_SECRET'),
        });
        
        // Force Cloudinary to use longer timeouts
        process.env.CLOUDINARY_TIMEOUT = '900000'; // 15 minutes in ms
        process.env.CLOUDINARY_CHUNK_SIZE = '6000000'; // 6MB chunks
    }

    private validateFiles(files: Array<Express.Multer.File>): UploadError[] {
        const errors: UploadError[] = [];
        
        files.forEach(file => {
            const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
            
            if (!fileExtension || !this.ALLOWED_FORMATS.includes(fileExtension)) {
                errors.push({
                    filename: file.originalname,
                    error: `File format not allowed. Allowed formats are: ${this.ALLOWED_FORMATS.join(', ')}`
                });
            }
        });

        return errors;
    }

    async uploadToCloudinary(files: Array<Express.Multer.File>): Promise<CloudinaryUploadResult[]> {
        console.log(colors.yellow("Validating files before upload..."));
        
        // Validate all files first
        const validationErrors = this.validateFiles(files);
        if (validationErrors.length > 0) {
            const errorMessage = validationErrors.map(err => 
                `${err.filename}: ${err.error}`
            ).join('\n');
            
            console.log(colors.red("File validation failed:\n" + errorMessage));
            throw ResponseHelper.error(
                'Invalid file format(s) detected',
                errorMessage,
                400
            );
        }

        console.log(colors.yellow("Starting file uploads to cloudinary..."));
        const successfulUploads: CloudinaryUploadResult[] = [];

        try {
            const uploadPromises = files.map(file => {
                return new Promise<CloudinaryUploadResult>((resolve, reject) => {
                    console.log(colors.cyan(`Uploading file: ${file.originalname}`));
                    
                    const upload = cloudinary.uploader.upload_stream(
                        {
                            resource_type: 'auto',
                            folder: 'smart-edu-hub/onboarding-docs'
                        },
                        (error, result) => {
                            if (error) {
                                const errorMessage = `Error uploading file ${file.originalname}: ${error.message}`;
                                console.log(colors.red(errorMessage));
                                reject(new Error(errorMessage));
                            }
                            else if (!result?.secure_url || !result?.public_id) {
                                const errorMessage = `Invalid upload result for file: ${file.originalname}`;
                                console.log(colors.red(errorMessage));
                                reject(new Error(errorMessage));
                            } else {
                                console.log(colors.green(`File "${file.originalname}" uploaded successfully`));
                                console.log(colors.cyan(`Secure URL: ${result.secure_url}`));
                                console.log(colors.cyan(`Public ID: ${result.public_id}`));
                                
                                const uploadResult = {
                                    secure_url: result.secure_url,
                                    public_id: result.public_id,
                                    original_filename: file.originalname
                                };
                                successfulUploads.push(uploadResult);
                                resolve(uploadResult);
                            }
                        }
                    );

                    upload.end(file.buffer);
                });
            });

            await Promise.all(uploadPromises);
            console.log(colors.green("All files successfully uploaded to cloudinary"));
            return successfulUploads;
        } catch (error) {
            console.log(colors.red("Error in file upload process"));
            throw ResponseHelper.error(
                'Failed to upload files',
                error.message,
                400
            );
        }
    }

    async deleteFromCloudinary(publicIds: string[]): Promise<any[]> {
        console.log(colors.yellow("Deleting files from cloudinary..."))

        try {
            const deletePromises = publicIds.map(publicId => {
                console.log(colors.cyan(`Deleting file with public ID: ${publicId}`));
                return cloudinary.uploader.destroy(publicId);
            });

            const results = await Promise.all(deletePromises);
            console.log(colors.green("All files successfully deleted from cloudinary"));
            return results;
        } catch (error) {
            console.log(colors.red("Error deleting files from cloudinary"));
            throw ResponseHelper.error(
                'Failed to delete files',
                error.message || 'Unknown error occurred',
                400
            );
        }
    }

    async cleanupUploadedFiles(uploadResults: CloudinaryUploadResult[]): Promise<void> {
        if (!uploadResults || uploadResults.length === 0) {
            console.log(colors.yellow("No files to cleanup"));
            return;
        }

        console.log(colors.yellow("Starting cleanup of uploaded files..."));
        const publicIds = uploadResults.map(result => result.public_id);
        
        try {
            await this.deleteFromCloudinary(publicIds);
            console.log(colors.green("Cleanup completed successfully"));
        } catch (error) {
            console.log(colors.red("Error during cleanup process"));
            // We don't throw here because this is a cleanup operation
            // and we don't want to mask the original error
            console.error(error);
        }
    }

    /**
     * Upload video files with custom folder structure and video-specific options
     * Enhanced with timeout handling and progress tracking
     */
    async uploadVideoToCloudinary(
        videoFile: Express.Multer.File,
        options?: {
            folder?: string;
            public_id?: string;
            transformation?: any[];
            timeout?: number;
            skipTransformation?: boolean; // Skip transformations for very large videos
        }
    ): Promise<CloudinaryUploadResult> {
        console.log(colors.yellow(`Starting video upload: ${videoFile.originalname}`));
        console.log(colors.blue(`File size: ${(videoFile.size / 1024 / 1024).toFixed(2)} MB`));
        
        // Validate video file format
        const fileExtension = videoFile.originalname.split('.').pop()?.toLowerCase();
        if (!fileExtension || !this.ALLOWED_VIDEO_FORMATS.includes(fileExtension)) {
            const errorMessage = `Video format not allowed. Allowed formats are: ${this.ALLOWED_VIDEO_FORMATS.join(', ')}`;
            console.log(colors.red(errorMessage));
            throw ResponseHelper.error(
                'Invalid video format',
                errorMessage,
                400
            );
        }

        return new Promise<CloudinaryUploadResult>((resolve, reject) => {
            console.log(colors.cyan(`Uploading video: ${videoFile.originalname}`));
            
            // Set timeout for large files (default: 10 minutes)
            const timeout = options?.timeout || 10 * 60 * 1000;
            const timeoutId = setTimeout(() => {
                reject(new Error(`Upload timeout after ${timeout / 1000 / 60} minutes`));
            }, timeout);
            
            const uploadOptions = {
                resource_type: 'video' as const,
                folder: options?.folder || 'smart-edu-hub/videos',
                public_id: options?.public_id || `${Date.now()}_${videoFile.originalname.split('.')[0]}`,
                // For very large videos, skip transformations to avoid async processing issues
                ...(options?.skipTransformation ? {} : {
                    transformation: options?.transformation || [
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' }
                    ]
                }),
                // Add chunked upload for large files
                chunk_size: 6000000 // 6MB chunks
            };
            
            // Use direct upload with explicit timeout and chunk settings
            const upload = cloudinary.uploader.upload_stream(
                {
                    ...uploadOptions,
                    timeout: timeout,
                    chunk_size: 6000000, // 6MB chunks
                    resource_type: 'video' as const,
                    // Force longer timeout
                    upload_preset: 'ml_default', // Use default preset
                    eager: [
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' }
                    ],
                    eager_async: true, // Process large videos asynchronously
                    notification_url: undefined, // No webhook needed for now
                    eager_notification_url: undefined
                },
                (error, result) => {
                    clearTimeout(timeoutId); // Clear timeout on completion
                    
                    if (error) {
                        const errorMessage = `Error uploading video ${videoFile.originalname}: ${error.message}`;
                        console.log(colors.red(errorMessage));
                        reject(new Error(errorMessage));
                    }
                    else if (!result?.secure_url || !result?.public_id) {
                        const errorMessage = `Invalid upload result for video: ${videoFile.originalname}`;
                        console.log(colors.red(errorMessage));
                        reject(new Error(errorMessage));
                    } else {
                        console.log(colors.green(`Video "${videoFile.originalname}" uploaded successfully`));
                        console.log(colors.cyan(`Secure URL: ${result.secure_url}`));
                        console.log(colors.cyan(`Public ID: ${result.public_id}`));
                        
                        const uploadResult = {
                            secure_url: result.secure_url,
                            public_id: result.public_id,
                            original_filename: videoFile.originalname
                        };
                        resolve(uploadResult);
                    }
                }
            );

            // Handle upload progress
            let uploadedBytes = 0;
            upload.on('progress', (progress) => {
                uploadedBytes = progress.bytes;
                const progressPercent = Math.round((uploadedBytes / videoFile.size) * 100);
                console.log(colors.blue(`Upload progress: ${progressPercent}% (${(uploadedBytes / 1024 / 1024).toFixed(2)} MB / ${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`));
            });

            upload.end(videoFile.buffer);
        });
    }
} 