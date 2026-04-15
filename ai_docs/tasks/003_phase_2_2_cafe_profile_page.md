# AI Task Template

---

## 1. Task Overview

### Task Title
**Title:** Phase 2.2 — Cafe Profile Page `/cafes/[slug]`

### Goal Statement
**Goal:** Build the full cafe profile page — each cafe's digital home and the URL Wilson shares with owners during pitches as proof of work. The page fetches a cafe by slug, renders a hero, contact bar, and conditionally shows About, Events, Menu, and Gallery sections only when data exists. No auth, no lightbox, no API routes — pure server-side rendering via the existing `getCafeBySlug()` query.

---

## 2. Strategic Analysis & Solution Options

Strategic analysis not required. The roadmap specifies the exact implementation, `getCafeBySlug()` already returns all needed data in a single call, and the user has already made all key UX decisions (no lightbox, specific section order, conditional rendering).

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.5.4 (App Router), React 19
- **Language:** TypeScript 5 strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM 0.44.6
- **UI & Styling:** shadcn/ui (Radix primitives + CVA), Tailwind CSS 3.4.1
- **Typography:** DM Serif Display (headings), DM Sans (body) via Google Fonts
- **Colors:** Espresso/caramel/cream palette, light-only mode
- **Icons:** lucide-react
- **Key Architectural Patterns:** App Router Server Components for data fetching, no API routes for internal data, `lib/queries/` for complex queries

### Current State
- **`lib/queries/cafes.ts`** already exports `getCafeBySlug(slug)` which returns `CafeWithDetails | null` — a cafe row plus `images[]`, `menuItems[]`, and `upcomingEvents[]` arrays, all pre-filtered (active-only, available menu items, upcoming events only, future-dated).
- **`app/(public)/cafes/page.tsx`** (the listing page) is built and working — establishes the pattern for async Server Components with awaited `searchParams`.
- **`components/cafes/`** has `CafeCard.tsx` and `AreaFilterPills.tsx` — reference for naming and style conventions.
- **Schema** for `cafes`, `cafeImages`, `menuItems`, and `events` is fully defined and migrated.
- **No** `[slug]` directory exists yet under `app/(public)/cafes/`.
- **No** profile-specific components exist yet in `components/cafes/`.

### Existing Context Providers Analysis
No context providers are used on public pages. All data is fetched server-side in Server Components via Drizzle queries. No context analysis needed.

---

## 4. Context & Problem Definition

### Problem Statement
Phase 2.1 (cafe listing) is complete. Customers can find cafes by area. But clicking a `CafeCard` leads to a 404 — the profile page doesn't exist yet. Wilson needs this page to share with cafe owners as proof of what the platform delivers during pitch meetings.

### Success Criteria
- [ ] `/cafes/[slug]` renders the full profile for any active cafe in the DB
- [ ] Page returns `notFound()` for unknown slugs
- [ ] Hero section shows cover image (or a neutral fallback if missing) + cafe name + area badge
- [ ] QuickContactBar renders phone, Google Maps, Instagram — each only if the field is populated
- [ ] About section only renders if `description` is non-empty
- [ ] Events section only renders if `upcomingEvents.length > 0`
- [ ] Menu section only renders if `menuItems.length > 0`
- [ ] Gallery section only renders if `images.length > 0`
- [ ] `generateMetadata` returns cafe-specific title, description, and OG image
- [ ] `loading.tsx` and `error.tsx` co-located with the page
- [ ] `npm run lint` and `npm run type-check` pass clean

---

## 5. Development Mode Context

- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** — feel free to make breaking changes
- **Data loss acceptable** — existing data can be wiped/migrated aggressively
- **Users are developers/testers** — not production users
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** — delete/recreate components as needed

---

## 6. Technical Requirements

### Functional Requirements
- User can view a cafe's full profile by visiting `/cafes/[cafe-slug]`
- System returns a 404 page for slugs that don't match any cafe in the DB
- Each contact method (phone, maps, Instagram) is only rendered when the field exists
- Menu items are grouped by category, sorted by `sort_order`, and only show `is_available = true` items
- Upcoming events show date (short format), event type badge, and ticket price (or "Free Entry")
- Gallery renders a clean responsive image grid with no click interaction

### Non-Functional Requirements
- **Responsive Design:** Works on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Light-only (no dark mode toggle per CLAUDE.md)
- **Performance:** Single `getCafeBySlug()` call with parallel sub-queries — no N+1 fetching
- **SEO:** `generateMetadata` with cafe-specific OG tags

### Technical Constraints
- Must use `getCafeBySlug()` from `lib/queries/cafes.ts` — do not duplicate query logic
- `params` must be awaited before reading `slug` (Next.js 15 requirement)
- No lightbox — PhotoGallery is a plain grid, no client-side interaction
- No API routes — all data fetching in Server Components
- No auth required — this is a public page
- No shadcn Dialog install needed (lightbox removed)

---

## 7. Data & Database Changes

No database schema changes required. All tables (`cafes`, `cafe_images`, `menu_items`, `events`) are already defined and migrated. `getCafeBySlug()` already joins all needed data.

---

## 8. API & Backend Changes

### Data Access Pattern
All data fetching uses the existing **complex query function** in `lib/queries/cafes.ts`:

```typescript
// lib/queries/cafes.ts — already exists, no changes needed
export async function getCafeBySlug(slug: string): Promise<CafeWithDetails | null>
```

- **No new query functions needed**
- **No Server Actions needed** — this page is read-only
- **No API routes** — server-side rendering only

---

## 9. Frontend Changes

### New Components

| File | Type | Purpose |
|------|------|---------|
| `app/(public)/cafes/[slug]/page.tsx` | Server Component | Main profile page — fetches data, composes sections |
| `app/(public)/cafes/[slug]/loading.tsx` | Server Component | Skeleton loading state |
| `app/(public)/cafes/[slug]/error.tsx` | Client Component | Route-level error boundary |
| `components/cafes/QuickContactBar.tsx` | Server Component | Phone, Maps, Instagram contact row |
| `components/cafes/PhotoGallery.tsx` | Server Component | Responsive image grid, no click actions |
| `components/cafes/MenuHighlights.tsx` | Server Component | Items grouped by category with prices |
| `components/cafes/CafeUpcomingEvents.tsx` | Server Component | Horizontal compact event cards |

### Section-by-Section Spec

#### Page: `app/(public)/cafes/[slug]/page.tsx`
```tsx
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CafeProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const cafe = await getCafeBySlug(slug);
  if (!cafe) notFound();

  return (
    <main>
      {/* 1. Hero — always renders */}
      {/* 2. QuickContactBar — always renders */}
      {/* 3. About — conditional on cafe.description */}
      {cafe.description && <AboutSection description={cafe.description} />}
      {/* 4. Events — conditional on upcomingEvents.length */}
      {cafe.upcomingEvents.length > 0 && <CafeUpcomingEvents events={cafe.upcomingEvents} />}
      {/* 5. Menu — conditional on menuItems.length */}
      {cafe.menuItems.length > 0 && <MenuHighlights items={cafe.menuItems} />}
      {/* 6. Gallery — conditional on images.length */}
      {cafe.images.length > 0 && <PhotoGallery images={cafe.images} />}
    </main>
  );
}
```

#### Hero Section (inline in page, no separate component needed)
- Full-width Next.js `Image` with gradient overlay: `bg-gradient-to-t from-espresso/80 to-transparent`
- Cafe name in DM Serif Display, cream text, large (text-4xl md:text-5xl)
- Area tag badge below name: transparent bg, border, roast text, rounded-full, text-sm
- If `coverImage` is null/empty: render a solid espresso-colored div as fallback (no broken image)

#### `components/cafes/QuickContactBar.tsx` (Server Component)
- Foam card (`bg-foam`), warm border, padding, always visible below hero
- Three contact items rendered conditionally:
  - Phone: `Phone` icon + number as `<a href="tel:+91...">` — only if `cafe.phone`
  - Maps: `MapPin` icon + "Directions" as `<a href={googleMapsUrl} target="_blank">` — only if `cafe.googleMapsUrl`
  - Instagram: `Instagram` icon + `@handle` as external link — only if `cafe.instagramHandle`
- Full address text below icons — only if `cafe.address`
- If none of phone/maps/instagram/address exist, render nothing (return null)

#### `components/cafes/PhotoGallery.tsx` (Server Component)
- Props: `images: CafeImage[]`
- Section heading: "Gallery" (DM Serif Display)
- Grid: `grid grid-cols-2 md:grid-cols-3 gap-3`
- Each image: Next.js `Image`, `aspect-square`, `object-cover`, `rounded-lg`, with `alt={image.altText ?? cafe.name}`
- No click handlers, no lightbox, no `"use client"` directive

#### `components/cafes/MenuHighlights.tsx` (Server Component)
- Props: `items: MenuItem[]`
- Section heading: "Menu Highlights" (DM Serif Display)
- Group items by `category` using `Object.groupBy` or reduce
- Each category: subheading (DM Sans 500, uppercase, tracking-wide, text-sm, roast text)
- Each item row: name left-aligned + `₹{price}` right-aligned in same flex row
- Optional description below name: text-sm, roast text
- Items already sorted by category + sort_order from `getCafeBySlug()`

#### `components/cafes/CafeUpcomingEvents.tsx` (Server Component)
- Props: `events: Event[]`
- Section heading: "Upcoming Events" (DM Serif Display)
- Horizontally scrollable row on mobile (`flex gap-4 overflow-x-auto pb-2`)
- Each event card: compact, min-width ~180px, foam bg, warm border, rounded-xl, padding
  - Event title (DM Sans 500, line-clamp-1)
  - Date: formatted as "Mar 28" using `Intl.DateTimeFormat`
  - Event type badge: rounded-full, caramel bg, small text, uppercase
  - Ticket price: `₹{ticketPrice}` or "Free Entry" if `ticketPrice` is null/0
  - Entire card wrapped in Next.js `Link` to `/events/{event.slug}`

#### `app/(public)/cafes/[slug]/loading.tsx`
- Skeleton matching page layout: hero skeleton, contact bar skeleton, 3-column card skeletons
- Use `bg-warm/50 animate-pulse rounded` blocks, matching section proportions

#### `app/(public)/cafes/[slug]/error.tsx`
- `"use client"` directive required
- Props: `{ error: Error; reset: () => void }`
- Simple centered card with error message + "Try again" button (shadcn Button, secondary)

### `generateMetadata`
```typescript
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cafe = await getCafeBySlug(slug);
  if (!cafe) return { title: "Cafe Not Found | GoOut Hyd" };
  return {
    title: `${cafe.name} — ${cafe.area} | GoOut Hyd`,
    description: cafe.description?.slice(0, 160) ?? `Visit ${cafe.name} in ${cafe.area}, Hyderabad`,
    openGraph: {
      images: cafe.coverImage ? [{ url: cafe.coverImage }] : [],
    },
  };
}
```

### Color Token Reference (from Tailwind config)
- `bg-espresso` / `text-espresso` — dark brown, main brand color
- `bg-caramel` / `text-caramel` — warm amber, accents
- `bg-foam` / `text-foam` — off-white, card backgrounds
- `bg-cream` / `text-cream` — warm white, page backgrounds
- `text-roast` — muted brown for secondary text
- `border-warm` — warm-toned border color

---

## 10. Code Changes Overview

### New Files Only — No Existing Files Modified

This task creates new files only. No existing files are modified.

#### 📂 New Files
```
apps/web/
├── app/(public)/cafes/[slug]/
│   ├── page.tsx          # Main profile page (~120 lines)
│   ├── loading.tsx       # Skeleton loading state (~40 lines)
│   └── error.tsx         # Error boundary (~25 lines)
└── components/cafes/
    ├── QuickContactBar.tsx    # Contact row (~70 lines)
    ├── PhotoGallery.tsx       # Image grid (~40 lines)
    ├── MenuHighlights.tsx     # Menu by category (~60 lines)
    └── CafeUpcomingEvents.tsx # Event cards (~70 lines)
```

#### 🎯 Key Points
- `getCafeBySlug()` already exists — zero query changes needed
- All new components are Server Components except `error.tsx` (requires `"use client"`)
- Gallery has no click behavior — no client-side state anywhere in the gallery
- `notFound()` imported from `next/navigation` handles missing slugs

---

## 11. Implementation Plan

### Phase 1: Page Route + Route Files
**Goal:** Create the `[slug]` route directory with page, loading, and error files

- [ ] **Task 1.1:** Create `app/(public)/cafes/[slug]/page.tsx`
  - Files: `apps/web/app/(public)/cafes/[slug]/page.tsx`
  - Details: Async Server Component, await params, call `getCafeBySlug()`, return `notFound()` if null, compose sections with conditional rendering, add `generateMetadata`
- [ ] **Task 1.2:** Create `app/(public)/cafes/[slug]/loading.tsx`
  - Files: `apps/web/app/(public)/cafes/[slug]/loading.tsx`
  - Details: Skeleton matching hero + contact + card sections using animate-pulse
- [ ] **Task 1.3:** Create `app/(public)/cafes/[slug]/error.tsx`
  - Files: `apps/web/app/(public)/cafes/[slug]/error.tsx`
  - Details: `"use client"`, error + reset props, centered card with "Try again" button

### Phase 2: Profile Section Components
**Goal:** Build all cafe profile section components

- [ ] **Task 2.1:** Create `components/cafes/QuickContactBar.tsx`
  - Files: `apps/web/components/cafes/QuickContactBar.tsx`
  - Details: Foam card, lucide Phone/MapPin/Instagram icons, each contact item conditional on data, return null if no contact data at all
- [ ] **Task 2.2:** Create `components/cafes/PhotoGallery.tsx`
  - Files: `apps/web/components/cafes/PhotoGallery.tsx`
  - Details: Server Component, grid grid-cols-2 md:grid-cols-3, Next.js Image with aspect-square + object-cover, no click actions
- [ ] **Task 2.3:** Create `components/cafes/MenuHighlights.tsx`
  - Files: `apps/web/components/cafes/MenuHighlights.tsx`
  - Details: Server Component, group items by category, flex row with name + ₹price, optional description text
- [ ] **Task 2.4:** Create `components/cafes/CafeUpcomingEvents.tsx`
  - Files: `apps/web/components/cafes/CafeUpcomingEvents.tsx`
  - Details: Server Component, horizontal scroll container, compact event cards with date/type/price, Link to /events/[slug]

### Phase 3: Validation
**Goal:** Confirm code quality passes static analysis

- [ ] **Task 3.1:** Run linting
  - Command: `npm run lint` (from `apps/web/`)
  - Details: Fix any lint errors in newly created files
- [ ] **Task 3.2:** Run type checking
  - Command: `npm run type-check` (from `apps/web/`)
  - Details: Fix any TypeScript errors

### Phase 4: Comprehensive Code Review (Mandatory)
- [x] **Task 4.1:** Present "Implementation Complete!" message and request review approval ✓ 2026-03-31
- [x] **Task 4.2:** Execute comprehensive code review ✓ 2026-03-31
  - All 7 files read and verified against success criteria
  - All success criteria met, lint + type-check clean, no issues found

---

## 12. Task Completion Tracking

### Phase 1: Page Route + Route Files
- [x] **Task 1.1:** Create `app/(public)/cafes/[slug]/page.tsx` ✓ 2026-03-31
  - Full page: awaited params, notFound guard, generateMetadata, hero, conditional sections
- [x] **Task 1.2:** Create `app/(public)/cafes/[slug]/loading.tsx` ✓ 2026-03-31
  - Skeleton matching hero + contact bar + about/events/menu/gallery sections
- [x] **Task 1.3:** Create `app/(public)/cafes/[slug]/error.tsx` ✓ 2026-03-31
  - "use client", AlertCircle icon, "Try again" Button

### Phase 2: Profile Section Components
- [x] **Task 2.1:** Create `QuickContactBar.tsx` ✓ 2026-03-31
  - Cafe prop, conditional phone/maps/instagram/address, returns null if all empty
- [x] **Task 2.2:** Create `PhotoGallery.tsx` ✓ 2026-03-31
  - Server Component, grid-cols-2/3, aspect-square Image, no interaction
- [x] **Task 2.3:** Create `MenuHighlights.tsx` ✓ 2026-03-31
  - reduce grouping by category, flex name+price row, optional description
- [x] **Task 2.4:** Create `CafeUpcomingEvents.tsx` ✓ 2026-03-31
  - Horizontal scroll, event cards with date/type badge/price, Link to /events/[slug]

### Phase 3: Validation
- [x] **Task 3.1:** `npm run lint` passes ✓ 2026-03-31 — zero warnings or errors
- [x] **Task 3.2:** `npm run type-check` passes ✓ 2026-03-31 — zero type errors

### Phase 4: Code Review
- [ ] **Task 4.1:** "Implementation Complete!" presented ✓ DATE
- [ ] **Task 4.2:** Comprehensive code review executed ✓ DATE

---

## 13. File Structure & Organization

### New Files to Create
```
apps/web/
├── app/
│   └── (public)/
│       └── cafes/
│           └── [slug]/
│               ├── page.tsx          # Cafe profile page
│               ├── loading.tsx       # Loading skeleton
│               └── error.tsx         # Error boundary
└── components/
    └── cafes/
        ├── QuickContactBar.tsx       # Contact info bar
        ├── PhotoGallery.tsx          # Image grid (no lightbox)
        ├── MenuHighlights.tsx        # Menu grouped by category
        └── CafeUpcomingEvents.tsx    # Upcoming event cards
```

### Files to Modify
None — this task is purely additive.

### Dependencies to Add
None — all required packages (lucide-react, Next.js Image, shadcn Button) are already installed.

---

## 14. Potential Issues & Security Review

### Edge Cases to Consider
- [ ] **`coverImage` is null:** Hero section must handle missing image gracefully — render espresso fallback div, not a broken `<Image>`
- [ ] **`instagramHandle` has leading `@`:** Strip it before constructing the Instagram URL to avoid `@@handle`
- [ ] **`ticketPrice` is `0`:** Treat as "Free Entry", same as null — `!ticketPrice` catches both
- [ ] **Menu category grouping:** `Object.groupBy` is available in Node 22+ but may need a reduce fallback for safety — verify runtime
- [ ] **Very long cafe names:** Hero overlay text needs `line-clamp-2` to prevent overflow on small screens
- [ ] **`getCafeBySlug()` called twice (page + generateMetadata):** Next.js 15 deduplicates `fetch()` but not Drizzle calls. This is acceptable for Phase 1 — memoization can be added later if needed

### Security & Access Control Review
- [ ] **Public page, no auth:** No authorization checks needed — intentional per Phase 1 constraints
- [ ] **External links:** All `<a target="_blank">` links must include `rel="noopener noreferrer"` to prevent tab-napping
- [ ] **Phone number rendering:** Rendered as `<a href="tel:...">` only — no eval, no script injection risk
- [ ] **Image URLs from DB:** Rendered via Next.js `Image` which validates domains via `next.config.ts` — confirm Supabase storage domain is in the allowed list

---

## 15. Deployment & Configuration

No new environment variables required. No schema changes. No migrations.

**One config check:** Verify `next.config.ts` has Supabase storage hostname in `images.remotePatterns` so Next.js `Image` can serve photos from the DB. If missing, add it.

---

## 16. AI Agent Instructions

Follow the standard workflow from this template. No strategic analysis needed — proceed directly to implementation options (A/B/C) after presenting this task document.

**Implementation notes specific to this task:**
- Create the `[slug]` directory and all three route files together in Phase 1
- Build all four components in Phase 2 — they are independent and can be written in sequence
- About section is simple enough to inline directly in `page.tsx` rather than creating a separate component
- Use `Intl.DateTimeFormat` with `{ month: 'short', day: 'numeric' }` for event date formatting
- For menu category grouping, use `Array.prototype.reduce` (more compatible than `Object.groupBy`)
- `getCafeBySlug()` is a server-only function (imports from drizzle/db) — it can only be called in Server Components, which is exactly what `page.tsx` is

**👤 IMPLEMENTATION OPTIONS:**

**A) Preview High-Level Code Changes**
Show detailed code snippets and specific file content before implementing.

**B) Proceed with Implementation**
Say "Approved" or "Go ahead" to start implementing phase by phase.

**C) Provide More Feedback**
Ask questions or request adjustments to the plan.

---

## 17. Notes & Additional Context

### Design Reference
- Color tokens: `espresso`, `caramel`, `cream`, `foam`, `roast`, `warm` — all defined in `tailwind.config.ts`
- Typography: `font-serif` = DM Serif Display, `font-sans` = DM Sans
- Existing component pattern reference: `components/cafes/CafeCard.tsx`, `components/cafes/AreaFilterPills.tsx`
- Existing page pattern reference: `app/(public)/cafes/page.tsx` for async Server Component with awaited params

### What Was Explicitly Removed from Roadmap 2.2
- **PhotoLightbox.tsx** — deleted from scope by user. PhotoGallery is a plain grid only.
- **shadcn Dialog install** — not needed without lightbox.
- No other changes to 2.2 scope.

---

## 18. Second-Order Consequences & Impact Analysis

**Breaking Changes:** None — new files only, no existing files modified.

**Ripple Effects:** None — `getCafeBySlug()` is already exported and tested via the listing page seed data. No other components depend on these new files.

**Performance:** `getCafeBySlug()` makes 4 parallel DB queries (cafe + images + menu + events) via `Promise.all()`. This is efficient. The double-call from `generateMetadata` + `page.tsx` adds one extra round-trip per request — acceptable at this scale.

**Security:** Public page, no sensitive data, external links properly attributed. Image domain check is the only action item.

**No user attention required** — this is purely additive with no breaking changes or data migrations.

---

*Template Version: 1.3*
*Task Created: 2026-03-31*
