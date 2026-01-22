# Testing General Materials Chapter Upload with AI Processing

## 🎯 Overview
This guide shows how to test the new chapter file upload endpoint that includes automatic AI document processing using Pinecone.

## 📋 Prerequisites
1. **Library User Account** - You need a valid library user JWT token
2. **General Material** - Create a general material first with `isAiEnabled: true`
3. **Test PDF File** - Have a PDF file ready (max 300MB, supported formats: PDF, DOC, DOCX, PPT, PPTX)

## 🔗 Endpoint Details

**Endpoint:** `POST /api/v1/library/general-materials/:materialId/chapters/with-file`

**Authentication:** Bearer JWT Token (Library User)

**Content-Type:** `multipart/form-data`

## 📝 Request Format

### Headers
```
Authorization: Bearer <LIBRARY_JWT_TOKEN>
Content-Type: multipart/form-data
```

### Form Data
```
title: "Chapter 1: Introduction" (REQUIRED)
description: "Introduction to the topic" (OPTIONAL)
pageStart: 1 (OPTIONAL)
pageEnd: 10 (OPTIONAL)
fileTitle: "Chapter 1 File" (OPTIONAL - defaults to original filename)
fileDescription: "File description" (OPTIONAL)
fileOrder: 1 (OPTIONAL - defaults to 1)
fileType: "PDF" (OPTIONAL - auto-detected from file extension)
file: <PDF_FILE> (REQUIRED)
```

## 🧪 Testing Steps

### Step 1: Get Your Library JWT Token
```bash
# Login as library user and get token
curl -X POST http://localhost:3000/api/v1/library/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-library-email@example.com",
    "password": "your-password"
  }'
```

### Step 2: Create a General Material (if you don't have one)
```bash
curl -X POST http://localhost:3000/api/v1/library/general-materials \
  -H "Authorization: Bearer YOUR_LIBRARY_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Material for AI Processing",
    "description": "Testing AI-enabled material",
    "isAiEnabled": true
  }'
```

**Note:** `isAiEnabled` must be `true` for the chapter upload to work!

### Step 3: Upload Chapter with File
```bash
curl -X POST http://localhost:3000/api/v1/library/general-materials/YOUR_MATERIAL_ID/chapters/with-file \
  -H "Authorization: Bearer YOUR_LIBRARY_JWT_TOKEN" \
  -F "title=Chapter 1: Introduction" \
  -F "description=First chapter of the material" \
  -F "file=@/path/to/your/document.pdf"
```

### Step 4: Check Processing Status
The document processing starts automatically in the background. You can check the status:

```bash
# Get processing status (if you have the PDFMaterial ID)
curl -X GET http://localhost:3000/api/v1/ai-chat/processing-status/PDF_MATERIAL_ID \
  -H "Authorization: Bearer YOUR_LIBRARY_JWT_TOKEN"
```

## 📊 Expected Response (201 Created)

```json
{
  "success": true,
  "message": "Chapter with file created successfully",
  "data": {
    "id": "chapter_id_here",
    "materialId": "material_id_here",
    "platformId": "platform_id_here",
    "title": "Chapter 1: Introduction",
    "description": "First chapter of the material",
    "pageStart": null,
    "pageEnd": null,
    "isAiEnabled": true,
    "isProcessed": true,
    "order": 1,
    "files": [
      {
        "id": "file_id_here",
        "fileName": "document.pdf",
        "fileType": "PDF",
        "url": "https://s3.amazonaws.com/...",
        "sizeBytes": 2048576,
        "title": "Chapter 1 File",
        "description": null,
        "order": 1,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "statusCode": 201
}
```

## 🔍 What Happens Behind the Scenes

1. **File Validation** - Validates file type, size (max 300MB)
2. **S3 Upload** - Uploads to `library/general-materials/chapters/{platformId}/{materialId}/`
3. **Database Records Created:**
   - `LibraryGeneralMaterialChapter` - The chapter record
   - `PDFMaterial` - Material record (for AI processing lookup)
   - `LibraryGeneralMaterialChapterFile` - File metadata
4. **Material Processing Record** - Creates `MaterialProcessing` record with status `PENDING`
5. **Background Processing Started** - Automatically starts document processing:
   - Text extraction
   - Document chunking
   - Embedding generation
   - Pinecone vector storage

## ⚠️ Important Notes

### For Library Materials:
- Library materials use a default "Library Chat System" school for processing
- This is required by the database schema (school_id is mandatory)
- Library owners don't need to be associated with a real school
- All library materials share the same system school for processing

### Processing Status:
- **PENDING** - Processing not started yet
- **PROCESSING** - Currently being processed
- **COMPLETED** - Successfully processed and ready for AI chat
- **FAILED** - Processing failed (check error_message)

## 🐛 Troubleshooting

### Error: "Material does not have AI chat enabled"
**Solution:** Make sure the general material has `isAiEnabled: true`

```bash
# Update material to enable AI
curl -X PATCH http://localhost:3000/api/v1/library/general-materials/YOUR_MATERIAL_ID \
  -H "Authorization: Bearer YOUR_LIBRARY_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isAiEnabled": true}'
```

### Error: "File validation failed"
**Solution:** Check:
- File size is under 300MB
- File type is PDF, DOC, DOCX, PPT, or PPTX
- File is not corrupted

### Processing Not Starting
**Solution:** Check server logs for errors. The processing starts automatically in the background.

## 📱 Testing with Postman

1. **Method:** POST
2. **URL:** `http://localhost:3000/api/v1/library/general-materials/:materialId/chapters/with-file`
3. **Headers:**
   - `Authorization: Bearer YOUR_LIBRARY_JWT_TOKEN`
4. **Body:** Select `form-data`
5. **Add Fields:**
   - `title` (text): "Chapter 1"
   - `file` (file): Select your PDF file
6. **Send Request**

## ✅ Success Indicators

After successful upload, you should see:
1. ✅ File uploaded to S3
2. ✅ Database records created
3. ✅ Material processing record created
4. ✅ Document processing started
5. ✅ Chapter status shows `isProcessed: true`

## 🔄 Next Steps After Upload

Once processing is complete:
1. The document chunks are stored in Pinecone
2. The material is ready for AI chat
3. Users can query the document using the explore chat service
4. The processing status will be `COMPLETED`

---

## 📚 Related Endpoints

- **Get Material:** `GET /api/v1/library/general-materials/:materialId`
- **Get Chapter:** `GET /api/v1/library/general-materials/:materialId/chapters/:chapterId`
- **Check Processing:** `GET /api/v1/ai-chat/processing-status/:materialId`
