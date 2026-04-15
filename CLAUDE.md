# CLAUDE.md

## Project Overview

**GoOut Hyd** (goouthyd.in) is a venue discovery and experience platform for Hyderabad, India. It connects independent cafe owners with experience-seeking customers aged 20-35 through curated listings and event discovery, powered by Wilson's event management network. Built to expand beyond cafes to bars, clubs, and rooftops.

This is NOT an AI application. The codebase was repurposed from a RAG (document processing) app. All RAG-specific code (document upload, embeddings, vector search, AI chat) is being stripped. The infrastructure (Next.js, Supabase, Drizzle, Tailwind, Vercel) is retained.

**Key Features (Phase 1 -- MVP):**

- Public cafe browsing by area (no auth required)
- Cafe profiles with photos, menu highlights, contact info, and upcoming events
- Events listing with category-based filtering
- Partner interest form for cafe owner onboarding
- Email notification to Wilson on new lead submissions
- Wilson manages all data via Supabase dashboard

**Architecture**: Monorepo with web application:
- `apps/web/`: Next.js 15 frontend with Supabase and Drizzle ORM

**Tech Stack:**

- **Framework**: Next.js 15.5.4 (App Router), React 19, TypeScript 5 (strict mode)
- **Database**: PostgreSQL via Supabase, Drizzle ORM 0.44.6, drizzle-zod 0.8.2
- **Styling**: Tailwind CSS 3.4.1, shadcn/ui (Radix primitives + CVA), tailwindcss-animate
- **Typography**: DM Serif Display (headings), DM Sans (body) via Google Fonts
- **Colors**: Espresso/caramel/cream palette. Light-only mode (no dark mode toggle).
- **Env Validation**: @t3-oss/env-nextjs with Zod
- **Icons**: lucide-react
- **Notifications**: sonner (toast)
- **Deployment**: Vercel
- **Auth**: Supabase email/password (dormant in Phase 1, activates Phase 2)

## Development Commands

### Web Application

```bash
cd apps/web
npm run dev              # Start dev server with Turbopack
npm run lint             # ESLint
npm run type-check       # TypeScript type checking
```

### Database Operations (from project root)

```bash
npm run db:generate      # Generate migrations from schema changes
npm run db:generate:custom  # Generate custom SQL migrations
npm run db:migrate       # Run pending migrations
npm run db:rollback      # Rollback last migration
npm run db:status        # Check migration status
npm run db:seed          # Seed database
npm run db:studio        # Open Drizzle Studio
```

### Important: Never use direct commands

- Use `npm run db:*` scripts, never `npx drizzle-kit` directly (env loading via dotenv-cli)
- Use `npm run lint` or `npm run type-check` for validation, never `npm run build`
- Use `npx shadcn@latest add <component>` for new shadcn components

## Route Structure (apps/web) -- Phase 1

- `app/(public)/` -- Public pages (no auth)
  - `/` -- Landing page with featured cafes and upcoming events
  - `/cafes` -- Cafe listing by area
  - `/cafes/[slug]` -- Individual cafe profile (photos, menu, events, contact)
  - `/events` -- Events listing with category cards for filtering
  - `/events/[slug]` -- Individual event detail (date, venue, description, ticket price)
  - `/partner` -- Cafe owner interest form and pitch page
  - `/about` -- Platform story and mission
  - `/privacy` -- Privacy policy (static)
  - `/terms` -- Terms of service (static)
- `app/actions/` -- Server Actions
  - `leads.ts` -- submitPartnerForm() (validate, save to DB, send email via Resend)

### No API Routes in Phase 1

All data fetching happens server-side in Server Components via Drizzle ORM. The only write operation is the partner form, handled by a Server Action. No REST API layer needed.

### Routes NOT in Phase 1

Auth pages, protected routes, admin dashboard, chat, documents, user profiles -- all stripped or dormant.

## Database Schema (Drizzle ORM)

Schema files live in `apps/web/lib/drizzle/schema/`. Phase 1 tables:

- **cafes** -- Cafe profiles (name, slug, area, description, cover_image, phone, instagram_handle, google_maps_url, address, status, created_at, updated_at)
- **cafe_images** -- Photo gallery for each cafe (cafe_id, image_url, alt_text, sort_order)
- **menu_items** -- Menu entries per cafe (cafe_id, category, name, price, description, is_available)
- **events** -- Events tied to cafes (cafe_id, title, slug, description, event_type, date, ticket_price, cover_image, status)
- **cafe_leads** -- Partner form submissions (owner_name, cafe_name, phone, area, status, created_at)

Event types: live_music, open_mic, workshop, comedy_night, gaming

### Schema Management

All schema changes go through Drizzle ORM migrations:

```bash
npm run db:generate   # After editing schema files
npm run db:migrate    # Apply to database
```

Never create tables directly in Supabase. Always use Drizzle schema definitions.

## Environment Variables

### Required (apps/web/.env.local)

**Server-only:**
- `DATABASE_URL` -- PostgreSQL connection string (Supabase)
- `SUPABASE_URL` -- Supabase project URL
- `SUPABASE_ANON_KEY` -- Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` -- Supabase service role key (for admin operations)

**Client:**
- `NEXT_PUBLIC_APP_URL` -- App URL (http://localhost:3000 in dev)

### Not needed in Phase 1

- `GEMINI_API_KEY` -- No AI features
- `GOOGLE_CLOUD_*` -- No GCS/Vertex AI
- `STRIPE_*` -- No payments

## Code Quality Standards

### TypeScript

- Strict mode always. No `any` types.
- Explicit return types on all functions.
- No `@ts-expect-error` or `eslint-disable` comments.
- Use Drizzle's inferred types from schema (via drizzle-zod) rather than duplicating type definitions.

### Components

- Server Components by default. Client Components only when needed (forms, interactivity, hooks).
- Use `"use client"` directive explicitly when needed.
- Always use Next.js `Image` component for images.
- Use shadcn/ui components, never raw HTML inputs/buttons. Install with `npx shadcn@latest add <component>`.
- Style with Tailwind utility classes. Use `cn()` helper for conditional classes, never inline style objects.

### Server/Client Separation

Never mix server-side imports with client-safe utilities in the same file.

- `*-client.ts` or `*-constants.ts` -- Client-safe constants, types, pure functions
- `*.ts` -- Server-side functions (may re-export from client files)

### Forms and Validation

- Validate all form inputs with Zod schemas before hitting Supabase.
- Use Server Actions for form submissions. Always return result objects with `{ success, error? }`.
- Never use `@ts-ignore` to bypass Zod validation types.

### Next.js 15 Async Params

Both `params` and `searchParams` are Promises that MUST be awaited:

```tsx
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
}
```

### Drizzle Type-Safe Operators

Never use raw SQL for basic operations:

```tsx
// BAD
sql`${column} = ANY(${array})`;

// GOOD
import { inArray } from "drizzle-orm";
inArray(column, array);
```

## Target Geography

- **City**: Hyderabad, India
- **Priority Areas**: Banjara Hills, Jubilee Hills, Kondapur, Gachibowli, Madhapur (expandable)
- **Currency**: INR (₹)
- **Phone Format**: Indian (+91)

## Phase 1 Constraints -- Never Break These

- No user authentication or login
- No payment processing (Razorpay, Stripe, or otherwise)
- No cafe owner dashboard or self-serve features
- No admin panel UI (Wilson uses Supabase dashboard)
- No WhatsApp integration (contact via phone, Google Maps, Instagram only)
- No AI features
- No cafe tag/attribute filtering (browse by area only)
- No push notifications
- No mobile app
- Every page must work on both mobile and desktop
- Write complete working code only, never placeholder comments

## What Gets Stripped from RAG Codebase

### Dependencies to Remove
- @ai-sdk/google, @ai-sdk/react, ai (AI SDK)
- @google-cloud/aiplatform, @google-cloud/storage (GCP)
- react-markdown, remark-gfm (chat rendering)
- stripe (payments)

### Code to Remove
- `apps/rag-processor/` -- Entire Python backend
- `apps/web/components/chat/` -- Chat UI
- `apps/web/components/documents/` -- Document upload
- `apps/web/components/history/` -- Conversation history
- `apps/web/contexts/ChatStateContext.tsx` -- Chat state
- `apps/web/lib/search/` -- Vector search
- `apps/web/lib/embeddings/` -- Embedding generation
- `apps/web/lib/rag/` -- RAG pipeline
- `apps/web/lib/documents.ts`, `storage.ts`, `attachments.ts` -- Document handling
- `apps/web/lib/chat-utils.ts`, `chat-utils-client.ts` -- Chat utilities
- `apps/web/app/(protected)/` -- All protected routes
- `apps/web/app/api/chat/` -- Chat API
- `apps/web/app/api/documents/` -- Document API
- `apps/web/app/api/webhooks/stripe/` -- Stripe webhook
- All RAG database schema files (documents, document_chunks, conversations, messages, processing_jobs)

### Cursor Rules to Remove (Python-specific, no longer relevant)
- All `python-*.mdc` files
- `pydantic-*.mdc`
- `use-uv-pyproject-dependencies.mdc`

### Files to Keep and Adapt
- `apps/web/lib/supabase/server.ts` -- Supabase server client
- `apps/web/lib/supabase/admin.ts` -- Supabase admin client
- `apps/web/lib/supabase/middleware.ts` -- Update public routes for CafeConnect
- `apps/web/lib/auth.ts` -- Keep but dormant until Phase 2
- `apps/web/lib/env.ts` -- Update to remove GCP/AI env vars
- `apps/web/lib/drizzle/db.ts` -- Database connection (keep as-is)
- `apps/web/drizzle.config.ts` -- Drizzle config (keep as-is)
- `apps/web/components/ui/` -- All shadcn components
- `apps/web/middleware.ts` -- Update for public-only routes

## Phase 2 Features (Do NOT build yet)

- WhatsApp CTA buttons and notifications
- Event ticketing with Razorpay and QR codes
- Cafe owner self-serve dashboard
- Customer accounts and authentication
- Cafe tags and advanced filtering
- Admin UI for Wilson
- Content engine (reels, posts, influencer management)
- 3D animated landing page
- Venue expansion (bars, clubs, rooftops)
- Wilson's weekly curated list
- Compliance shield (FSSAI, IPRS, PPL guidance)
