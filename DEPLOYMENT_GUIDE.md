# 🚀 **AI Chat Deployment Guide**

## **How Document Upload & Vector Processing Works Now**

### **Automatic Flow (Fixed!):**
1. **Upload Document** → Stored in AWS S3 + Database record created
2. **Auto-Process** → Automatically extracts text, chunks, and generates embeddings
3. **Store in Vector DB** → Chunks + embeddings saved to PostgreSQL with pgvector
4. **Ready for Chat** → User can immediately search and chat with the document

### **API Flow:**
```bash
# Step 1: Upload document (now auto-processes)
POST /api/v1/ai-chat/start-upload
# Returns: { sessionId: "upload_123", materialId: "mat_456" }
# ✅ Automatically starts processing in background

# Step 2: Check processing status
GET /api/v1/ai-chat/processing-status/mat_456
# Returns: { status: "COMPLETED", totalChunks: 25, processedChunks: 25 }

# Step 3: Search chunks (ready to use!)
GET /api/v1/ai-chat/search-chunks/mat_456?query=mathematics&topK=5
# Returns: Relevant chunks with similarity scores
```

## **Production Deployment Options**

### **Option 1: Supabase (Recommended - Easiest)**
```bash
# 1. Create Supabase project
# 2. Get connection string
# 3. Update .env
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# ✅ pgvector is pre-installed on Supabase!
```

### **Option 2: Neon (Good Alternative)**
```bash
# 1. Create Neon project
# 2. Enable pgvector extension
# 3. Update .env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"

# ✅ pgvector support available
```

### **Option 3: AWS RDS with pgvector**
```bash
# 1. Launch RDS PostgreSQL instance
# 2. Connect and install pgvector
sudo -u postgres psql
CREATE EXTENSION vector;

# 3. Update .env
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[database]"
```

### **Option 4: Docker with pgvector**
```dockerfile
# Dockerfile
FROM postgres:15
RUN apt-get update && apt-get install -y postgresql-15-pgvector
```

## **Environment Variables Needed**

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# AWS S3
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# OpenAI
OPENAI_API_KEY="your_openai_api_key"
```

## **Deployment Steps**

### **1. Choose Your Database Provider**
- **Supabase** (easiest - pgvector pre-installed)
- **Neon** (good alternative)
- **AWS RDS** (more control)
- **Self-hosted** (most control)

### **2. Update Database URL**
```bash
# Update .env with your production database URL
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### **3. Run Migrations**
```bash
# Deploy database schema
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### **4. Deploy Your App**
```bash
# Build and deploy
npm run build
npm start
```

## **Testing in Production**

### **1. Upload a Document**
```bash
curl -X POST "https://your-api.com/api/v1/ai-chat/start-upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@test.pdf"
```

### **2. Check Processing Status**
```bash
curl -X GET "https://your-api.com/api/v1/ai-chat/processing-status/MATERIAL_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Search Chunks**
```bash
curl -X GET "https://your-api.com/api/v1/ai-chat/search-chunks/MATERIAL_ID?query=mathematics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## **Performance Considerations**

### **Vector Search Performance:**
- **Small datasets (< 10K chunks)**: Very fast (< 100ms)
- **Medium datasets (10K-100K chunks)**: Fast (< 500ms)
- **Large datasets (100K+ chunks)**: Consider index tuning

### **Index Optimization:**
```sql
-- For better performance with large datasets
DROP INDEX document_chunk_embedding_cosine_idx;
CREATE INDEX CONCURRENTLY document_chunk_embedding_cosine_idx 
ON "DocumentChunk" USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 1000);
```

## **Monitoring & Debugging**

### **Check pgvector Installation:**
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### **Check Vector Index:**
```sql
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'DocumentChunk' AND indexname LIKE '%embedding%';
```

### **Test Vector Search:**
```sql
SELECT id, content, 
  1 - (embedding <=> '[0.1, 0.2, 0.3]'::vector) as similarity
FROM "DocumentChunk" 
ORDER BY embedding <=> '[0.1, 0.2, 0.3]'::vector 
LIMIT 5;
```

## **Cost Considerations**

### **Database Costs:**
- **Supabase**: Free tier available, then $25/month
- **Neon**: Free tier available, then $19/month
- **AWS RDS**: ~$15-50/month depending on size

### **OpenAI Costs:**
- **Embeddings**: ~$0.0001 per 1K tokens
- **Typical document**: ~$0.01-0.10 per document
- **Monthly usage**: Depends on document volume

## **Troubleshooting**

### **Common Issues:**
1. **pgvector not installed**: Use Supabase or install manually
2. **Vector dimension mismatch**: Ensure 1536 dimensions for text-embedding-3-small
3. **Slow searches**: Check index configuration
4. **Memory issues**: Reduce batch size in processing

### **Support:**
- Check logs for processing errors
- Monitor database performance
- Test with small documents first

**Your AI chat system is now production-ready!** 🚀
