# AI Task Document

---

## 1. Task Overview

### Task Title
**Title:** Phase 5 — Landing Page & Content Pages (Home, About, Privacy, Terms)

### Goal Statement
**Goal:** Build the public landing page as the main entry point and complete all remaining static/content pages so that all eight GoOut Hyd routes are implemented and coherent. After this phase, `/` showcases featured cafes and upcoming events, surfaces browse-by-area and partner CTAs, and legal pages reflect GoOut Hyd (goouthyd.in) instead of legacy RAG/ShipKit copy.

---

## 2. Strategic Analysis & Solution Options

Strategic analysis is not required. The roadmap specifies section order, copy, typography, and reuse of existing `CafeCard` and `EventCard`. Query helpers `getFeaturedCafes` and `getUpcomingEventsForLanding` already exist in `lib/queries/`. Legal pages should keep the existing `LegalLayout` / `LegalPageWrapper` / TOC pattern where practical, replacing content and metadata for GoOut Hyd.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.5.x (App Router), React 19
- **Language:** TypeScript 5, strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM
- **UI & Styling:** shadcn/ui, Tailwind with GoOut Hyd tokens (`espresso`, `caramel`, `cream`, `foam`, `milk`, etc.)
- **Typography:** DM Serif Display (headings), DM Sans (body)
- **Authentication:** Dormant in Phase 1 — public routes only
- **Key patterns:** Server Components for data fetching; `generateMetadata` for SEO; footer via `app/(public)/layout.tsx` (roadmap: “Footer via layout”)
- **Relevant existing code:**
  - `lib/queries/cafes.ts` — `getFeaturedCafes(limit = 6)`
  - `lib/queries/events.ts` — `getUpcomingEventsForLanding(limit = 4)`
  - `lib/constants/areas.ts` — `AREAS` (slug + name) for browse pills
  - `components/cafes/CafeCard.tsx`, `components/events/EventCard.tsx` — reuse on landing
  - `components/legal/*` — privacy/terms shell (currently ShipKit/RAG-oriented copy)
  - `lib/metadata.ts` — `generateLegalMetadata` and patterns for titles/descriptions

### Current State
- **`app/(public)/page.tsx`:** Full landing composition with `components/landing/*` (Phase 2 complete).
- **`app/(public)/about/`:** `page.tsx`, `loading.tsx`, and `error.tsx` in place (Phase 3 complete).
- **`app/(public)/privacy/page.tsx` & `terms/page.tsx`:** Rewritten for GoOut Hyd (Phase 4 complete).
- **Landing components:** Roadmap names new files under `components/landing/`; verify no duplicate legacy `HeroSection` etc. from removed RAG landing (create fresh per roadmap).

### Existing Context Providers Analysis
- No React context required for these pages. Data for home is fetched in the Server Component; About is static content.

---

## 4. Context & Problem Definition

### Problem Statement
Visitors and cafe owners first encounter GoOut Hyd through `/` and credibility/legal pages. A placeholder home and third-party legal text undermine trust and SEO. The product needs a single scrollable marketing story (hero → areas → cafes → events → partner CTA) with accurate metadata and India/Hyderabad-appropriate legal framing.

### Success Criteria
- [x] `page.tsx` (home) is an async Server Component that awaits `getFeaturedCafes(6)` and `getUpcomingEventsForLanding(4)` and composes sections in order: **Hero → Browse by Area → Featured Cafes → Upcoming Events → Partner CTA** (footer from public layout)
- [x] New landing components exist with roadmap-specified copy, styling, and links (`/cafes`, `/cafes?area={slug}`, `/events`, `/partner`)
- [x] Home `generateMetadata`: title **"GoOut Hyd -- Discover Hyderabad's Best Cafes & Events"**, description per roadmap, Open Graph using `NEXT_PUBLIC_APP_URL` (or established project pattern)
- [x] `app/(public)/about/page.tsx` with hero, story, mission quote, CTA + Instagram placeholder link; `generateMetadata` title **"About | GoOut Hyd"** with roadmap description
- [x] Privacy and Terms pages updated for GoOut Hyd; `generateMetadata` titles **"Privacy Policy | GoOut Hyd"** and **"Terms of Service | GoOut Hyd"** (via `generateLegalMetadata`); **Last updated** **2026-04-13**
- [x] `npm run lint` and `npm run type-check` pass for touched files
- [ ] Responsive layout (mobile stack for dual CTAs, grids for cards); **light-only** — no dark mode toggle or `dark:` theme work

---

## 5. Development Mode Context

- Active development; no production migration pressure
- No database schema changes expected for this phase

---

## 6. Technical Requirements

### Functional Requirements
- Landing: reuse `CafeCard` and `EventCard`; “See All Cafes →” / “See All Events →” links; area pills link to `/cafes?area={slug}` (align with existing cafes listing query param if present)
- About: static sections; primary CTA to `/partner`
- Privacy: sections covering partner form fields collected, use of data, cookies/analytics (Vercel Analytics), retention, contact — domain **goouthyd.in**, product name **GoOut Hyd**
- Terms: acceptance, platform usage, listings, event information (display only, no ticketing), IP, limitation of liability, contact

### Non-Functional Requirements
- **Performance:** Reasonable image usage (Next `Image` where images are shown); avoid unnecessary client JS
- **SEO:** Distinct metadata per page; OG for home per roadmap
- **Responsive Design:** 320px+; headline sizes ~48px desktop / 32px mobile where specified
- **Theme:** Light-only per `CLAUDE.md` (do not implement dark mode)

### Technical Constraints
- Phase 1 constraints: no auth, no payments, no AI features
- Use `npm run db:*` only if schema changes (not expected)
- Install shadcn components only if needed: `npx shadcn@latest add <component>`

---

## 7. Data & Database Changes

### Database Schema Changes
**None** expected.

### Down Migration Safety Protocol
Not applicable unless schema changes are introduced (they should not be required for this task).

---

## 8. API & Backend Changes

### Queries
- [x] **Existing:** `getFeaturedCafes`, `getUpcomingEventsForLanding` — import from `lib/queries/cafes` and `lib/queries/events`

### Server Actions / API Routes
- **None** for this phase (read-only pages except existing partner flow).

---

## 9. Frontend Changes

### New Components (`components/landing/`)
- [x] **`HeroSection.tsx`** — Espresso bg; headline, subtitle, two CTAs (primary → `/cafes`, secondary → `/events`), stack on mobile
- [x] **`BrowseByArea.tsx`** — Cream bg; “Find Your Spot”; pills from `AREAS` → `/cafes?area={slug}`
- [x] **`FeaturedCafes.tsx`** — Milk bg; grid of `CafeCard`; “See All Cafes →” → `/cafes`
- [x] **`UpcomingEventsSection.tsx`** — Cream bg; grid of `EventCard`; “See All Events →” → `/events`
- [x] **`PartnerCTABanner.tsx`** — Espresso bg; headline, subtitle, CTA → `/partner`

### Pages
- [x] **`app/(public)/page.tsx`** — Replace placeholder; fetch data; compose sections; `generateMetadata`
- [x] **`app/(public)/about/page.tsx`** — New (+ `loading.tsx`, `error.tsx`)
- [x] **`app/(public)/privacy/page.tsx`** — Rewrite content; adjust TOC sections; metadata
- [x] **`app/(public)/terms/page.tsx`** — Rewrite content; adjust TOC; metadata

### Code Changes Overview (High-Level)

**Before:** `app/(public)/page.tsx` renders a minimal centered placeholder.

**After:** Same file imports query functions, awaits data, and renders landing sections in sequence; metadata export added.

**Before:** Privacy/Terms reference ShipKit.ai and AI chat product.

**After:** Same legal wrapper components where possible, with GoOut Hyd-specific sections and updated `generateMetadata` / `lastUpdated`.

---

## 10. Implementation Plan

### Phase 1: Query verification & cafes listing alignment
**Goal:** Confirm `?area=` handling on `/cafes` matches `BrowseByArea` links (`AreaSlug` from `AREAS`).

- [x] **Task 1.1:** Read `app/(public)/cafes/page.tsx` and `lib/queries/cafes.ts` for searchParams / area filter behavior; adjust link shape if needed ✓ 2026-04-13
  - **Verified:** Page already validated `area` against `AREAS` slugs; `getAllCafes` filters by name from slug via `getAreaNameFromSlug` — no URL shape change required.
  - **Added:** `CAFES_AREA_SEARCH_PARAM` and `cafesListingHref(slug)` in `lib/constants/areas.ts` so landing `BrowseByArea` links and pills share one contract; `AreaFilterPills` and `cafes/page.tsx` read/write the same param key.

### Phase 2: Landing components
**Goal:** Add five landing components with roadmap styling and accessibility (semantic headings, focus states on links/buttons).

- [x] **Task 2.1:** Create `components/landing/*.tsx` files ✓ 2026-04-13
  - Added: `HeroSection`, `BrowseByArea`, `FeaturedCafes`, `UpcomingEventsSection`, `PartnerCTABanner`
- [x] **Task 2.2:** Wire `app/(public)/page.tsx` + `generateMetadata` + OG fields ✓ 2026-04-13
  - Home fetches `getFeaturedCafes(6)` + `getUpcomingEventsForLanding(4)` in parallel; metadata uses `title.absolute`, roadmap title/description, `openGraph` + `twitter` with `env.NEXT_PUBLIC_APP_URL` for OG URL

### Phase 3: About page
**Goal:** New route with metadata and loading/error boundaries.

- [x] **Task 3.1:** `about/page.tsx`, `loading.tsx`, `error.tsx` ✓ 2026-04-13
  - Hero (espresso), story (cream, 3 paragraphs), mission quote (milk), CTA + Instagram placeholder link (cream); `generateMetadata` title `About` (template → **About | GoOut Hyd**), roadmap description; loading/error match partner patterns

### Phase 4: Legal pages
**Goal:** Replace template content; simplify TOC to match new headings; set last updated date.

- [x] **Task 4.1:** `privacy/page.tsx` ✓ 2026-04-13
  - GoOut Hyd copy: partner form fields, use of data, Vercel Analytics, retention, security, rights, contact; domain **goouthyd.in**; `generateLegalMetadata`; last updated **2026-04-13**; `contactEmail` passed to wrapper
- [x] **Task 4.2:** `terms/page.tsx` ✓ 2026-04-13
  - Acceptance, platform usage, cafe listings, events (display-only, no ticketing), IP, limitation of liability, changes, contact + governing law (India / Hyderabad); same metadata pattern and date

### Phase 5: Validation
**Goal:** Static validation only (no `npm run build`).

- [x] **Task 5.1:** `npm run lint` and `npm run type-check` in `apps/web` ✓ 2026-04-14
  - Completed by user in local terminal session.

---

## 11. File Structure & Organization

### New files (expected)
```
apps/web/components/landing/
  HeroSection.tsx
  BrowseByArea.tsx
  FeaturedCafes.tsx
  UpcomingEventsSection.tsx
  PartnerCTABanner.tsx
apps/web/app/(public)/about/
  page.tsx
  loading.tsx
  error.tsx
```

### Files to modify (expected)
- `apps/web/app/(public)/page.tsx`
- `apps/web/app/(public)/privacy/page.tsx`
- `apps/web/app/(public)/terms/page.tsx`
- Possibly `apps/web/lib/metadata.ts` only if a shared helper is needed for OG on the home page (prefer existing patterns)

---

## 12. Potential Issues & Security Review

- **Empty states:** If no featured cafes or no upcoming events, landing should still render sections without broken layouts (empty grids or concise fallback copy — align with existing card/list patterns elsewhere).
- **Legal accuracy:** Rewritten privacy/terms are marketing/legal placeholders; Wilson should review before production reliance.
- **Instagram placeholder:** Use a sensible `href` pattern (e.g. `#` with `aria-disabled` or obvious placeholder URL) to avoid linking to wrong account.

---

## 13. Deployment & Configuration

- **Env:** `NEXT_PUBLIC_APP_URL` for OG canonical URLs (verify `lib/env.ts` / metadata helpers)

---

## 14. Notes & Additional Context

- **Roadmap reference:** `ai_docs/prep/roadmap.md` — Phase 5 (lines ~433–509)
- **Prior phase:** Partner lead capture (`005_phase_4_partner_lead_capture.md`) — `/partner` is live; landing CTAs should route there consistently

---

## 15. AI Agent Instructions (Task Template Summary)

When implementing this task:

1. Do not run `npm run dev` or `npm run build` for validation; use `npm run lint` and `npm run type-check` per project rules.
2. Update this document’s checkboxes as work completes.
3. After implementation, offer comprehensive code review per team workflow.
4. User browser testing for visual/copy acceptance.

---

*Task created from roadmap Phase 5 and `ai_docs/dev_templates/task_template.md`. Task number: **006**.*
