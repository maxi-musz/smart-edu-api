export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: string;
}

export class FileValidationHelper {
  // Allowed material file types
  private static readonly ALLOWED_MATERIAL_TYPES = [
    'application/pdf',                    // PDF
    'application/msword',                 // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-powerpoint',      // PPT
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  ];

  // Allowed file extensions
  private static readonly ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];

  // Max file size in bytes (300MB)
  private static readonly MAX_FILE_SIZE = 300 * 1024 * 1024;

  /**
   * Validate material file upload
   */
  static validateMaterialFile(file: Express.Multer.File): FileValidationResult {
    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided'
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      const maxSizeMB = this.MAX_FILE_SIZE / (1024 * 1024);
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`
      };
    }

    // Check MIME type
    if (!this.ALLOWED_MATERIAL_TYPES.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${this.ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    // Check file extension
    const fileExtension = this.getFileExtension(file.originalname);
    if (!this.ALLOWED_EXTENSIONS.includes(fileExtension.toLowerCase())) {
      return {
        isValid: false,
        error: `File extension not allowed. Allowed extensions: ${this.ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    // Get file type for database
    const fileType = this.getFileType(file.mimetype);

    return {
      isValid: true,
      fileType
    };
  }

  /**
   * Get file extension from filename
   */
  private static getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return filename.substring(lastDotIndex);
  }

  /**
   * Get file type from MIME type
   */
  private static getFileType(mimeType: string): string {
    switch (mimeType) {
      case 'application/pdf':
        return 'pdf';
      case 'application/msword':
        return 'doc';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
      case 'application/vnd.ms-powerpoint':
        return 'ppt';
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return 'pptx';
      default:
        return 'unknown';
    }
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
