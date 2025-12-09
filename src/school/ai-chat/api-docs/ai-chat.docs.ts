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

export const ProcessDocumentDocs = {
  operation: () => ApiOperation({
    summary: 'Process document for AI chat',
    description: 'Start processing a uploaded document to extract text, create chunks, and generate embeddings'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 202,
      description: 'Document processing started',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Document processing started successfully' },
          data: {
            type: 'object',
            properties: {
              materialId: { type: 'string', example: 'cmfh35jfh0002sbix6l9n752e' },
              status: { type: 'string', example: 'PROCESSING' }
            }
          },
          statusCode: { type: 'number', example: 202 }
        }
      }
    }),
    
    notFound: () => ApiResponse({
      status: 404,
      description: 'Material not found'
    })
  }
};

export const ProcessingStatusDocs = {
  operation: () => ApiOperation({
    summary: 'Get document processing status',
    description: 'Get the current processing status of a document'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 200,
      description: 'Processing status retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Processing status retrieved' },
          data: {
            type: 'object',
            properties: {
              materialId: { type: 'string', example: 'cmfh35jfh0002sbix6l9n752e' },
              status: { type: 'string', example: 'COMPLETED' },
              totalChunks: { type: 'number', example: 25 },
              processedChunks: { type: 'number', example: 25 },
              failedChunks: { type: 'number', example: 0 },
              errorMessage: { type: 'string', example: null },
              createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              updatedAt: { type: 'string', example: '2024-01-15T10:35:00Z' }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    })
  }
};

export const DocumentChunksDocs = {
  operation: () => ApiOperation({
    summary: 'Get document chunks',
    description: 'Get the processed chunks of a document'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 200,
      description: 'Document chunks retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Document chunks retrieved' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'cmfh35jfh0002sbix6l9n752e_chunk_0' },
                content: { type: 'string', example: 'This is the first chunk of the document...' },
                chunkIndex: { type: 'number', example: 0 },
                chunkType: { type: 'string', example: 'paragraph' },
                tokenCount: { type: 'number', example: 150 },
                sectionTitle: { type: 'string', example: 'Introduction' },
                pageNumber: { type: 'number', example: 1 }
              }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    })
  }
};

export const SearchChunksDocs = {
  operation: () => ApiOperation({
    summary: 'Search document chunks using vector similarity',
    description: 'Search for relevant chunks in a document using semantic similarity'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 200,
      description: 'Relevant chunks found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Relevant chunks found' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'cmfh35jfh0002sbix6l9n752e_chunk_0' },
                content: { type: 'string', example: 'This chunk contains information about...' },
                chunk_type: { type: 'string', example: 'paragraph' },
                similarity: { type: 'number', example: 0.85 }
              }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    })
  }
};

export const CreateConversationDocs = {
  operation: () => ApiOperation({
    summary: 'Create a new chat conversation',
    description: 'Create a new conversation for chatting with AI'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 201,
      description: 'Conversation created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Conversation created successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'conv_1234567890abcdef' },
              title: { type: 'string', example: 'Document Chat' },
              status: { type: 'string', example: 'ACTIVE' },
              materialId: { type: 'string', example: 'cmfh35jfh0002sbix6l9n752e' },
              totalMessages: { type: 'number', example: 0 },
              lastActivity: { type: 'string', example: '2024-01-15T10:30:00Z' },
              createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              updatedAt: { type: 'string', example: '2024-01-15T10:30:00Z' }
            }
          },
          statusCode: { type: 'number', example: 201 }
        }
      }
    })
  }
};

export const SendMessageDocs = {
  operation: () => ApiOperation({
    summary: 'Send a message to AI chat',
    description: 'Send a message and get AI response with document context'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 200,
      description: 'Message sent and response received',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Message processed successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'msg_1234567890abcdef' },
              content: { type: 'string', example: 'Based on the document, the main topic is...' },
              role: { type: 'string', example: 'ASSISTANT' },
              conversationId: { type: 'string', example: 'conv_1234567890abcdef' },
              materialId: { type: 'string', example: 'cmfh35jfh0002sbix6l9n752e' },
              contextChunks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'chunk_123' },
                    content: { type: 'string', example: 'This chunk contains...' },
                    similarity: { type: 'number', example: 0.85 },
                    chunkType: { type: 'string', example: 'paragraph' }
                  }
                }
              },
              tokensUsed: { type: 'number', example: 150 },
              responseTimeMs: { type: 'number', example: 1200 },
              createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              usageLimits: { type: 'object' }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    })
  }
};

export const InitiateAiChatDocs = {
  operation: () => ApiOperation({
    summary: 'Initiate AI chat session',
    description: 'Initialize AI chat based on user role and return available materials for teachers'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 200,
      description: 'AI chat session initiated successfully'
    }),
    
    badRequest: () => ApiResponse({
      status: 400,
      description: 'Bad request - invalid user role or missing data'
    })
  }
};

export const GetUserConversationsDocs = {
  operation: () => ApiOperation({
    summary: 'Get user conversations',
    description: 'Get all conversations for the authenticated user'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 200,
      description: 'Conversations retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Conversations retrieved successfully' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'conv_1234567890abcdef' },
                title: { type: 'string', example: 'Document Chat' },
                status: { type: 'string', example: 'ACTIVE' },
                materialId: { type: 'string', example: 'cmfh35jfh0002sbix6l9n752e' },
                totalMessages: { type: 'number', example: 10 },
                lastActivity: { type: 'string', example: '2024-01-15T10:30:00Z' },
                createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', example: '2024-01-15T10:30:00Z' }
              }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    })
  }
};

export const GetChatHistoryDocs = {
  operation: () => ApiOperation({
    summary: 'Get chat history',
    description: 'Get message history for a specific conversation'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 200,
      description: 'Chat history retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Chat history retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              conversationHistory: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'msg_1234567890abcdef' },
                    content: { type: 'string', example: 'Hello, how can I help you?' },
                    role: { type: 'string', example: 'ASSISTANT' },
                    conversationId: { type: 'string', example: 'conv_1234567890abcdef' },
                    materialId: { type: 'string', example: 'cmfh35jfh0002sbix6l9n752e' },
                    tokensUsed: { type: 'number', example: 50 },
                    responseTimeMs: { type: 'number', example: 800 },
                    createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' }
                  }
                }
              },
              usageLimits: { type: 'object' }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    })
  }
};

export const DeleteConversationDocs = {
  operation: () => ApiOperation({
    summary: 'Delete a conversation',
    description: 'Deletes a conversation and optionally deletes the associated document and its vectors'
  }),
  
  responses: {
    success: () => ApiResponse({
      status: 200,
      description: 'Conversation deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Conversation deleted successfully' },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 }
        }
      }
    })
  }
};