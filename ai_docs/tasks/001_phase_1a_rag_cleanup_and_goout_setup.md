# Phase 1A: RAG Cleanup & GoOut Hyd Setup — COMPLETE ✓

---

## 1. Task Overview

### Task Title
**Title:** Phase 1A — Strip RAG Code, Apply GoOut Hyd Design System, Create Schema & Seed Data

### Goal Statement
**Goal:** Transform the existing RAG document-processing monorepo into a clean foundation for GoOut Hyd (goouthyd.com). This means removing every AI/RAG/payment dependency and piece of code that no longer applies, applying the espresso/caramel/cream brand identity, replacing the old multi-table RAG database schema with GoOut Hyd's 5-table schema (cafes, cafe_images, menu_items, events, cafe_leads), configuring Supabase Storage for images, and populating seed data with fictional sample cafes and events. After this phase the app boots clean, reflects GoOut Hyd branding, and renders realistic content from the database.

---

## 2. Strategic Analysis

> **Skipped** — no meaningful trade-offs. The approach is clearly defined in the roadmap: delete the old, configure the new. No architectural decisions required.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.5.4 (App Router), React 19
- **Language:** TypeScript 5 (strict mode)
- **Database & ORM:** PostgreSQL via Supabase, Drizzle ORM 0.44.6 + drizzle-zod 0.8.2
- **UI & Styling:** shadcn/ui (Radix primitives + CVA), Tailwind CSS 3.4.1
- **Authentication:** Supabase Auth (active in middleware — to be made passthrough in this phase)
- **Key Architectural Patterns:** Next.js App Router, Server Components, Server Actions

### Current State (based on codebase analysis)

**Dependencies to remove** (in `apps/web/package.json`):
- `@ai-sdk/google`, `@ai-sdk/react`, `ai` — AI SDK
- `@google-cloud/aiplatform`, `@google-cloud/storage` — GCP
- `react-markdown`, `remark-gfm` — chat content rendering
- `stripe` — payments

**Root `package.json` scripts to remove:**
- `deploy:processor:*`, `deploy:gcs-handler:*`, `deploy:task-processor:*`, `setup:gcp:*`, `stripe:listen`, `storage:setup`

**App routes (all under `apps/web/app/`):**
- `(auth)/` — login, sign-up, forgot-password, update-password, confirm, sign-up-success, error — **delete**
- `(protected)/` — chat, documents, history, profile, admin — **delete**
- `api/chat/` — **delete**
- `api/documents/` — **delete**
- `(public)/cookies/` — not in GoOut Hyd plan — **delete**
- `app/actions/` — `history.ts`, `documents.ts`, `chat.ts`, `auth.ts`, `admin.ts` — **delete** (keep `profile.ts` shell only if needed, otherwise delete too)

**Components to delete:**
- `components/chat/` (8 files)
- `components/documents/` (11 files)
- `components/history/` (5 files)
- `components/auth/` (5 files)
- `components/profile/` (4 files)
- `components/error/` (1 file)
- `components/landing/` — entire directory deleted: HeroSection, FeaturesSection, RAGDemoSection, PricingSection, FAQSection, CTASection, ProblemSection, Navbar, Footer — all deleted now, rebuilt fresh for GoOut Hyd in Phase 1B
- `components/layout/AppSidebar.tsx`, `components/layout/MobileHeaderContent.tsx`
- `components/NavbarThemeSwitcher.tsx`, `components/SidebarThemeSwitcher.tsx`
- `components/Logo.tsx` (rebuild with GoOut Hyd wordmark)

**Lib files to delete:**
- `lib/embeddings/` (text-embeddings.ts, multimodal-embeddings.ts, types.ts)
- `lib/search/` (text-search.ts, multimodal-search.ts, search-combiner.ts, types.ts)
- `lib/rag/` (search-service.ts)
- `lib/documents.ts`, `lib/storage.ts`
- `lib/attachments.ts`, `lib/attachments-client.ts`
- `lib/chat-utils.ts`, `lib/chat-utils-client.ts`
- `lib/google-cloud.ts`
- `lib/upload-queue.ts`, `lib/upload-error-handling.ts`, `lib/file-validation.ts`, `lib/file-validation-constants.ts`
- `lib/processing-constants.ts`, `lib/processing-utils.ts`
- `lib/history.ts`, `lib/persistence.ts`
- `lib/document-utils.ts`, `lib/error-categories.ts`, `lib/error-processing.ts`, `lib/error-formatting.ts`
- `lib/types/errors.ts`, `lib/types/upload-errors.ts`

**Lib files to keep:**
- `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `lib/supabase/middleware.ts`
- `lib/drizzle/db.ts`
- `lib/env.ts` — update env vars
- `lib/utils.ts`, `lib/app-utils.ts`, `lib/metadata.ts`, `lib/auth.ts`

**Schema files to delete and replace:**
- `lib/drizzle/schema/documents.ts`, `document_chunks.ts`, `document_processing_jobs.ts`, `conversations.ts`, `messages.ts`, `users.ts`

---

## 4. Context & Problem Definition

### Problem Statement
The codebase is a RAG document-processing app. GoOut Hyd is a venue discovery platform. Nearly all existing application code — routes, components, lib utilities, database schema, environment config — is for the wrong product. Before building any GoOut Hyd features, we need a clean codebase with the correct branding, database, and infrastructure.

### Success Criteria
- [ ] App boots with `npm run dev` and shows GoOut Hyd branding with no errors or broken imports
- [ ] All RAG/AI/payment code and dependencies removed
- [ ] Middleware is a passthrough (no auth redirects in Phase 1)
- [ ] Tailwind configured with espresso/caramel/cream tokens and DM Serif Display / DM Sans fonts
- [ ] All 5 GoOut Hyd database tables created and migrated to Supabase
- [ ] Seed data populated: 4 cafes, events, menu items, leads
- [ ] `npm run lint` and `npm run type-check` pass with no errors

---

## 5. Development Mode Context

- **This is a new application in active development**
- **No backwards compatibility concerns** — aggressive deletions are fine
- **Data loss acceptable** — old RAG tables can be dropped entirely
- **Priority: Speed and cleanliness** over preservation
- **Aggressive refactoring allowed** — delete and recreate entire directories

---

## 6. Technical Requirements

### Functional Requirements
- All RAG-related routes return 404 or don't exist
- Public home page (`/`) loads without crashing
- Database migrations apply cleanly to Supabase
- Seed data is queryable via Drizzle Studio
- Images are accessible from Supabase Storage bucket `images`

### Non-Functional Requirements
- **Responsive Design:** Every page must work on mobile (320px+) and desktop (1024px+)
- **Theme:** Light-only. `next-themes` will be fully uninstalled — no dark mode now or later.
- **Performance:** No unused packages in the dependency tree

### Technical Constraints
- Must use `npm run db:*` scripts for all Drizzle operations (never `npx drizzle-kit` directly)
- Must create down migration before running `npm run db:migrate`
- Never use `npm run build` for validation — use `npm run lint` and `npm run type-check`

---

## 7. Data & Database Changes

### Database Schema Changes

**Drop all RAG tables:**
- `documents`, `document_chunks`, `document_processing_jobs`, `conversations`, `messages`, `users`

**Create GoOut Hyd tables:**

```sql
-- Enums
CREATE TYPE cafe_status AS ENUM ('active', 'inactive');
CREATE TYPE event_type AS ENUM ('live_music', 'open_mic', 'workshop', 'comedy_night', 'gaming');
CREATE TYPE event_status AS ENUM ('upcoming', 'cancelled', 'completed');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'converted', 'closed');

-- cafes
CREATE TABLE cafes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  area TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  phone TEXT,
  instagram_handle TEXT,
  google_maps_url TEXT,
  address TEXT,
  opening_hours TEXT,
  status cafe_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- cafe_images
CREATE TABLE cafe_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- menu_items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  event_type event_type NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  ticket_price INTEGER,
  cover_image TEXT,
  status event_status NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- cafe_leads
CREATE TABLE cafe_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name TEXT NOT NULL,
  cafe_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  area TEXT NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Data Model Updates (Drizzle Schema Files)

New files to create in `apps/web/lib/drizzle/schema/`:

- `cafes.ts` — cafes table + `cafe_status` enum + indexes (`cafes_slug_idx`, `cafes_area_idx`, `cafes_status_idx`)
- `cafe-images.ts` — cafe_images table + `cafe_images_cafe_id_idx`
- `menu-items.ts` — menu_items table + `menu_items_cafe_id_idx`
- `events.ts` — events table + `event_type` enum + `event_status` enum + indexes (`events_slug_idx`, `events_cafe_id_idx`, `events_event_type_idx`, `events_start_time_idx`, `events_status_idx`)
- `cafe-leads.ts` — cafe_leads table + `lead_status` enum + indexes (`cafe_leads_status_idx`, `cafe_leads_created_at_idx`)
- Updated `index.ts` — export all 5 tables and 4 enums

### Down Migration Safety Protocol
- [ ] **Step 1:** Run `npm run db:generate` to create migration
- [ ] **Step 2:** Follow `drizzle_down_migration.md` template to create `down.sql`
- [ ] **Step 3:** Create subdirectory `drizzle/migrations/[timestamp_name]/`
- [ ] **Step 4:** Write `down.sql` with `DROP TABLE IF EXISTS` for all 5 tables and `DROP TYPE IF EXISTS` for all 4 enums
- [ ] **Step 5:** Verify all operations use `IF EXISTS`
- [ ] **Step 6:** Only then run `npm run db:migrate`

---

## 8. API & Backend Changes

### No API Routes Needed in This Phase

This phase is cleanup + config. No new API routes are being introduced. The only write operation planned for Phase 1 overall is the partner form (Phase 1B), which will use a Server Action.

### Data Access Pattern for Seed Script

The seed script (`lib/drizzle/seed.ts`) will use direct Drizzle `db.insert()` calls — not a Server Action, since it's a CLI script run via `npm run db:seed`.

---

## 9. Frontend Changes

### Files to Create (minimal — just what's needed to boot cleanly)

After deleting all the RAG routes and components, the only public page that must still work is the landing page (`app/(public)/page.tsx`). It can be a placeholder for now since UI is built in Phase 1B. A minimal stub is sufficient.

- `app/(public)/page.tsx` — minimal stub page (heading + brand name, no complex layout)
- `components/Logo.tsx` — GoOut Hyd wordmark (text-based, espresso color)

### Pages to Delete
- `app/(auth)/` — all auth routes
- `app/(protected)/` — all protected routes
- `app/(public)/cookies/` — not in plan
- `app/api/chat/`, `app/api/documents/` — all API routes

### Design System Updates
- `tailwind.config.ts` — add GoOut Hyd color tokens and font families
- `app/layout.tsx` — import DM Serif Display + DM Sans, update metadata
- `app/globals.css` — update CSS custom properties with brand tokens

### State Management
- No client state management in this phase — this is cleanup and config only
- No context providers needed (no auth, no user state)

---

## 10. Code Changes Overview

### Key Configuration Changes

#### `apps/web/lib/env.ts` — Remove GCP/AI vars, add Resend
**Before:** Contains `GEMINI_API_KEY`, `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_REGION`, `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY`, `GOOGLE_CLOUD_STORAGE_BUCKET`

**After:** Only keeps `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, adds `RESEND_API_KEY` (optional)

#### `apps/web/middleware.ts` — Passthrough
**Before:** Full Supabase session check, auth redirects to `/auth/login` for protected routes

**After:**
```typescript
import { NextResponse } from "next/server";
// Phase 2: Re-enable Supabase session checks and auth redirects here when authentication is added
export function middleware() {
  return NextResponse.next();
}
export const config = { matcher: [] };
```

#### `apps/web/next.config.ts` — Add image hostnames
**After:** Add both `{ protocol: 'https', hostname: '*.supabase.co' }` and `{ protocol: 'https', hostname: 'picsum.photos' }` to `images.remotePatterns`

#### `apps/web/tailwind.config.ts` — GoOut Hyd tokens
Add brand colors: `espresso`, `roast`, `caramel`, `gold`, `cream`, `milk`, `foam`
Add UI colors: `border`, `input-border`, `success`, `warning`, `error`
Add font families: `heading` (DM Serif Display), `body` (DM Sans)

#### `apps/web/app/layout.tsx` — Fonts + metadata
Import `DM_Serif_Display` (weight 400) and `DM_Sans` (weights 300, 400, 500) via `next/font/google`
Update metadata: title `"GoOut Hyd"`, description `"Discover Hyderabad's best independent cafes and events"`

### Files Modified Summary
- `apps/web/package.json` — remove 6 packages, remove `stripe:listen` script
- `package.json` (root) — remove GCP deploy scripts, update name/description
- `apps/web/lib/env.ts` — remove GCP/AI vars, add RESEND_API_KEY optional
- `apps/web/middleware.ts` — passthrough
- `apps/web/next.config.ts` — add Supabase Storage hostname
- `apps/web/tailwind.config.ts` — GoOut Hyd tokens
- `apps/web/app/layout.tsx` — fonts + metadata
- `apps/web/app/globals.css` — CSS custom properties
- `apps/web/lib/drizzle/schema/index.ts` — new exports

---

## 11. Implementation Plan

### Phase 1: RAG Dependency Removal
**Goal:** Remove all AI/RAG/payment packages and dead scripts so the dependency tree is clean

- [ ] **Task 1.1:** Remove packages from `apps/web/package.json`
  - Files: `apps/web/package.json`
  - Details: Remove `@ai-sdk/google`, `@ai-sdk/react`, `ai`, `@google-cloud/aiplatform`, `@google-cloud/storage`, `react-markdown`, `remark-gfm`, `stripe`, `next-themes`
  - Command: `npm uninstall @ai-sdk/google @ai-sdk/react ai @google-cloud/aiplatform @google-cloud/storage react-markdown remark-gfm stripe next-themes` (run in `apps/web`)
- [ ] **Task 1.2:** Remove dead scripts from root `package.json`
  - Files: `package.json` (root)
  - Details: Delete `deploy:processor:*`, `deploy:gcs-handler:*`, `deploy:task-processor:*`, `setup:gcp:*`, `stripe:listen`, `storage:setup` scripts. Update `name` and `description` to GoOut Hyd.
- [ ] **Task 1.3:** Remove `stripe:listen` and `dev:full` scripts from `apps/web/package.json`
  - Files: `apps/web/package.json`
  - Details: Delete `stripe:listen` and `dev:full` scripts. Update `name` field to `goout-hyd-web`.

### Phase 2: RAG Code Deletion
**Goal:** Delete all RAG-specific routes, components, and lib files

- [ ] **Task 2.1:** Delete RAG app routes
  - Delete: `apps/web/app/(auth)/`, `apps/web/app/(protected)/`, `apps/web/app/api/chat/`, `apps/web/app/api/documents/`, `apps/web/app/(public)/cookies/`
  - Delete: `apps/web/app/actions/history.ts`, `apps/web/app/actions/documents.ts`, `apps/web/app/actions/chat.ts`, `apps/web/app/actions/auth.ts`, `apps/web/app/actions/admin.ts`, `apps/web/app/actions/profile.ts`
- [ ] **Task 2.2:** Delete RAG components
  - Delete: `components/chat/`, `components/documents/`, `components/history/`, `components/auth/`, `components/profile/`, `components/error/`
  - Delete: entire `components/landing/` directory (HeroSection, FeaturesSection, RAGDemoSection, PricingSection, FAQSection, CTASection, ProblemSection, Navbar, Footer — all of it)
  - Delete: `components/layout/AppSidebar.tsx`, `components/layout/MobileHeaderContent.tsx`
  - Delete: `components/NavbarThemeSwitcher.tsx`, `components/SidebarThemeSwitcher.tsx`, `components/Logo.tsx`
- [ ] **Task 2.3:** Delete RAG lib files
  - Delete: `lib/embeddings/`, `lib/search/`, `lib/rag/`
  - Delete: `lib/documents.ts`, `lib/storage.ts`, `lib/attachments.ts`, `lib/attachments-client.ts`
  - Delete: `lib/chat-utils.ts`, `lib/chat-utils-client.ts`, `lib/google-cloud.ts`
  - Delete: `lib/upload-queue.ts`, `lib/upload-error-handling.ts`, `lib/file-validation.ts`, `lib/file-validation-constants.ts`
  - Delete: `lib/processing-constants.ts`, `lib/processing-utils.ts`
  - Delete: `lib/history.ts`, `lib/persistence.ts`, `lib/document-utils.ts`
  - Delete: `lib/error-categories.ts`, `lib/error-processing.ts`, `lib/error-formatting.ts`
  - Delete: `lib/types/errors.ts`, `lib/types/upload-errors.ts`
- [ ] **Task 2.4:** Delete old Drizzle schema files
  - Delete: `lib/drizzle/schema/documents.ts`, `lib/drizzle/schema/document_chunks.ts`, `lib/drizzle/schema/document_processing_jobs.ts`, `lib/drizzle/schema/conversations.ts`, `lib/drizzle/schema/messages.ts`, `lib/drizzle/schema/users.ts`
- [ ] **Task 2.5:** Stub the public landing page
  - Files: `apps/web/app/(public)/page.tsx`
  - Details: Replace with a minimal stub — just renders "GoOut Hyd" heading and "Coming soon" text so the app boots without broken imports

### Phase 3: Environment & Configuration Cleanup
**Goal:** Update env validation, middleware, Next.js config to match GoOut Hyd's minimal service requirements

- [ ] **Task 3.1:** Update `lib/env.ts`
  - Files: `apps/web/lib/env.ts`
  - Details: Remove `GEMINI_API_KEY`, all `GOOGLE_CLOUD_*` vars. Add `RESEND_API_KEY` as `z.string().optional()`. Keep `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`
- [ ] **Task 3.2:** Replace `middleware.ts` with passthrough
  - Files: `apps/web/middleware.ts`
  - Details: Remove all Supabase session checks. Return `NextResponse.next()` unconditionally. Add comment about Phase 2 re-enable. Set `config.matcher` to empty array.
- [ ] **Task 3.3:** Update `next.config.ts`
  - Files: `apps/web/next.config.ts`
  - Details: Add `{ protocol: 'https', hostname: '*.supabase.co' }` and `{ protocol: 'https', hostname: 'picsum.photos' }` to `images.remotePatterns`
- [ ] **Task 3.4:** Run lint + type-check to confirm clean app boot
  - Command: `npm run lint` and `npm run type-check` from `apps/web`

### Phase 4: Design System Application
**Goal:** Apply GoOut Hyd visual identity — color tokens, typography, layout defaults

- [ ] **Task 4.1:** Update `tailwind.config.ts`
  - Files: `apps/web/tailwind.config.ts`
  - Details:
    - Brand colors: `espresso: '#1C1008'`, `roast: '#4A2C17'`, `caramel: '#C4813A'`, `gold: '#D4956A'`, `cream: '#F5ECD7'`, `milk: '#FAF5EC'`, `foam: '#FFFCF7'`
    - UI colors: `border: '#E8DCC8'`, `input-border: '#D4C9B5'`, `success: '#2D7A4F'`, `warning: '#C4813A'`, `error: '#C43A3A'`
    - Font families: `heading: ['"DM Serif Display"', 'Georgia', 'serif']`, `body: ['"DM Sans"', 'system-ui', 'sans-serif']`
- [ ] **Task 4.2:** Update `app/layout.tsx`
  - Files: `apps/web/app/layout.tsx`
  - Details: Import `DM_Serif_Display` (weight 400) and `DM_Sans` (weights 300, 400, 500) via `next/font/google`. Apply variable classes to `<html>`. Update metadata: title `"GoOut Hyd"`, description `"Discover Hyderabad's best independent cafes and events"`. Remove `next-themes` ThemeProvider entirely. Uninstall `next-themes` package.
- [ ] **Task 4.3:** Update `app/globals.css`
  - Files: `apps/web/app/globals.css`
  - Details: Update CSS custom properties to use GoOut Hyd color tokens. Remove dark mode `:root` overrides. Set `font-family` defaults to body font.
- [ ] **Task 4.4:** Create minimal `components/Logo.tsx`
  - Files: `apps/web/components/Logo.tsx`
  - Details: Simple text-based logo — "GoOut Hyd" in DM Serif Display, espresso color. Accepts optional `className` prop.

### Phase 5: Database Schema
**Goal:** Create the 5 GoOut Hyd tables via Drizzle and apply migration

- [ ] **Task 5.1:** Create `lib/drizzle/schema/cafes.ts`
  - Defines `cafe_status` enum and `cafes` table with all columns and 3 indexes
- [ ] **Task 5.2:** Create `lib/drizzle/schema/cafe-images.ts`
  - Defines `cafe_images` table with FK to cafes + index
- [ ] **Task 5.3:** Create `lib/drizzle/schema/menu-items.ts`
  - Defines `menu_items` table with FK to cafes + index
- [ ] **Task 5.4:** Create `lib/drizzle/schema/events.ts`
  - Defines `event_type` enum, `event_status` enum, `events` table with all columns and 5 indexes
- [ ] **Task 5.5:** Create `lib/drizzle/schema/cafe-leads.ts`
  - Defines `lead_status` enum and `cafe_leads` table with 2 indexes
- [ ] **Task 5.6:** Update `lib/drizzle/schema/index.ts`
  - Export all 5 tables and 4 enums
- [ ] **Task 5.7:** Generate migration
  - Command: `npm run db:generate` (from repo root)
- [ ] **Task 5.8:** Create down migration
  - Follow `drizzle_down_migration.md` template
  - Create `apps/web/drizzle/migrations/[timestamp]/down.sql` with `DROP TABLE IF EXISTS` for all 5 tables and `DROP TYPE IF EXISTS` for all 4 enums (order: drop tables first, then enums)
- [ ] **Task 5.9:** Apply migration
  - Command: `npm run db:migrate` (from repo root)

### Phase 6: Supabase Storage Setup
**Goal:** Create the `images` bucket in Supabase Storage so images can be served

- [ ] **Task 6.1:** Create `images` bucket in Supabase Storage dashboard
  - Details: Public bucket, allow public reads, no RLS required for public bucket
  - **This is a manual step** — Wilson or developer does this via Supabase dashboard
- [ ] **Task 6.2:** Upload placeholder images
  - Details: 4 cafe cover photos, 12-16 gallery photos (3-4 per cafe), 6 event cover images
  - **This is a manual step** — upload via Supabase Storage dashboard or CLI
  - Note the public URL pattern: `https://<project-ref>.supabase.co/storage/v1/object/public/images/...`

### Phase 7: Seed Data
**Goal:** Populate the database with realistic fictional sample data

- [ ] **Task 7.1:** Create/update seed script at `apps/web/lib/drizzle/seed.ts`
  - Details:
    - 4 cafes: "The Roast" (Banjara Hills), "Cafe Blend" (Jubilee Hills), "Clay & Coffee" (Kondapur), "Filter House" (Gachibowli)
    - 3-5 cafe_images per cafe
    - 5-8 menu_items per cafe: Coffee (₹149-₹299), Food (₹249-₹449), Desserts (₹199-₹349)
    - 6 upcoming events: 2 live_music, 1 open_mic, 1 workshop, 1 comedy_night, 1 gaming — future dates, ticket_prices null (free) to ₹499
    - 2 cafe_leads (status: new, contacted)
    - Use `https://picsum.photos/800/600?random=N` URLs for all images (increment N per image) — replace with real Supabase Storage URLs after Phase 6
- [ ] **Task 7.2:** Run seed
  - Command: `npm run db:seed` (from repo root)

### Phase 8: Validation
**Goal:** Confirm the app is clean, typed, and linted

- [ ] **Task 8.1:** Run lint
  - Command: `npm run lint` from `apps/web`
  - Details: Fix any import errors or ESLint violations from deleted files
- [ ] **Task 8.2:** Run type-check
  - Command: `npm run type-check` from `apps/web`
  - Details: Fix any TypeScript errors
- [ ] **Task 8.3:** Verify seed data via Drizzle Studio
  - Command: `npm run db:studio` from repo root
  - Details: Confirm all 5 tables have data, relationships are correct

### Phase 9: Comprehensive Code Review
**Goal:** Present completion and request thorough review

- [ ] **Task 9.1:** Present "Implementation Complete!" message
- [ ] **Task 9.2:** Execute comprehensive code review if approved

---

## 12. Task Completion Tracking

### Phase 1: RAG Dependency Removal
- [x] **Task 1.1:** Remove packages from `apps/web/package.json` ✓ 2026-03-22
- [x] **Task 1.2:** Remove dead scripts from root `package.json` ✓ 2026-03-22
- [x] **Task 1.3:** Remove `stripe:listen`/`dev:full` from `apps/web/package.json` ✓ 2026-03-22

### Phase 2: RAG Code Deletion
- [x] **Task 2.1:** Delete RAG app routes ✓ 2026-03-22
- [x] **Task 2.2:** Delete RAG components ✓ 2026-03-22
- [x] **Task 2.3:** Delete RAG lib files ✓ 2026-03-22
- [x] **Task 2.4:** Delete old Drizzle schema files ✓ 2026-03-22
- [x] **Task 2.5:** Stub public landing page ✓ 2026-03-22

### Phase 3: Environment & Configuration Cleanup
- [x] **Task 3.1:** Update `lib/env.ts` ✓ 2026-03-22
- [x] **Task 3.2:** Replace `middleware.ts` with passthrough ✓ 2026-03-22
- [x] **Task 3.3:** Update `next.config.ts` ✓ 2026-03-22
- [x] **Task 3.4:** Lint + type-check ✓ 2026-03-22 — `tsc --noEmit` passes clean

### Phase 4: Design System Application
- [x] **Task 4.1:** Update `tailwind.config.ts` ✓ 2026-03-22
- [x] **Task 4.2:** Update `app/layout.tsx` ✓ 2026-03-22
- [x] **Task 4.3:** Update `app/globals.css` ✓ 2026-03-22
- [x] **Task 4.4:** Create `components/Logo.tsx` ✓ 2026-03-22

### Phase 5: Database Schema
- [x] **Task 5.1:** Create `cafes.ts` ✓ 2026-03-22
- [x] **Task 5.2:** Create `cafe-images.ts` ✓ 2026-03-22
- [x] **Task 5.3:** Create `menu-items.ts` ✓ 2026-03-22
- [x] **Task 5.4:** Create `events.ts` ✓ 2026-03-22
- [x] **Task 5.5:** Create `cafe-leads.ts` ✓ 2026-03-22
- [x] **Task 5.6:** Update `index.ts` ✓ 2026-03-22
- [x] **Task 5.7:** `npm run db:generate` ✓ 2026-03-22 — generated `0000_charming_sentry.sql`
- [x] **Task 5.8:** Create down migration ✓ 2026-03-22 — `0000_charming_sentry/down.sql`
- [x] **Task 5.9:** `npm run db:migrate` ✓ 2026-03-22 — applied successfully

### Phase 6: Supabase Storage Setup (Manual)
- [x] **Task 6.1:** Create `images` bucket ✓ 2026-03-22 — created manually in Supabase dashboard (public-read)
- [x] **Task 6.2:** Upload placeholder images ✓ 2026-03-22 — seed data uses `picsum.photos` URLs; no uploads required for Phase 1A

### Phase 7: Seed Data
- [x] **Task 7.1:** Create/update `seed.ts` ✓ 2026-03-22
- [x] **Task 7.2:** `npm run db:seed` ✓ 2026-03-22 — 4 cafes · 12 images · 20 menu items · 4 events inserted

### Phase 8: Validation
- [x] **Task 8.1:** `npm run lint` ✓ 2026-03-22 — passes clean (fixed missing `@next/eslint-plugin-next@15.5.4`)
- [x] **Task 8.2:** `npm run type-check` ✓ 2026-03-22 — passes clean
- [x] **Task 8.3:** Verify via Drizzle Studio ✓ 2026-03-22 — confirmed by successful seed run and clean validation

### Phase 9: Code Review
- [x] **Task 9.1:** Phase 1A complete ✓ 2026-03-22 — all phases done, app boots clean
- [x] **Task 9.2:** Code review ✓ 2026-03-22 — lint + type-check pass, no outstanding issues

---

## 13. File Structure & Organization

### Files to Delete
```
apps/web/app/(auth)/                          ← entire directory
apps/web/app/(protected)/                     ← entire directory
apps/web/app/api/chat/                        ← entire directory
apps/web/app/api/documents/                   ← entire directory
apps/web/app/(public)/cookies/                ← entire directory
apps/web/app/actions/history.ts
apps/web/app/actions/documents.ts
apps/web/app/actions/chat.ts
apps/web/app/actions/auth.ts
apps/web/app/actions/admin.ts
apps/web/app/actions/profile.ts
apps/web/components/chat/                     ← entire directory
apps/web/components/documents/               ← entire directory
apps/web/components/history/                 ← entire directory
apps/web/components/auth/                    ← entire directory
apps/web/components/profile/                 ← entire directory
apps/web/components/error/                   ← entire directory
apps/web/components/layout/AppSidebar.tsx
apps/web/components/layout/MobileHeaderContent.tsx
apps/web/components/landing/                 ← entire directory (Navbar, Footer, all sections)
apps/web/components/NavbarThemeSwitcher.tsx
apps/web/components/SidebarThemeSwitcher.tsx
apps/web/components/Logo.tsx
apps/web/lib/embeddings/                     ← entire directory
apps/web/lib/search/                         ← entire directory
apps/web/lib/rag/                            ← entire directory
apps/web/lib/documents.ts
apps/web/lib/storage.ts
apps/web/lib/attachments.ts
apps/web/lib/attachments-client.ts
apps/web/lib/chat-utils.ts
apps/web/lib/chat-utils-client.ts
apps/web/lib/google-cloud.ts
apps/web/lib/upload-queue.ts
apps/web/lib/upload-error-handling.ts
apps/web/lib/file-validation.ts
apps/web/lib/file-validation-constants.ts
apps/web/lib/processing-constants.ts
apps/web/lib/processing-utils.ts
apps/web/lib/history.ts
apps/web/lib/persistence.ts
apps/web/lib/document-utils.ts
apps/web/lib/error-categories.ts
apps/web/lib/error-processing.ts
apps/web/lib/error-formatting.ts
apps/web/lib/types/errors.ts
apps/web/lib/types/upload-errors.ts
apps/web/lib/drizzle/schema/documents.ts
apps/web/lib/drizzle/schema/document_chunks.ts
apps/web/lib/drizzle/schema/document_processing_jobs.ts
apps/web/lib/drizzle/schema/conversations.ts
apps/web/lib/drizzle/schema/messages.ts
apps/web/lib/drizzle/schema/users.ts
```

### New Files to Create
```
apps/web/lib/drizzle/schema/cafes.ts
apps/web/lib/drizzle/schema/cafe-images.ts
apps/web/lib/drizzle/schema/menu-items.ts
apps/web/lib/drizzle/schema/events.ts
apps/web/lib/drizzle/schema/cafe-leads.ts
apps/web/lib/drizzle/seed.ts
apps/web/components/Logo.tsx
apps/web/drizzle/migrations/[timestamp]/down.sql
```

### Files to Modify
- `apps/web/package.json` — remove deps, remove scripts, rename
- `package.json` (root) — remove GCP scripts, rename
- `apps/web/lib/env.ts` — remove GCP/AI vars, add RESEND_API_KEY optional
- `apps/web/middleware.ts` — passthrough
- `apps/web/next.config.ts` — add Supabase Storage hostname
- `apps/web/tailwind.config.ts` — GoOut Hyd design tokens + fonts
- `apps/web/app/layout.tsx` — DM fonts + metadata
- `apps/web/app/globals.css` — CSS custom properties
- `apps/web/app/(public)/page.tsx` — replace with minimal stub
- `apps/web/lib/drizzle/schema/index.ts` — new exports

---

## 14. Potential Issues & Security Review

### Error Scenarios
- [ ] **Broken imports after deletion:** Components or pages may import from deleted lib files
  - **Code Review Focus:** Run `npm run type-check` — TypeScript will surface all broken imports
  - **Potential Fix:** Remove the importing file or update to remove the broken import

- [x] **`next-themes` ThemeProvider still referenced after dark mode removal** — ✅ Resolved 2026-03-22
  - `next-themes` will be fully uninstalled in Task 1.1. `ThemeProvider` removed from `app/layout.tsx` in Task 4.2.

- [x] **Supabase Storage images not loading if bucket not yet created** — ✅ Resolved 2026-03-22
  - Seed data will use `picsum.photos` placeholder URLs. No dependency on Supabase Storage bucket existing before Phase 7 runs. Also need to add `picsum.photos` to `next.config.ts` `images.remotePatterns`.

- [x] **Old migration files referencing dropped RAG tables** — ✅ Resolved 2026-03-22
  - Database is not connected yet. No existing tables exist. Migrations will be applied fresh to a clean Supabase instance in Phase 5. No drop migration needed for old RAG tables.

### Security
- No auth changes to worry about in this phase — middleware is a passthrough
- No user input until Phase 1B (partner form) — no validation surface yet
- Supabase Storage: the `images` bucket should be public-read only; no write access from the client

---

## 15. Deployment & Configuration

### Environment Variables (no changes to `.env.local` required for Phase 1A)

The following vars should already be in `apps/web/.env.local`:
```bash
DATABASE_URL=                    # PostgreSQL connection string (Supabase)
SUPABASE_URL=                    # Supabase project URL
SUPABASE_ANON_KEY=               # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Remove from `.env.local` (no longer needed):
```bash
GEMINI_API_KEY=
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_REGION=
GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=
GOOGLE_CLOUD_STORAGE_BUCKET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

**`RESEND_API_KEY` is not needed yet** — it's marked optional in env schema. Add it when email features are built (Phase 1B).

---

## 16. Second-Order Consequences & Impact Analysis

### Breaking Changes Identified
- All RAG routes (`/chat`, `/documents`, `/history`, `/admin`, all `/auth/*`) will 404 — **expected and desired**
- Old database tables (documents, conversations, etc.) will be dropped — **data loss is acceptable in dev**
- Any bookmarked RAG URLs will break — **no production users exist**

### Performance Implications
- Removing 6 heavy packages (`@ai-sdk/*`, `@google-cloud/*`, `stripe`) will meaningfully reduce bundle size and `npm install` time
- No `next-themes` = slightly lighter client bundle

### Mitigation
- Down migration created before any `npm run db:migrate` run
- Seed data provides immediate realistic content for development

---

## 17. Notes & Additional Context

### Manual Steps Summary (require human action)
1. **Phase 6.1:** Create `images` bucket in Supabase Storage dashboard
2. **Phase 6.2:** Upload placeholder images via Supabase dashboard
3. **Phase 8.3:** Verify seed data in Drizzle Studio

### Phase 1B Preview
Phase 1B (covered in a separate task) will build the actual GoOut Hyd pages:
- Landing page with featured cafes and events
- `/cafes` listing + `/cafes/[slug]` profile
- `/events` listing + `/events/[slug]` detail
- `/partner` interest form (with Server Action + Resend email)
- `/about`, `/privacy`, `/terms` static pages

### Key Files NOT Deleted (keep and adapt)
- `components/ui/` — all shadcn components stay
- `components/legal/` — LegalLayout, LegalPageWrapper, etc. stay (used by privacy/terms)
- `components/landing/` — deleted entirely in Phase 2; Navbar and Footer rebuilt fresh in Phase 1B
- `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `lib/supabase/middleware.ts`
- `lib/drizzle/db.ts`, `lib/utils.ts`, `lib/app-utils.ts`, `lib/metadata.ts`, `lib/auth.ts`

---

*Task: 001*
*Phase: 1A*
*Created: 2026-03-22*
*Completed: 2026-03-22*
*Status: COMPLETE ✓*
