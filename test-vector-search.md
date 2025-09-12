# 🧠 **Vector Search Testing Guide**

## **pgvector Setup Complete!** ✅

Your PostgreSQL database now has pgvector extension enabled with optimized vector similarity search.

## **What's Been Set Up:**

### 1. **pgvector Extension** ✅
- Installed pgvector via Homebrew
- Enabled extension in your database
- Created vector(1536) columns for embeddings

### 2. **Vector Similarity Index** ✅
- Created `ivfflat` index for cosine similarity
- Optimized for fast vector searches
- Index name: `document_chunk_embedding_cosine_idx`

### 3. **Native Vector Operations** ✅
- Updated search to use native pgvector `<=>` operator
- Cosine similarity: `1 - (embedding <=> query_vector)`
- Much faster than JavaScript similarity calculations

## **Testing Vector Search**

### **Test 1: Basic Vector Search**
```bash
# Test the search endpoint
curl -X GET "http://localhost:3000/api/v1/ai-chat/search-chunks/MATERIAL_ID?query=mathematics&topK=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Test 2: Database Vector Query**
```sql
-- Test vector similarity directly in database
SELECT 
  id,
  content,
  chunk_type,
  1 - (embedding <=> '[0.1, 0.2, 0.3, ...]'::vector) as similarity
FROM "DocumentChunk"
WHERE material_id = 'your_material_id'
ORDER BY embedding <=> '[0.1, 0.2, 0.3, ...]'::vector
LIMIT 5;
```

### **Test 3: Performance Comparison**
```sql
-- Check index usage
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, content, 
  1 - (embedding <=> '[0.1, 0.2, 0.3, ...]'::vector) as similarity
FROM "DocumentChunk"
WHERE material_id = 'your_material_id'
ORDER BY embedding <=> '[0.1, 0.2, 0.3, ...]'::vector
LIMIT 5;
```

## **Performance Benefits:**

### **Before pgvector:**
- JavaScript similarity calculations
- O(n) complexity for each search
- Slower for large datasets

### **After pgvector:**
- Native database vector operations
- Optimized with ivfflat index
- Sub-millisecond search times
- Scales to millions of vectors

## **Vector Search Operators:**

- `<=>` - Cosine distance (0 = identical, 2 = opposite)
- `<#>` - Negative inner product
- `<->` - L2 distance (Euclidean)

## **Index Configuration:**
- **Type:** ivfflat
- **Lists:** 100 (good for 10K-1M vectors)
- **Operator:** vector_cosine_ops
- **Concurrent:** Yes (non-blocking creation)

## **Next Steps:**
1. Upload and process a document
2. Test the search functionality
3. Monitor performance with real data
4. Adjust index parameters if needed

## **Troubleshooting:**

### **If search is slow:**
```sql
-- Rebuild index with more lists
DROP INDEX document_chunk_embedding_cosine_idx;
CREATE INDEX CONCURRENTLY document_chunk_embedding_cosine_idx 
ON "DocumentChunk" USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 1000);
```

### **If index has low recall:**
- Add more data to the table first
- Increase the `lists` parameter
- Consider using `hnsw` index for better recall

**Ready for high-performance vector search!** 🚀
