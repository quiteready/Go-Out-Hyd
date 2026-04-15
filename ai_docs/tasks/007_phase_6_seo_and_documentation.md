# Task 007: Phase 6 — SEO & Documentation

---

## 1. Task Overview

### Task Title
**Title:** Phase 6 — SEO Infrastructure, Custom 404 Page & Project Documentation

### Goal Statement
**Goal:** Close out the GoOut Hyd MVP by adding site-wide SEO infrastructure (`robots.ts`, `sitemap.ts`), a branded 404 page (`not-found.tsx`), and rewriting the project `SETUP.md` for future developers. After this phase all 8 pages are live and the project is search-engine-ready and properly documented.

---

## 2. Strategic Analysis & Solution Options

Strategic analysis not required — implementation patterns are fully defined in the roadmap. No significant trade-offs exist; the approach is straightforward Next.js 15 conventions.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.5.4 (App Router), React 19
- **Language:** TypeScript 5 with strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM 0.44.6
- **UI & Styling:** shadcn/ui components, Tailwind CSS 3.4.1, DM Serif Display / DM Sans fonts
- **Authentication:** Supabase Auth (dormant in Phase 1)
- **Key Architectural Patterns:** App Router, Server Components for data fetching, Server Actions for mutations
- **Relevant Existing Query Functions:**
  - `getAllCafes()` in `lib/queries/cafes.ts` — returns all active cafes with slugs
  - `getUpcomingEvents()` in `lib/queries/events.ts` — returns all upcoming events with slugs

### Current State
- All 8 public pages are implemented (landing, cafes listing, cafe profile, events listing, event detail, partner, about, privacy, terms)
- No `robots.ts`, `sitemap.ts`, or `not-found.tsx` exists yet in `apps/web/app/`
- `SETUP.md` exists at repo root but contains old RAG-app instructions and needs a full rewrite for GoOut Hyd

---

## 4. Context & Problem Definition

### Problem Statement
The app is functionally complete but not yet crawlable by search engines (no sitemap or robots config). There's no branded 404 page so users hitting a bad URL get a generic Next.js error. The setup docs still describe the old RAG app, making it hard for future developers or AI agents to onboard.

### Success Criteria
- [ ] `apps/web/app/robots.ts` created — allows all crawlers, points to sitemap
- [ ] `apps/web/app/sitemap.ts` created — includes all static and dynamic routes with correct `changeFrequency` and `priority`
- [ ] `apps/web/app/not-found.tsx` created — GoOut Hyd branded 404 page with nav + footer via root layout
- [ ] `SETUP.md` rewritten for GoOut Hyd with accurate prerequisites, env vars, DB setup, and deployment instructions
- [ ] All new files pass lint and type-check with no errors

---

## 5. Development Mode Context

- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** — feel free to make breaking changes
- **Priority: Speed and simplicity** over preservation
- **Aggressive refactoring allowed**

---

## 6. Technical Requirements

### Functional Requirements
- `robots.ts`: All crawlers allowed, sitemap URL points to `${NEXT_PUBLIC_APP_URL}/sitemap.xml`
- `sitemap.ts`: Dynamic — fetches active cafe slugs and upcoming event slugs at generation time
- `not-found.tsx`: Uses root layout (nav + footer auto-included), cream background, DM Serif Display heading, links to `/cafes` and `/events`
- `SETUP.md`: Accurate developer onboarding guide for GoOut Hyd

### Non-Functional Requirements
- **Performance:** `sitemap.ts` and `robots.ts` are static/cached at build time by Next.js — no runtime overhead
- **Responsive Design:** `not-found.tsx` must work on mobile (320px+) and desktop
- **Theme Support:** Light mode only (no dark mode toggle per project spec)

### Technical Constraints
- Must use Next.js 15 App Router conventions (`MetadataRoute.Robots`, `MetadataRoute.Sitemap`)
- `sitemap.ts` must call `getAllCafes()` and `getUpcomingEvents()` from existing query files — no new DB queries
- `not-found.tsx` is a Server Component — no `"use client"` needed
- No new npm dependencies required

---

## 7. Data & Database Changes

No database schema changes required for this phase.

---

## 8. API & Backend Changes

No API routes or Server Actions needed. Data fetching for the sitemap is direct via existing lib query functions in a Server Component context.

---

## 9. Frontend Changes

### New Files to Create

- [ ] **`apps/web/app/robots.ts`** — Next.js robots metadata route
- [ ] **`apps/web/app/sitemap.ts`** — Dynamic sitemap with static + dynamic routes
- [ ] **`apps/web/app/not-found.tsx`** — Custom 404 page (Server Component)
- [ ] **`SETUP.md`** (repo root) — Full rewrite for GoOut Hyd

### Code Changes Overview

#### `apps/web/app/robots.ts`
```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
```

#### `apps/web/app/sitemap.ts`
```typescript
import type { MetadataRoute } from "next";
import { getAllCafes } from "@/lib/queries/cafes";
import { getUpcomingEvents } from "@/lib/queries/events";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl,                    changeFrequency: "daily",   priority: 1.0 },
    { url: `${baseUrl}/cafes`,         changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/events`,        changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/partner`,       changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/about`,         changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`,       changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`,         changeFrequency: "monthly", priority: 0.3 },
  ];

  // Dynamic cafe routes
  const allCafes = await getAllCafes();
  const cafeRoutes: MetadataRoute.Sitemap = allCafes.map((cafe) => ({
    url: `${baseUrl}/cafes/${cafe.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Dynamic event routes
  const upcomingEvents = await getUpcomingEvents();
  const eventRoutes: MetadataRoute.Sitemap = upcomingEvents.map((event) => ({
    url: `${baseUrl}/events/${event.slug}`,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [...staticRoutes, ...cafeRoutes, ...eventRoutes];
}
```

#### `apps/web/app/not-found.tsx`
Branded 404 page using GoOut Hyd palette (cream background, espresso text), DM Serif Display heading, two CTA links to `/cafes` and `/events`. No `"use client"` needed — root layout provides Navbar and Footer automatically.

---

## 10. Code Changes Overview

#### 🎯 Key Changes Summary
- [ ] **New file: `robots.ts`** — 8 lines, standard Next.js metadata route
- [ ] **New file: `sitemap.ts`** — ~35 lines, fetches all active cafes + upcoming events for dynamic routes
- [ ] **New file: `not-found.tsx`** — ~50 lines, branded 404 with Navbar/Footer from root layout
- [ ] **Rewrite: `SETUP.md`** — Replace RAG app content with GoOut Hyd onboarding guide
- [ ] **No existing files modified** — pure additions only

---

## 11. Implementation Plan

### Phase 1: SEO Files
**Goal:** Create robots config and dynamic sitemap

- [ ] **Task 1.1:** Create `apps/web/app/robots.ts`
  - Files: `apps/web/app/robots.ts` (new)
  - Details: Export `MetadataRoute.Robots` — allow all, point sitemap to `NEXT_PUBLIC_APP_URL/sitemap.xml`
- [ ] **Task 1.2:** Create `apps/web/app/sitemap.ts`
  - Files: `apps/web/app/sitemap.ts` (new)
  - Details: Async function, import `getAllCafes` + `getUpcomingEvents`, build static + dynamic entries with correct `changeFrequency` and `priority` per route type

### Phase 2: Custom 404 Page
**Goal:** Create branded not-found page consistent with GoOut Hyd design

- [ ] **Task 2.1:** Create `apps/web/app/not-found.tsx`
  - Files: `apps/web/app/not-found.tsx` (new)
  - Details: Server Component, cream background (`bg-amber-50`), espresso text, DM Serif Display "Page not found" heading (h1), friendly sub-message, two buttons/links to `/cafes` and `/events`, consistent with site style

### Phase 3: Project Documentation
**Goal:** Rewrite SETUP.md for GoOut Hyd

- [ ] **Task 3.1:** Rewrite `SETUP.md` at repo root
  - Files: `SETUP.md`
  - Details: Cover prerequisites (Node.js 20+, npm, Supabase project, Resend account), all required env vars, database setup steps (`npm run db:migrate`, `npm run db:seed`), local dev (`npm run dev`), Resend domain config, Supabase Storage bucket setup, Vercel deployment steps, all available `db:*` scripts

### Phase 4: Basic Code Validation
**Goal:** Run static analysis on all new files

- [ ] **Task 4.1:** Run lint on web app
  - Command: `cd apps/web && npm run lint`
  - Details: Verify no lint errors in new files
- [ ] **Task 4.2:** Run type-check
  - Command: `cd apps/web && npm run type-check`
  - Details: Ensure `sitemap.ts`, `robots.ts`, and `not-found.tsx` have no type errors

🛑 **CRITICAL WORKFLOW CHECKPOINT** — After Phase 4, present "Implementation Complete!" message and wait for user approval before code review.

### Phase 5: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 5.1:** Present "Implementation Complete!" message (use exact template from AI Agent Instructions section 16, step 7)
- [ ] **Task 5.2:** Execute Comprehensive Code Review (if approved)

### Phase 6: User Browser Testing
**Goal:** Confirm SEO routes and 404 page work in browser

- [ ] **Task 6.1:** Present AI testing results summary
- [ ] **Task 6.2:** Request user to verify:
  - Visit `/sitemap.xml` — should return XML with all static + dynamic routes
  - Visit `/robots.txt` — should return allow-all config pointing to sitemap
  - Visit `/some-invalid-url` — should show branded 404 page with nav + footer
- [ ] **Task 6.3:** Wait for user confirmation

---

## 12. Task Completion Tracking

### Phase 1: SEO Files
- [x] **Task 1.1:** Create `apps/web/app/robots.ts` ✓ 2026-04-14
  - Files: `apps/web/app/robots.ts` ✓
- [x] **Task 1.2:** Create `apps/web/app/sitemap.ts` ✓ 2026-04-14
  - Files: `apps/web/app/sitemap.ts` ✓

### Phase 2: Custom 404 Page
- [x] **Task 2.1:** Create `apps/web/app/not-found.tsx` ✓ 2026-04-14
  - Files: `apps/web/app/not-found.tsx` ✓

### Phase 3: Project Documentation
- [x] **Task 3.1:** Rewrite `SETUP.md` ✓ 2026-04-14
  - Files: `SETUP.md` ✓

### Phase 4: Code Validation
- [x] **Task 4.1:** Lint check passed ✓ 2026-04-14
- [x] **Task 4.2:** Type-check passed ✓ 2026-04-14

### Phase 5: Code Review
- [x] **Task 5.1:** "Implementation Complete!" presented ✓ 2026-04-14
- [x] **Task 5.2:** Comprehensive code review executed ✓ 2026-04-14

### Phase 6: User Browser Testing
- [x] **Task 6.1:** AI test results presented ✓ 2026-04-14
- [x] **Task 6.2:** User testing checklist provided ✓ 2026-04-14
- [x] **Task 6.3:** User confirmed all checks pass ✓ 2026-04-14

---

## 13. File Structure & Organization

### New Files to Create
```
apps/web/
├── app/
│   ├── robots.ts            # Robots metadata route (new)
│   ├── sitemap.ts           # Dynamic sitemap (new)
│   └── not-found.tsx        # Custom 404 page (new)
SETUP.md                     # Rewritten developer guide (repo root)
```

### Files to Modify
- None — this phase is purely additive

### Dependencies to Add
- None — all required APIs are built into Next.js 15

---

## 14. Potential Issues & Security Review

### Error Scenarios
- [ ] **`sitemap.ts` DB error at build time:** If `getAllCafes()` or `getUpcomingEvents()` throws (e.g. no DB connection during static generation), sitemap generation fails silently.
  - **Code Review Focus:** Wrap DB calls in try/catch and return only static routes on failure
  - **Potential Fix:** `try { const cafes = await getAllCafes(); ... } catch { /* return static only */ }`
- [ ] **`NEXT_PUBLIC_APP_URL` missing:** If env var is undefined, sitemap URLs will be malformed (`undefined/cafes`).
  - **Code Review Focus:** `sitemap.ts` and `robots.ts` usage of `process.env.NEXT_PUBLIC_APP_URL`
  - **Potential Fix:** Validate env var is set; `lib/env.ts` already validates this

### Edge Cases
- [ ] **No cafes or events in DB:** `sitemap.ts` should gracefully return just static routes (empty array spread is fine)
- [ ] **404 page in nested routes:** Next.js `not-found.tsx` at the `app/` root level catches all unmatched routes — this is the correct placement

### Security Review
- No auth, DB writes, or user input involved — security risk is minimal
- [ ] **Robots.ts:** Allows all crawlers — correct for a public discovery platform

---

## 15. Deployment & Configuration

No new environment variables required. All existing env vars (`NEXT_PUBLIC_APP_URL`, `DATABASE_URL`) are already validated in `lib/env.ts`.

---

## 16. AI Agent Instructions

Follow the standard workflow from the task template (section 16). This task has no strategic analysis phase — proceed directly to presenting implementation options (A/B/C) after reading this document.

**Key reminders for this task:**
- No DB migrations needed — skip all down migration steps
- No new npm packages needed
- `not-found.tsx` is a Server Component — no `"use client"` directive
- `sitemap.ts` must be `async` to call DB query functions
- Use `MetadataRoute.Robots` and `MetadataRoute.Sitemap` types from `"next"` package

---

## 17. Notes & Additional Context

### Reference Links
- [Next.js robots.ts docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next.js sitemap.ts docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js not-found.tsx docs](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)

### GoOut Hyd Color Reference
- Cream background: `bg-amber-50` or `bg-[#FDFAF5]`
- Espresso text: `text-stone-900`
- Caramel accent: `text-amber-700`

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment

#### Breaking Changes
- None — this phase adds new files only, no existing code is modified

#### Performance Implications
- `sitemap.ts` runs at build time (or on-demand revalidation) — no runtime cost per user request
- 404 page is a standard Server Component — no performance concern

#### Security Considerations
- Public sitemap exposes all active cafe and event slugs — acceptable for a public discovery platform

#### Maintenance Burden
- Sitemap automatically includes new cafes/events via `getAllCafes()` and `getUpcomingEvents()` — zero ongoing maintenance

### 🟢 No red or yellow flags identified — safe to proceed with implementation.

---

*Template Version: 1.3 | Task Created: 2026-04-14*
