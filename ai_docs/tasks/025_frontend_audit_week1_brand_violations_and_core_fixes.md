# AI Task Document — 025

## 1. Task Overview

### Task Title
**Title:** Frontend Audit Week 1 — Brand violations, dark hero shell, partner rewrite, navbar, team

### Goal Statement
**Goal:** Fix the five highest-impact brand violations and page-level issues identified in the May 2026 frontend design audit. These are the changes that break brand identity or are directly user-visible bugs: global font weight sweep, sentence case sweep, a single reusable dark hero component on every secondary page, a full partner page copy+structure rewrite, CafeCard data honesty fix, navbar cleanup, and adding Lijohn to the About team section. No database changes. Pure frontend.

---

## 2. Strategic Analysis & Solution Options

Strategic analysis not required — every change has one clear correct implementation specified by the audit. All decisions have already been made.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.5.4 (App Router), React 19
- **Language:** TypeScript 5 strict mode
- **UI & Styling:** shadcn/ui + Tailwind CSS 3.4.1. Light-only. Brand palette: yellow `#fbf497`, black `#0a0a0a`, cream `#f8f7f2`, secondary `#efece5`.
- **Typography:** DM Serif Display (headings/display), DM Sans (body). Font weights: 500 headings, 300 body, never bold.
- **Key Architectural Patterns:** Next.js App Router, Server Components by default, `"use client"` only for interactivity.
- **No context providers** — this is a Phase 1 public-only app with no auth.

### Current State (confirmed by file reads)

**font-semibold occurrences:**
- `apps/web/components/layout/Footer.tsx:30` — `font-semibold` on link group headings
- `apps/web/components/events/EventCard.tsx:95` — `font-semibold` on "Early" pill

**Sentence case violations:**
- `apps/web/app/(public)/partner/page.tsx:68` — "Your Cafe Deserves to Be Discovered"
- `apps/web/app/(public)/submit-event/page.tsx:35` — "Bring Your Event to Hyderabad"
- `apps/web/app/(public)/partner/page.tsx` value cards — "Get Discovered", "Fill Empty Tables", "Host Events Effortlessly", "Plans Starting at ₹999/month"
- `apps/web/components/partner/PartnerForm.tsx:82` — CardTitle "Get Started"
- `apps/web/components/partner/PartnerForm.tsx:198` — button "Request a Callback"
- `apps/web/app/(public)/events/page.tsx:46` — `${categoryLabel} Events` (trailing capital)

**Hero inconsistency:**
- `apps/web/app/(public)/events/page.tsx` — light hero pattern (plain h1 + muted subhead)
- `apps/web/app/(public)/cafes/page.tsx` — light hero pattern (same)
- `apps/web/app/(public)/partner/page.tsx` — dark hero ✅ but missing eyebrow/Telugu
- `apps/web/app/(public)/submit-event/page.tsx` — dark hero ✅ but missing eyebrow/Telugu
- `apps/web/app/(public)/about/page.tsx` — dark hero ✅ with eyebrow but no Telugu

**Partner page issues:**
- Generic SaaS icons (Search, TrendingUp, Music, CircleDollarSign) and SaaS copy
- "How it works" uses Chevron icons — feels template-like
- `PartnerForm.tsx:188` — submit button `bg-[#0a0a0a] text-[#fbf497]` on a light section (wrong — should be yellow CTA on light bg)
- Form card has `shadow-md` — should be `shadow-sm`

**CafeCard issues:**
- `CafeCard.tsx:14-21` — `AREA_VIBES` static map shows fake tags (e.g., every Banjara Hills cafe shows "Specialty Coffee, Live Music" even if false)
- `CafeCard.tsx:73` — `strokeWidth={2.5}` on MapPin, should be `1.5`
- `CafeCard.tsx:66` — `group-hover:text-foreground/70` on title (wrong hover behavior)

**Navbar issues:**
- `Navbar.tsx:34-36` — "Made with love in Hyderabad" center tagline
- `Navbar.tsx:105-107` — same string in mobile sheet
- `NAV_LINKS` has no "Submit event" entry
- Active link is yellow text only — no visual underline indicator

**Footer:**
- `Footer.tsx:30` — `font-semibold tracking-widest` (V1 + wrong tracking)
- `Footer.tsx:58` — "unforgettable events" banned marketing-speak copy

**About team section:**
- `TeamSection.tsx:10-11` — only Wilson listed. User wants Lijohn added as co-founder.

---

## 4. Context & Problem Definition

### Problem Statement
The brand violations (bold fonts, title case, inconsistent heroes) are visible on every page. They make the site look like a generic template rather than a curated Hyderabad platform. The partner page copy is generic SaaS ("Get Discovered", "Fill Empty Tables") which contradicts the brand voice. The CafeCard vibe pills show made-up data. All of these are trust and brand problems that undermine the product before any feature work.

### Success Criteria
- [ ] Zero `font-semibold` or `font-bold` in public-facing components
- [ ] All hero titles in sentence case
- [ ] Every secondary page (events, cafes, partner, submit-event, about) uses the dark `PageHero` shell with correct eyebrow + Telugu label
- [ ] Partner page value cards rewritten to question-form pattern with emoji openers
- [ ] Partner "How it works" uses 01/02/03 numerals instead of icons
- [ ] Partner form submit button is `bg-yellow text-black` (yellow CTA on light section)
- [ ] `AREA_VIBES` removed from CafeCard — no fake tag pills
- [ ] MapPin strokeWidth is `1.5`
- [ ] CafeCard title hover is `translateY(-3px)` not text-dim
- [ ] Navbar center tagline removed from desktop and mobile
- [ ] Navbar active link has `border-b-2 border-yellow` underline
- [ ] "Submit event" added to NAV_LINKS
- [ ] Footer heading tracking corrected, copy updated
- [ ] Lijohn added to TeamSection alongside Wilson

---

## 5. Development Mode Context
- New application in active development
- No backwards compatibility concerns
- Pure UI/copy changes — no database or API changes
- Safe to delete dead code (AREA_VIBES constant) completely

---

## 6. Technical Requirements

### Functional Requirements
- PageHero component accepts `eyebrow` (string), `title` (string), `lead` (optional string) props
- PageHero eyebrow format: `"LABEL · తెలుగు"` — uppercase Latin, space-dot-space, Telugu
- All existing page hero markup replaced by the single PageHero import
- CategoryFilterCards.tsx is NOT deleted in this task (Week 2 cleanup)
- No new dependencies required

### Non-Functional Requirements
- **Responsive:** PageHero must work on 320px+ mobile through desktop
- **Accessibility:** Eyebrow is decorative — `aria-hidden` not needed since it is real content, but no landmark role needed
- **No dark mode toggle** — site is light-only, dark hero sections use explicit bg color

### Technical Constraints
- Must use existing Tailwind design tokens (`text-yellow`, `bg-[#0a0a0a]`, `text-[#f8f7f2]`, `bg-secondary`, etc.)
- `PageHero` goes in `components/layout/PageHero.tsx` — it is a layout-level shared component
- No modifications to shadcn `ui/` components

---

## 7. Data & Database Changes
None. This task is entirely frontend/UI.

---

## 8. API & Backend Changes
None.

---

## 9. Frontend Changes

### New Components
- [ ] **`components/layout/PageHero.tsx`** — reusable dark hero shell. Props: `eyebrow: string`, `title: string`, `lead?: string`. Server Component (no `"use client"`).

### Pages / Components to Modify
- [ ] **`components/layout/Footer.tsx`** — font-semibold → font-medium, tracking-widest → tracking-[0.28em], copy fix
- [ ] **`components/events/EventCard.tsx`** — Early pill font-semibold → font-medium
- [ ] **`components/cafes/CafeCard.tsx`** — remove AREA_VIBES, fix strokeWidth, fix hover
- [ ] **`components/layout/Navbar.tsx`** — kill taglines, add underline active state, add Submit event link
- [ ] **`components/partner/PartnerForm.tsx`** — sentence case CardTitle + button, shadow-sm, yellow CTA button
- [ ] **`components/about/TeamSection.tsx`** — add Lijohn
- [ ] **`app/(public)/events/page.tsx`** — swap light hero for PageHero
- [ ] **`app/(public)/cafes/page.tsx`** — swap light hero for PageHero, extract EmptyState
- [ ] **`app/(public)/partner/page.tsx`** — add PageHero eyebrow, rewrite value cards + steps
- [ ] **`app/(public)/submit-event/page.tsx`** — add PageHero eyebrow, replace → with hairline, numerals for steps

---

## 10. Code Changes Overview

### Phase 1 — V1 + V2: Font weight + sentence case sweep

#### Footer.tsx:30 (Before)
```tsx
<p className="text-xs font-semibold uppercase tracking-widest text-white/30">
  {heading}
</p>
```
#### Footer.tsx:30 (After)
```tsx
<p className="text-xs font-medium uppercase tracking-[0.28em] text-white/30">
  {heading}
</p>
```
#### Footer.tsx:58 copy (Before)
```
Explore independent cafes and unforgettable events in Hyderabad.
```
#### Footer.tsx:58 copy (After)
```
Everything happening in the city. Friday plans, sorted.
```

#### EventCard.tsx:95 (Before)
```tsx
<span className="rounded bg-[#fbf497]/20 px-1 text-[10px] font-semibold uppercase tracking-wide text-[#0a0a0a]">
  Early
</span>
```
#### EventCard.tsx:95 (After)
```tsx
<span className="rounded bg-[#fbf497]/20 px-1 text-[10px] font-medium uppercase tracking-[0.05em] text-[#0a0a0a]">
  Early
</span>
```

#### partner/page.tsx hero (Before)
```tsx
<h1 className="text-4xl font-medium leading-tight text-[#f8f7f2] sm:text-5xl">
  Your Cafe Deserves to Be Discovered
</h1>
```
#### partner/page.tsx hero (After) — via PageHero component
```tsx
<PageHero
  eyebrow="PARTNER WITH US · మాతో చేరండి"
  title="Your cafe deserves to be discovered"
  lead="Join Hyderabad's only platform built for independent cafes"
/>
```

#### PartnerForm.tsx CardTitle + button (Before)
```tsx
<CardTitle className="text-2xl font-medium text-foreground">
  Get Started
</CardTitle>
...
<Button ... className="w-full bg-[#0a0a0a] text-[#fbf497] hover:bg-[#0a0a0a]/90">
  Request a Callback
</Button>
```
#### PartnerForm.tsx CardTitle + button (After)
```tsx
<CardTitle className="text-2xl font-medium text-foreground">
  Get started
</CardTitle>
...
<Button ... className="w-full bg-yellow text-black hover:opacity-85 hover:bg-yellow">
  Request a callback
</Button>
```

### Phase 2 — PageHero component (new file)

```tsx
// components/layout/PageHero.tsx
interface PageHeroProps {
  eyebrow: string;
  title: string;
  lead?: string;
}

export function PageHero({ eyebrow, title, lead }: PageHeroProps) {
  return (
    <section className="relative bg-[#0a0a0a] px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mb-[14px] block text-[11px] font-medium uppercase tracking-[0.4em] text-yellow opacity-85">
          {eyebrow}
        </span>
        <h1 className="font-medium text-[clamp(36px,6vw,56px)] tracking-[-0.02em] leading-[1.05] text-[#f8f7f2]">
          {title}
        </h1>
        {lead && (
          <p className="mt-4 text-[15px] font-light text-white/55 max-w-xl mx-auto">
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
```

### Phase 3 — events/page.tsx hero (Before)
```tsx
<div className="mb-8">
  <h1 className="text-4xl font-medium text-foreground">
    {categoryLabel ? `${categoryLabel} Events` : "Events"}
  </h1>
  <p className="mt-2 text-muted-foreground">...</p>
</div>
```
### events/page.tsx (After)
```tsx
<PageHero
  eyebrow="EVENTS · ఈవెంట్స్"
  title={categoryLabel ? `${categoryLabel} events` : "What's on this weekend"}
  lead="Discover what's happening at Hyderabad's best independent cafes"
/>
```

### Phase 4 — Partner page value cards (Before)
```tsx
const valueCards = [
  { icon: Search, title: "Get Discovered", body: "..." },
  { icon: TrendingUp, title: "Fill Empty Tables", body: "..." },
  { icon: Music, title: "Host Events Effortlessly", body: "..." },
  { icon: CircleDollarSign, title: "Plans Starting at ₹999/month", body: "..." },
];
```
### Partner page value cards (After)
```tsx
const valueCards = [
  {
    emoji: "☕",
    title: "Own a cafe?",
    body: "Get listed where the long-table crowd actually looks. Photos, menu, events — all on one page.",
  },
  {
    emoji: "🎤",
    title: "Running events?",
    body: "Open mics, gigs, workshops — we'll put it in front of the people who care.",
  },
  {
    emoji: "📍",
    title: "Have a space to host?",
    body: "Got a rooftop, a basement, a back room? We'll match it to organisers looking for venues.",
  },
  {
    emoji: "💰",
    title: "Pricing? It's simple.",
    body: "Free to list. Pay only when you sell tickets through us. No upfront fees, no contracts.",
  },
];
```

### Phase 5 — CafeCard (Before)
```tsx
const AREA_VIBES: Record<string, string[]> = {
  "Banjara Hills": ["Specialty Coffee", "Live Music"],
  ...
};
// used below to render vibe pills
```
### CafeCard (After)
```tsx
// AREA_VIBES constant removed entirely. No vibe pills rendered.
// hover title fix:
<h3 className="text-lg font-medium text-foreground line-clamp-1 transition-transform group-hover:-translate-y-[3px]">
// strokeWidth fix:
<MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
```

### Phase 6 — Navbar (Before)
```tsx
const NAV_LINKS = [
  { href: "/cafes", label: "Cafes" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
];
// center tagline:
<p className="hidden text-sm text-white/40 md:block">Made with love in Hyderabad</p>
// active state:
pathname === href ? "text-yellow font-medium" : "text-white/70 hover:text-white"
```
### Navbar (After)
```tsx
const NAV_LINKS = [
  { href: "/cafes", label: "Cafes" },
  { href: "/events", label: "Events" },
  { href: "/submit-event", label: "Submit event" },
  { href: "/about", label: "About" },
];
// center tagline: REMOVED
// active state with underline:
pathname === href
  ? "text-yellow font-medium border-b-2 border-yellow pb-0.5"
  : "text-white/70 font-light hover:text-white"
// mobile sheet: tagline removed, Telugu accent added next to wordmark
<span className="ml-2 text-[10px] tracking-[0.4em] text-yellow/60">హైదరాబాద్</span>
```

### Phase 7 — TeamSection (Before)
```tsx
const TEAM: TeamMember[] = [
  { initials: "W", name: "Wilson", role: "Founder" },
];
```
### TeamSection (After)
```tsx
const TEAM: TeamMember[] = [
  { initials: "W", name: "Wilson", role: "Founder" },
  { initials: "L", name: "Lijohn", role: "Co-founder" },
];
```

---

## 11. Implementation Plan

### Phase 1: V1 + V2 — Font weight and sentence case sweep
**Goal:** Eliminate all `font-semibold`/`font-bold`, fix sentence case on all page titles and CTAs

- [ ] **Task 1.1:** Fix Footer.tsx — `font-semibold` → `font-medium`, `tracking-widest` → `tracking-[0.28em]`, update brand description copy
  - Files: `apps/web/components/layout/Footer.tsx`
- [ ] **Task 1.2:** Fix EventCard.tsx — Early pill `font-semibold` → `font-medium tracking-[0.05em]`
  - Files: `apps/web/components/events/EventCard.tsx`
- [ ] **Task 1.3:** Fix PartnerForm.tsx — CardTitle "Get started", button "Request a callback", `bg-yellow text-black`, `shadow-sm`
  - Files: `apps/web/components/partner/PartnerForm.tsx`
- [ ] **Task 1.4:** Grep entire codebase for any remaining `font-semibold`/`font-bold` in public-facing components and fix
  - Files: any found matches

### Phase 2: Create PageHero component
**Goal:** Single reusable dark hero shell used by every secondary page

- [ ] **Task 2.1:** Create `apps/web/components/layout/PageHero.tsx`
  - Props: `eyebrow: string`, `title: string`, `lead?: string`
  - Dark section with eyebrow, clamp h1, optional lead paragraph

### Phase 3: Swap page heroes (events + cafes)
**Goal:** Replace light hero markup in events and cafes pages with PageHero

- [ ] **Task 3.1:** Update `apps/web/app/(public)/events/page.tsx`
  - Remove light h1/p hero block
  - Add `<PageHero eyebrow="EVENTS · ఈవెంట్స్" title="..." lead="..." />`
  - Fix `${categoryLabel} events` (lowercase)
- [ ] **Task 3.2:** Update `apps/web/app/(public)/cafes/page.tsx`
  - Remove light h1/p hero block
  - Add `<PageHero eyebrow="CAFES · కేఫేలు" title="..." lead="..." />`
  - Fix "All cafes" sentence case
  - Extract inline `EmptyState` function into `apps/web/components/cafes/CafeEmptyState.tsx`

### Phase 4: Update existing dark heroes (partner + submit-event)
**Goal:** Swap partner and submit-event manual dark sections for PageHero (adding eyebrow/Telugu they currently lack)

- [ ] **Task 4.1:** Update `apps/web/app/(public)/partner/page.tsx`
  - Replace `<section className="bg-[#0a0a0a]...">` hero with `<PageHero eyebrow="PARTNER WITH US · మాతో చేరండి" title="Your cafe deserves to be discovered" lead="..." />`
  - Rewrite `valueCards` array — emoji openers, question-form copy, remove icon imports
  - Replace Chevron step icons with `01`/`02`/`03` numeral divs
  - Remove unused lucide imports (Search, TrendingUp, Music, CircleDollarSign, ChevronDown, ChevronRight, FileText, Phone, Rocket)
  - Fix value card radius: `rounded-xl` → `rounded-[10px]`
  - Fix value card icon wrapper: remove (no longer needed)
- [ ] **Task 4.2:** Update `apps/web/app/(public)/submit-event/page.tsx`
  - Replace existing dark `<section>` hero with `<PageHero eyebrow="SUBMIT AN EVENT · ఈవెంట్ సబ్మిట్ చేయండి" title="Bring your event to Hyderabad" lead="..." />`
  - Replace `→` text arrow with `<span className="hidden h-px w-12 bg-foreground/15 md:block" aria-hidden />`
  - Replace lucide step icons with `01`/`02`/`03` numerals
  - Remove unused imports (CalendarCheck, Clock, CheckCircle2)

### Phase 5: CafeCard cleanup
**Goal:** Remove lying AREA_VIBES data, fix stroke, fix hover

- [ ] **Task 5.1:** Update `apps/web/components/cafes/CafeCard.tsx`
  - Delete entire `AREA_VIBES` constant and all references
  - Remove vibe pill render block
  - `strokeWidth={2.5}` → `strokeWidth={1.5}` on MapPin
  - `group-hover:text-foreground/70` → `transition-transform group-hover:-translate-y-[3px]` on h3

### Phase 6: Navbar cleanup
**Goal:** Remove tagline, add underline active state, add Submit event, add Telugu accent

- [ ] **Task 6.1:** Update `apps/web/components/layout/Navbar.tsx`
  - Add `{ href: "/submit-event", label: "Submit event" }` to NAV_LINKS
  - Remove `<p>Made with love in Hyderabad</p>` from desktop (line 34-36)
  - Update active link class to include `border-b-2 border-yellow pb-0.5`
  - Update inactive link class to `font-light` (so active `font-medium` creates hierarchy)
  - Remove `<p>Made with love in Hyderabad</p>` from mobile sheet (line 105-107)
  - Add Telugu accent `<span className="ml-2 text-[10px] tracking-[0.4em] text-yellow/60">హైదరాబాద్</span>` next to mobile wordmark

### Phase 7: About page team section
**Goal:** Add Lijohn as co-founder

- [ ] **Task 7.1:** Update `apps/web/components/about/TeamSection.tsx`
  - Add `{ initials: "L", name: "Lijohn", role: "Co-founder" }` to `TEAM` array

### Phase 8: Basic Code Validation (AI-Only)
**Goal:** Run static analysis only

- [ ] **Task 8.1:** Run linting on all modified files
  - Command: `cd apps/web && npm run lint`
- [ ] **Task 8.2:** Run type checking
  - Command: `cd apps/web && npm run type-check`
- [ ] **Task 8.3:** Verify no remaining `font-semibold`/`font-bold` in public components
  - Grep: `font-semibold|font-bold` across `apps/web/components/` and `apps/web/app/(public)/`

### Phase 9: Comprehensive Code Review (Mandatory)
- [ ] **Task 9.1:** Present "Implementation Complete!" message and wait for user approval
- [ ] **Task 9.2:** Execute comprehensive code review if approved

### Phase 10: User Browser Testing
- [ ] **Task 10.1:** 👤 USER TESTING — Visit all pages, verify heroes, fonts, partner page, navbar

---

## 12. Task Completion Tracking

- [x] **Phase 1: V1+V2 sweep** — complete
- [x] **Phase 2: PageHero component** — complete
- [x] **Phase 3: Swap events+cafes heroes** — complete
- [x] **Phase 4: Update partner+submit-event** — complete
- [x] **Phase 5: CafeCard cleanup** — complete
- [x] **Phase 6: Navbar cleanup** — complete
- [x] **Phase 7: Team section** — complete
- [x] **Phase 8: Code validation** — complete
- [x] **Phase 9: Code review** — complete
- [x] **Phase 10: User browser testing** — complete

---

## 13. File Structure

### New Files to Create
```
apps/web/components/layout/PageHero.tsx        ← reusable dark hero shell
apps/web/components/cafes/CafeEmptyState.tsx   ← extracted from cafes/page.tsx
```

### Files to Modify
- `apps/web/components/layout/Footer.tsx`
- `apps/web/components/layout/Navbar.tsx`
- `apps/web/components/events/EventCard.tsx`
- `apps/web/components/cafes/CafeCard.tsx`
- `apps/web/components/partner/PartnerForm.tsx`
- `apps/web/components/about/TeamSection.tsx`
- `apps/web/app/(public)/events/page.tsx`
- `apps/web/app/(public)/cafes/page.tsx`
- `apps/web/app/(public)/partner/page.tsx`
- `apps/web/app/(public)/submit-event/page.tsx`

### Dependencies to Add
None.

---

## 14. Potential Issues & Security Review

- **CafeCard AREA_VIBES removal:** Removing the vibe pills will change the card layout (more whitespace under the cafe name). This is intentional — honest empty state is better than false data.
- **Partner page lucide imports:** When removing icon references from valueCards, ensure the lucide imports are also removed to avoid unused-import lint errors.
- **Navbar Submit event link on mobile:** The mobile sheet already renders `NAV_LINKS` via a map, so adding to the array is sufficient — no mobile-specific change needed beyond removing the tagline.
- **PageHero on events page with active category filter:** The dynamic title (`${categoryLabel} events`) must remain lowercase. Confirmed: sentence case only means first word capitalised, rest lower.

---

## 15. Deployment & Configuration
No environment variable changes. No database changes. Deploy as normal.

---

## 16. AI Agent Instructions

Follow the standard workflow. Key reminders for this task:
- No database migrations — skip all db steps
- PageHero is a Server Component — no `"use client"` directive
- When removing AREA_VIBES from CafeCard, also remove the import of any types it used and any conditional render that was gated on `vibes.length > 0`
- When replacing partner page icons with numerals, delete ALL the now-unused lucide imports
- Run `npm run lint` and `npm run type-check` after all phases before presenting completion

**👤 IMPLEMENTATION OPTIONS:**

**A) Preview High-Level Code Changes**
Show detailed before/after snippets for each file before touching anything.

**B) Proceed with Implementation**
Start phase-by-phase immediately.

**C) Provide More Feedback**
Adjust the plan first.

---

## 17. Notes

### Eyebrow text reference (Latin · Telugu)
- Events: `EVENTS · ఈవెంట్స్`
- Cafes: `CAFES · కేఫేలు`
- About: `ABOUT · మా గురించి` (already has eyebrow but no Telugu — fix in Week 2 task)
- Partner: `PARTNER WITH US · మాతో చేరండి`
- Submit event: `SUBMIT AN EVENT · ఈవెంట్ సబ్మిట్ చేయండి`

### About page hero note
The about page already has the dark hero pattern with an eyebrow. The about hero eyebrow currently reads just "About" with no Telugu. That fix (adding Telugu) is included in Week 2 task 026 alongside the body copy trim. Do not touch about/page.tsx in this task.

---

## 18. Second-Order Consequences

- **No breaking changes** — all pure UI edits, no data contracts changed
- **CafeCard visual change:** Cards will now show no vibe pills for any cafe. This is intentional and correct per the audit. If real tag data is added to the schema in future, the pills can be re-added from actual data.
- **Navbar layout shift:** Removing the center tagline will change the 3-column nav layout to wordmark-left / links+CTA-right. This is correct brand behaviour and intentional.
- **Partner page copy change:** The new question-form value cards are significantly different from the current SaaS copy. Wilson should review the final page before launch.

---

*Task created: 2026-05-10*
*Audit source: May 2026 frontend design audit*
