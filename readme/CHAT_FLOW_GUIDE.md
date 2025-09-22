# 💬 **Complete AI Chat Flow Guide**

## **🔄 Complete Flow - Step by Step:**

### **Step 1: Upload Document**
```bash
POST /api/v1/ai-chat/start-upload
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body:
- document: [PDF file]
- title: "Mathematics Chapter 5" (optional)
- description: "Algebra basics" (optional)
- materialId: "mat_123" (optional)

Response:
{
  "success": true,
  "message": "Document upload started",
  "data": {
    "sessionId": "upload_session_123",
    "materialId": "cmfh35jfh0002sbix6l9n752e",
    "progressEndpoint": "/api/v1/ai-chat/upload-progress/upload_session_123"
  }
}
```

### **Step 2: Check Processing Status**
```bash
GET /api/v1/ai-chat/processing-status/cmfh35jfh0002sbix6l9n752e
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "success": true,
  "data": {
    "materialId": "cmfh35jfh0002sbix6l9n752e",
    "status": "COMPLETED",
    "totalChunks": 25,
    "processedChunks": 25,
    "failedChunks": 0
  }
}
```

### **Step 3: Create Chat Conversation (Optional)**
```bash
POST /api/v1/ai-chat/conversations
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

Body:
{
  "title": "Math Discussion",
  "materialId": "cmfh35jfh0002sbix6l9n752e",
  "systemPrompt": "You are a helpful math tutor."
}

Response:
{
  "success": true,
  "data": {
    "id": "conv_1234567890abcdef",
    "title": "Math Discussion",
    "status": "ACTIVE",
    "materialId": "cmfh35jfh0002sbix6l9n752e",
    "totalMessages": 0
  }
}
```

### **Step 4: Send Message to Chat**
```bash
POST /api/v1/ai-chat/send-message
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

Body:
{
  "message": "What is the main topic of this document?",
  "materialId": "cmfh35jfh0002sbix6l9n752e",
  "conversationId": "conv_1234567890abcdef" (optional)
}

Response:
{
  "success": true,
  "data": {
    "id": "msg_1234567890abcdef",
    "content": "Based on the document, the main topic is algebraic expressions and equations. The document covers...",
    "role": "ASSISTANT",
    "conversationId": "conv_1234567890abcdef",
    "materialId": "cmfh35jfh0002sbix6l9n752e",
    "contextChunks": [
      {
        "id": "chunk_123",
        "content": "Algebraic expressions are mathematical phrases...",
        "similarity": 0.85,
        "chunkType": "paragraph"
      }
    ],
    "tokensUsed": 150,
    "responseTimeMs": 1200
  }
}
```

## **🧠 How Chat Memory Works:**

### **Conversation Memory:**
- **Conversation ID**: Links all messages together
- **Message History**: Last 10 messages used as context
- **User Context**: Each user has separate conversations
- **Material Context**: Document-specific conversations

### **Document Context:**
- **Vector Search**: Finds relevant chunks from Pinecone
- **Context Chunks**: Top 5 most similar chunks
- **Similarity Scores**: Shows how relevant each chunk is
- **Chunk Types**: Paragraph, heading, list, etc.

### **AI Response Generation:**
1. **User Message** → Generate embedding
2. **Search Pinecone** → Find relevant document chunks
3. **Get Conversation History** → Last 10 messages
4. **Build Context** → Document chunks + conversation history
5. **Generate Response** → Using OpenAI GPT-4o-mini
6. **Save Messages** → User + AI messages to database

## **📱 Mobile App Integration:**

### **Upload Flow:**
```javascript
// 1. Upload document
const uploadResponse = await fetch('/api/v1/ai-chat/start-upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData
});

// 2. Monitor progress
const progressStream = new EventSource(
  `/api/v1/ai-chat/upload-progress/${sessionId}`
);

progressStream.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  updateProgressBar(progress.progress);
};
```

### **Chat Flow:**
```javascript
// 1. Create conversation
const conversation = await fetch('/api/v1/ai-chat/conversations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Document Chat',
    materialId: materialId
  })
});

// 2. Send message
const response = await fetch('/api/v1/ai-chat/send-message', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: userMessage,
    materialId: materialId,
    conversationId: conversationId
  })
});
```

## **🔧 Environment Variables Needed:**

```bash
# OpenAI
OPENAI_API_KEY="your_openai_api_key"

# Pinecone
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_ENVIRONMENT="us-east-1-aws"

# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# AWS S3
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

## **📊 API Endpoints Summary:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/start-upload` | POST | Upload document with progress tracking |
| `/upload-progress/:sessionId` | GET (SSE) | Real-time upload progress |
| `/processing-status/:materialId` | GET | Check document processing status |
| `/search-chunks/:materialId` | GET | Search document chunks |
| `/conversations` | POST | Create new conversation |
| `/conversations` | GET | Get user conversations |
| `/send-message` | POST | Send message and get AI response |
| `/conversations/:id/messages` | GET | Get chat history |

## **💡 Key Features:**

### **✅ Document Processing:**
- Automatic text extraction
- Smart chunking (500-1000 tokens)
- Vector embeddings generation
- Pinecone storage for fast search

### **✅ Chat Memory:**
- Conversation persistence
- Message history context
- Document-specific conversations
- User-specific conversations

### **✅ Real-time Features:**
- Upload progress tracking
- Streaming responses
- Live status updates

### **✅ Context Awareness:**
- Document chunk retrieval
- Similarity scoring
- Relevant context injection
- Chunk type classification

**Your AI chat system is now complete with full conversation memory and document context!** 🚀
