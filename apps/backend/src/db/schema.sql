CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  content    TEXT        NOT NULL,
  metadata   JSONB       DEFAULT '{}',
  embedding  vector(768) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- IVFFlat index for fast approximate cosine search
-- Rebuild after ingesting a large batch: REINDEX INDEX documents_embedding_idx
CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
