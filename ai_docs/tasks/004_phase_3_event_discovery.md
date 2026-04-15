# AI Task Document

---

## 1. Task Overview

### Task Title
**Title:** Phase 3 — Event Discovery (Events Listing & Detail Pages)

### Goal Statement
**Goal:** Build the complete event browsing experience for GoOut Hyd. After this phase, customers can discover upcoming events across Hyderabad filtered by category (Live Music, Open Mic, Workshop, Comedy Night, Gaming), view full event detail pages with venue info, and share shareable event URLs on social media. No database schema changes are needed — the `events` table already exists from Phase 1A.

---

## 2. Strategic Analysis & Solution Options

Strategic analysis is not required here. The implementation approach is clearly defined in the roadmap, the schema already exists, and there is only one logical UI pattern for event browsing (listing + detail pages using the same pattern established in Phase 2 for cafes).

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.5.4 (App Router), React 19
- **Language:** TypeScript 5, strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM 0.44.6
- **UI & Styling:** shadcn/ui (Radix primitives + CVA), Tailwind CSS 3.4.1 with GoOut Hyd design tokens
- **Typography:** DM Serif Display (headings), DM Sans (body) via Google Fonts
- **Color palette:** espresso, roast, caramel, gold, cream, milk, foam, border, input-border
- **Authentication:** Dormant in Phase 1 — middleware is a passthrough (`NextResponse.next()`)
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Server Actions for mutations. No API routes for internal data.
- **Relevant Existing Components:**
  - `components/cafes/CafeCard.tsx` — card pattern to mirror for EventCard
  - `components/cafes/AreaFilterPills.tsx` — filter pill pattern to mirror for CategoryFilterCards
  - `components/cafes/CafeUpcomingEvents.tsx` — already links to `/events/[slug]`
  - `components/layout/Navbar.tsx` and `components/layout/Footer.tsx` — shared layout shell
  - `app/(public)/layout.tsx` — wraps all public pages with Navbar + Footer
  - `lib/queries/events.ts` — `getUpcomingEvents()`, `getEventBySlug()` already written in Phase 1B

### Current State
- Phase 1A: Schema, seed data, design system all applied. `events` table exists with `event_type` enum (`live_music`, `open_mic`, `workshop`, `comedy_night`, `gaming`) and `event_status` enum (`upcoming`, `cancelled`, `completed`). Seed data includes 6 upcoming events across multiple types.
- Phase 1B: Query layer complete. `lib/queries/events.ts` has `getUpcomingEvents(category?)` and `getEventBySlug(slug)` ready to use.
- Phase 2: Cafe listing page (`/cafes`) and cafe profile page (`/cafes/[slug]`) both complete. Component patterns established.
- Phase 3 routes (`/events` and `/events/[slug]`) do not exist yet — this task creates them.

### Existing Context Providers Analysis
- No context providers in this app (public-only, no auth in Phase 1). All data flows from server-side DB queries directly into Server Components via props.

---

## 4. Context & Problem Definition

### Problem Statement
After Phase 2, customers can browse cafes but have no way to discover events happening around the city. Wilson promotes his events on Instagram and WhatsApp but needs web URLs he can share. GoOut Hyd needs an event browsing flow so customers can find upcoming events by type, see full event details with venue info, and share links.

### Success Criteria
- [ ] `/events` page renders all upcoming events in a responsive grid with category filter cards
- [ ] Filtering by category (e.g., `/events?category=live_music`) shows only matching events with updated page heading
- [ ] Empty state renders correctly when no events match a category
- [ ] `/events/[slug]` renders full event details: cover image hero, date/time, venue with cafe link, ticket price, description
- [ ] VenueSection on event detail page shows cafe mini-card with contact links and "View Full Cafe Profile" link
- [ ] `notFound()` is returned for unknown slugs
- [ ] Both pages have correct `generateMetadata` with OG image support
- [ ] `loading.tsx` and `error.tsx` exist alongside both page routes
- [ ] All pages are responsive (mobile-first, works from 320px up)
- [ ] No TypeScript errors, no lint errors

---

## 5. Development Mode Context

### Development Mode Context
- **This is a new application in active development**
- **No backwards compatibility concerns** — feel free to make breaking changes
- **Data loss acceptable** — seed data can be re-run
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** — delete/recreate components as needed

---

## 6. Technical Requirements

### Functional Requirements
- Customers can browse all upcoming events (future `start_time`, `status = upcoming`) in chronological order
- Customers can filter events by `event_type` via category filter cards; URL reflects active filter
- "All" category shows all upcoming events
- Each event card links to its detail page at `/events/[slug]`
- Event detail page shows full event info with a section linking back to the cafe's profile page
- Unknown event slugs return a 404

### Non-Functional Requirements
- **Performance:** Server Components for all data fetching — no client-side fetching
- **Security:** Public routes only, no auth required
- **Usability:** Category filter cards scrollable on mobile; all interactive elements accessible
- **Responsive Design:** Mobile-first, works on 320px+, tablet 768px+, desktop 1024px+
- **Theme Support:** Light-only mode (no dark mode toggle per project spec)
- **Compatibility:** Modern browsers

### Technical Constraints
- Must use existing `lib/queries/events.ts` query functions — do not write inline DB queries in page components for complex joins
- Must follow Next.js 15 async params pattern: `params: Promise<{ slug: string }>` and `await params`
- Must follow Next.js 15 async searchParams pattern: `searchParams: Promise<{ category?: string }>` and `await searchParams`
- No API routes — all data fetching in Server Components
- `CategoryFilterCards` must be `"use client"` (uses `useRouter`, `useSearchParams`)
- No dark mode — do not add `dark:` classes
- Use `cn()` helper for conditional Tailwind classes, never inline `style` objects

---

## 7. Data & Database Changes

### Database Schema Changes
No schema changes required. The `events` table and all enums (`event_type`, `event_status`) were created in Phase 1A.

### Data Model Updates
No new Drizzle schema files needed.

### Data Migration Plan
No migrations needed.

### Down Migration Safety Protocol
Not applicable — no database changes in this phase.

---

## 8. API & Backend Changes

### Data Access Pattern

All data fetching uses **complex query functions already defined in `lib/queries/events.ts`**:

- `getUpcomingEvents(category?: string)` → used in `/events` page
- `getEventBySlug(slug: string)` → used in `/events/[slug]` page

No Server Actions needed (no mutations in this phase). No API routes needed.

### Server Actions
None — this phase is read-only.

### Database Queries
- **`getUpcomingEvents(category?: string)`** — fetches upcoming events with cafe join, filters by event_type when category provided, ordered by start_time asc
- **`getEventBySlug(slug: string)`** — fetches single event with full cafe data joined

### API Routes
None.

### External Integrations
None.

---

## 9. Frontend Changes

### New Components

**`components/events/` directory:**

- [ ] **`CategoryFilterCards.tsx`** (`"use client"`) — horizontal scrollable category filter cards with icons. Reads `?category=` from URL and highlights active card. Clicking updates URL via `useRouter().push()`.
- [ ] **`EventCard.tsx`** — event card with cover image, date badge overlay, event name, cafe + area, event type badge, ticket price. Wrapped in `Link` to `/events/[slug]`.
- [ ] **`EventEmptyState.tsx`** — empty state message when no events match selected category. Includes "Browse All Events" link.
- [ ] **`EventInfoCard.tsx`** — structured foam card on event detail page with date/time, venue (linked to cafe profile), event type, and ticket price.
- [ ] **`VenueSection.tsx`** — milk background section on event detail page with cafe mini-card (cover image, name, area), contact row (phone, Google Maps, Instagram), and "View Full Cafe Profile" link.

**New pages:**

- [ ] **`app/(public)/events/page.tsx`** — events listing page (Server Component)
- [ ] **`app/(public)/events/loading.tsx`** — loading state for events listing
- [ ] **`app/(public)/events/error.tsx`** — error boundary for events listing
- [ ] **`app/(public)/events/[slug]/page.tsx`** — event detail page (Server Component)
- [ ] **`app/(public)/events/[slug]/loading.tsx`** — loading state for event detail
- [ ] **`app/(public)/events/[slug]/error.tsx`** — error boundary for event detail

### Component Design Specs

#### `CategoryFilterCards.tsx`
- Category options with lucide-react icons:
  - All → `LayoutGrid` icon, navigates to `/events`
  - Live Music → `Guitar` icon, navigates to `/events?category=live_music`
  - Open Mic → `Mic` icon, navigates to `/events?category=open_mic`
  - Workshop → `Palette` icon, navigates to `/events?category=workshop`
  - Comedy Night → `Laugh` icon, navigates to `/events?category=comedy_night`
  - Gaming → `Gamepad2` icon, navigates to `/events?category=gaming`
- Active card: `bg-caramel text-foam` (caramel background, foam text)
- Inactive card: `bg-foam text-espresso border border-border` with hover transition
- Container: `flex gap-3 overflow-x-auto pb-2` (horizontal scroll on mobile)
- Each card: `flex flex-col items-center gap-1 px-4 py-3 rounded-xl cursor-pointer whitespace-nowrap`

#### `EventCard.tsx`
- Cover image: Next.js `Image`, aspect-ratio 16:9, `rounded-t-xl`, `object-cover`
- Date badge overlay on image: absolute positioned, `bg-espresso/80 text-foam text-xs px-2 py-1 rounded-md` formatted as "SAT, MAR 28"
- Event name: DM Sans 500 weight
- Venue line: `"@ [Cafe Name], [Area]"` — `text-roast text-sm`
- Event type badge: `bg-caramel text-foam text-xs px-2 py-1 rounded-full`
- Ticket price: "₹299" or "Free Entry" — DM Sans 500
- Card wrapper: `Link` to `/events/[slug]`, `bg-foam border border-border rounded-xl hover:shadow-md transition-shadow`

#### `EventInfoCard.tsx`
- Foam card (`bg-foam border border-border rounded-xl p-6`)
- Each row: icon (lucide-react, `text-caramel`) + label text
- Date/time row: `Calendar` icon + "Saturday, March 28, 2026 at 7:00 PM" (formatted with `Intl.DateTimeFormat`)
- Venue row: `MapPin` icon + cafe name as `Link` to `/cafes/[cafe-slug]` + ", " + area
- Event type row: category-appropriate icon + event type label (formatted: "Live Music", "Open Mic", etc.)
- Ticket row: `Ticket` icon + "₹{price}" or "Free Entry"

**Category-to-icon mapping for EventInfoCard:**
- `live_music` → `Music` icon
- `open_mic` → `Mic` icon
- `workshop` → `Palette` icon
- `comedy_night` → `Laugh` icon
- `gaming` → `Gamepad2` icon

#### `VenueSection.tsx`
- Background: `bg-milk`
- Section heading: "Venue" (DM Serif Display)
- Mini cafe card: cafe cover image thumbnail (small, `rounded-lg`, fixed size ~80px), cafe name (`font-medium`), area (`text-roast text-sm`)
- Contact row: phone (`<a href="tel:...">` + `Phone` icon), Maps (`<a href={google_maps_url} target="_blank">` + `MapPin` icon), Instagram (`<a href="..." target="_blank">` + `Instagram` icon) — all `text-caramel hover:text-roast`
- "View Full Cafe Profile →" as `Link` to `/cafes/[cafe-slug]` — `text-caramel font-medium`

### Page Structure

#### `/events` page
```
<page heading area>
  <h1>"Events" or "[Category Label] Events"</h1>
<CategoryFilterCards /> (client component, reads searchParams.category)
<event card grid> grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6
  <EventCard /> for each event
<EventEmptyState /> when no events
```

#### `/events/[slug]` page
```
<cover image hero>
  full-width Next.js Image with gradient overlay
  event name (DM Serif Display, cream)
  event type badge
<content area> max-w-4xl mx-auto
  <EventInfoCard />
  <description section> (cream bg, DM Sans body)
<VenueSection />
```

### State Management
No global state. All data fetched server-side in Server Components and passed as props to child components. `CategoryFilterCards` manages its own active state by reading from URL params.

---

## 10. Code Changes Overview

### New Files (Before → After)

#### Before
No `/events` routes exist. The navbar links to `/events` but the page returns 404.

#### After
```
apps/web/
├── app/(public)/events/
│   ├── page.tsx          # Events listing Server Component
│   ├── loading.tsx       # Suspense fallback skeleton
│   └── error.tsx         # Error boundary
├── app/(public)/events/[slug]/
│   ├── page.tsx          # Event detail Server Component
│   ├── loading.tsx       # Suspense fallback skeleton
│   └── error.tsx         # Error boundary
└── components/events/
    ├── CategoryFilterCards.tsx   # "use client" — category filter
    ├── EventCard.tsx             # Event summary card
    ├── EventEmptyState.tsx       # Empty state
    ├── EventInfoCard.tsx         # Structured info on detail page
    └── VenueSection.tsx          # Venue info with cafe links
```

### Key Changes Summary
- [ ] **5 new components** in `components/events/` following the same patterns as `components/cafes/`
- [ ] **6 new files** across 2 route groups (`events/` and `events/[slug]/`)
- [ ] **No existing files modified** — all net-new code
- [ ] **Impact:** The `/events` and `/events/[slug]` routes become fully functional. The navbar "Events" link stops returning 404.

---

## 11. Implementation Plan

### Phase 1: Events Listing Page
**Goal:** Create the `/events` page with category filter cards and event grid

- [ ] **Task 1.1:** Create `app/(public)/events/page.tsx`
  - Files: `app/(public)/events/page.tsx`
  - Details: Async Server Component. Await `searchParams` for `category`. Call `getUpcomingEvents(category)` from `lib/queries/events.ts`. Render heading ("Events" or "[Category] Events"), `CategoryFilterCards`, event grid, and `EventEmptyState` if no results. Add `generateMetadata`.
- [ ] **Task 1.2:** Create `app/(public)/events/loading.tsx`
  - Files: `app/(public)/events/loading.tsx`
  - Details: Simple skeleton cards (3 placeholder divs with `animate-pulse`) matching the grid layout
- [ ] **Task 1.3:** Create `app/(public)/events/error.tsx`
  - Files: `app/(public)/events/error.tsx`
  - Details: `"use client"` error boundary with a friendly message and "Try Again" button calling `reset()`
- [ ] **Task 1.4:** Create `components/events/CategoryFilterCards.tsx`
  - Files: `components/events/CategoryFilterCards.tsx`
  - Details: `"use client"`. Category definitions with icons. Read active category from URL via `useSearchParams()`. Navigate on click via `useRouter().push()`. Horizontal scroll container.
- [ ] **Task 1.5:** Create `components/events/EventCard.tsx`
  - Files: `components/events/EventCard.tsx`
  - Details: Server Component (no interactivity needed). Cover image with date badge overlay. Event name, cafe/area, event type badge, ticket price. Wrapped in `Link`.
- [ ] **Task 1.6:** Create `components/events/EventEmptyState.tsx`
  - Files: `components/events/EventEmptyState.tsx`
  - Details: Message with category name interpolated. "Browse All Events" button as `Link` to `/events`.

### Phase 2: Event Detail Page
**Goal:** Create the `/events/[slug]` page with full event details and venue section

- [ ] **Task 2.1:** Create `app/(public)/events/[slug]/page.tsx`
  - Files: `app/(public)/events/[slug]/page.tsx`
  - Details: Async Server Component. Await `params` for slug. Call `getEventBySlug(slug)`. Return `notFound()` if null. Build cover hero (full-width image + gradient + event name + type badge). Render `EventInfoCard`, description section, `VenueSection`. Add `generateMetadata` with OG image from event's `cover_image`.
- [ ] **Task 2.2:** Create `app/(public)/events/[slug]/loading.tsx`
  - Files: `app/(public)/events/[slug]/loading.tsx`
  - Details: Hero skeleton + info card skeleton with `animate-pulse`
- [ ] **Task 2.3:** Create `app/(public)/events/[slug]/error.tsx`
  - Files: `app/(public)/events/[slug]/error.tsx`
  - Details: `"use client"` error boundary with friendly message and reset button
- [ ] **Task 2.4:** Create `components/events/EventInfoCard.tsx`
  - Files: `components/events/EventInfoCard.tsx`
  - Details: Foam card. Four rows with lucide icons: date/time (Calendar), venue (MapPin + Link to cafe), event type (category-appropriate icon), ticket price (Ticket). Format date with `Intl.DateTimeFormat` for "Saturday, March 28, 2026 at 7:00 PM".
- [ ] **Task 2.5:** Create `components/events/VenueSection.tsx`
  - Files: `components/events/VenueSection.tsx`
  - Details: Milk background. "Venue" heading. Mini cafe card with cover thumbnail, name, area. Contact row (phone, Maps, Instagram) with lucide icons as links. "View Full Cafe Profile →" Link.

### Phase 3: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only — NEVER run dev server, build, or application commands

- [ ] **Task 3.1:** Run linting on all new files
  - Files: All modified/created files
  - Command: `npm run lint` from `apps/web/`
  - Details: Static ESLint analysis only
- [ ] **Task 3.2:** Run TypeScript type checking
  - Files: All new TypeScript files
  - Command: `npm run type-check` from `apps/web/`
  - Details: `tsc --noEmit` — no compilation, just type validation
- [ ] **Task 3.3:** Static logic review
  - Details: Read all new files to verify: async params pattern, correct import paths, no server/client boundary violations, proper `notFound()` usage, correct `generateMetadata` signatures

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 3, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16 of the template)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 4: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 4.1:** Present "Implementation Complete!" message (MANDATORY)
  - Details: STOP here and wait for user code review approval
- [ ] **Task 4.2:** Execute Comprehensive Code Review (If Approved)
  - Details: Read all new files, verify requirements, check integration with existing query layer and layout, provide detailed summary

### Phase 5: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [ ] **Task 5.1:** Present AI testing results
- [ ] **Task 5.2:** Request user browser testing with specific checklist
- [ ] **Task 5.3:** Wait for user confirmation

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

🚨 Update this section in real-time as tasks are completed.

### Phase 1: Events Listing Page

- [x] **Task 1.1:** Create `app/(public)/events/page.tsx` ✓ 2026-04-12
  - Files: `app/(public)/events/page.tsx` ✓
  - Details: Async Server Component with `generateMetadata`, Suspense-wrapped `CategoryFilterCards`, event grid, `EventEmptyState` fallback ✓
- [x] **Task 1.2:** Create `app/(public)/events/loading.tsx` ✓ 2026-04-12
  - Files: `app/(public)/events/loading.tsx` ✓
  - Details: Skeleton for header, category filter cards, and 6-card grid ✓
- [x] **Task 1.3:** Create `app/(public)/events/error.tsx` ✓ 2026-04-12
  - Files: `app/(public)/events/error.tsx` ✓
  - Details: `"use client"` error boundary with reset button ✓
- [x] **Task 1.4:** Create `components/events/CategoryFilterCards.tsx` ✓ 2026-04-12
  - Files: `components/events/CategoryFilterCards.tsx` ✓
  - Details: `"use client"`, 6 category cards with lucide-react icons, horizontal scroll, URL-based active state ✓
- [x] **Task 1.5:** Create `components/events/EventCard.tsx` ✓ 2026-04-12
  - Files: `components/events/EventCard.tsx` ✓
  - Details: Cover image with date badge overlay (IST timezone), event type badge, ticket/free label, gradient fallback ✓
- [x] **Task 1.6:** Create `components/events/EventEmptyState.tsx` ✓ 2026-04-12
  - Files: `components/events/EventEmptyState.tsx` ✓
  - Details: Category-aware message, "Browse All Events" link when filtered ✓
- [x] **Bonus: `lib/constants/events.ts`** ✓ 2026-04-12
  - Files: `lib/constants/events.ts` ✓
  - Details: `EVENT_TYPE_LABELS`, `VALID_EVENT_TYPES`, `isValidEventType()`, `getEventTypeLabel()` — shared by both pages and components ✓

### Phase 2: Event Detail Page

- [x] **Task 2.1:** Create `app/(public)/events/[slug]/page.tsx` ✓ 2026-04-12
  - Files: `app/(public)/events/[slug]/page.tsx` ✓
  - Details: Hero with gradient overlay + event type badge, 2-column grid (EventInfoCard + description), VenueSection full-width. `generateMetadata` with OG image. `notFound()` guard. ✓
- [x] **Task 2.2:** Create `app/(public)/events/[slug]/loading.tsx` ✓ 2026-04-12
  - Files: `app/(public)/events/[slug]/loading.tsx` ✓
  - Details: Hero skeleton, info card rows skeleton, description skeleton, venue section skeleton with mini-card ✓
- [x] **Task 2.3:** Create `app/(public)/events/[slug]/error.tsx` ✓ 2026-04-12
  - Files: `app/(public)/events/[slug]/error.tsx` ✓
  - Details: `"use client"` error boundary, "Try again" + "Browse all events" buttons ✓
- [x] **Task 2.4:** Create `components/events/EventInfoCard.tsx` ✓ 2026-04-12
  - Files: `components/events/EventInfoCard.tsx` ✓
  - Details: Foam card, 4 rows: Calendar (IST date/time), MapPin (cafe name as Link + area), category icon (Music/Mic/Palette/Laugh/Gamepad2), Ticket (₹X or Free Entry) ✓
- [x] **Task 2.5:** Create `components/events/VenueSection.tsx` ✓ 2026-04-12
  - Files: `components/events/VenueSection.tsx` ✓
  - Details: Milk bg section, "Venue" heading, mini cafe card (80px thumbnail + name + area), contact row (phone/Maps/Instagram), "View Full Cafe Profile →" link ✓

### Phase 3: Code Validation

- [x] **Task 3.1:** Run `npm run lint` ✓ 2026-04-12
  - Result: 0 errors, 0 warnings across all 7 new files ✓
- [x] **Task 3.2:** Run `npm run type-check` ✓ 2026-04-12
  - Result: `tsc --noEmit` exit code 0 — no type errors ✓
- [x] **Task 3.3:** Static logic review ✓ 2026-04-12
  - Async params pattern correct (`await searchParams`, `await params`) ✓
  - Suspense wrapping `CategoryFilterCards` (uses `useSearchParams`) ✓
  - `isValidEventType()` guard prevents bad category values reaching DB ✓
  - `null` ticket price → "Free Entry", `null` cover_image → gradient fallback ✓
  - IST timezone (`Asia/Kolkata`) used in `formatDateBadge` ✓

---

## 13. File Structure & Organization

### New Files to Create
```
apps/web/
├── app/(public)/events/
│   ├── page.tsx                    # Events listing page (Server Component)
│   ├── loading.tsx                 # Loading skeleton for listing
│   └── error.tsx                   # Error boundary for listing ("use client")
├── app/(public)/events/[slug]/
│   ├── page.tsx                    # Event detail page (Server Component)
│   ├── loading.tsx                 # Loading skeleton for detail
│   └── error.tsx                   # Error boundary for detail ("use client")
└── components/events/
    ├── CategoryFilterCards.tsx     # "use client" — category filter cards
    ├── EventCard.tsx               # Event summary card
    ├── EventEmptyState.tsx         # Empty state when no events match
    ├── EventInfoCard.tsx           # Structured info card (detail page)
    └── VenueSection.tsx            # Venue info section (detail page)
```

### Files to Modify
None — all changes are net-new files.

### Files Already Existing (Used, Not Modified)
- `lib/queries/events.ts` — `getUpcomingEvents()` and `getEventBySlug()` (Phase 1B)
- `app/(public)/layout.tsx` — wraps all public pages automatically
- `components/layout/Navbar.tsx` — already has "Events" link to `/events`

### Dependencies to Add
None — all required packages (lucide-react, next/image, next/link, shadcn/ui) already installed.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Event slug not found:** `getEventBySlug()` returns null → must call `notFound()` to render 404, not crash
  - **Code Review Focus:** `app/(public)/events/[slug]/page.tsx` null check before accessing event fields
  - **Potential Fix:** `if (!event) notFound();` immediately after query
- [ ] **No upcoming events for a category:** `getUpcomingEvents()` returns empty array → `EventEmptyState` must render
  - **Code Review Focus:** Conditional rendering in events listing page
- [ ] **Missing `cover_image` on event:** Some events may have null `cover_image`
  - **Code Review Focus:** `EventCard` and hero section in detail page
  - **Potential Fix:** Fallback to a placeholder gradient when `cover_image` is null
- [ ] **Missing `ticket_price` (null = free):** Ticket price is nullable — null means free
  - **Code Review Focus:** All places rendering ticket price — must show "Free Entry" not "₹null"

### Edge Cases to Consider
- [ ] **`searchParams.category` is an invalid enum value:** User manually types `?category=foobar`
  - **Analysis Approach:** Check what `getUpcomingEvents()` does with an invalid category — should return empty array, not error
  - **Recommendation:** Pass category through as-is; DB query returns empty results naturally. `EventEmptyState` handles it.
- [ ] **Event `start_time` formatting:** Dates must be formatted in IST (UTC+5:30), not UTC
  - **Recommendation:** Use `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'` everywhere dates are displayed
- [ ] **`CategoryFilterCards` hydration:** `useSearchParams()` requires `Suspense` boundary
  - **Recommendation:** Wrap `CategoryFilterCards` in a `<Suspense>` in the events page to avoid hydration errors

### Security & Access Control Review
- [ ] **Public routes only:** No auth checks needed — all event data is public
- [ ] **No user input in event pages:** Read-only pages, no forms, no XSS risk
- [ ] **External links:** Google Maps, Instagram links use `target="_blank" rel="noopener noreferrer"` to prevent tab hijacking

---

## 15. Deployment & Configuration

### Environment Variables
No new environment variables required.

---

## 16. AI Agent Instructions

Follow the standard workflow from the task template exactly:
1. Evaluate strategic need (already done — straightforward implementation)
2. Present implementation options A/B/C to user
3. Wait for explicit choice before coding

### Important Implementation Notes

- **`useSearchParams()` requires Suspense:** Wrap `<CategoryFilterCards />` in `<Suspense fallback={...}>` in the events listing page. This is a Next.js 15 requirement.
- **Date formatting:** Always use `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'` for date display. Events in Hyderabad.
- **Category label mapping:** Map `event_type` enum values to human-readable labels:
  - `live_music` → "Live Music"
  - `open_mic` → "Open Mic"
  - `workshop` → "Workshop"
  - `comedy_night` → "Comedy Night"
  - `gaming` → "Gaming"
- **Page heading when filtered:** Use the human-readable category label, not the raw enum. E.g., "Live Music Events" not "live_music Events"
- **Ticket price display:** `ticket_price` is stored in paise (integer) or as INR integer. If `ticket_price` is null → "Free Entry". If it's a number → `₹{ticket_price}`. Check existing seed data to confirm the unit.
- **Image fallback:** Use a caramel/espresso gradient placeholder when `cover_image` is null, rather than crashing or showing broken images.
- **No dark mode classes** — project spec says light-only mode.

---

## 17. Notes & Additional Context

### Reference (Existing Phase 2 Patterns to Follow)
- `components/cafes/CafeCard.tsx` — mirror this pattern for `EventCard.tsx`
- `components/cafes/AreaFilterPills.tsx` — mirror this pattern for `CategoryFilterCards.tsx`
- `app/(public)/cafes/page.tsx` — mirror this pattern for `app/(public)/events/page.tsx`
- `app/(public)/cafes/[slug]/page.tsx` — mirror this pattern for `app/(public)/events/[slug]/page.tsx`

### Query Layer (Already Written in Phase 1B)
```typescript
// lib/queries/events.ts — already exists, use as-is
getUpcomingEvents(category?: string)   // for /events page
getEventBySlug(slug: string)           // for /events/[slug] page
```

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment

#### Breaking Changes Analysis
- No existing code is modified — zero risk of breaking existing functionality
- Phase 2 cafe pages are unaffected
- The navbar "Events" link already exists and will simply stop returning 404

#### Ripple Effects Assessment
- `CafeUpcomingEvents` component (Phase 2) already links to `/events/[slug]` — those links will now work
- No state management changes

#### Performance Implications
- Server Components for both pages — no client-side data fetching, fast TTFB
- `getUpcomingEvents()` uses a JOIN with cafes — verify existing query has appropriate indexes (`events_start_time_idx`, `events_event_type_idx` from Phase 1A schema)
- Images served from Supabase Storage — already configured in `next.config.ts`

#### Security Considerations
- Public read-only pages — no attack surface introduced
- External links use `rel="noopener noreferrer"`

#### User Experience Impacts
- Customers gain event browsing for the first time
- Wilson gains shareable event URLs to send via WhatsApp/Instagram
- The navbar "Events" link becomes functional (currently 404)

#### Maintenance Burden
- Low — follows identical patterns to Phase 2. Future event types require only adding a new entry to the category config array in `CategoryFilterCards`.

### AI Agent Checklist
- [x] **Complete Impact Analysis:** Filled out above
- [x] **Identify Critical Issues:** No red flags. One yellow flag: Suspense wrapping for `useSearchParams()`.
- [x] **Propose Mitigation:** Suspense boundary around `CategoryFilterCards`
- [x] **Alert User:** No significant second-order impacts to flag

---

*Task: 004*
*Phase: 3 — Event Discovery*
*Created: 2026-04-12*
tr5