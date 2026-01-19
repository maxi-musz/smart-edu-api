-- Enable pgvector extension for vector embeddings
-- Run this in Neon SQL Editor before running migrations

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- If successful, you should see:
-- extname | extversion
-- --------+-----------
-- vector  | 0.x.x

