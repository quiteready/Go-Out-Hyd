# Task 022 — GoOut Hyd Landing Page Rebrand

## 1. Task Overview

### Task Title
**Title:** Landing Page Rebrand — Yellow/Black/White Design System Migration

### Goal Statement
**Goal:** Replace the existing home page (landing page) with the fully redesigned version from `index.html`. This includes migrating the Tailwind config and CSS variable layer to the new 4-color palette, replacing all landing section components with new ones ported from the HTML prototype, and fixing cross-cutting design system violations (GoOut Official badge, empty state copy, font strategy). The cafes and events pages are out of scope for this task — they will be tackled next.

---

## 2. Strategic Analysis

*Strategic analysis is not required — the approach has been fully decided through a detailed design review session. All decisions are documented below.*

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15 (App Router), React 19
- **Language:** TypeScript (strict mode)
- **Database & ORM:** Postgres via Drizzle ORM
- **UI & Styling:** shadcn/ui components + Tailwind CSS v4
- **Key Architectural Patterns:** Server Components for data fetching, Server Actions for mutations, `app/(public)/` route group for public pages

### Current State

The landing page (`app/(public)/page.tsx`) renders five sections in this order:
`HeroSection → BrowseByArea → UpcomingEventsSection → FeaturedCafes → PartnerCTABanner`

All components use a completely dead colour palette:
- Custom Tailwind tokens: `espresso`, `roast`, `caramel`, `gold`, `cream`, `milk`, `foam`, `brand-border`, `input-border`
- CSS variables in `globals.css` map to caramel orange as primary, espresso blue-black as foreground
- `tailwind.config.ts` `fontFamily.heading` maps to DM Serif Display, which bleeds into every card title, section heading, and form label that uses `font-heading`

The HTML prototype (`index.html`) at the project root is the approved reference design. It implements the full new system correctly and is the source of truth for this migration.

### Existing Context Providers
- No React Context providers on public routes — data is fetched server-side in Server Components
- `app/(public)/layout.tsx` renders `<Navbar>` + `<main>` + `<Footer>` wrapping all public pages

---

## 4. Context & Problem Definition

### Problem Statement
The existing landing page looks like a warm cafe directory ("Irani hotel DNA"). The brand has evolved to a bolder, urban cultural events platform. The new palette, typography rules, and section structure are fully designed and prototyped in `index.html`. None of it exists in the Next.js app yet. The landing page is the first thing users see — it must reflect the new brand before any other work proceeds.

### Success Criteria
- [ ] Landing page renders the new section order: Hero → Marquee → Philosophy → Wink → Discover → Areas → Partner → Footer
- [ ] No instance of `caramel`, `espresso`, `roast`, `cream`, `milk`, `foam`, `brand-border`, `gold` tokens remains in any landing component
- [ ] `tailwind.config.ts` has only `black`, `white`, `yellow` as custom color tokens (plus the shadcn CSS variable system)
- [ ] `font-heading` no longer exists in the config — replaced by `font-display` (DM Serif Display, used in exactly 2 places)
- [ ] GoOut Official badge uses `#fbf497` background, `#0a0a0a` text — no amber Tailwind colors
- [ ] `EventEmptyState.tsx` copy no longer references Wilson
- [ ] Hero is full-bleed, parallax Charminar image, Ken Burns, yellow frame, dark overlay
- [ ] Pearl interaction works on the Areas section (click to expand area card)
- [ ] Partner section has TWO cards side by side on dark background
- [ ] All landing animations respect `prefers-reduced-motion`

---

## 5. Development Mode Context
- **🚨 Active development — no backwards compatibility concerns**
- Old landing components (`BrowseByArea`, `UpcomingEventsSection`, `FeaturedCafes`) will be deleted
- The data fetches they used (`getFeaturedCafes`, `getUpcomingEventsForLanding`) will be removed from `page.tsx` — the new landing page uses static/curated content in all sections
- Aggressive component replacement is expected and approved

---

## 6. Technical Requirements

### Functional Requirements
- New landing page loads without any data fetching (fully static, no DB queries)
- Hero parallax scroll effect works on scroll
- Discover section cards expand on click to show sample events
- Areas section pearls expand on click to show area card with cafes
- Partner section links: "Own a cafe?" → `/partner`, "Running an event?" → `/submit-event`
- All CTAs in hero link to `/events`

### Non-Functional Requirements
- **Performance:** No layout shift — hero uses absolute positioning, no data waterfalls
- **Responsive Design:** Mobile-first. Parallax scroll is disabled on mobile (CSS handles this). Pearl cards position correctly on narrow screens.
- **Reduced Motion:** All animations (Ken Burns, marquee scroll, scroll cue bob, pearl spring, reveal fade) must be suppressed with `prefers-reduced-motion: reduce`
- **Accessibility:** Pearl cards use `role="button"`, `aria-expanded`, `aria-label`. Discover cards use `role="button"`, `aria-expanded`. Marquee strip is `aria-hidden`.

### Technical Constraints
- Must not touch `app/(admin)/` or any admin components
- Must not change the Drizzle schema or any database queries in `lib/queries/`
- Must not modify `components/ui/` (shadcn primitives) — only fix consuming components
- Navbar and Footer are updated for color tokens only — structure stays identical
- The `(public)/layout.tsx` `<main>` wrapper currently has `bg-cream` — this needs to be removed (hero is full-bleed, no parent background should show through)

---

## 7. Data & Database Changes
**None.** The new landing page is fully static. No DB queries, no schema changes, no migrations.

---

## 8. API & Backend Changes
**None.** No Server Actions, no API routes, no lib query changes needed.

---

## 9. Frontend Changes

### Design System Decisions (Reference for Implementation)

| Decision | Ruling |
|---|---|
| Dead tokens to remove | `espresso`, `roast`, `caramel`, `gold`, `cream`, `milk`, `foam`, `brand-border`, `input-border` |
| New custom color tokens | `black: "#0a0a0a"`, `white: "#f8f7f2"`, `yellow: "#fbf497"` |
| `font-heading` | **Nuke it.** Does not exist after this task. |
| `font-display` | DM Serif Display. Used in exactly 2 places: `.wink` band + philosophy heading. |
| `font-sans font-medium` | DM Sans 500. Used for ALL card titles, section headings, buttons, nav items. |
| GoOut Official badge | `bg-[#fbf497]` text `text-[#0a0a0a]`. No ring, no border, no gradient. |
| PartnerCTABanner | Dark (`#0a0a0a`) bg, TWO cards: "Own a cafe?" + "Running an event?" |
| EventEmptyState copy | Kill Wilson. Use: "Nothing here yet. / But Hyderabad never stays quiet." |
| Pearl interaction | Net new. `useState` toggle in React. Static area data hardcoded. |

### New Files to Create

- [ ] `components/landing/MarqueeStrip.tsx` — Scrolling yellow text strip, `aria-hidden`
- [ ] `components/landing/PhilosophySection.tsx` — Asymmetric 2-col editorial section
- [ ] `components/landing/WinkBand.tsx` — Black band, `font-display`, "Hyderabad ki baithak."
- [ ] `components/landing/DiscoverSection.tsx` — Horizontal scroll cards with expand interaction
- [ ] `components/landing/AreasSection.tsx` — Pearl interaction, dark bg, 5 areas from `AREAS` constant

### Files to Replace (Complete Rewrite)

- [ ] `components/landing/HeroSection.tsx` — Full-bleed parallax Charminar, Ken Burns, yellow frame, scroll cue
- [ ] `components/landing/PartnerCTABanner.tsx` — Dark bg, two-card layout, yellow buttons

### Files to Delete

- [ ] `components/landing/BrowseByArea.tsx` — Replaced by `AreasSection.tsx`
- [ ] `components/landing/UpcomingEventsSection.tsx` — Not on new landing page
- [ ] `components/landing/FeaturedCafes.tsx` — Not on new landing page

### Files to Modify

- [ ] `tailwind.config.ts` — Replace dead palette, nuke `font-heading`, add `font-display`
- [ ] `app/globals.css` — Update CSS vars to new palette; add landing animation CSS (hero, marquee, pearl, discover, scroll reveal)
- [ ] `app/layout.tsx` — Remove `DM_Serif_Display` font variable from root layout (replaced by `font-display` via Tailwind)
- [ ] `app/(public)/layout.tsx` — Remove `bg-cream` from `<main>` wrapper
- [ ] `app/(public)/page.tsx` — New section composition, remove data fetches
- [ ] `components/layout/Navbar.tsx` — Token swap: `espresso`→`black`, `caramel`→`yellow`, `cream`→`white`
- [ ] `components/layout/Footer.tsx` — Token swap + rebuild to match `index.html` footer style
- [ ] `components/events/GooutOfficialBadge.tsx` — Replace amber Tailwind colors with `#fbf497`/`#0a0a0a`
- [ ] `components/events/EventEmptyState.tsx` — Fix copy + dead color tokens

### Code Changes Overview

#### `tailwind.config.ts` — Before
```ts
colors: {
  espresso: "#1A1A2E",
  roast: "#374151",
  caramel: "#E8602A",
  gold: "#D4501F",
  cream: "#FEFCF8",
  milk: "#F8F6F2",
  foam: "#FFFFFF",
  "brand-border": "#E8DCC8",
  "input-border": "#D4C9B5",
  // ...shadcn tokens
},
fontFamily: {
  heading: ["var(--font-heading)", "Georgia", "serif"],
  body: ["var(--font-body)", "system-ui", "sans-serif"],
  sans: ["var(--font-body)", "system-ui", "sans-serif"],
},
```

#### `tailwind.config.ts` — After
```ts
colors: {
  black: "#0a0a0a",
  white: "#f8f7f2",
  yellow: "#fbf497",
  // ...shadcn tokens unchanged
},
fontFamily: {
  display: ["DM Serif Display", "serif"],
  sans: ["DM Sans", "system-ui", "sans-serif"],
},
```

#### `globals.css` CSS vars — Before
```css
--background: 38 77% 98%;   /* old cream */
--foreground: 240 28% 14%;  /* espresso */
--primary: 17 80% 54%;      /* caramel */
--ring: 17 80% 54%;         /* caramel */
```

#### `globals.css` CSS vars — After
```css
--background: 45 27% 96%;   /* warm white #f8f7f2 */
--foreground: 0 0% 4%;      /* near-black #0a0a0a */
--primary: 56 93% 79%;      /* yellow #fbf497 */
--ring: 56 93% 79%;         /* yellow */
```

#### `page.tsx` — Before
```tsx
export default async function HomePage() {
  const [cafes, events] = await Promise.all([
    getFeaturedCafes(6),
    getUpcomingEventsForLanding(4),
  ]);
  return (
    <>
      <HeroSection />
      <BrowseByArea />
      <UpcomingEventsSection events={events} />
      <FeaturedCafes cafes={cafes} />
      <PartnerCTABanner />
    </>
  );
}
```

#### `page.tsx` — After
```tsx
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MarqueeStrip />
      <PhilosophySection />
      <WinkBand />
      <DiscoverSection />
      <AreasSection />
      <PartnerCTABanner />
    </>
  );
}
```

#### `EventEmptyState.tsx` — Before
```tsx
<p className="mt-2 max-w-sm text-sm text-roast/60">
  Wilson&apos;s always planning something new — check back soon.
</p>
```

#### `EventEmptyState.tsx` — After
```tsx
<p className="mt-2 max-w-sm text-sm text-foreground/45">
  Nothing here yet. But Hyderabad never stays quiet.
</p>
```

---

## 10. Implementation Plan

### Phase 1: Config Layer
**Goal:** Update the design system foundation so all subsequent component work uses correct tokens.

- [ ] **Task 1.1:** Update `tailwind.config.ts`
  - Files: `apps/web/tailwind.config.ts`
  - Details: Remove dead palette tokens. Replace `fontFamily`. Add `black`, `white`, `yellow` as custom colors. Keep all shadcn CSS variable token mappings unchanged.

- [ ] **Task 1.2:** Update `app/globals.css`
  - Files: `apps/web/app/globals.css`
  - Details: Update CSS variable values to new palette. Remove old hero animation CSS. Add full animation/layout CSS for: hero (Ken Burns, scroll cue, parallax), marquee, scroll reveal (`data-reveal`), pearl interaction, discover card expand, reduced-motion overrides. Use `index.html` styles as the source of truth.

- [ ] **Task 1.3:** Update root layout font loading
  - Files: `apps/web/app/layout.tsx`
  - Details: Remove `DM_Serif_Display` as a CSS variable font. Since `font-display` in Tailwind now references `"DM Serif Display"` as a static string (loaded via Google Fonts link in `globals.css` or a `<link>` tag), the `next/font/google` variable approach is no longer needed for DM Serif. DM Sans stays as `--font-body` via `next/font`. Alternatively, keep both loaded but just ensure they're available.

  > **Note:** Since Tailwind's `font-display` will reference `"DM Serif Display"` by name, we still need the font loaded. The cleanest approach: keep both DM Sans and DM Serif Display loaded via `next/font/google` in `layout.tsx`, but rename the DM Serif variable to `--font-display`. Update Tailwind config to use `["var(--font-display)", "serif"]`.

### Phase 2: Fix Cross-Cutting Violations
**Goal:** Fix the non-landing components that have design system violations before building the new landing.

- [ ] **Task 2.1:** Fix `GooutOfficialBadge.tsx`
  - Files: `apps/web/components/events/GooutOfficialBadge.tsx`
  - Details: Replace all `bg-amber-*`, `text-amber-*`, `ring-amber-*`, `fill-amber-*` with `bg-[#fbf497]`, `text-[#0a0a0a]`, `fill-[#fbf497]`. Both `sm` and `md` size variants.

- [ ] **Task 2.2:** Fix `EventEmptyState.tsx`
  - Files: `apps/web/components/events/EventEmptyState.tsx`
  - Details: Replace Wilson copy. Fix `bg-caramel/10` → `bg-foreground/8`, `text-caramel` → `text-foreground`, `font-heading` → `font-sans font-medium`, `text-roast/60` → `text-foreground/45`.

- [ ] **Task 2.3:** Update `Navbar.tsx` colour tokens
  - Files: `apps/web/components/layout/Navbar.tsx`
  - Details: `bg-espresso` → `bg-black`, `text-caramel` (active link) → `text-yellow`, `text-cream` → `text-white`, `bg-caramel hover:bg-gold` (CTA button) → `bg-yellow text-black hover:opacity-85`, `border-roast` (sheet) → `border-white/10`.

- [ ] **Task 2.4:** Update `Footer.tsx`
  - Files: `apps/web/components/layout/Footer.tsx`
  - Details: `bg-espresso` → `bg-black`. `hover:text-caramel` (Instagram/email links) → `hover:text-yellow`. Remove the word "Discover" from footer copy (replace with "Explore"). All other structure stays the same.

### Phase 3: Delete Old Landing Components
**Goal:** Remove the three components that are no longer used on the landing page.

- [ ] **Task 3.1:** Delete `BrowseByArea.tsx`
  - Files: `apps/web/components/landing/BrowseByArea.tsx`
  - Details: Delete file. Verify no other page imports it.

- [ ] **Task 3.2:** Delete `UpcomingEventsSection.tsx`
  - Files: `apps/web/components/landing/UpcomingEventsSection.tsx`
  - Details: Delete file. Verify no other page imports it.

- [ ] **Task 3.3:** Delete `FeaturedCafes.tsx`
  - Files: `apps/web/components/landing/FeaturedCafes.tsx`
  - Details: Delete file. Verify no other page imports it.

### Phase 4: Build New Landing Components
**Goal:** Port all new sections from `index.html` into React components.

- [ ] **Task 4.1:** Replace `HeroSection.tsx`
  - Files: `apps/web/components/landing/HeroSection.tsx`
  - Details: Full rewrite. `"use client"` (needs `useRef` + `useEffect` for parallax scroll). Charminar Unsplash image. Ken Burns via CSS class. Yellow frame `div`. Dark overlay with gradient. Left-aligned content: city label, `GoOut Hyd.` in `font-sans font-medium`, yellow rule `<hr>`, subtitle, two CTAs (both link to `/events`). Scroll cue SVG. Matches `index.html` `.hero` section exactly.

- [ ] **Task 4.2:** Create `MarqueeStrip.tsx`
  - Files: `apps/web/components/landing/MarqueeStrip.tsx`
  - Details: Server Component. `aria-hidden="true"`. Black bg, yellow text at 25% opacity. Two repeated `<span>` tracks inside a flex container animated by `mscroll` keyframe in globals.css. Matches `index.html` `.marquee-strip` section.

- [ ] **Task 4.3:** Create `PhilosophySection.tsx`
  - Files: `apps/web/components/landing/PhilosophySection.tsx`
  - Details: Server Component. Asymmetric 2-col grid (stacks on mobile). Left: `<h2>` in `font-display` — "We don't list places. We map moods." with yellow `<em>` highlight on one word. Right: `<p>` in `font-sans font-light` gray body text. `data-reveal` attribute on both columns.

- [ ] **Task 4.4:** Create `WinkBand.tsx`
  - Files: `apps/web/components/landing/WinkBand.tsx`
  - Details: Server Component. Black bg, centered. `<p>` in `font-display` — "Hyderabad ki baithak." Yellow text at 75% opacity. Subtle radial glow `::before`. `data-reveal`.

- [ ] **Task 4.5:** Create `DiscoverSection.tsx`
  - Files: `apps/web/components/landing/DiscoverSection.tsx`
  - Details: `"use client"` (needs `useState` for expand toggle). White bg. Horizontal scroll container. 4 cards: Live Music, Comedy, Workshops, Quiet Cafes. Each card: black pill tag, emoji, `<h3>` in `font-sans font-medium`, description, expandable sample items list (yellow dot bullets). Yellow `border-top` on cards. Fade-out gradient on right edge. Matches `index.html` `.discover` section.

- [ ] **Task 4.6:** Create `AreasSection.tsx`
  - Files: `apps/web/components/landing/AreasSection.tsx`
  - Details: `"use client"` (needs `useState` for active pearl). Dark (`#0a0a0a`) bg. Imports `AREAS` from `@/lib/constants/areas`. Renders one pearl per area (5 total). Each pearl: glowing yellow dot, label below, pop-up dark glass card on active with area name, sub-label, 3 sample cafe names. Click toggles active state; clicking elsewhere closes. Spring animation via CSS. Matches `index.html` `.areas` section.

- [ ] **Task 4.7:** Replace `PartnerCTABanner.tsx`
  - Files: `apps/web/components/landing/PartnerCTABanner.tsx`
  - Details: Full rewrite. Server Component. Dark (`bg-black`) section. TWO side-by-side cards (stack on mobile below 560px): Card 1 "Own a cafe?" → Link to `/partner`. Card 2 "Running an event?" → Link to `/submit-event`. Both use yellow button (`bg-yellow text-black`). `data-reveal`.

### Phase 5: Assemble Landing Page
**Goal:** Update `page.tsx` and the public layout to use the new components.

- [ ] **Task 5.1:** Update `app/(public)/layout.tsx`
  - Files: `apps/web/app/(public)/layout.tsx`
  - Details: Remove `bg-cream` from `<main>` wrapper. New landing page manages its own backgrounds per section.

- [ ] **Task 5.2:** Update `app/(public)/page.tsx`
  - Files: `apps/web/app/(public)/page.tsx`
  - Details: Remove all data fetches (`getFeaturedCafes`, `getUpcomingEventsForLanding`). Remove old component imports. Add new component imports. New render order: `HeroSection → MarqueeStrip → PhilosophySection → WinkBand → DiscoverSection → AreasSection → PartnerCTABanner`. Update page metadata: title → "GoOut Hyd — Everything happening in Hyderabad", description → "Your weekend starts here. Live music, comedy, workshops, open mics, and more across Hyderabad."

- [ ] **Task 5.3:** Add scroll-reveal script
  - Files: `apps/web/app/globals.css` or a new client component
  - Details: The `data-reveal` scroll animation requires an `IntersectionObserver` to add the `revealed` class when elements enter the viewport. This can live in a small `"use client"` `ScrollReveal.tsx` component rendered in the root layout, or as an inline script. Reference `index.html` lines 1240–1285 for the JS logic.

### Phase 6: Code Validation
**Goal:** Static analysis only — no dev server.

- [ ] **Task 6.1:** Check for remaining dead token references in landing components
  - Run: `grep -r "caramel\|espresso\|roast\|cream\|milk\|foam\|brand-border\|gold" apps/web/components/landing/`
  - Expected: zero results

- [ ] **Task 6.2:** Check for remaining `font-heading` usage across codebase
  - Run: `grep -r "font-heading" apps/web/`
  - Expected: zero results (replaced by `font-display` or `font-sans font-medium`)

- [ ] **Task 6.3:** Verify deleted files are not imported anywhere
  - Run: `grep -r "BrowseByArea\|UpcomingEventsSection\|FeaturedCafes" apps/web/app/`
  - Expected: zero results

- [ ] **Task 6.4:** Lint modified files
  - Command: `cd apps/web && npx eslint components/landing/ components/layout/ components/events/GooutOfficialBadge.tsx components/events/EventEmptyState.tsx app/globals.css tailwind.config.ts --max-warnings 0`

---

## 11. File Structure

### New Files
```
apps/web/components/landing/
├── HeroSection.tsx          [REPLACE — full rewrite]
├── MarqueeStrip.tsx         [NEW]
├── PhilosophySection.tsx    [NEW]
├── WinkBand.tsx             [NEW]
├── DiscoverSection.tsx      [NEW]
├── AreasSection.tsx         [NEW]
├── PartnerCTABanner.tsx     [REPLACE — full rewrite]
├── BrowseByArea.tsx         [DELETE]
├── UpcomingEventsSection.tsx[DELETE]
└── FeaturedCafes.tsx        [DELETE]
```

### Files Modified
```
apps/web/
├── tailwind.config.ts
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── (public)/
│       ├── layout.tsx
│       └── page.tsx
└── components/
    ├── layout/
    │   ├── Navbar.tsx
    │   └── Footer.tsx
    └── events/
        ├── GooutOfficialBadge.tsx
        └── EventEmptyState.tsx
```

---

## 12. Potential Issues & Security Review

### Error Scenarios

- [ ] **Parallax scroll on iOS Safari:** `window.scrollY` in `useEffect` sometimes behaves differently on iOS. The `{ passive: true }` listener is already in the design. Verify the `useRef` cleanup is correct.
  - **Potential Fix:** If jank occurs, disable parallax entirely on touch devices via a CSS media query (`@media (hover: none)`).

- [ ] **Pearl card overflow on narrow mobile:** The pearl card is `min(280px, calc(100vw - 40px))` wide and positioned `bottom: 64px`. On very narrow screens or when a pearl is at the far right, the card may clip.
  - **Potential Fix:** Already handled in `index.html` — the `transform: translateX(-50%)` centers on the dot, and `min()` clamps width. Verify on a 375px viewport.

- [ ] **`data-reveal` before JS hydrates:** SSR renders the page with `opacity: 0` on `data-reveal` elements. If the IntersectionObserver script is in a Client Component that hydrates after paint, users may see a brief flash of invisible content.
  - **Potential Fix:** Add `<noscript>` CSS or use a `data-reveal="loaded"` check to fall back gracefully.

### Edge Cases

- [ ] **DiscoverSection on desktop:** The horizontal scroll card pattern is designed for mobile. On desktop, all 4 cards should be visible without scrolling. Verify the container handles this without a truncated scroll.
  - **Analysis:** `index.html` uses `overflow-x: auto` with no desktop override — cards just don't need scrolling when they all fit. This is fine.

- [ ] **Areas section static data:** Sample cafe names per area are hardcoded. If a hardcoded cafe name doesn't match any real cafe in the DB, it's still fine — they're illustrative, not linked. Document this as "v1 static, phase 2 make data-driven."

---

## 13. Task Completion Tracking

### Phase 1: Config Layer
- [x] **Task 1.1:** Update `tailwind.config.ts` ✓ 2026-05-01
- [x] **Task 1.2:** Update `app/globals.css` ✓ 2026-05-01
- [x] **Task 1.3:** Update root layout font loading ✓ 2026-05-01

### Phase 2: Fix Cross-Cutting Violations
- [x] **Task 2.1:** Fix `GooutOfficialBadge.tsx` ✓ 2026-05-01
- [x] **Task 2.2:** Fix `EventEmptyState.tsx` ✓ 2026-05-01
- [x] **Task 2.3:** Update `Navbar.tsx` colour tokens ✓ 2026-05-01
- [x] **Task 2.4:** Update `Footer.tsx` ✓ 2026-05-01

### Phase 3: Delete Old Landing Components
- [x] **Task 3.1:** Delete `BrowseByArea.tsx` ✓ 2026-05-01
- [x] **Task 3.2:** Delete `UpcomingEventsSection.tsx` ✓ 2026-05-01
- [x] **Task 3.3:** Delete `FeaturedCafes.tsx` ✓ 2026-05-01

### Phase 4: Build New Landing Components
- [x] **Task 4.1:** Replace `HeroSection.tsx` ✓ 2026-05-01
- [x] **Task 4.2:** Create `MarqueeStrip.tsx` ✓ 2026-05-01
- [x] **Task 4.3:** Create `PhilosophySection.tsx` ✓ 2026-05-01
- [x] **Task 4.4:** Create `WinkBand.tsx` ✓ 2026-05-01
- [x] **Task 4.5:** Create `DiscoverSection.tsx` ✓ 2026-05-01
- [x] **Task 4.6:** Create `AreasSection.tsx` ✓ 2026-05-01
- [x] **Task 4.7:** Replace `PartnerCTABanner.tsx` ✓ 2026-05-01

### Phase 5: Assemble Landing Page
- [x] **Task 5.1:** Update `app/(public)/layout.tsx` ✓ 2026-05-01
- [x] **Task 5.2:** Update `app/(public)/page.tsx` ✓ 2026-05-01
- [x] **Task 5.3:** Add scroll-reveal script (`ScrollReveal.tsx` + root layout) ✓ 2026-05-01

### Phase 6: Code Validation
- [x] **Task 6.1:** Check for remaining dead token references ✓ 2026-05-01 — zero hits in landing components; remaining hits are cafes/events pages (deferred scope)
- [x] **Task 6.2:** Check for remaining `font-heading` usage ✓ 2026-05-01 — zero in Tailwind config; remaining in deferred pages + fixed `Logo.tsx` immediately
- [x] **Task 6.3:** Verify deleted files are not imported ✓ 2026-05-01 — zero results
- [x] **Task 6.4:** Lint + type-check passed ✓ 2026-05-01 — `npm run lint` ✓, `npm run type-check` ✓, zero errors

---

## 14. Reference

- **HTML Prototype (source of truth):** `go-out-hyd/index.html`
- **Design System Doc:** Shared in conversation — covers palette, typography, component rules
- **Areas constant:** `apps/web/lib/constants/areas.ts` — 5 areas, use directly in `AreasSection.tsx`
- **Charminar image URL:** `https://images.unsplash.com/photo-1572427401206-c0e90ac69e3a?auto=format&fit=crop&w=1600&q=80`
- **Previous task for context:** `021_event_status_fixes_and_instagram.md`
