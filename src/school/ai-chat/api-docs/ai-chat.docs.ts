import { ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

export const UploadDocumentDocs = {
  operation: () => ApiOperation({
    summary: 'Upload document for AI chat',
    description: 'Upload a PDF, DOC, DOCX, PPT, or PPTX document to enable AI chat functionality. Subject and topic are optional - you can upload any material for AI chat.'
  }),
  
  consumes: () => ApiConsumes('multipart/form-data'),
  
  body: () => ApiBody({
    description: 'Document upload data',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Document title (optional - will auto-generate from filename if not provided)',
          example: 'Mathematics Chapter 5 - Algebra'
        },
        description: {
          type: 'string',
          description: 'Document description',
          example: 'Comprehensive guide to algebraic expressions'
        },
        subject_id: {
          type: 'string',
          description: 'Subject ID (optional)',
          example: 'clx1234567890abcdef'
        },
        topic_id: {
          type: 'string',
          description: 'Topic ID (optional)',
          example: 'clx1234567890abcdef'
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document file (PDF, DOC, DOCX, PPT, PPTX)'
        }
      },
      required: ['document']
    }
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 201,
      description: 'Document uploaded successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Document uploaded successfully and ready for AI chat processing' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clx1234567890abcdef' },
              title: { type: 'string', example: 'Mathematics Chapter 5 - Algebra' },
              description: { type: 'string', example: 'Comprehensive guide to algebraic expressions' },
              url: { type: 'string', example: 'https://bucket.s3.region.amazonaws.com/ai-chat/schools/...' },
              fileType: { type: 'string', example: 'pdf' },
              size: { type: 'string', example: '2.3 MB' },
              originalName: { type: 'string', example: 'algebra_chapter5.pdf' },
              subject_id: { type: 'string', example: 'clx1234567890abcdef', description: 'Optional - empty if not provided' },
              topic_id: { type: 'string', example: 'clx1234567890abcdef', description: 'Optional - empty if not provided' },
              processing_status: { type: 'string', example: 'PENDING' },
              createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              updatedAt: { type: 'string', example: '2024-01-15T10:30:00Z' }
            }
          },
          statusCode: { type: 'number', example: 201 }
        }
      }
    }),
    
    badRequest: () => ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid file or data'
    }),
    
    unauthorized: () => ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
    }),
    
    notFound: () => ApiResponse({
      status: 404,
      description: 'Subject or topic not found'
    }),
    
    tooLarge: () => ApiResponse({
      status: 413,
      description: 'File too large'
    })
  }
};

export const StartUploadDocs = {
  operation: () => ApiOperation({
    summary: 'Start upload with progress tracking',
    description: 'Start a document upload with real-time progress tracking via SSE'
  }),
  
  consumes: () => ApiConsumes('multipart/form-data'),
  
  body: () => ApiBody({
    description: 'Document upload data',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Document title',
          example: 'Test Document'
        },
        description: {
          type: 'string',
          description: 'Document description',
          example: 'Test description'
        },
        subject_id: {
          type: 'string',
          description: 'Subject ID (optional)',
          example: 'clx1234567890abcdef'
        },
        topic_id: {
          type: 'string',
          description: 'Topic ID (optional)',
          example: 'clx1234567890abcdef'
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document file (PDF, DOC, DOCX, PPT, PPTX)'
        }
      },
      required: ['document']
    }
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 202,
      description: 'Upload started successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Upload started successfully. Use the progress endpoint to track progress.' },
          data: {
            type: 'object',
            properties: {
              sessionId: { type: 'string', example: 'upload_session_1234567890' },
              progressEndpoint: { type: 'string', example: '/api/v1/ai-chat/upload-progress/upload_session_1234567890' }
            }
          },
          statusCode: { type: 'number', example: 202 }
        }
      }
    }),
    
    badRequest: () => ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid file or data'
    }),
    
    unauthorized: () => ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
    })
  }
};

export const UploadProgressDocs = {
  operation: () => ApiOperation({
    summary: 'Get upload progress via Server-Sent Events',
    description: 'Stream real-time upload progress updates'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 200,
      description: 'Progress stream started',
      content: {
        'text/event-stream': {
          schema: {
            type: 'string',
            example: 'data: {"sessionId":"upload_session_123","progress":45,"stage":"uploading","message":"Uploading to cloud storage...","bytesUploaded":1048576,"totalBytes":2097152}\n\n'
          }
        }
      }
    }),
    
    notFound: () => ApiResponse({
      status: 404,
      description: 'Upload session not found'
    })
  }
};

export const UploadStatusDocs = {
  operation: () => ApiOperation({
    summary: 'Get current upload status',
    description: 'Get the current upload progress without streaming'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 200,
      description: 'Current upload status',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Upload status retrieved' },
          data: {
            type: 'object',
            properties: {
              sessionId: { type: 'string', example: 'upload_session_1234567890' },
              progress: { type: 'number', example: 45 },
              stage: { type: 'string', example: 'uploading' },
              message: { type: 'string', example: 'Uploading to cloud storage...' },
              bytesUploaded: { type: 'number', example: 1048576 },
              totalBytes: { type: 'number', example: 2097152 },
              estimatedTimeRemaining: { type: 'number', example: 15 }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    }),
    
    notFound: () => ApiResponse({
      status: 404,
      description: 'Upload session not found'
    })
  }
};