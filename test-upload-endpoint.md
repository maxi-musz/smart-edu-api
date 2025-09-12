# AI Chat Document Upload Endpoint Test

## Endpoint Details
- **URL**: `POST /api/v1/ai-chat/upload-document`
- **Content-Type**: `multipart/form-data`
- **Authentication**: Bearer JWT Token

## Request Format

### Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

### Form Data (Only document is required - title auto-generated from filename)
```
title: "Mathematics Chapter 5 - Algebra" (OPTIONAL - auto-generated from filename)
description: "Comprehensive guide to algebraic expressions and equations" (OPTIONAL)
subject_id: "clx1234567890abcdef" (OPTIONAL - for organizing materials)
topic_id: "clx1234567890abcdef" (OPTIONAL - for organizing materials)
document: <PDF_FILE> (REQUIRED)
```

### Example 1: Minimal Upload (Just file - title auto-generated)
```
document: <PDF_FILE>
# Title will be auto-generated from filename: "algebra_chapter5.pdf" → "Algebra Chapter5"
```

### Example 2: With Subject Only
```
title: "Math Notes"
description: "My personal math notes"
subject_id: "clx1234567890abcdef"
document: <PDF_FILE>
```

### Example 3: Full Organization
```
title: "Algebra Chapter 5"
description: "Comprehensive guide to algebraic expressions"
subject_id: "clx1234567890abcdef"
topic_id: "clx1234567890abcdef"
document: <PDF_FILE>
```

## Expected Response (201 Created)
```json
{
  "success": true,
  "message": "Document uploaded successfully and ready for AI chat processing",
  "data": {
    "id": "clx1234567890abcdef",
    "title": "Mathematics Chapter 5 - Algebra",
    "description": "Comprehensive guide to algebraic expressions and equations",
    "url": "https://bucket.s3.region.amazonaws.com/ai-chat/schools/...",
    "fileType": "pdf",
    "size": "2.3 MB",
    "originalName": "algebra_chapter5.pdf",
    "subject_id": "clx1234567890abcdef",
    "topic_id": "clx1234567890abcdef",
    "processing_status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "statusCode": 201
}
```

## Test with cURL

### Minimal Upload (No subject/topic)
```bash
curl -X POST http://localhost:3000/api/v1/ai-chat/upload-document \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Random Study Material" \
  -F "document=@/path/to/your/document.pdf"
```

### With Subject Only
```bash
curl -X POST http://localhost:3000/api/v1/ai-chat/upload-document \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Math Notes" \
  -F "description=My personal math notes" \
  -F "subject_id=YOUR_SUBJECT_ID" \
  -F "document=@/path/to/your/document.pdf"
```

### Full Organization
```bash
curl -X POST http://localhost:3000/api/v1/ai-chat/upload-document \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Mathematics Chapter 5 - Algebra" \
  -F "description=Comprehensive guide to algebraic expressions" \
  -F "subject_id=YOUR_SUBJECT_ID" \
  -F "topic_id=YOUR_TOPIC_ID" \
  -F "document=@/path/to/your/document.pdf"
```

## Test with Postman
1. Set method to POST
2. Set URL to `http://localhost:3000/api/v1/ai-chat/upload-document`
3. Add Authorization header with Bearer token
4. Go to Body tab, select "form-data"
5. Add the following fields:
   - title (text)
   - description (text)
   - subject_id (text)
   - topic_id (text)
   - document (file)

## Features Implemented
✅ File validation (PDF, DOC, DOCX, PPT, PPTX)
✅ File size validation (max 300MB)
✅ S3 upload with organized folder structure
✅ Database record creation
✅ Material processing record creation
✅ Comprehensive error handling
✅ Professional logging
✅ Swagger documentation
✅ Type safety with DTOs
✅ **Temporary/Standalone Design** - No ordering needed for AI chat materials
✅ **Public Access** - Anyone can upload and chat with materials

## Next Steps
After successful upload, the document will be ready for:
1. Document chunking and processing
2. Vector embedding generation
3. AI chat functionality
