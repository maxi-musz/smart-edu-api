# Upload Progress System Test Guide

## 🚀 **Real-Time Upload Progress with SSE**

This guide shows how to test the new upload progress system that provides real-time progress updates for document uploads.

## 📋 **Available Endpoints**

### 1. **Start Upload with Progress Tracking**
- **Endpoint**: `POST /api/v1/ai-chat/start-upload`
- **Purpose**: Start upload with real-time progress tracking
- **Response**: Returns session ID and progress endpoint

### 2. **Stream Progress Updates (SSE)**
- **Endpoint**: `GET /api/v1/ai-chat/upload-progress/:sessionId`
- **Purpose**: Real-time progress updates via Server-Sent Events
- **Content-Type**: `text/event-stream`

### 3. **Get Current Status (One-time)**
- **Endpoint**: `GET /api/v1/ai-chat/upload-status/:sessionId`
- **Purpose**: Get current progress without streaming
- **Response**: Current progress data

## 🔄 **Upload Progress Stages**

1. **Validating** (0-10%): File validation
2. **Uploading** (10-80%): S3 upload
3. **Processing** (80-90%): Document processing
4. **Saving** (90-100%): Database operations
5. **Completed** (100%): Upload finished
6. **Error**: Upload failed

## 📱 **Mobile App Integration**

### **Step 1: Start Upload**
```javascript
// Start upload and get session ID
const formData = new FormData();
formData.append('title', 'Test Document');
formData.append('description', 'Test description');
formData.append('document', file);

const response = await fetch('/api/v1/ai-chat/start-upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { data } = await response.json();
const { sessionId, progressEndpoint } = data;
```

### **Step 2: Connect to Progress Stream**
```javascript
// Connect to SSE stream for real-time updates
const eventSource = new EventSource(`/api/v1/ai-chat/upload-progress/${sessionId}`);

eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  
  // Update UI with progress
  updateProgressBar(progress.progress);
  updateStatusMessage(progress.message);
  updateStage(progress.stage);
  
  // Handle completion
  if (progress.stage === 'completed') {
    eventSource.close();
    showSuccessMessage('Upload completed!');
    // Navigate to chat or show material ID
    console.log('Material ID:', progress.materialId);
  }
  
  // Handle errors
  if (progress.stage === 'error') {
    eventSource.close();
    showErrorMessage(progress.error);
  }
};

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  eventSource.close();
};
```

### **Step 3: Update UI Components**
```javascript
function updateProgressBar(progress) {
  const progressBar = document.getElementById('upload-progress');
  progressBar.style.width = `${progress}%`;
  progressBar.setAttribute('aria-valuenow', progress);
}

function updateStatusMessage(message) {
  const statusElement = document.getElementById('upload-status');
  statusElement.textContent = message;
}

function updateStage(stage) {
  const stageElement = document.getElementById('upload-stage');
  stageElement.textContent = stage;
  stageElement.className = `stage-${stage}`;
}
```

## 🧪 **Testing with cURL**

### **Test 1: Start Upload**
```bash
curl -X POST "http://localhost:3000/api/v1/ai-chat/start-upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Test Document" \
  -F "description=Test description" \
  -F "document=@/path/to/test.pdf"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Upload started successfully. Use the progress endpoint to track progress.",
  "data": {
    "sessionId": "upload_session_1234567890_abc123",
    "progressEndpoint": "/api/v1/ai-chat/upload-progress/upload_session_1234567890_abc123"
  },
  "statusCode": 202
}
```

### **Test 2: Stream Progress (SSE)**
```bash
curl -N "http://localhost:3000/api/v1/ai-chat/upload-progress/upload_session_1234567890_abc123"
```

**Expected Stream:**
```
data: {"sessionId":"upload_session_1234567890_abc123","progress":0,"stage":"validating","message":"Validating file...","bytesUploaded":0,"totalBytes":2097152}

data: {"sessionId":"upload_session_1234567890_abc123","progress":10,"stage":"validating","message":"File validation passed","bytesUploaded":209715,"totalBytes":2097152}

data: {"sessionId":"upload_session_1234567890_abc123","progress":45,"stage":"uploading","message":"Uploading to cloud storage...","bytesUploaded":943718,"totalBytes":2097152}

data: {"sessionId":"upload_session_1234567890_abc123","progress":80,"stage":"uploading","message":"Upload completed","bytesUploaded":1677721,"totalBytes":2097152}

data: {"sessionId":"upload_session_1234567890_abc123","progress":90,"stage":"processing","message":"Processing document for AI chat...","bytesUploaded":1887436,"totalBytes":2097152}

data: {"sessionId":"upload_session_1234567890_abc123","progress":95,"stage":"saving","message":"Saving to database...","bytesUploaded":1992294,"totalBytes":2097152}

data: {"sessionId":"upload_session_1234567890_abc123","progress":100,"stage":"completed","message":"Upload completed successfully!","bytesUploaded":2097152,"totalBytes":2097152,"materialId":"clx1234567890abcdef"}
```

### **Test 3: Get Current Status**
```bash
curl "http://localhost:3000/api/v1/ai-chat/upload-status/upload_session_1234567890_abc123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Upload status retrieved",
  "data": {
    "sessionId": "upload_session_1234567890_abc123",
    "progress": 45,
    "stage": "uploading",
    "message": "Uploading to cloud storage...",
    "bytesUploaded": 943718,
    "totalBytes": 2097152,
    "estimatedTimeRemaining": 15
  },
  "statusCode": 200
}
```

## 📊 **Progress Data Structure**

```typescript
interface UploadProgressDto {
  sessionId: string;           // Unique session identifier
  progress: number;            // Progress percentage (0-100)
  stage: string;              // Current stage
  message: string;            // User-friendly message
  bytesUploaded: number;      // Bytes uploaded so far
  totalBytes: number;         // Total file size
  estimatedTimeRemaining?: number; // ETA in seconds
  error?: string;             // Error message if failed
  materialId?: string;        // Material ID when completed
}
```

## 🎯 **Mobile App UX Flow**

1. **User selects file** → Show file info
2. **User taps upload** → Start upload, show progress bar
3. **Progress updates** → Update bar, show stage message
4. **Upload completes** → Show success, navigate to chat
5. **Upload fails** → Show error, allow retry

## 🔧 **Features Implemented**

✅ **Real-time progress tracking** (0-100%)
✅ **Stage-based progress** (validation, upload, processing, saving)
✅ **Server-Sent Events** for real-time updates
✅ **One-time status check** for simple queries
✅ **Error handling** with detailed messages
✅ **Time estimation** for remaining upload time
✅ **Session management** with cleanup
✅ **Mobile-optimized** progress data
✅ **Professional logging** for debugging

## 🚀 **Next Steps**

After implementing upload progress:
1. **Document chunking service** for AI processing
2. **Vector embedding generation** for search
3. **Chat conversation endpoints** for AI interaction
4. **Progress persistence** for app restarts
5. **Upload resumption** for failed uploads

## 📝 **Notes**

- **Session cleanup**: Old sessions are automatically cleaned up after 30 minutes
- **Error recovery**: Failed uploads can be retried with new session
- **Mobile optimization**: Progress data is optimized for mobile UI updates
- **Scalability**: SSE connections are lightweight and scalable
- **Security**: All endpoints require JWT authentication

This system provides a professional, user-friendly upload experience with real-time feedback! 🎉
