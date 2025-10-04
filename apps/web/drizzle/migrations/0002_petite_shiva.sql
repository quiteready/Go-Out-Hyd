-- RPC Function 1: Vector Search for Text Embeddings (768 dimensions)
-- Performs vector similarity search with user-level access control
-- Uses embedding column existence for natural filtering
-- Returns both content (transcription) and context (visual descriptions) for multimodal RAG
CREATE OR REPLACE FUNCTION match_text_chunks (
      query_embedding vector(768),
      p_user_id uuid,
      p_match_threshold float DEFAULT 0.7,
      p_match_count int DEFAULT 10
)
RETURNS TABLE (
      chunk_id uuid,
      document_id uuid,
      content text,
      context text,
      similarity float,
      metadata jsonb,
      document_filename text,
      created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
      RETURN QUERY
      SELECT
         dc.id as chunk_id,
         dc.document_id,
         dc.content,
         dc.context,
         (1 - (dc.text_embedding <=> query_embedding)) as similarity,
         dc.metadata,
         d.original_filename as document_filename,
         dc.created_at
      FROM
         document_chunks dc
      INNER JOIN
         documents d ON dc.document_id = d.id
      WHERE
         -- CRITICAL: User scoping first
         dc.user_id = p_user_id
         AND d.status = 'completed'
         -- Text embedding existence check (natural filtering)
         AND dc.text_embedding IS NOT NULL
         -- Similarity threshold
         AND (1 - (dc.text_embedding <=> query_embedding)) > p_match_threshold
      ORDER BY
         similarity DESC
      LIMIT p_match_count;
END;
$$;

-- RPC Function 2: Vector Search for Multimodal Embeddings (1408 dimensions)
-- Performs vector similarity search for combined visual + text content
-- Uses embedding column existence for natural filtering
-- Returns both content (transcription) and context (visual descriptions) for multimodal RAG
CREATE OR REPLACE FUNCTION match_multimodal_chunks (
      query_embedding vector(1408),
      p_user_id uuid,
      p_match_threshold float DEFAULT 0.7,
      p_match_count int DEFAULT 10
)
RETURNS TABLE (
      chunk_id uuid,
      document_id uuid,
      content text,
      context text,
      similarity float,
      metadata jsonb,
      document_filename text,
      created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
      RETURN QUERY
      SELECT
         dc.id as chunk_id,
         dc.document_id,
         dc.content,
         dc.context,
         (1 - (dc.multimodal_embedding <=> query_embedding)) as similarity,
         dc.metadata,
         d.original_filename as document_filename,
         dc.created_at
      FROM
         document_chunks dc
      INNER JOIN
         documents d ON dc.document_id = d.id
      WHERE
         -- CRITICAL: User scoping first
         dc.user_id = p_user_id
         AND d.status = 'completed'
         -- Multimodal embedding existence check (natural filtering)
         AND dc.multimodal_embedding IS NOT NULL
         -- Similarity threshold
         AND (1 - (dc.multimodal_embedding <=> query_embedding)) > p_match_threshold
      ORDER BY
         similarity DESC
      LIMIT p_match_count;
END;
$$;
