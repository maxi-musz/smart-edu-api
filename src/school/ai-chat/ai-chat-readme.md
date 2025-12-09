# AI Chat Module Documentation

## Overview
The AI Chat module provides intelligent document-based chat functionality for teachers and students. It allows users to upload educational materials (PDFs, Word documents, etc.) and have AI-powered conversations about the content. The module integrates with subscription plans to enforce usage limits and feature restrictions.

## Module Location
`src/school/ai-chat/`

## Key Features

1. **Document Upload & Processing**: Upload and process educational materials (PDF, DOCX, PPTX, etc.)
2. **AI-Powered Conversations**: Chat with AI about uploaded documents
3. **Subscription Plan Integration**: Usage limits and features are determined by the school's subscription plan
4. **Usage Tracking**: Real-time tracking of tokens, document uploads, and storage usage
5. **Progress Tracking**: Real-time upload progress for large files

## Subscription Plan Integration

The AI Chat module dynamically adjusts features and limits based on the school's active subscription plan from the `PlatformSubscriptionPlan` model.

### Plan-Based Features

#### Document Types
- **Allowed Document Types**: Determined by `allowed_document_types` array in the subscription plan
- **Supported Types**: PDF, DOCX, DOC, PPTX, XLSX, TXT, RTF
- **Default**: If no plan exists, only PDF is allowed

#### Usage Limits
The following limits are enforced from the subscription plan:

1. **Token Limits**:
   - `max_daily_tokens_per_user`: Maximum tokens per user per day
   - `max_weekly_tokens_per_user`: Maximum tokens per user per week (optional)
   - `max_monthly_tokens_per_user`: Maximum tokens per user per month (optional)

2. **Document Upload Limits**:
   - `max_document_uploads_per_student_per_day`: Maximum uploads for students (default: 3)
   - `max_document_uploads_per_teacher_per_day`: Maximum uploads for teachers (default: 10)
   - `max_file_size_mb`: Maximum file size in MB (default: 10MB)
   - `max_files_per_month`: Maximum files per month (default: 10)

3. **Storage Limits**:
   - `max_storage_mb`: Maximum storage in MB (default: 500MB)

### Fallback Behavior
If a school doesn't have an active subscription plan:
- Default document type: PDF only
- Default limits: System defaults (3 uploads/day for students, 10 for teachers)
- Default token limit: 50,000 tokens/day per user

## API Endpoints

### 1. Initiate AI Chat

**POST** `/api/v1/ai-chat/initiate`

Initializes the AI chat session and returns available features, document types, and usage limits based on the user's role and school's subscription plan.

**Authentication:** Required (Bearer Token - JWT)

**Request Body:**
```json
{
  "userRole": "teacher"
}
```

**Request Fields:**
- `userRole` (enum, required): User role - `teacher`, `student`, `school_director`, `school_admin`, `parent`, `ict_staff`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "AI chat initiated successfully",
  "data": {
    "userRole": "teacher",
    "documentCount": 5,
    "supportedDocumentTypes": [
      {
        "type": "PDF",
        "extension": ".pdf",
        "mimeType": "application/pdf",
        "maxSize": "10MB",
        "description": "Portable Document Format files"
      },
      {
        "type": "Word Document",
        "extension": ".docx",
        "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "maxSize": "10MB",
        "description": "Microsoft Word documents"
      }
    ],
    "uploadedDocuments": [
      {
        "id": "cmfh35jfh0002sbix6l9n752e",
        "title": "Mathematics Chapter 5",
        "description": "Algebra and equations",
        "fileType": "pdf",
        "originalName": "math_chapter_5.pdf",
        "size": "2.5MB",
        "status": "published",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "isProcessed": true
      }
    ],
    "conversations": [
      {
        "id": "conv_1234567890abcdef",
        "title": "Discussion about Mathematics Chapter 5",
        "documentTitle": "Mathematics Chapter 5",
        "originalFileName": "math_chapter_5.pdf",
        "status": "ACTIVE",
        "materialId": "cmfh35jfh0002sbix6l9n752e",
        "totalMessages": 12,
        "lastActivity": "2024-01-20T14:30:00.000Z",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-20T14:30:00.000Z"
      }
    ],
    "usageLimits": {
      "filesUploadedThisMonth": 3,
      "totalFilesUploadedAllTime": 15,
      "totalStorageUsedMB": 45.5,
      "maxFilesPerMonth": 10,
      "maxFileSizeMB": 10,
      "maxStorageMB": 500,
      "tokensUsedThisWeek": 12500,
      "tokensUsedThisDay": 3500,
      "tokensUsedAllTime": 125000,
      "maxTokensPerWeek": 100000,
      "maxTokensPerDay": 50000,
      "maxDocumentUploadsPerDay": 10,
      "lastFileResetDate": "2024-01-01T00:00:00.000Z",
      "lastTokenResetDate": "2024-01-20T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

**Usage Limits Explanation:**
- `filesUploadedThisMonth`: Number of files uploaded in the current month
- `totalFilesUploadedAllTime`: Total files uploaded by the user
- `totalStorageUsedMB`: Total storage used in MB
- `maxFilesPerMonth`: Maximum files allowed per month (from plan)
- `maxFileSizeMB`: Maximum file size in MB (from plan)
- `maxStorageMB`: Maximum storage in MB (from plan)
- `tokensUsedThisWeek`: Tokens used this week
- `tokensUsedThisDay`: Tokens used today
- `tokensUsedAllTime`: Total tokens used by the user
- `maxTokensPerWeek`: Maximum tokens per week (from plan or user default)
- `maxTokensPerDay`: Maximum tokens per day (from plan or user default)
- `maxDocumentUploadsPerDay`: Maximum document uploads per day based on role (from plan)
- `lastFileResetDate`: Date when file upload counter was last reset
- `lastTokenResetDate`: Date when token counter was last reset

---

### 2. Upload Document

**POST** `/api/v1/ai-chat/upload`

Uploads a document for AI chat processing. Supports progress tracking for large files.

**Authentication:** Required (Bearer Token - JWT)

**Request:** Multipart form data
- `file` (file, required): Document file to upload
- `title` (string, optional): Document title (auto-generated from filename if not provided)
- `description` (string, optional): Document description

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "cmfh35jfh0002sbix6l9n752e",
    "title": "Mathematics Chapter 5",
    "description": "Algebra and equations",
    "fileType": "pdf",
    "originalName": "math_chapter_5.pdf",
    "size": "2.5MB",
    "status": "published",
    "uploadedAt": "2024-01-15T10:00:00.000Z"
  },
  "statusCode": 201
}
```

**Error Responses:**
- **400 Bad Request**: Invalid file type, file too large, or upload limit exceeded
- **401 Unauthorized**: Invalid or missing JWT token
- **500 Internal Server Error**: Upload or processing failure

---

### 3. Get Upload Progress

**GET** `/api/v1/ai-chat/upload-progress/:sessionId`

Gets the upload progress for a file upload session.

**Authentication:** Required (Bearer Token - JWT)

**Path Parameters:**
- `sessionId` (string, required): Upload session ID

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Upload progress retrieved",
  "data": {
    "sessionId": "upload_session_123",
    "progress": 75,
    "status": "processing",
    "message": "Processing document..."
  },
  "statusCode": 200
}
```

**Progress Status Values:**
- `uploading`: File is being uploaded
- `processing`: File is being processed
- `completed`: Upload and processing completed
- `failed`: Upload or processing failed

---

### 4. Create Conversation

**POST** `/api/v1/ai-chat/conversation`

Creates a new conversation for AI chat.

**Authentication:** Required (Bearer Token - JWT)

**Request Body:**
```json
{
  "title": "Discussion about Mathematics Chapter 5",
  "materialId": "cmfh35jfh0002sbix6l9n752e"
}
```

**Request Fields:**
- `title` (string, optional): Conversation title
- `materialId` (string, optional): Material/document ID to chat about

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "id": "conv_1234567890abcdef",
    "title": "Discussion about Mathematics Chapter 5",
    "chatTitle": "Discussion about Mathematics Chapter 5",
    "status": "ACTIVE",
    "materialId": "cmfh35jfh0002sbix6l9n752e",
    "totalMessages": 0,
    "lastActivity": "2024-01-15T10:00:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "statusCode": 201
}
```

---

### 5. Send Message

**POST** `/api/v1/ai-chat/message`

Sends a message to the AI and receives a response. Usage limits are returned after every message.

**Authentication:** Required (Bearer Token - JWT)

**Request Body:**
```json
{
  "message": "What is the main topic of this document?",
  "conversationId": "conv_1234567890abcdef",
  "materialId": "cmfh35jfh0002sbix6l9n752e"
}
```

**Request Fields:**
- `message` (string, required): The message content
- `conversationId` (string, optional): Conversation ID to continue existing chat
- `materialId` (string, optional): Material ID for document-specific chat

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Message processed successfully",
  "data": {
    "id": "msg_1234567890abcdef",
    "content": "The main topic of this document is algebra and equations...",
    "role": "ASSISTANT",
    "conversationId": "conv_1234567890abcdef",
    "materialId": "cmfh35jfh0002sbix6l9n752e",
    "chatTitle": "Discussion about Mathematics Chapter 5",
    "contextChunks": [
      {
        "id": "chunk_123",
        "content": "Algebra is a branch of mathematics...",
        "similarity": 0.95,
        "chunkType": "semantic"
      }
    ],
    "tokensUsed": 450,
    "responseTimeMs": 1250,
    "createdAt": "2024-01-15T10:05:00.000Z",
    "usageLimits": {
      "filesUploadedThisMonth": 3,
      "totalFilesUploadedAllTime": 15,
      "totalStorageUsedMB": 45.5,
      "maxFilesPerMonth": 10,
      "maxFileSizeMB": 10,
      "maxStorageMB": 500,
      "tokensUsedThisWeek": 12950,
      "tokensUsedThisDay": 3950,
      "tokensUsedAllTime": 125450,
      "maxTokensPerWeek": 100000,
      "maxTokensPerDay": 50000,
      "maxDocumentUploadsPerDay": 10,
      "lastFileResetDate": "2024-01-01T00:00:00.000Z",
      "lastTokenResetDate": "2024-01-20T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

**Note:** The `usageLimits` object is included in every message response to allow the frontend to track usage in real-time.

---

### 6. Get Chat History

**GET** `/api/v1/ai-chat/conversation/:conversationId/history`

Gets the chat history for a conversation.

**Authentication:** Required (Bearer Token - JWT)

**Path Parameters:**
- `conversationId` (string, required): Conversation ID

**Query Parameters:**
- `limit` (number, optional): Number of messages to retrieve (default: 25)
- `offset` (number, optional): Number of messages to skip (default: 0)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Chat history retrieved successfully",
  "data": {
    "conversationHistory": [
      {
        "id": "msg_1234567890abcdef",
        "content": "What is the main topic?",
        "role": "USER",
        "conversationId": "conv_1234567890abcdef",
        "materialId": "cmfh35jfh0002sbix6l9n752e",
        "tokensUsed": 50,
        "responseTimeMs": null,
        "createdAt": "2024-01-15T10:04:00.000Z"
      },
      {
        "id": "msg_1234567890abcdeg",
        "content": "The main topic is algebra...",
        "role": "ASSISTANT",
        "conversationId": "conv_1234567890abcdef",
        "materialId": "cmfh35jfh0002sbix6l9n752e",
        "tokensUsed": 450,
        "responseTimeMs": 1250,
        "createdAt": "2024-01-15T10:05:00.000Z"
      }
    ],
    "usageLimits": {
      "filesUploadedThisMonth": 3,
      "totalFilesUploadedAllTime": 15,
      "totalStorageUsedMB": 45.5,
      "maxFilesPerMonth": 10,
      "maxFileSizeMB": 10,
      "maxStorageMB": 500,
      "tokensUsedThisWeek": 12950,
      "tokensUsedThisDay": 3950,
      "tokensUsedAllTime": 125450,
      "maxTokensPerWeek": 100000,
      "maxTokensPerDay": 50000,
      "maxDocumentUploadsPerDay": 10,
      "lastFileResetDate": "2024-01-01T00:00:00.000Z",
      "lastTokenResetDate": "2024-01-20T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

---

## Business Logic

### Subscription Plan Integration

1. **Plan Lookup**: The system fetches the school's active subscription plan from `PlatformSubscriptionPlan` where `school_id` matches the user's school.

2. **Feature Availability**: 
   - Document types are filtered based on `allowed_document_types` array
   - If no plan exists, defaults to PDF only

3. **Limit Enforcement**:
   - Token limits use plan values if available, otherwise user model defaults
   - Document upload limits are role-based (student vs teacher)
   - Storage and file limits use plan values

4. **Usage Tracking**:
   - Real-time tracking of tokens, uploads, and storage
   - Limits are checked before operations
   - Usage limits are returned after every message

### Document Processing Flow

1. **Upload**: File is uploaded to S3 storage
2. **Validation**: File type and size are validated against plan limits
3. **Processing**: Document is processed (text extraction, chunking)
4. **Embedding**: Document chunks are embedded using OpenAI
5. **Indexing**: Embeddings are stored in Pinecone vector database
6. **Ready**: Document is marked as processed and available for chat

### Chat Flow

1. **Message Received**: User sends a message
2. **Context Retrieval**: If materialId is provided, relevant chunks are retrieved from Pinecone
3. **AI Processing**: Message is sent to OpenAI with context
4. **Response Generation**: AI generates response based on document context
5. **Usage Update**: Token usage is tracked and updated
6. **Response**: Message response with updated usage limits is returned

## File Structure

```
src/school/ai-chat/
├── api-docs/
│   ├── ai-chat.docs.ts          # Swagger API documentation
│   └── index.ts
├── dto/
│   ├── chat.dto.ts              # Chat-related DTOs
│   ├── initiate-ai-chat.dto.ts  # Initiate chat DTOs
│   ├── upload-document.dto.ts   # Upload DTOs
│   ├── upload-progress.dto.ts   # Progress tracking DTOs
│   └── index.ts
├── services/
│   ├── chat.service.ts           # Main chat service
│   ├── document-processing.service.ts  # Document processing
│   ├── document-chunking.service.ts    # Document chunking
│   ├── embedding.service.ts           # Embedding generation
│   ├── pinecone.service.ts            # Pinecone integration
│   ├── text-extraction.service.ts     # Text extraction
│   └── index.ts
├── ai-chat.controller.ts        # Main controller
├── ai-chat.service.ts           # Upload and initiation service
├── ai-chat.module.ts            # NestJS module
├── upload-progress.service.ts   # Upload progress tracking
└── ai-chat-readme.md           # This file
```

## Database Models

### PlatformSubscriptionPlan
Key fields used by AI Chat:
- `allowed_document_types`: Array of allowed document types (e.g., ["pdf", "docx"])
- `max_file_size_mb`: Maximum file size in MB
- `max_document_uploads_per_student_per_day`: Student upload limit
- `max_document_uploads_per_teacher_per_day`: Teacher upload limit
- `max_storage_mb`: Maximum storage in MB
- `max_files_per_month`: Maximum files per month
- `max_daily_tokens_per_user`: Maximum tokens per user per day
- `max_weekly_tokens_per_user`: Maximum tokens per user per week (optional)
- `max_monthly_tokens_per_user`: Maximum tokens per user per month (optional)

### User
Key fields for usage tracking:
- `filesUploadedThisMonth`: Files uploaded this month
- `totalFilesUploadedAllTime`: Total files uploaded
- `totalStorageUsedMB`: Total storage used
- `tokensUsedThisWeek`: Tokens used this week
- `tokensUsedThisDay`: Tokens used today
- `tokensUsedAllTime`: Total tokens used
- `maxTokensPerWeek`: Maximum tokens per week (fallback)
- `maxTokensPerDay`: Maximum tokens per day (fallback)

## Error Handling

### Common Errors

1. **File Type Not Allowed**:
   ```json
   {
     "success": false,
     "message": "File type not allowed. Allowed types: pdf, docx",
     "data": null,
     "statusCode": 400
   }
   ```

2. **File Too Large**:
   ```json
   {
     "success": false,
     "message": "File size exceeds maximum allowed size: 10MB",
     "data": null,
     "statusCode": 400
   }
   ```

3. **Upload Limit Exceeded**:
   ```json
   {
     "success": false,
     "message": "Daily upload limit exceeded. Maximum uploads per day: 10",
     "data": null,
     "statusCode": 400
   }
   ```

4. **Token Limit Exceeded**:
   ```json
   {
     "success": false,
     "message": "Daily token limit exceeded. Maximum tokens per day: 50000",
     "data": null,
     "statusCode": 400
   }
   ```

## Frontend Integration Tips

1. **Usage Limits**: Always check `usageLimits` after every message to update UI
2. **Document Types**: Use `supportedDocumentTypes` from initiate endpoint to filter file picker
3. **Upload Progress**: Use upload progress endpoint for large files
4. **Error Handling**: Handle plan-based errors gracefully (suggest upgrade if needed)
5. **Real-time Updates**: Update usage indicators after every message/upload

## Environment Variables

Required environment variables:
- `OPENAI_API_KEY`: OpenAI API key for embeddings and chat
- `PINECONE_API_KEY`: Pinecone API key for vector storage
- `PINECONE_ENVIRONMENT`: Pinecone environment
- `PINECONE_INDEX_NAME`: Pinecone index name
- `AWS_ACCESS_KEY_ID`: AWS access key for S3
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3
- `AWS_S3_BUCKET_NAME`: S3 bucket name for file storage

## Related Modules

- **Subscription Module**: `src/admin/` - Manages subscription plans
- **School Module**: `src/school/` - School-related operations
- **User Module**: `src/user/` - User management

## Notes

- All document types are validated against the subscription plan
- Usage limits are enforced in real-time
- Token usage is tracked per message
- Document processing happens asynchronously
- Vector embeddings are stored in Pinecone for semantic search
- File storage uses AWS S3

