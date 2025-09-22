Perfect! Here's the complete list of AI Chat endpoints for your mobile app integration:

## 🚀 **AI Chat Endpoints for Mobile Integration**

### **1. Initiate AI Chat Session**
```
POST /api/v1/ai-chat/initiate-ai-chat
```
**Purpose**: Initialize AI chat based on user role, get supported document types and uploaded documents

**Request Body**:
```json
{
  "userRole": "teacher"
}
```

**Response**:
```json
{
  "success": true,
  "message": "AI chat session initiated successfully",
  "data": {
    "userRole": "teacher",
    "documentCount": 3,
    "supportedDocumentTypes": [
      {
        "type": "PDF",
        "extension": ".pdf",
        "mimeType": "application/pdf",
        "maxSize": "50MB",
        "description": "Portable Document Format files"
      }
      // ... more supported types
    ],
    "uploadedDocuments": [
      {
        "id": "cmfi9k59l0002sbx18gd4lvtc",
        "title": "Accelerated Maths Level 1",
        "description": "Mathematics workbook for level 1",
        "fileType": "pdf",
        "originalName": "math_workbook.pdf",
        "size": "16.73 MB",
        "status": "published",
        "createdAt": "2025-09-13T13:49:52.000Z",
        "isProcessed": true
      }
      // ... more documents
    ]
  },
  "statusCode": 200
}
```

---

### **2. Upload New Document**
```
POST /api/v1/ai-chat/upload-document
```
**Purpose**: Upload a new document for AI chat processing

**Request**: Multipart form data
- `file`: The document file
- `title`: Document title
- `description`: Document description (optional)

**Response**:
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "cmfi9k59l0002sbx18gd4lvtc",
    "title": "New Document",
    "status": "processing",
    "uploadedAt": "2025-09-13T13:49:52.000Z"
  },
  "statusCode": 200
}
```

---

### **3. Send Message to AI**
```
POST /api/v1/ai-chat/send-message
```
**Purpose**: Send a message to AI and get response

**Request Body**:
```json
{
  "message": "What are the main topics in this document?",
  "materialId": "cmfi9k59l0002sbx18gd4lvtc",
  "conversationId": "cmfia9ttk0001sbrwnd4og0lf"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message processed successfully",
  "data": {
    "id": "cmfian1rj000hsb3x6xhsuv2p",
    "content": "Based on the document, the main topics are...",
    "role": "ASSISTANT",
    "conversationId": "cmfia9ttk0001sbrwnd4og0lf",
    "materialId": "cmfi9k59l0002sbx18gd4lvtc",
    "contextChunks": [],
    "tokensUsed": 150,
    "responseTimeMs": 1868,
    "createdAt": "2025-09-13T13:07:21.384Z"
  },
  "statusCode": 200
}
```

---

### **4. Get Chat History**
```
GET /api/v1/ai-chat/conversations/{conversationId}/messages?limit=20&offset=0
```
**Purpose**: Get message history for a conversation

**Response**:
```json
{
  "success": true,
  "message": "Chat history retrieved successfully",
  "data": [
    {
      "id": "msg1",
      "content": "Hello, what can you help me with?",
      "role": "USER",
      "conversationId": "conv1",
      "materialId": "doc1",
      "createdAt": "2025-09-13T13:00:00.000Z"
    },
    {
      "id": "msg2",
      "content": "I can help you understand the document content...",
      "role": "ASSISTANT",
      "conversationId": "conv1",
      "materialId": "doc1",
      "tokensUsed": 100,
      "responseTimeMs": 1500,
      "createdAt": "2025-09-13T13:01:00.000Z"
    }
  ],
  "statusCode": 200
}
```

---

### **5. Get User Conversations**
```
GET /api/v1/ai-chat/conversations
```
**Purpose**: Get all conversations for the user

**Response**:
```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "id": "cmfia9ttk0001sbrwnd4og0lf",
      "title": "Document Chat",
      "status": "ACTIVE",
      "materialId": "cmfi9k59l0002sbx18gd4lvtc",
      "totalMessages": 10,
      "lastActivity": "2025-09-13T13:07:21.384Z",
      "createdAt": "2025-09-13T12:00:00.000Z",
      "updatedAt": "2025-09-13T13:07:21.384Z"
    }
  ],
  "statusCode": 200
}
```

---

### **6. Create New Conversation**
```
POST /api/v1/ai-chat/conversations
```
**Purpose**: Create a new conversation

**Request Body**:
```json
{
  "title": "New Chat Session",
  "materialId": "cmfi9k59l0002sbx18gd4lvtc",
  "systemPrompt": "You are a helpful AI assistant for this document."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "id": "cmfia9ttk0001sbrwnd4og0lf",
    "title": "New Chat Session",
    "status": "ACTIVE",
    "materialId": "cmfi9k59l0002sbx18gd4lvtc",
    "totalMessages": 0,
    "lastActivity": "2025-09-13T13:00:00.000Z",
    "createdAt": "2025-09-13T13:00:00.000Z",
    "updatedAt": "2025-09-13T13:00:00.000Z"
  },
  "statusCode": 200
}
```

---

## �� **Authentication**
All endpoints require JWT Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## �� **Mobile App Flow**
1. **Start**: Call `initiate-ai-chat` to get supported document types and existing documents
2. **Upload**: Use `upload-document` to add new documents
3. **Chat**: Use `send-message` to chat with AI about documents
4. **History**: Use `conversations` and `messages` endpoints to manage chat history

Ready to start integrating! 🚀