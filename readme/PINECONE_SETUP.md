# 🍍 **Pinecone Vector Database Setup Guide**

## **Why Pinecone is Better Than pgvector:**

✅ **Managed Service** - No database setup or maintenance  
✅ **Optimized for Vectors** - Built specifically for vector search  
✅ **Scalable** - Handles millions of vectors easily  
✅ **Fast** - Sub-millisecond search times  
✅ **Easy Deployment** - Works anywhere, just API calls  
✅ **No Database Extensions** - No pgvector installation needed  

## **Setup Steps:**

### **1. Create Pinecone Account**
1. Go to [pinecone.io](https://pinecone.io)
2. Sign up for free account
3. Create a new project

### **2. Get API Credentials**
1. Go to your Pinecone dashboard
2. Copy your **API Key**
3. Note your **Environment** (e.g., `us-east-1-aws`)

### **3. Update Environment Variables**
```bash
# Add to your .env file
PINECONE_API_KEY="your_pinecone_api_key_here"
PINECONE_ENVIRONMENT="us-east-1-aws"
```

### **4. Initialize Pinecone Index**
The service will automatically create the index when you first upload a document.

## **How It Works Now:**

### **Document Upload Flow:**
1. **Upload Document** → Stored in S3 + Database record
2. **Auto-Process** → Extract text, chunk, generate embeddings
3. **Save to Pinecone** → Vectors stored in Pinecone
4. **Save to Database** → Basic chunk info saved to PostgreSQL
5. **Ready for Chat** → User can search immediately

### **Search Flow:**
1. **User Query** → "What is mathematics?"
2. **Generate Embedding** → Convert query to vector
3. **Search Pinecone** → Find similar chunks
4. **Return Results** → Ranked by similarity

## **API Endpoints:**

### **Upload Document:**
```bash
POST /api/v1/ai-chat/start-upload
# Automatically processes and stores in Pinecone
```

### **Search Chunks:**
```bash
GET /api/v1/ai-chat/search-chunks/MATERIAL_ID?query=mathematics&topK=5
# Returns similar chunks from Pinecone
```

### **Check Processing Status:**
```bash
GET /api/v1/ai-chat/processing-status/MATERIAL_ID
# Shows processing progress
```

## **Pinecone vs pgvector Comparison:**

| Feature | Pinecone | pgvector |
|---------|----------|----------|
| **Setup** | API key only | Database extension needed |
| **Deployment** | Works anywhere | Needs PostgreSQL with pgvector |
| **Performance** | Optimized for vectors | Good with proper indexing |
| **Scalability** | Handles millions easily | Limited by database size |
| **Cost** | Pay per usage | Database hosting costs |
| **Maintenance** | Zero maintenance | Database maintenance needed |

## **Cost Estimation:**

### **Pinecone Pricing:**
- **Free Tier**: 100K vectors, 1 index
- **Starter**: $70/month for 1M vectors
- **Standard**: $140/month for 10M vectors

### **Typical Usage:**
- **1 PDF (50 pages)**: ~100-200 chunks
- **1000 PDFs**: ~100K-200K chunks
- **Monthly Cost**: $0-70 (within free tier)

## **Testing Your Setup:**

### **1. Test Pinecone Connection:**
```bash
# Check if Pinecone service initializes
npm run start
# Look for: "✅ Pinecone service initialized"
```

### **2. Upload a Test Document:**
```bash
curl -X POST "http://localhost:3000/api/v1/ai-chat/start-upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@test.pdf"
```

### **3. Check Processing Status:**
```bash
curl -X GET "http://localhost:3000/api/v1/ai-chat/processing-status/MATERIAL_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **4. Search Chunks:**
```bash
curl -X GET "http://localhost:3000/api/v1/ai-chat/search-chunks/MATERIAL_ID?query=test" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## **Production Deployment:**

### **Environment Variables:**
```bash
# Required
PINECONE_API_KEY="your_production_api_key"
PINECONE_ENVIRONMENT="your_environment"

# Optional (for different index)
PINECONE_INDEX_NAME="ai-chat-chunks-prod"
```

### **Deployment Steps:**
1. **Set Environment Variables** in your hosting platform
2. **Deploy Your Code** - Pinecone works anywhere
3. **Test Upload** - Verify everything works
4. **Monitor Usage** - Check Pinecone dashboard

## **Monitoring & Debugging:**

### **Pinecone Dashboard:**
- View index statistics
- Monitor query performance
- Check vector count
- View usage metrics

### **Logs to Watch:**
```
✅ Pinecone service initialized
🔧 Creating Pinecone index: ai-chat-chunks
📤 Upserting 25 chunks to Pinecone...
✅ Successfully upserted 25 chunks to Pinecone
🔍 Searching Pinecone for material: mat_123
✅ Found 5 similar chunks
```

## **Troubleshooting:**

### **Common Issues:**
1. **API Key Invalid**: Check your Pinecone dashboard
2. **Environment Wrong**: Verify environment name
3. **Index Not Found**: Service will auto-create on first use
4. **Rate Limits**: Pinecone has generous limits

### **Error Messages:**
- `Pinecone API key and environment must be provided` → Set environment variables
- `Failed to initialize Pinecone index` → Check API key and environment
- `Failed to upsert chunks` → Check network connection

## **Migration from pgvector:**

If you were using pgvector before:
1. **Keep your existing data** in PostgreSQL
2. **New uploads** will go to Pinecone
3. **Search** will use Pinecone for new documents
4. **Gradually migrate** old documents if needed

**Your AI chat system now uses Pinecone for lightning-fast vector search!** 🚀
