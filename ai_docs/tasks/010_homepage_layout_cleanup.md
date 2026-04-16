# AI Task Template

## 1. Task Overview

### Task Title
**Title:** Homepage Layout Cleanup — Remove Stats/Search, Reorder Sections, Limit Mobile Cafes

### Goal Statement
**Goal:** Clean up the landing page by removing the vanity stats row and cosmetic search bar from the HeroSection, reordering the home page so events appear before cafes, and limiting the cafe grid on mobile to 3 cards (desktop keeps 6).

---

## 2. Strategic Analysis & Solution Options

*Straightforward UI cleanup — no strategic analysis required. Single clear implementation path for each change.*

---

## 3. Project Analysis & Current State

- **Frameworks & Versions:** Next.js 15.5.4, React 19, TypeScript 5 (strict mode)
- **UI & Styling:** Tailwind CSS 3.4.1, shadcn/ui, mobile-first responsive design
- **Key Architectural Patterns:** Server Components, no client-side interactivity needed

### Current State
- `HeroSection.tsx` renders a stats row (20+/100+/5K+) and a cosmetic (readOnly) search bar below the hero grid
- `page.tsx` renders sections in order: Hero → BrowseByArea → **FeaturedCafes → UpcomingEventsSection** → PartnerCTABanner
- `FeaturedCafes.tsx` fetches and shows up to 6 cafes; the grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — all cafes visible on every screen size

---

## 4. Context & Problem Definition

### Problem Statement
The stats (20+, 100+, 5K+) are placeholder numbers that don't reflect real data and look like filler. The search bar is cosmetic/readOnly and adds visual noise. On mobile, showing 6 cafe cards creates an excessively long scroll. Events should be surfaced higher on the page as a key discovery feature.

### Success Criteria
- [ ] Stats row (20+ Partner Cafes, 100+ Monthly Events, 5K+ Explorers) removed from HeroSection
- [ ] Cosmetic search bar removed from HeroSection
- [ ] Home page section order: Hero → BrowseByArea → **UpcomingEventsSection → FeaturedCafes** → PartnerCTABanner
- [ ] On mobile (`< lg`), FeaturedCafes shows maximum 3 cards
- [ ] On desktop (`lg+`), FeaturedCafes continues to show up to 6 cards
- [ ] No linting or TypeScript errors introduced

---

## 5. Development Mode Context

- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** — feel free to make breaking changes
- **Priority: Speed and simplicity** over data preservation

---

## 6. Technical Requirements

### Functional Requirements
- Remove `STATS` constant and stats row JSX from `HeroSection.tsx`
- Remove cosmetic search bar JSX (and unused `Search`, `MapPin` imports) from `HeroSection.tsx`
- Swap `<FeaturedCafes>` and `<UpcomingEventsSection>` in `page.tsx`
- In `FeaturedCafes.tsx`, hide cards beyond the 3rd on mobile using Tailwind's `hidden lg:block` on the 4th–6th cards

### Non-Functional Requirements
- **Responsive Design:** Mobile-first; changes must not break tablet layout
- **No dark mode toggle** (light-only project)

### Technical Constraints
- Must not change the data fetching (`getFeaturedCafes(6)` stays as-is; we just hide extras on mobile via CSS)
- No new dependencies required

---

## 7. Data & Database Changes

None required.

---

## 8. API & Backend Changes

None required.

---

## 9. Frontend Changes

### Files to Modify
- [ ] **`apps/web/components/landing/HeroSection.tsx`** — Remove stats + search bar; clean up unused imports
- [ ] **`apps/web/app/(public)/page.tsx`** — Swap section order (events before cafes)
- [ ] **`apps/web/components/landing/FeaturedCafes.tsx`** — Hide 4th–6th cards on mobile

### Code Changes Overview

#### 📂 HeroSection.tsx — Before (stats + search bar)
```tsx
const STATS = [
  { value: "20+", label: "Partner Cafes" },
  { value: "100+", label: "Monthly Events" },
  { value: "5K+", label: "Explorers" },
] as const;

// ... inside JSX:
{/* Stats row */}
<div className="mt-10 flex items-center gap-8 border-t border-brand-border pt-8">
  {STATS.map(({ value, label }) => (
    <div key={label} className="flex flex-col">
      <span className="font-heading text-2xl text-espresso sm:text-3xl">{value}</span>
      <span className="mt-0.5 text-xs text-roast/60">{label}</span>
    </div>
  ))}
</div>

{/* Cosmetic search bar */}
<div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
  <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-foam ...">
    <Search ... />
    <input type="text" readOnly ... />
    ...
    <button>Search</button>
  </div>
</div>
```

#### 📂 HeroSection.tsx — After
```tsx
// STATS constant removed entirely
// Stats row JSX removed
// Cosmetic search bar section removed
// Search and MapPin imports removed
```

#### 📂 page.tsx — Before
```tsx
<FeaturedCafes cafes={cafes} />
<UpcomingEventsSection events={events} />
```

#### 📂 page.tsx — After
```tsx
<UpcomingEventsSection events={events} />
<FeaturedCafes cafes={cafes} />
```

#### 📂 FeaturedCafes.tsx — Before
```tsx
{cafes.map((cafe) => (
  <CafeCard key={cafe.id} cafe={cafe} />
))}
```

#### 📂 FeaturedCafes.tsx — After
```tsx
{cafes.map((cafe, index) => (
  <div key={cafe.id} className={index >= 3 ? "hidden lg:block" : undefined}>
    <CafeCard cafe={cafe} />
  </div>
))}
```

#### 🎯 Key Changes Summary
- [ ] **HeroSection.tsx:** Remove `STATS` const, stats row JSX, search bar JSX, `Search` and `MapPin` imports
- [ ] **page.tsx:** Swap `<UpcomingEventsSection>` and `<FeaturedCafes>` lines
- [ ] **FeaturedCafes.tsx:** Wrap each `CafeCard` in a `div` that hides index >= 3 on mobile
- [ ] **Files Modified:** 3 files total, ~40 lines removed/changed, 0 lines added to deps

---

## 10. Implementation Plan

### Phase 1: HeroSection Cleanup
**Goal:** Remove stats row and search bar from the hero

- [ ] **Task 1.1:** Edit `apps/web/components/landing/HeroSection.tsx`
  - Remove `STATS` constant
  - Remove stats row `<div>` block
  - Remove cosmetic search bar `<div>` block
  - Remove `Search` and `MapPin` imports (no longer used)
  - Files: `apps/web/components/landing/HeroSection.tsx`

### Phase 2: Page Section Reorder
**Goal:** Surface events above cafes on the homepage

- [ ] **Task 2.1:** Edit `apps/web/app/(public)/page.tsx`
  - Swap `<FeaturedCafes>` and `<UpcomingEventsSection>` so events render first
  - Files: `apps/web/app/(public)/page.tsx`

### Phase 3: Mobile Cafe Card Limit
**Goal:** Show max 3 cafes on mobile, 6 on desktop

- [ ] **Task 3.1:** Edit `apps/web/components/landing/FeaturedCafes.tsx`
  - Wrap each `CafeCard` in a `div` with `className={index >= 3 ? "hidden lg:block" : undefined}`
  - Files: `apps/web/components/landing/FeaturedCafes.tsx`

### Phase 4: Basic Code Validation
**Goal:** Verify no linting or type errors introduced

- [ ] **Task 4.1:** Run `npm run lint` in `apps/web`
- [ ] **Task 4.2:** Run `npm run type-check` in `apps/web`

### Phase 5: Comprehensive Code Review
- [ ] **Task 5.1:** Present "Implementation Complete!" message
- [ ] **Task 5.2:** Execute comprehensive code review if approved

### Phase 6: User Browser Testing
- [ ] **Task 6.1:** 👤 USER TESTING — Verify on mobile viewport that only 3 cafes show
- [ ] **Task 6.2:** 👤 USER TESTING — Verify desktop shows 6 cafes
- [ ] **Task 6.3:** 👤 USER TESTING — Verify stats row and search bar are gone from hero
- [ ] **Task 6.4:** 👤 USER TESTING — Verify events section appears before cafes

---

## 12. Task Completion Tracking

### Phase 1: HeroSection Cleanup
- [ ] **Task 1.1:** Edit HeroSection.tsx — remove stats + search bar

### Phase 2: Page Section Reorder
- [ ] **Task 2.1:** Swap section order in page.tsx

### Phase 3: Mobile Cafe Card Limit
- [ ] **Task 3.1:** Hide cards index >= 3 on mobile in FeaturedCafes.tsx

### Phase 4: Validation
- [ ] **Task 4.1:** Linting pass
- [ ] **Task 4.2:** Type-check pass

---

## 13. File Structure & Organization

### Files to Modify
- `apps/web/components/landing/HeroSection.tsx`
- `apps/web/app/(public)/page.tsx`
- `apps/web/components/landing/FeaturedCafes.tsx`

### New Files to Create
None.

---

## 14. Potential Issues & Security Review

- **Edge case:** If `cafes` has fewer than 3 items, the `index >= 3` guard never triggers — this is fine, no extra handling needed.
- **No security implications** — pure UI/layout changes, no data access changes.

---

## 15. Deployment & Configuration

No environment variable changes required.

---

*Template Version: 1.3*
*Task Created: 2026-04-17*
