# Smart Edu Hub — Chat with PDF Setup Plan  

This is the high-level plan for enabling students to **chat with PDF or DOC materials** inside the Smart Edu Hub platform.  

## 🎯 **Current Status: Phase 1 Complete ✅**
- Document upload and storage is working
- Ready to move to Phase 2: Document Processing Pipeline

---

## 1. Goal  

- Teachers upload study materials (PDF, DOC).  
  - ✅ Already implemented in another service (do not re-implement in AI-chat module).  
- Students can click **“Chat with this material”** on the app.  
  - ✅ Already implemented (no extra work needed here).  
- Students ask questions in natural language (supports **English, Hausa, Yoruba**, etc.).  
- The system answers in a conversational way, with **memory of past messages** and **context from the document**.  

---

## 2. Data Flow  

### 2.1 Upload & Store  
- Teacher uploads PDF/DOC → stored in **AWS S3**.  
- File is pre-processed into **chunks** (sections of text).  
- Each chunk is **embedded** (converted into vectors) and stored in a **vector database** (pgvector, Pinecone, or similar).  

### 2.2 Chat Session  
- Student opens a material and starts a chat.  
- Every message is saved in a **chat_messages history table** with:  
  - student  
  - material  
  - role (user/assistant)  
  - content  
  - timestamp  

### 2.3 Handling a Message  
When a student sends a question:  
1. Save the question in the chat history.  
2. Fetch recent conversation history for continuity.  
3. Generate embedding for the new question.  
4. Search the vector database for **relevant chunks** from the material.  
5. Build a **prompt** for the LLM containing:  
   - System role (e.g. *“You are a helpful tutor for this material”*).  
   - Previous chat history.  
   - The student’s new question.  
   - Context snippets retrieved from the document.  
6. Send the prompt to the LLM.  
7. Save the assistant’s response to chat history.  
8. Return the response to the app.  

### 2.4 Conversation Continuity  
- Each new student question should include **recent history** in the prompt.  
- If the history grows too long:  
  - Use a **sliding window** (last N messages), or  
  - **Summarize older messages**.  

---

## 3. Expected Outcome  

- Student can ask: *“What is photosynthesis?”*  
- System answers from the material.  
- Student can then ask: *“And what role does chlorophyll play?”*  
- System understands the follow-up because it has the **previous chat history in memory**.  

---

## 4. Tech Stack Recommendations  

- **LLM (Large Language Model)**  
  - Use **OpenAI GPT-4o-mini** (cheap, fast, good quality).  
  - Alternative: **Claude Haiku** (Anthropic) or **DeepSeek** (if cost-sensitive).  

- **Vector Database**  
  - **Option 1: pgvector** (recommended if you already use PostgreSQL with NestJS).  
  - **Option 2: Pinecone** (scalable, easy setup, but external cost).  
  - **Option 3: Weaviate or Qdrant** (open-source alternatives if you want self-hosting).  

- **Embeddings**  
  - Use **OpenAI `text-embedding-3-small`** for cost efficiency.  
  - If needed for multilingual (Yoruba, Hausa, etc.), **text-embedding-3-large** offers better coverage.  

- **Storage**  
  - Already handled with **AWS S3** (no changes needed).  

---

## 5. Implementation Checklist

### ✅ **Phase 1: Document Upload & Storage (COMPLETED)**
- [x] Document upload to S3
- [x] Database storage of materials
- [x] Basic API endpoints
- [x] File validation and processing

### ❌ **Phase 2: Document Processing Pipeline (PENDING)**
- [ ] **Text Extraction**: Extract text from PDF/DOC files
- [ ] **Document Chunking**: Break documents into smaller text sections (500-1000 tokens)
- [ ] **Embedding Generation**: Convert chunks to vectors using OpenAI embeddings
- [ ] **Vector Storage**: Store embeddings in vector database (pgvector/Pinecone)
- [ ] **Processing Status**: Track document processing status (pending/processing/completed)

### ❌ **Phase 3: Chat Functionality (PENDING)**
- [ ] **Chat Endpoints**: 
  - `POST /api/v1/ai-chat/send-message` - Send message to AI
  - `GET /api/v1/ai-chat/chat-history/:materialId` - Get conversation history
  - `GET /api/v1/ai-chat/conversations` - List user's conversations
- [ ] **Conversation Memory**: Store chat history with user, material, role, content, timestamp
- [ ] **Context Retrieval**: Find relevant chunks for questions using vector search
- [ ] **Session Management**: Handle multiple concurrent chat sessions

### ❌ **Phase 4: AI Integration (PENDING)**
- [ ] **LLM Integration**: Connect to OpenAI GPT-4o-mini or Claude Haiku
- [ ] **Prompt Building**: Combine context + history + question into effective prompts
- [ ] **Response Generation**: Get AI answers and stream responses
- [ ] **Multilingual Support**: Handle English, Hausa, Yoruba questions
- [ ] **Error Handling**: Graceful fallbacks for AI service failures

### ❌ **Phase 5: Advanced Features (FUTURE)**
- [ ] **Streaming Responses**: Real-time typing effect for better UX
- [ ] **Conversation Summarization**: Summarize long chat histories
- [ ] **Cost Monitoring**: Track LLM usage per student
- [ ] **Analytics**: Track popular questions and materials
- [ ] **Caching**: Cache frequent embeddings and responses

---

## 6. Next Steps Priority

### **Immediate Next Step: Document Processing Pipeline**
1. **Text Extraction Service**: Extract text from uploaded PDFs
2. **Chunking Service**: Split text into manageable chunks
3. **Embedding Service**: Generate vectors for each chunk
4. **Vector Database Setup**: Configure pgvector or Pinecone
5. **Processing Queue**: Handle document processing asynchronously

### **Then: Chat System**
1. **Chat Message Model**: Database schema for conversations
2. **Chat Endpoints**: Basic send/receive message functionality
3. **Context Search**: Find relevant chunks for questions
4. **LLM Integration**: Connect to AI service
5. **Memory Management**: Handle conversation continuity

---

## 7. Scalability Considerations  

1. **Token Cost Management**  
   - Use shorter context windows (e.g. last 5–10 messages).  
   - Summarize older conversations before passing to the LLM.  
   - Cache embeddings to avoid recomputation.  

2. **Parallel Users**  
   - Ensure chat history is stored per **student + material** to avoid mix-ups.  
   - Use database indexing for fast retrieval of chat history and embeddings.  

3. **Large Documents**  
   - Break materials into **smaller chunks (500–1000 tokens)** for efficient retrieval.  
   - Use a hybrid search: semantic (vector) + keyword filtering for precision.  

4. **Response Latency**  
   - Pre-compute embeddings at upload time, not during chat.  
   - Use streaming responses from the LLM for better UX (students see answers being typed).  

5. **Monitoring & Logging**  
   - Track LLM usage per student to control costs.  
   - Store logs of queries and responses for debugging and future model fine-tuning.  

---