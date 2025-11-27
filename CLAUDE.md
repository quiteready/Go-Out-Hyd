# CLAUDE.md

## Project Overview

This is a **RAG (Retrieval-Augmented Generation) application** - a polyglot monorepo that allows users to upload documents and ask questions about them through an intelligent chat interface. Supports multi-modal content including PDFs, images, videos, and audio.

**Key Features:**

- Multi-modal document upload (PDFs, images, videos, audio)
- Intelligent document processing with chunking and embeddings
- Vector similarity search for context retrieval
- AI-powered chat with document context (Google Gemini)
- Real-time processing status tracking
- Admin dashboard for user management
- Role-based access control (member/admin)

**Architecture**: Polyglot monorepo with multiple applications:
- `apps/web/`: Next.js 15 frontend with Supabase auth
- `apps/rag-processor/`: Python FastAPI service for document processing and embeddings
- `apps/rag-gcs-handler/`: Cloud Function for GCS upload events
- `apps/rag-task-processor/`: Cloud Run service for async task processing

**Tech Stack:**

- **Frontend**: Next.js 15 (App Router), React 19, Supabase, Drizzle ORM, AI SDK
- **Backend**: Python 3.10+, FastAPI, uv package management, Docling, Vertex AI
- **Infrastructure**: Google Cloud (Cloud Run, Cloud Functions, Cloud Storage), pgvector
- **AI/ML**: Google Gemini (chat), Vertex AI embeddings (text + multimodal)

## Development Commands

### Root-Level Commands (Recommended)

```bash
# Development
npm run dev              # Start web frontend

# Database Operations
npm run db:generate      # Generate migrations from schema changes
npm run db:generate:custom # Generate custom SQL migrations
npm run db:migrate       # Run pending migrations
npm run db:rollback      # Rollback last migration
npm run db:status        # Check migration status
npm run db:seed          # Seed database

# Production Database
npm run db:generate:prod
npm run db:migrate:prod
npm run db:rollback:prod
npm run db:status:prod

# Deployment
npm run deploy:processor:dev    # Deploy RAG processor to Cloud Run (dev)
npm run deploy:processor:prod   # Deploy RAG processor to Cloud Run (prod)
npm run deploy:gcs-handler:dev  # Deploy GCS handler Cloud Function (dev)
npm run deploy:gcs-handler:prod # Deploy GCS handler Cloud Function (prod)
npm run deploy:task-processor:dev  # Deploy task processor (dev)
npm run deploy:task-processor:prod # Deploy task processor (prod)

# GCP Setup
npm run setup:gcp:dev    # Setup GCP infrastructure (dev)
npm run setup:gcp:prod   # Setup GCP infrastructure (prod)

# Type Checking and Linting
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
npm run format           # Prettier formatting
```

### Web Application Commands

```bash
cd apps/web
npm run dev              # Start dev server with Turbopack
npm run build            # Production build
npm run storage:setup    # Setup Supabase storage buckets
```

### Python Backend Commands

```bash
# Run from project root using uv
uv run python -m rag_processor.main  # Start RAG processor locally

# Linting and formatting
uv run ruff check .      # Lint Python code
uv run ruff format .     # Format Python code
uv run black .           # Alternative formatter
uv run mypy .            # Type checking
```

## Architecture Overview

### Document Processing Flow

1. **Upload**: User uploads file → signed URL → Google Cloud Storage
2. **Event**: GCS upload triggers Cloud Function (`rag-gcs-handler`)
3. **Queue**: Handler creates processing job and triggers task processor
4. **Process**: `rag-processor` downloads, parses, chunks document
5. **Embed**: Generate embeddings (text or multimodal based on content type)
6. **Store**: Chunks and embeddings stored in PostgreSQL with pgvector
7. **Search**: User query → embedding → vector similarity search → context
8. **Chat**: Context + query sent to Gemini for AI response

### Multi-Modal Embedding Strategy

```
TEXT CONTENT (documents, text chunks):
- Model: text-embedding-004 (Vertex AI)
- Dimensions: 768
- Index: HNSW with cosine similarity

MULTIMODAL CONTENT (images, videos, audio):
- Model: multimodalembedding@001
- Dimensions: 1408
- Index: HNSW with cosine similarity
```

### Route Structure (apps/web)

- `app/(public)/` - Public pages (landing, terms, privacy, cookies)
- `app/(auth)/` - Authentication pages (login, signup, password reset)
- `app/(protected)/` - Protected routes requiring authentication
  - `/documents` - Document management and upload
  - `/chat` - RAG-powered chat interface
  - `/history` - Conversation history
  - `/profile` - User profile
  - `/admin/dashboard` - Admin metrics (admin only)
- `app/api/` - API routes
  - `/api/chat` - Streaming chat endpoint with RAG context
  - `/api/documents` - Document management endpoints

### Database Schema (apps/web/lib/drizzle/schema/)

- **users** - User profiles (synced with Supabase auth), roles (member/admin)
- **documents** - Document metadata, GCS paths, processing status
- **document_chunks** - Text chunks with embeddings (text_embedding + multimodal_embedding columns)
- **document_processing_jobs** - Processing job tracking
- **conversations** - Chat conversations
- **messages** - Individual chat messages

### Python Backend Structure (apps/rag-processor)

```
rag_processor/
├── main.py              # FastAPI entry point
├── config.py            # Configuration management
├── models/              # Pydantic models
├── services/            # Business logic
│   ├── document_processor.py
│   ├── embedding_service.py
│   ├── chunking_service.py
│   └── storage_service.py
└── utils/               # Utilities
```

## Critical Requirements

### Next.js 15 Async Params

In Next.js 15, both `params` and `searchParams` are Promises that MUST be awaited:

```tsx
// ✅ Correct
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
}
```

### Python Type Annotations

ALL Python code MUST have explicit type annotations:

```python
# ✅ Correct
def process_document(file_path: str, user_id: str) -> ProcessingResult:
    ...

# ❌ Wrong - missing annotations
def process_document(file_path, user_id):
    ...
```

### Drizzle Type-Safe Operators

**NEVER** use raw SQL for basic operations:

```tsx
// ❌ BAD
sql`${column} = ANY(${array})`;

// ✅ GOOD
import { inArray } from "drizzle-orm";
inArray(column, array);
```

## Environment Variables

### Web Application (apps/web/.env.local)

**Server-only:**
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` - Google AI API key for chat
- `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_REGION`
- `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY` - For Vertex AI embeddings
- `GOOGLE_CLOUD_STORAGE_BUCKET` - GCS bucket for uploads

**Client:**
- `NEXT_PUBLIC_APP_URL`

### RAG Processor (Cloud Run environment)

- `DATABASE_URL` - PostgreSQL connection string
- `GCP_PROJECT_ID`, `GCS_BUCKET_NAME`
- `GOOGLE_APPLICATION_CREDENTIALS` - Service account for GCP APIs

## Code Quality Standards

### TypeScript (Frontend)

- Explicit return types for all functions
- No `any` types - use proper interfaces
- No `@ts-expect-error` or `eslint-disable` comments
- Server/client separation: `*-client.ts` for client-safe code

### Python (Backend)

- Complete type annotations required
- Use modern Python 3.10+ syntax: `dict[str, int]` not `Dict[str, int]`
- Use `uv` for dependency management, never pip directly
- Follow Ruff and Black formatting (88 char line length)
- Always use `raise ... from e` for exception chaining

## Server/Client Separation

### CRITICAL: Separate Server and Client Utilities

**NEVER** mix server-side imports with client-safe utilities in the same file.

```tsx
// ❌ BAD - Mixing concerns causes build errors
// lib/documents.ts
import { createClient } from "@/lib/supabase/server"; // Server-only
export const FILE_TYPES = [...]; // Client-safe constant

// ✅ GOOD - Separate files
// lib/document-utils.ts (client-safe)
export const FILE_TYPES = [...];

// lib/documents.ts (server-only)
import { createClient } from "@/lib/supabase/server";
export { FILE_TYPES } from "./document-utils";
```

**File naming conventions:**
- `*-client.ts` - Client-safe constants, types, pure functions
- `*.ts` - Server-side functions (may re-export from client files)

## Deployment

### GCP Infrastructure Setup

1. Run `npm run setup:gcp:dev` to create:
   - Cloud Storage bucket
   - Cloud Run services
   - Cloud Functions
   - IAM permissions
   - Secret Manager entries

2. Deploy services:
   ```bash
   npm run deploy:processor:dev
   npm run deploy:gcs-handler:dev
   npm run deploy:task-processor:dev
   ```

### Frontend Deployment

Frontend deploys to Vercel with automatic deployments on push to main.

## Authentication & Authorization

**Server-side only utilities** (`apps/web/lib/auth.ts`):

- `getCurrentUserId()` - Get authenticated user ID (most common use case)
- `requireUserId()` - Require authentication, redirects to /auth/login if not authenticated
- `getCurrentUserWithRole()` - Get user with role information
- `requireAdminAccess()` - Enforce admin-only access, redirects to /unauthorized

## Common Patterns

### Server Actions

Always validate authentication and return result objects:

```tsx
"use server";
export async function myAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  const userId = await requireUserId();
  // ... logic
  return { success: true };
}
```

### Protected Pages

```tsx
export default async function ProtectedPage() {
  const userId = await requireUserId();
  // ... render page
}
```

### Admin Pages

```tsx
export default async function AdminPage() {
  await requireAdminAccess();
  // ... render admin content
}
```

## Testing & Debugging

### TypeScript Errors

Run `npm run type-check` from project root.

### Python Errors

```bash
uv run ruff check .
uv run mypy .
```

### Database Migrations

Check status: `npm run db:status`
