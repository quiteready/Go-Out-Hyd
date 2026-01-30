# Task Review Checklist (rag-simple Template)

> **Note:** This checklist is tailored for the **rag-simple** template, which uses a **monorepo structure**. All frontend code is in `apps/web/`, and Python backends are in `apps/rag-processor/`, `apps/rag-gcs-handler/`, and `apps/rag-task-processor/`.

Use this checklist to verify implementation quality before marking a task complete. Run through each section systematically.

---

## 1. Type Safety (TypeScript)

### 1.1 No `any` Types
```bash
# Search for any types in changed files
grep -r "any" --include="*.ts" --include="*.tsx" <changed-files>
```

**Check for:**
- [ ] No explicit `any` type annotations
- [ ] No implicit `any` from missing types
- [ ] Proper generics used where needed

### 1.2 Explicit Return Types
```typescript
// ❌ Bad
async function getUser(id: string) {
  return await db.query.users.findFirst({ where: eq(users.id, id) });
}

// ✅ Good
async function getUser(id: string): Promise<User | undefined> {
  return await db.query.users.findFirst({ where: eq(users.id, id) });
}
```

**Check for:**
- [ ] All functions have explicit return types
- [ ] Async functions return `Promise<T>`
- [ ] Void functions explicitly return `void` or `Promise<void>`

### 1.3 No Type Assertions Without Justification
```typescript
// ❌ Bad - hiding potential issues
const user = data as User;

// ✅ Good - validate first
if (isUser(data)) {
  const user = data;
}
```

---

## 2. Type Safety (Python)

> **Applies to:** `apps/rag-processor/`, `apps/rag-gcs-handler/`, `apps/rag-task-processor/`

### 2.1 No `Any` Type
```python
# ❌ Bad - using Any
from typing import Any
def process_document(data: Any) -> Any:
    pass

# ✅ Good - specific types
def process_document(data: dict[str, str]) -> ProcessResult:
    pass
```

**Check for:**
- [ ] No `Any` type annotations
- [ ] Specific types for all parameters and return values
- [ ] Proper generics used where needed (`TypeVar`, `Generic`)

### 2.2 Explicit Return Type Annotations
```python
# ❌ Bad - missing return type
def get_embedding(text: str):
    return model.encode(text)

# ✅ Good - explicit return type
def get_embedding(text: str) -> list[float]:
    return model.encode(text)

# ✅ Good - None return type explicit
def log_event(event: str) -> None:
    print(event)
```

**Check for:**
- [ ] All functions have explicit return type annotations
- [ ] Functions returning `None` explicitly annotate `-> None`
- [ ] Async functions use proper return types

### 2.3 Modern Type Syntax
```python
# ❌ Bad - old-style typing
from typing import Dict, List, Optional, Union
def process(items: List[Dict[str, str]]) -> Optional[str]:
    pass

# ✅ Good - modern syntax (Python 3.10+)
def process(items: list[dict[str, str]]) -> str | None:
    pass
```

**Check for:**
- [ ] Use `dict[K, V]` not `Dict[K, V]`
- [ ] Use `list[T]` not `List[T]`
- [ ] Use `str | None` not `Optional[str]`
- [ ] Use `X | Y` not `Union[X, Y]`

### 2.4 RAG-Specific Type Patterns
```python
# ✅ Embeddings should have explicit types
def generate_embeddings(texts: list[str]) -> list[list[float]]:
    pass

# ✅ Vector search results should be typed
@dataclass
class SearchResult:
    document_id: str
    content: str
    similarity: float
    metadata: dict[str, str]

def vector_search(query: str, limit: int = 10) -> list[SearchResult]:
    pass
```

---

## 3. Drizzle ORM

### 3.1 Type-Safe Operators (No Raw SQL)
```typescript
// ❌ Bad - SQL injection risk
sql`${column} = ANY(${array})`;
where: sql`user_id = ${userId}`;

// ✅ Good - Type-safe operators
import { eq, inArray, and, or, isNull, like, between } from 'drizzle-orm';
where: eq(users.id, userId);
where: inArray(posts.status, ['draft', 'published']);
```

**Available operators:** `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `inArray`, `notInArray`, `and`, `or`, `isNull`, `isNotNull`, `like`, `ilike`, `between`

### 3.2 Proper Transaction Usage
```typescript
// ✅ Good - atomic operations
await db.transaction(async (tx) => {
  await tx.insert(orders).values(orderData);
  await tx.update(inventory).set({ quantity: sql`quantity - 1` });
});
```

### 3.3 Select Only Needed Columns
```typescript
// ❌ Bad - fetching everything
const users = await db.select().from(usersTable);

// ✅ Good - specific columns
const users = await db.select({
  id: usersTable.id,
  email: usersTable.email,
}).from(usersTable);
```

---

## 4. Next.js 15 Patterns

### 4.1 Async Params/SearchParams
```typescript
// ✅ Server Components - await the promises
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ query?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { query } = await searchParams;
}

// ✅ Client Components - use React's use() hook
'use client';
import { use } from 'react';

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
}
```

### 4.2 revalidatePath with Dynamic Routes
```typescript
// Dynamic routes REQUIRE type parameter
// ❌ Bad - missing type parameter for dynamic route
revalidatePath('/documents/[documentId]');

// ✅ Good - include type parameter for dynamic routes
revalidatePath('/documents/[documentId]', 'page');
revalidatePath('/api/documents', 'layout');

// Static routes do NOT need type parameter
// ✅ Good - static path, no type parameter needed
revalidatePath('/documents');
revalidatePath('/settings');
```

### 4.3 No Async Client Components
```typescript
// ❌ Bad - async client component
'use client';
export default async function Component() { // ERROR
  const data = await fetchData();
}

// ✅ Good - use hooks for data fetching
'use client';
import { useEffect, useState } from 'react';

export default function Component() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetchData().then(setData);
  }, []);
}
```

---

## 5. Server/Client Separation

### 5.1 File Naming Convention
```
apps/web/lib/
├── storage-client.ts    # Client-safe: constants, types, pure functions
├── storage.ts           # Server-only: DB access, can re-export from -client
├── auth-client.ts       # Client-safe auth utilities
└── auth.ts              # Server-only auth (createClient, etc.)
```

### 5.2 No Mixed Imports
```typescript
// ❌ Bad - mixed concerns in one file
// apps/web/lib/utils.ts
import { createClient } from '@/lib/supabase/server';  // Server-only
export const MAX_SIZE = 10 * 1024 * 1024;              // Client-safe

// ✅ Good - separate files
// apps/web/lib/utils-client.ts
export const MAX_SIZE = 10 * 1024 * 1024;

// apps/web/lib/utils.ts
import { createClient } from '@/lib/supabase/server';
export { MAX_SIZE } from './utils-client';
```

### 5.3 Server-Only Imports Check
```typescript
// These imports are SERVER-ONLY - never import in 'use client' files:
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/drizzle';
import { headers, cookies } from 'next/headers';
```

---

## 6. Security

### 6.1 Authentication on Protected Routes
```typescript
// ✅ Every protected API route must check auth
// File: apps/web/app/api/documents/route.ts
export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... rest of handler
}
```

### 6.2 Public Routes Configuration
Public routes are configured in `apps/web/lib/supabase/middleware.ts`:

```typescript
// apps/web/lib/supabase/middleware.ts
const publicRoutes = ["/", "/cookies", "/privacy", "/terms"];
const publicPatterns = ["/auth"];

const isPublicRoute =
  publicRoutes.includes(request.nextUrl.pathname) ||
  publicPatterns.some((pattern) =>
    request.nextUrl.pathname.startsWith(pattern)
  );
```

**When adding new public routes:**
- [ ] Add exact paths to `publicRoutes` array
- [ ] Add prefix patterns to `publicPatterns` array
- [ ] Webhooks are auto-skipped: `/api/webhooks/*`

### 6.3 Input Validation
```typescript
// ✅ Validate all user input
import { z } from 'zod';

const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  collectionId: z.string().uuid(),
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const result = CreateDocumentSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 });
  }

  // Use result.data - it's typed!
}
```

### 6.4 No Secrets in Client Code
```typescript
// ❌ Bad - exposing secrets
const apiKey = process.env.OPENAI_API_KEY; // In client component

// ✅ Good - only NEXT_PUBLIC_ vars in client
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
```

---

## 7. Error Handling

### 7.1 Consistent Error Responses
```typescript
// ✅ Standard error response format
return Response.json(
  { error: 'Resource not found' },
  { status: 404 }
);

// ✅ With details for validation errors
return Response.json(
  { error: 'Validation failed', details: result.error.issues },
  { status: 400 }
);
```

### 7.2 Try-Catch for External Calls
```typescript
// ✅ Wrap external API calls
try {
  const response = await stripe.customers.create({ email });
  return Response.json({ customerId: response.id });
} catch (error) {
  console.error('Stripe error:', error);
  return Response.json(
    { error: 'Payment service unavailable' },
    { status: 503 }
  );
}
```

### 7.3 Database Error Handling
```typescript
// ✅ Handle database errors gracefully
try {
  await db.insert(documents).values(documentData);
} catch (error) {
  if (error.code === '23505') { // Unique violation
    return Response.json({ error: 'Document already exists' }, { status: 409 });
  }
  console.error('Database error:', error);
  return Response.json({ error: 'Database error' }, { status: 500 });
}
```

### 7.4 Python Error Handling (RAG Backend)
```python
# ✅ Handle embedding/vector search errors
try:
    embeddings = await generate_embeddings(text)
    results = await vector_search(embeddings, limit=10)
    return results
except EmbeddingError as e:
    logger.error(f"Embedding generation failed: {e}")
    raise HTTPException(status_code=503, detail="Embedding service unavailable")
except VectorSearchError as e:
    logger.error(f"Vector search failed: {e}")
    raise HTTPException(status_code=503, detail="Search service unavailable")
```

---

## 8. Server Actions

### 8.1 Proper Server Action Structure
```typescript
// ✅ Server action with auth check
// File: apps/web/app/actions/documents.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateDocument(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const title = formData.get('title') as string;

  // Validate input
  if (!title || title.length < 2) {
    return { error: 'Title must be at least 2 characters' };
  }

  // Perform action
  await db.update(documents)
    .set({ title, updatedAt: new Date() })
    .where(eq(documents.userId, user.id));

  revalidatePath('/documents', 'page');
  return {};
}
```

### 8.2 Return Types for Actions
```typescript
// ✅ Define clear return types
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createDocument(data: CreateDocumentInput): Promise<ActionResult<{ id: string }>> {
  // ...
  return { success: true, data: { id: document.id } };
}
```

---

## 9. Code Quality

### 9.1 No TODO/FIXME in Production Code
```bash
# Check for leftover TODOs (TypeScript)
grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.ts" --include="*.tsx" apps/web/

# Check for leftover TODOs (Python)
grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.py" apps/rag-processor/
```

### 9.2 No Console Statements (Except Error Logging)
```typescript
// ❌ Bad - debug logging
console.log('user:', user);

// ✅ OK - error logging
console.error('Failed to process document:', error);
```

### 9.3 No Commented-Out Code
```typescript
// ❌ Bad - dead code
// const oldImplementation = () => { ... };

// ✅ Good - remove it entirely, git has history
```

### 9.4 Consistent Naming
- **Files:** kebab-case (`document-processor.tsx`)
- **Components:** PascalCase (`DocumentProcessor`)
- **Functions:** camelCase (`processDocument`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types/Interfaces:** PascalCase (`Document`, `CreateDocumentInput`)
- **Python files:** snake_case (`document_processor.py`)
- **Python classes:** PascalCase (`DocumentProcessor`)
- **Python functions:** snake_case (`process_document`)

---

## 10. RAG-Specific Patterns

> **Note:** Embedding generation and vector search logic lives in the Python backends (`apps/rag-processor/`). The web frontend primarily handles document upload, display, and chat interfaces.

### 10.1 Document Processing Flow
```
1. User uploads document via apps/web/
2. Document stored in Supabase Storage
3. Python backend (rag-processor) processes document:
   - Extracts text
   - Chunks content
   - Generates embeddings
   - Stores in pgvector
4. Web app queries via vector search for RAG responses
```

### 10.2 Vector Search Type Safety (Python)
```python
# ✅ Ensure proper typing for vector operations
async def similarity_search(
    query_embedding: list[float],
    collection_id: str,
    limit: int = 10,
    threshold: float = 0.7
) -> list[SearchResult]:
    """Perform cosine similarity search against document embeddings."""
    pass
```

### 10.3 Embedding Dimensions
```python
# ✅ Document expected embedding dimensions
EMBEDDING_DIMENSION = 1536  # OpenAI ada-002

def validate_embedding(embedding: list[float]) -> bool:
    return len(embedding) == EMBEDDING_DIMENSION
```

---

## 11. Testing Checklist

### 11.1 Manual Testing
- [ ] Happy path works as expected
- [ ] Error states handled gracefully
- [ ] Loading states display correctly
- [ ] Auth redirects work properly
- [ ] Document upload and processing works
- [ ] Vector search returns relevant results

### 11.2 Edge Cases
- [ ] Empty states handled
- [ ] Invalid input rejected
- [ ] Unauthorized access blocked
- [ ] Network errors handled
- [ ] Large document handling
- [ ] Empty search results handled

### 11.3 Type Checking
```bash
# TypeScript (from apps/web/)
cd apps/web && npm run typecheck
# or
cd apps/web && npx tsc --noEmit

# Python (from apps/rag-processor/)
cd apps/rag-processor && mypy .
# or
cd apps/rag-processor && pyright
```

---

## 12. Final Verification

Before marking complete, verify:

**TypeScript (apps/web/):**
- [ ] `npm run typecheck` passes (or `npx tsc --noEmit`)
- [ ] `npm run lint` passes
- [ ] No `any` types introduced
- [ ] All functions have explicit return types
- [ ] Server/client separation maintained
- [ ] Auth checks on all protected routes
- [ ] Input validation on all user input
- [ ] Error handling is consistent
- [ ] No debug console.logs left behind
- [ ] revalidatePath includes type parameter for dynamic routes

**Python (apps/rag-processor/, etc.):**
- [ ] `mypy .` or `pyright` passes
- [ ] `ruff check .` passes
- [ ] No `Any` types introduced
- [ ] All functions have explicit return type annotations
- [ ] Modern type syntax used (`dict`, `list`, `|` union)
- [ ] RAG operations properly typed (embeddings, search results)

---

## Quick Reference: Common Mistakes

| Mistake | Fix |
|---------|-----|
| `any` type (TS) | Use specific type or generic |
| `Any` type (Python) | Use specific type or TypeVar |
| Missing return type (TS) | Add explicit `: ReturnType` |
| Missing return type (Python) | Add explicit `-> ReturnType` |
| `Dict[str, str]` (Python) | Use `dict[str, str]` |
| `Optional[str]` (Python) | Use `str \| None` |
| Raw SQL in Drizzle | Use `eq`, `inArray`, etc. |
| Async client component | Use `useEffect` + `useState` |
| Missing auth check | Add `getUser()` check first |
| `revalidatePath('/path/[id]')` | `revalidatePath('/path/[id]', 'page')` |
| Server import in client | Create `-client.ts` file |
| `console.log` debugging | Remove or change to `console.error` |
| Wrong path reference | Prefix with `apps/web/` for web code |
