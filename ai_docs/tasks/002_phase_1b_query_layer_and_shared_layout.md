# AI Task Template

---

## 1. Task Overview

### Task Title
**Title:** Phase 1B — Query Layer & Shared Layout (Area Constants, DB Queries, Navbar, Footer)

### Goal Statement
**Goal:** Build the data access layer and visual shell for GoOut Hyd. This phase creates the area slug mapping constants (single source of truth for all 5 Hyderabad areas), reusable Drizzle query functions for cafes and events, and the Navbar + Footer components wired into the public layout. After this phase, every public page is wrapped in the GoOut Hyd brand shell and all query primitives are ready for the feature pages in Phase 1C+.

---

## 2. Strategic Analysis & Solution Options

Strategic analysis skipped — implementation pattern is clearly established by the roadmap and CLAUDE.md. No meaningful architectural trade-offs exist for this phase.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.5.4 (App Router), React 19
- **Language:** TypeScript 5 (strict mode)
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM 0.44.6
- **UI & Styling:** shadcn/ui + Tailwind CSS 3.4.1. `cn()` helper in `lib/utils.ts`
- **Typography:** DM Serif Display (`--font-heading`) for headings, DM Sans (`--font-body`) for body — already loaded in `app/layout.tsx`
- **Colors:** Espresso/caramel/cream palette defined in Tailwind config
- **Icons:** lucide-react
- **Key Architectural Patterns:** App Router, Server Components for data fetching, no API routes for internal data
- **Relevant Existing Components:** `components/Logo.tsx` (GoOut Hyd wordmark, uses `font-heading`), `components/ui/button.tsx` (already installed), `components/ui/sheet.tsx` (already installed)

### Current State
- `app/(public)/layout.tsx` — minimal shell, no Navbar or Footer, just a `<div>` wrapping `<main>`
- `app/(public)/page.tsx` — bare placeholder `<h1>GoOut Hyd</h1>` + "Coming soon"
- `lib/` — has `auth.ts`, `env.ts`, `metadata.ts`, `utils.ts`, `app-utils.ts`, supabase clients, drizzle db. **No `constants/` or `queries/` directories exist yet.**
- `components/` — `Logo.tsx` exists, all needed shadcn primitives installed (button, sheet, badge, card, etc.)
- Database schema (Phase 1A complete): `cafes`, `cafe_images`, `menu_items`, `events`, `cafe_leads` tables with seed data

### Existing Context Providers Analysis
- No context providers exist (GoOut Hyd is Phase 1 public-only, no auth/user context needed)
- All data flows through Server Components via direct Drizzle queries or lib query functions

---

## 4. Context & Problem Definition

### Problem Statement
Phase 1B is about foundations. Without area constants, every component that needs to display or filter by area would duplicate slug↔name conversion logic. Without query functions, every page would write raw Drizzle queries inline. Without the Navbar and Footer in the layout, none of the feature pages will have consistent branding or navigation.

### Success Criteria
- [ ] `lib/constants/areas.ts` created with `AREAS`, `AREA_SLUGS`, `AREA_NAMES`, `getAreaNameFromSlug()`, `getAreaSlugFromName()`
- [ ] `lib/queries/cafes.ts` created with `getAllCafes()`, `getCafeBySlug()`, `getFeaturedCafes()`
- [ ] `lib/queries/events.ts` created with `getUpcomingEvents()`, `getEventBySlug()`, `getEventsByCafe()`, `getUpcomingEventsForLanding()`
- [ ] `components/layout/Navbar.tsx` renders on landing page (desktop + mobile)
- [ ] `components/layout/Footer.tsx` renders on landing page
- [ ] `app/(public)/layout.tsx` updated to include Navbar + Footer
- [ ] `app/(public)/page.tsx` updated with GoOut Hyd placeholder heading
- [ ] `npm run type-check` passes clean

---

## 5. Development Mode Context

- **🚨 This is a new application in active development**
- **No backwards compatibility concerns** — free to make breaking changes
- **Priority: Speed and correctness** over over-engineering
- **Aggressive refactoring allowed**

---

## 6. Technical Requirements

### Functional Requirements
- Area constants serve as the single source of truth for area slug↔name conversion
- Query functions use Drizzle ORM (no raw SQL for basic operations)
- Navbar renders: wordmark left, "Made With Love in Hyderabad" center, "Partner with Us" CTA button right (→ `/partner`)
- Navbar handles mobile via Sheet slide-out with all nav links
- Footer renders: GoOut Hyd + tagline left, quick links center, Instagram right
- Active link highlighting in Navbar based on current pathname
- Every public page wrapped in Navbar + Footer via `app/(public)/layout.tsx`

### Non-Functional Requirements
- **Responsive Design:** Mobile-first. Navbar hamburger on mobile, full nav on desktop
- **Theme Support:** Light-only mode. Espresso background (`bg-espresso`), cream text (`text-cream`), caramel hover/CTA
- **Accessibility:** Semantic nav/footer HTML, aria labels on icon-only buttons
- **Performance:** Navbar/Footer are static — no data fetching needed

### Technical Constraints
- Light-only mode — no `dark:` classes
- No auth in Phase 1 — no login/profile links
- Area data lives in `lib/constants/areas.ts` only — no `lib/queries/areas.ts`
- Use `inArray`, `eq`, `gt`, `asc`, `desc` from `drizzle-orm` — never raw `sql\`\`` for basic ops
- `lib/queries/cafes.ts` and `lib/queries/events.ts` are server-only files (import from `@/lib/drizzle/db`)

---

## 7. Data & Database Changes

No database schema changes in this phase. Tables are already migrated and seeded from Phase 1A.

---

## 8. API & Backend Changes

### Data Access Pattern
- Query functions in `lib/queries/cafes.ts` and `lib/queries/events.ts` — complex queries with JOINs, reused by multiple pages
- No Server Actions needed (read-only queries)
- No API routes

### Database Queries
- [ ] **`lib/queries/cafes.ts`** — `getAllCafes(areaSlug?)`, `getCafeBySlug(slug)`, `getFeaturedCafes(limit)`
- [ ] **`lib/queries/events.ts`** — `getUpcomingEvents(category?)`, `getEventBySlug(slug)`, `getEventsByCafe(cafeId)`, `getUpcomingEventsForLanding(limit)`

---

## 9. Frontend Changes

### New Components
- [ ] **`components/layout/Navbar.tsx`** — Full Navbar (desktop + mobile). "use client" for `usePathname()` active link detection. Props: none (reads pathname from hook).
- [ ] **`components/layout/Footer.tsx`** — Three-column footer. Server Component (no interactivity).

### Page Updates
- [ ] **`app/(public)/layout.tsx`** — Add `<Navbar />` + `<Footer />`, cream background on main
- [ ] **`app/(public)/page.tsx`** — Replace bare placeholder with styled "GoOut Hyd — Coming Soon" heading using brand typography

### State Management
- Navbar uses `usePathname()` from `next/navigation` for active link state (client component)
- All other components are Server Components — no state needed

---

## 10. Code Changes Overview

### 📂 Current Implementation (Before)

**`app/(public)/layout.tsx`** — no Navbar or Footer:
```tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">{children}</main>
    </div>
  );
}
```

**`app/(public)/page.tsx`** — bare placeholder:
```tsx
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">GoOut Hyd</h1>
        <p className="mt-4 text-lg text-gray-500">Coming soon</p>
      </div>
    </div>
  );
}
```

**`lib/`** — no `constants/` or `queries/` directories.

### 📂 After Implementation

**`app/(public)/layout.tsx`** — with Navbar + Footer:
```tsx
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-cream">{children}</main>
      <Footer />
    </div>
  );
}
```

**`lib/constants/areas.ts`** — new file:
```ts
export const AREAS = [
  { slug: "banjara-hills", name: "Banjara Hills" },
  { slug: "jubilee-hills", name: "Jubilee Hills" },
  { slug: "kondapur", name: "Kondapur" },
  { slug: "gachibowli", name: "Gachibowli" },
  { slug: "madhapur", name: "Madhapur" },
] as const;

export const AREA_SLUGS = AREAS.map((a) => a.slug);
export const AREA_NAMES = AREAS.map((a) => a.name);

export function getAreaNameFromSlug(slug: string): string | undefined {
  return AREAS.find((a) => a.slug === slug)?.name;
}

export function getAreaSlugFromName(name: string): string | undefined {
  return AREAS.find((a) => a.name === name)?.slug;
}
```

### 🎯 Key Changes Summary
- [ ] **New:** `lib/constants/areas.ts` — bidirectional area slug↔name mapping
- [ ] **New:** `lib/queries/cafes.ts` — 3 reusable Drizzle query functions
- [ ] **New:** `lib/queries/events.ts` — 4 reusable Drizzle query functions
- [ ] **New:** `components/layout/Navbar.tsx` — branded navigation with mobile Sheet
- [ ] **New:** `components/layout/Footer.tsx` — three-column footer
- [ ] **Modified:** `app/(public)/layout.tsx` — add Navbar + Footer + cream background
- [ ] **Modified:** `app/(public)/page.tsx` — styled placeholder heading
- **Impact:** Every public page now renders inside the GoOut Hyd shell. All query primitives ready for Phase 1C feature pages.

---

## 11. Implementation Plan

### Phase 1: Area Constants
**Goal:** Create the single source of truth for area data

- [ ] **Task 1.1:** Create `apps/web/lib/constants/areas.ts`
  - Files: `lib/constants/areas.ts` (new)
  - Details: `AREAS` array, `AREA_SLUGS`, `AREA_NAMES`, `getAreaNameFromSlug()`, `getAreaSlugFromName()` — all typed, no `any`

### Phase 2: Query Layer
**Goal:** Create reusable Drizzle query functions for cafes and events

- [ ] **Task 2.1:** Create `apps/web/lib/queries/cafes.ts`
  - Files: `lib/queries/cafes.ts` (new)
  - Details: Import `db` from `@/lib/drizzle/db`, import schema types. Implement `getAllCafes(areaSlug?)` with optional area filter (convert slug→name via constants before querying), `getCafeBySlug(slug)` with left-joined `cafe_images` + `menu_items` + upcoming `events`, `getFeaturedCafes(limit = 6)`. Use `eq`, `and`, `gt`, `asc`, `desc` from drizzle-orm — no raw SQL.
- [ ] **Task 2.2:** Create `apps/web/lib/queries/events.ts`
  - Files: `lib/queries/events.ts` (new)
  - Details: `getUpcomingEvents(category?)` with cafe name/slug/area joined via leftJoin, optional `event_type` filter. `getEventBySlug(slug)` with full cafe join. `getEventsByCafe(cafeId)` for upcoming events. `getUpcomingEventsForLanding(limit = 4)` for landing page preview.

### Phase 3: Shared Layout Components
**Goal:** Build Navbar + Footer and wire them into the public layout

- [ ] **Task 3.1:** Create `apps/web/components/layout/Navbar.tsx`
  - Files: `components/layout/Navbar.tsx` (new)
  - Details: `"use client"` directive. Desktop layout: `<Logo />` (links to `/`) left, "Made with love in Hyderabad" text center, "Partner with Us" `<Button>` (caramel, links to `/partner`) right. Mobile: `<Logo />` left, `<Sheet>` hamburger right with all nav links + CTA inside. Espresso background (`bg-espresso`), cream text (`text-cream`). Active link: compare `usePathname()` to link href, apply caramel color on match.
- [ ] **Task 3.2:** Create `apps/web/components/layout/Footer.tsx`
  - Files: `components/layout/Footer.tsx` (new)
  - Details: Server Component. Three-column grid (stacks on mobile). Left: `<Logo />` + "Built for Hyderabadis". Center: Quick links — Cafes (`/cafes`), Events (`/events`), Partner (`/partner`). Right: Instagram placeholder icon link + copyright. Espresso background, cream text.
- [ ] **Task 3.3:** Update `apps/web/app/(public)/layout.tsx`
  - Files: `app/(public)/layout.tsx`
  - Details: Import and render `<Navbar />` above `<main>` and `<Footer />` below. Add `bg-cream` to `<main>`.
- [ ] **Task 3.4:** Update `apps/web/app/(public)/page.tsx`
  - Files: `app/(public)/page.tsx`
  - Details: Replace bare placeholder with a styled "GoOut Hyd — Coming Soon" section using `font-heading` for the h1 and brand palette. This confirms the layout renders correctly end-to-end.

### Phase 4: Basic Code Validation
**Goal:** Static analysis only

- [ ] **Task 4.1:** Run `npm run lint` from `apps/web`
- [ ] **Task 4.2:** Run `npm run type-check` from `apps/web`
- [ ] **Task 4.3:** Read all new files to verify logic, imports, and no server/client boundary violations in query files

### Phase 5: Comprehensive Code Review (Mandatory)

- [ ] **Task 5.1:** Present "Implementation Complete!" message — stop and wait for user approval
- [ ] **Task 5.2:** Execute comprehensive code review if approved

### Phase 6: User Browser Testing

- [ ] **Task 6.1:** 👤 USER TESTING — Confirm Navbar and Footer render on landing page at `localhost:3000`
- [ ] **Task 6.2:** 👤 USER TESTING — Confirm mobile hamburger opens Sheet slide-out
- [ ] **Task 6.3:** 👤 USER TESTING — Confirm "Partner with Us" button visible and links to `/partner`

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Phase 1: Area Constants
- [x] **Task 1.1:** Create `lib/constants/areas.ts` ✓ 2026-03-24
  - Files: `apps/web/lib/constants/areas.ts` ✓
  - Details: AREAS const, AreaSlug/AreaName types, AREA_SLUGS, AREA_NAMES, getAreaNameFromSlug(), getAreaSlugFromName() — no linter errors ✓

### Phase 2: Query Layer
- [x] **Task 2.1:** Create `lib/queries/cafes.ts` ✓ 2026-03-24
  - Files: `apps/web/lib/queries/cafes.ts` ✓
  - Details: getAllCafes(areaSlug?), getFeaturedCafes(limit), getCafeBySlug(slug) with parallel Promise.all for images/menuItems/upcomingEvents. CafeWithDetails type exported. No linter errors ✓
- [x] **Task 2.2:** Create `lib/queries/events.ts` ✓ 2026-03-24
  - Files: `apps/web/lib/queries/events.ts` ✓
  - Details: getUpcomingEvents(category?), getUpcomingEventsForLanding(limit), getEventBySlug(slug), getEventsByCafe(cafeId). EventWithCafe and EventWithFullCafe types exported. leftJoin with cafes table. No linter errors ✓

### Phase 3: Shared Layout Components
- [x] **Task 3.1:** Create `components/layout/Navbar.tsx` ✓ 2026-03-24
  - Files: `apps/web/components/layout/Navbar.tsx` ✓
  - Details: "use client", usePathname() active link, desktop nav + CTA, mobile Sheet with all links, espresso bg, cream text, caramel active/CTA ✓
- [x] **Task 3.2:** Create `components/layout/Footer.tsx` ✓ 2026-03-24
  - Files: `apps/web/components/layout/Footer.tsx` ✓
  - Details: Server Component, three-column grid (stacks mobile), Logo + "Built for Hyderabadis" left, quick links center, Instagram right, espresso bg ✓
- [x] **Task 3.3:** Update `app/(public)/layout.tsx` ✓ 2026-03-24
  - Files: `apps/web/app/(public)/layout.tsx` ✓
  - Details: Navbar above main, Footer below, bg-cream on main ✓
- [x] **Task 3.4:** Update `app/(public)/page.tsx` ✓ 2026-03-24
  - Files: `apps/web/app/(public)/page.tsx` ✓
  - Details: Styled placeholder with font-heading h1, brand palette, escaped apostrophe ✓

### Phase 4: Basic Code Validation
- [x] **Task 4.1:** `npm run lint` ✓ 2026-03-24 — exit code 0, no errors ✓
- [x] **Task 4.2:** `npm run type-check` ✓ 2026-03-24 — exit code 0, no type errors ✓
- [x] **Task 4.3:** File content review ✓ 2026-03-24 — all new files verified, no server/client boundary violations ✓

---

## 13. File Structure & Organization

### New Files to Create
```
apps/web/
├── lib/
│   ├── constants/
│   │   └── areas.ts                    # Area slug↔name mapping (client-safe)
│   └── queries/
│       ├── cafes.ts                    # Cafe query functions (server-only)
│       └── events.ts                   # Event query functions (server-only)
└── components/
    └── layout/
        ├── Navbar.tsx                  # Top navigation (client component)
        └── Footer.tsx                  # Bottom footer (server component)
```

### Files to Modify
- [ ] **`apps/web/app/(public)/layout.tsx`** — Add Navbar + Footer + cream bg on main
- [ ] **`apps/web/app/(public)/page.tsx`** — Styled placeholder heading

### Server/Client Boundary Notes
- `lib/constants/areas.ts` — **client-safe** (pure data, no server imports). Safe to import from both Server and Client components.
- `lib/queries/cafes.ts` — **server-only** (imports `@/lib/drizzle/db`). Only import in Server Components or server-side functions.
- `lib/queries/events.ts` — **server-only** (imports `@/lib/drizzle/db`). Only import in Server Components or server-side functions.
- `components/layout/Navbar.tsx` — **client component** (`"use client"` for `usePathname()`). Must NOT import from server-only libs.
- `components/layout/Footer.tsx` — **server component** (no `"use client"`). Can import from either.

### Dependencies
No new npm packages needed. `sheet`, `button` already installed. `lucide-react` already installed.

---

## 14. Potential Issues & Security Review

### Error Scenarios
- [ ] **`getAreaNameFromSlug` returns `undefined` for unknown slug** — query functions must handle gracefully (return empty array, not throw)
- [ ] **`getCafeBySlug` returns no rows** — caller (page component) must handle null/undefined and show 404

### Edge Cases
- [ ] **Events with `date` in the past** — query filters `date > now()` using `gt(events.date, new Date())`
- [ ] **Area slug filter with no matching cafes** — `getAllCafes("some-area")` must return `[]` not error

### Security
- No user input on this page — all data is read-only from DB seeded by Wilson
- No auth required in Phase 1

---

## 15. Deployment & Configuration

No new environment variables. No schema changes.

---

## 16. AI Agent Instructions

Follow the standard workflow from the task template. This task document is already approved — proceed to implementation options A/B/C.

---

## 17. Notes & Additional Context

### Design Decisions (from user)
- **Navbar:** GoOut Hyd wordmark left → `/`. "Made with love in Hyderabad" center (static text). "Partner with Us" caramel CTA button right → `/partner`.
- **Footer:** GoOut Hyd wordmark + "Built for Hyderabadis" tagline left. Quick links (Cafes, Events, Partner) center. Instagram icon placeholder right.
- Espresso background on both Navbar and Footer. Cream text throughout.

### Color Reference (Tailwind config from Phase 1A)
- `bg-espresso` — dark brown navbar/footer background
- `text-cream` — light text on dark backgrounds
- `text-caramel` — accent/CTA color (hover states, active links, buttons)
- `bg-cream` — light page background

### Existing Logo Component
`components/Logo.tsx` already exists with correct `font-heading text-espresso` classes. Use it in Navbar and Footer but override text color to cream since those are on espresso backgrounds (pass `className="text-cream"` prop).

---

## 18. Second-Order Consequences & Impact Analysis

**No significant risks.** This phase adds new files and updates two existing layout files:
- Area constants and query functions are additive — no existing code depends on them yet
- Updating `app/(public)/layout.tsx` will apply Navbar + Footer to ALL public pages (`/`, `/privacy`, `/terms`) — this is the desired behavior
- No database schema changes — no migration risk
- No breaking changes to any existing components

**✅ Green flag — safe to implement immediately.**

---

*Task created: 2026-03-24*
*Phase: 1B*
*Depends on: Phase 1A (complete)*
*Blocks: Phase 1C (Cafe Discovery pages)*
