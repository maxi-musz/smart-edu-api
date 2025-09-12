import { ApiProperty } from '@nestjs/swagger';

export class UploadProgressDto {
  @ApiProperty({
    description: 'Upload session ID',
    example: 'upload_session_1234567890'
  })
  sessionId: string;

  @ApiProperty({
    description: 'Current progress percentage (0-100)',
    example: 45
  })
  progress: number;

  @ApiProperty({
    description: 'Current stage of upload',
    example: 'uploading'
  })
  stage: 'validating' | 'uploading' | 'processing' | 'saving' | 'completed' | 'error';

  @ApiProperty({
    description: 'Stage description for UI',
    example: 'Uploading to cloud storage...'
  })
  message: string;

  @ApiProperty({
    description: 'Uploaded bytes',
    example: 1048576
  })
  bytesUploaded: number;

  @ApiProperty({
    description: 'Total file size in bytes',
    example: 2097152
  })
  totalBytes: number;

  @ApiProperty({
    description: 'Estimated time remaining in seconds',
    example: 15
  })
  estimatedTimeRemaining?: number;

  @ApiProperty({
    description: 'Error message if stage is error',
    example: 'File validation failed'
  })
  error?: string;

  @ApiProperty({
    description: 'Material ID when upload is completed',
    example: 'clx1234567890abcdef'
  })
  materialId?: string;
}

export class UploadSessionDto {
  @ApiProperty({
    description: 'Upload session ID',
    example: 'upload_session_1234567890'
  })
  sessionId: string;

  @ApiProperty({
    description: 'WebSocket/SSE endpoint for progress updates',
    example: '/api/v1/ai-chat/upload-progress/upload_session_1234567890'
  })
  progressEndpoint: string;
}
