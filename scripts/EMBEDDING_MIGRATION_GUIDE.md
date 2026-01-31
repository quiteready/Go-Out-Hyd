# RAG Embedding Migration Plan

## text-embedding-004 (768d) → gemini-embedding-001 (3072d)

This guide walks you through migrating your RAG system from `text-embedding-004` (768 dimensions) to `gemini-embedding-001` (3072 dimensions) with improved search quality.

**Strategy:** Additive migration - add new column, populate embeddings, then cleanup old column.

**Environments:** Always migrate staging first, then production.

---

## Phase 1: Setup & Schema Migration

Add the new embedding column `text_embedding_v2` and index to your database schema.

### 1.1 Update Drizzle Schema

**File:** `apps/web/lib/drizzle/schema/document_chunks.ts`

Add the new constant and column:

```typescript
// Add V2 constant (after TEXT_EMBEDDING_DIMENSIONS)
export const TEXT_EMBEDDING_V2_DIMENSIONS = 3072;

// Add new column (after text_embedding)
text_embedding_v2: vector("text_embedding_v2", {
  dimensions: TEXT_EMBEDDING_V2_DIMENSIONS,
}),

// Add HNSW index for the new column (in the indexes array)
index("document_chunks_text_embedding_idx_v2").using(
  "hnsw",
  sql`(text_embedding_v2::halfvec(3072)) halfvec_cosine_ops`
),
```

### 1.2 Generate & Apply Migration (Staging)

```bash
# Generate the migration file
npm run db:generate

# Ask AI to generate the down migration for rollback capability

# Apply migration to staging database
npm run db:migrate
```

**Verify:** Check your Supabase staging database → Table Editor → `document_chunks` table. Confirm the `text_embedding_v2` column was created.

### 1.3 Apply Migration (Production)

```bash
# Apply the same migration to production
npm run db:migrate:prod
```

**Verify:** Check your Supabase production database to confirm the `text_embedding_v2` column exists.

### 1.4 Update Codebase

Update your project to the latest RAG-Simple template version which uses `gemini-embedding-001` (3072d) instead of `text-embedding-004` (768d).

Key files that change:
- `apps/rag-processor/rag_processor/config.py` - Model and dimensions
- `apps/rag-processor/rag_processor/services/embedding_service.py` - Default params
- `apps/rag-processor/rag_processor/services/database_service.py` - INSERT statement
- `apps/web/lib/embeddings/text-embeddings.ts` - Model and dimensions
- `apps/web/lib/embeddings/types.ts` - Dimensions

---

## Phase 2: Re-embed Existing Data

Run the migration script to generate new 3072d embeddings for all existing chunks.

### 2.1 Run Migration Script (Staging)

```bash
python3 scripts/migrate_embeddings_v2.py --env-file /path_to_project/apps/web/.env.local
```

Wait until all chunks are re-embedded. The script shows progress and ETA.

### 2.2 Run Migration Script (Production)

```bash
python3 scripts/migrate_embeddings_v2.py --env-file /path_to_project/apps/web/.env.prod
```

Wait until all chunks are re-embedded successfully.

### 2.3 Verify Embeddings

From the script final output, verify that all chunks have been processed and migrated with 0 errors. If you find that some chunks haven't been migrated, run the migration script again.

Once all chunks have been successfully migrated in both environments, proceed to Phase 3.

---

## Phase 3: Cleanup & Finalize

Cleanup old columns and update the RPC function and RAG processor to use the new embeddings.

### 3.1 Update Schema - Remove Old Column

**File:** `apps/web/lib/drizzle/schema/document_chunks.ts`

1. Remove the old `text_embedding` column definition
2. Remove the old `TEXT_EMBEDDING_DIMENSIONS` constant
3. Rename `text_embedding_v2` to `text_embedding`
4. Rename `TEXT_EMBEDDING_V2_DIMENSIONS` to `TEXT_EMBEDDING_DIMENSIONS`
5. Update the index name and it's column name to use `document_chunks_text_embedding_idx` and `text_embedding`:
```typescript
index("document_chunks_text_embedding_idx").using(
  "hnsw",
  sql`(text_embedding::halfvec(3072)) halfvec_cosine_ops`
),
```

### 3.2 Generate Rename Migration

```bash
npm run db:generate
```

**Important:** When prompted, select **"Rename"** column (not "Create" column). Verify the generated migration only renames `text_embedding_v2` → `text_embedding`.

Ask AI to generate the down migration, then apply:

```bash
npm run db:migrate
```

### 3.3 Update RPC Function

```bash
npm run db:generate:custom
```

Add this SQL to the generated migration file. Make sure to update the content of the following RPC function if you previously made any changes to your `match_text_chunks`:

```sql
-- Drop existing function (signature is changing from vector(768) to vector(3072))
DROP FUNCTION IF EXISTS match_text_chunks(vector, uuid, float, int);

-- RPC Function 1: Vector Search for Text Embeddings (3072 dimensions with halfvec)
CREATE FUNCTION match_text_chunks (
      query_embedding vector(3072),
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
AS $
BEGIN
      RETURN QUERY
      SELECT
         dc.id as chunk_id,
         dc.document_id,
         dc.content,
         dc.context,
         -- Cast BOTH sides to halfvec for HNSW index usage
         (1 - (dc.text_embedding::halfvec(3072) <=> query_embedding::halfvec(3072)))::float as similarity,
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
         -- Cast in WHERE clause too for filtering
         AND (1 - (dc.text_embedding::halfvec(3072) <=> query_embedding::halfvec(3072))) > p_match_threshold
      ORDER BY
         similarity DESC
      LIMIT p_match_count;
END;
$;
```

Ask AI to generate the down migration, then apply:

```bash
npm run db:migrate
```

### 3.4 Apply to Production Database

```bash
npm run db:migrate:prod
```

### 3.5 Deploy RAG Processor

Before deploying, update the environment files with the new embedding model configuration:

**For staging** (`apps/rag-processor/.env.local`):
```bash
TEXT_EMBEDDING_MODEL=gemini-embedding-001
TEXT_EMBEDDING_DIMENSIONS=3072
```

**For production** (`apps/rag-processor/.env.prod`):
```bash
TEXT_EMBEDDING_MODEL=gemini-embedding-001
TEXT_EMBEDDING_DIMENSIONS=3072
```

Then deploy the updated RAG processor:

```bash
# Deploy to staging (uses .env.local)
npm run deploy:processor:dev

# Deploy to production (uses .env.prod)
npm run deploy:processor:prod
```

### 3.6 Test RAG Search

Upload a test document and ask the RAG assistant about it in both staging and production to verify that results are returned correctly from both newly uploaded and previously migrated documents.

---

## Verification Checklist

**Phase 1:**
- [ ] `text_embedding_v2` column and index exists in staging database
- [ ] `text_embedding_v2` column and index exists in production database
- [ ] Codebase updated to use gemini-embedding-001 (3072d)

**Phase 2:**
- [ ] Migration script completed for staging (0 chunks remaining)
- [ ] Migration script completed for production (0 chunks remaining)
- [ ] All chunks have `text_embedding_v2` populated in both environments

**Phase 3:**
- [ ] Old `text_embedding` column removed, renamed to `text_embedding` in staging
- [ ] Rename migration applied to staging database
- [ ] RPC function updated to use 3072 dimensions with halfvec in staging
- [ ] RPC function migration applied to staging database
- [ ] Both migrations applied to production database
- [ ] RAG processor deployed to staging
- [ ] RAG processor deployed to production

**Final Verification:**
- [ ] Search returns relevant results in both environments
