/*
  # Create memory embeddings table for vector search

  1. New Tables
    - `memory_embeddings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `content` (text, the memory content)
      - `metadata` (jsonb, additional metadata)
      - `embedding` (vector, OpenAI embedding)
      - `created_at` (timestamp)

  2. Functions
    - `match_memories` function for similarity search

  3. Security
    - Enable RLS on `memory_embeddings` table
    - Add policies for users to access their own embeddings
*/

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS memory_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE memory_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own embeddings"
  ON memory_embeddings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own embeddings"
  ON memory_embeddings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS memory_embeddings_embedding_idx 
ON memory_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  filter jsonb DEFAULT '{}',
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.78
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    memory_embeddings.id,
    memory_embeddings.content,
    memory_embeddings.metadata,
    1 - (memory_embeddings.embedding <=> query_embedding) AS similarity
  FROM memory_embeddings
  WHERE memory_embeddings.metadata @> filter
    AND 1 - (memory_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY memory_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;