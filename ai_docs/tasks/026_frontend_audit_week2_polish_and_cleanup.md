# AI Task Document — 026

## 1. Task Overview

### Task Title
**Title:** Frontend Audit Week 2 — Token cleanup, EventCard fixes, about copy, parallax, footer, legal, Telugu font

### Goal Statement
**Goal:** Complete the remaining items from the May 2026 frontend design audit after Week 1 fixes are live. Covers: V4 card radii, V5 bg-secondary token replacement, EventCard visual fixes (gradient fallback, date badge, hover), dead code deletion (CategoryFilterCards.tsx), About page copy trim and pull-quote font, hero parallax performance + motion safety, footer bottom-bar legibility, legal page eyebrow style, Telugu font loading, and Marquee strip local words. No database changes.

---

## 2. Strategic Analysis & Solution Options

Strategic analysis not required — all changes have a single correct implementation specified by the audit.

---

## 3. Project Analysis & Current State

### Technology & Architecture
Same as Task 025. Next.js 15.5.4, React 19, TypeScript 5 strict, Tailwind CSS 3.4.1, shadcn/ui. No auth context. Light-only.

### Current State (confirmed by file reads)

**V4 — Card radii wrong:**
- `apps/web/app/(public)/partner/page.tsx:85` — value cards `rounded-xl` (12px) → should be `rounded-[10px]`
  - NOTE: This will be `rounded-[10px]` after the Week 1 rewrite anyway since we're rebuilding the cards. Verify after 025 is merged.
- `apps/web/components/events/CategoryFilterCards.tsx:62` — filter cards `rounded-xl` → `rounded-[10px]`
  - NOTE: CategoryFilterCards is dead code (events page uses CategoryFilterTabs). This component will be deleted entirely in this task — so the radius fix is moot, just delete the file.

**V5 — bg-foreground/8 fragile token:**
- `apps/web/components/events/EventCard.tsx:46` — `bg-foreground/8` on image placeholder container
- `apps/web/components/cafes/CafeCard.tsx:32` — `bg-foreground/8` on image placeholder container (after Week 1, the inner fallback div will still use `bg-foreground/5`)
- `apps/web/app/(public)/partner/page.tsx:87` — `bg-foreground/8` on icon wrapper (may be gone after Week 1 rewrite — verify)
- `apps/web/app/(public)/submit-event/page.tsx:61` — `bg-foreground/8` on step icon circle

**EventCard visual issues:**
- `apps/web/components/events/EventCard.tsx:56` — fallback gradient `from-[#0a0a0a]/10 to-[#fbf497]/10` (gradients banned)
- `apps/web/components/events/EventCard.tsx:64` — date badge `text-xs` → should be `text-[11px] font-medium tracking-[2px] uppercase`
- `apps/web/components/events/EventCard.tsx:76` — `group-hover:text-foreground/70` on title (wrong hover)

**Dead code:**
- `apps/web/components/events/CategoryFilterCards.tsx` — entire file unused (events page imports CategoryFilterTabs)

**About page:**
- `apps/web/app/(public)/about/page.tsx:31-57` — 4 paragraphs of mission prose (too long for brand voice)
- `apps/web/app/(public)/about/page.tsx:62-67` — pull-quote uses italic DM Sans, not DM Serif Display
- `apps/web/app/(public)/about/page.tsx:66` — "Discover. Connect. Experience." tagline — delete
- `apps/web/app/(public)/about/page.tsx:74-96` — duplicate CTA section (already have one in the hero / partner page)
- About page dark hero eyebrow currently reads `"About"` with no Telugu → add `"ABOUT · మా గురించి"`

**Hero parallax:**
- `apps/web/components/landing/HeroSection.tsx:14-24` — no `requestAnimationFrame` throttle on scroll handler
- No `prefers-reduced-motion` guard

**Footer:**
- `apps/web/components/layout/Footer.tsx:91` — `text-white/25` on bottom bar copyright (too dim) → `text-white/40`
  - NOTE: font-semibold and copy already fixed in Week 1. This task handles bottom-bar opacity only.

**Legal pages:**
- `apps/web/components/legal/LastUpdated.tsx` — check current style, apply eyebrow style: `text-[11px] uppercase tracking-[0.28em] text-foreground/50`
- Legal body copy: `apps/web/components/legal/LegalLayout.tsx` — verify body uses `font-light text-[15px] leading-[1.85]`

**Telugu font:**
- `apps/web/app/layout.tsx` — currently loads only DM Sans + DM Serif Display. Add Noto Sans Telugu 300/500 from Google Fonts.
- No `font-telugu` utility class exists yet — needs to be added to Tailwind config or as a CSS class.

**Marquee strip:**
- `apps/web/components/landing/MarqueeStrip.tsx` — needs 1-2 Telugu/local words added: `Irani Chai · Baithak Nights · Biryani Sundays · హైదరాబాద్`

---

## 4. Context & Problem Definition

### Problem Statement
After Week 1 fixes handle the most visible brand violations, Week 2 completes the detail polish that separates a good-looking site from a great one. The `bg-foreground/8` token is technically fragile in Tailwind v3. The EventCard gradient fallback violates the no-gradients rule. The About page reads like a startup pitch deck. The parallax has no motion safety. The legal pages use inconsistent typography. The Telugu font is loaded nowhere, meaning any Telugu text currently falls back to a generic sans-serif.

### Success Criteria
- [ ] `CategoryFilterCards.tsx` deleted
- [ ] All `bg-foreground/8` and `bg-foreground/[0.06]` replaced with `bg-secondary` in public components
- [ ] EventCard image fallback uses `bg-secondary` with initial letter, no gradient
- [ ] EventCard date badge is `text-[11px] font-medium tracking-[2px] uppercase`
- [ ] EventCard title hover is `transition-transform group-hover:-translate-y-[3px]`, not text-dim
- [ ] About page body trimmed to 2 paragraphs max
- [ ] About page pull-quote uses `font-display` / DM Serif Display (`font-serif` Tailwind class or `t-editorial`)
- [ ] "Discover. Connect. Experience." tagline deleted from about page
- [ ] About page duplicate CTA section removed — keep only the one that makes sense in context (or trim both to a single lighter CTA)
- [ ] About hero eyebrow updated to `"ABOUT · మా గురించి"`
- [ ] HeroSection parallax wrapped in `requestAnimationFrame` and guarded with `prefers-reduced-motion`
- [ ] Footer bottom bar `text-white/25` → `text-white/40`
- [ ] LastUpdated component uses eyebrow style
- [ ] Legal body copy uses `font-light text-[15px] leading-[1.85]`
- [ ] Noto Sans Telugu loaded in `app/layout.tsx`
- [ ] `font-telugu` utility class available for Telugu text
- [ ] Marquee strip contains at least one Telugu/local word

---

## 5. Development Mode Context
- New application in active development
- No backwards compatibility concerns
- Deleting dead code file (CategoryFilterCards.tsx) is safe — it is not imported anywhere
- About page copy changes are copy edits only — no schema impact

---

## 6. Technical Requirements

### Functional Requirements
- Noto Sans Telugu must load at weights 300 and 500 (matching DM Sans weights used on the site)
- `font-telugu` class must set `font-family: 'Noto Sans Telugu', 'DM Sans', sans-serif` with graceful fallback
- Parallax `prefers-reduced-motion` guard must be a simple `if` at the top of the effect — skip attaching the scroll listener entirely if motion is reduced
- Legal page body text changes must apply globally via the LegalLayout component, not page-by-page

### Non-Functional Requirements
- **Performance:** rAF throttle on parallax scroll prevents layout thrash on low-end mobile
- **Accessibility:** `prefers-reduced-motion: reduce` must completely disable the parallax — no partial motion
- **Responsive:** All changes must work 320px+

### Technical Constraints
- Tailwind v3 — use `bg-secondary` (the actual CSS variable token), not fragile `/8` opacity syntax
- Google Fonts: Noto Sans Telugu subset — load via `next/font/google` same as DM Sans
- Do not modify `apps/web/components/ui/` shadcn components

---

## 7. Data & Database Changes
None.

---

## 8. API & Backend Changes
None.

---

## 9. Frontend Changes

### Files to Delete
- [ ] **`apps/web/components/events/CategoryFilterCards.tsx`** — dead code, unused

### Files to Modify
- [ ] **`apps/web/components/events/EventCard.tsx`** — fallback bg, date badge, hover, bg-secondary token
- [ ] **`apps/web/components/cafes/CafeCard.tsx`** — bg-secondary token (if any bg-foreground/8 remains after Week 1)
- [ ] **`apps/web/app/(public)/about/page.tsx`** — trim body copy, pull-quote font, delete tagline, fix eyebrow Telugu, remove duplicate CTA
- [ ] **`apps/web/components/landing/HeroSection.tsx`** — rAF + prefers-reduced-motion
- [ ] **`apps/web/components/layout/Footer.tsx`** — `text-white/25` → `text-white/40` on bottom bar
- [ ] **`apps/web/components/legal/LastUpdated.tsx`** — eyebrow style
- [ ] **`apps/web/components/legal/LegalLayout.tsx`** — body text style
- [ ] **`apps/web/app/layout.tsx`** — add Noto Sans Telugu font
- [ ] **`apps/web/components/landing/MarqueeStrip.tsx`** — add Telugu/local words
- [ ] **`apps/web/app/(public)/submit-event/page.tsx`** — `bg-foreground/8` on step icon circle → `bg-secondary` (if not already fixed in Week 1)

---

## 10. Code Changes Overview

### Phase 1 — Delete dead code + V5 token replacement

#### DELETE
```
apps/web/components/events/CategoryFilterCards.tsx
```

#### EventCard.tsx image fallback (Before)
```tsx
<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0a0a0a]/10 to-[#fbf497]/10">
  <span className="text-3xl font-medium text-foreground/20">
    {event.title.charAt(0)}
  </span>
</div>
```
#### EventCard.tsx image fallback (After)
```tsx
<div className="flex h-full w-full items-center justify-center bg-secondary">
  <span className="text-3xl font-medium text-foreground/20">
    {event.title.charAt(0)}
  </span>
</div>
```

#### EventCard.tsx image container (Before)
```tsx
<div className="relative h-48 w-full overflow-hidden bg-foreground/8">
```
#### EventCard.tsx image container (After)
```tsx
<div className="relative h-48 w-full overflow-hidden bg-secondary">
```

#### EventCard.tsx date badge (Before)
```tsx
<span className="absolute left-3 top-3 rounded-md bg-[#0a0a0a]/80 px-2 py-1 text-xs font-medium text-[#f8f7f2]">
```
#### EventCard.tsx date badge (After)
```tsx
<span className="absolute left-3 top-3 rounded-md bg-[#0a0a0a]/80 px-2 py-1 text-[11px] font-medium tracking-[2px] uppercase text-[#f8f7f2]">
```

#### EventCard.tsx title hover (Before)
```tsx
<h3 className="line-clamp-2 text-lg font-medium text-foreground transition-colors group-hover:text-foreground/70">
```
#### EventCard.tsx title hover (After)
```tsx
<h3 className="line-clamp-2 text-lg font-medium text-foreground transition-transform group-hover:-translate-y-[3px]">
```

### Phase 2 — About page

#### about/page.tsx body copy (Before — 4 paragraphs)
```tsx
<section className="bg-background px-4 py-14 sm:px-6 sm:py-16">
  <div className="mx-auto max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
    <p>GoOutHyd was built by people who have spent years...</p>
    <p>Too many great events happen to half-empty rooms...</p>
    <p>GoOutHyd exists to fix that...</p>
    <p>We're building a creative ecosystem...</p>
  </div>
</section>
```
#### about/page.tsx body copy (After — 2 paragraphs)
```tsx
<section className="bg-background px-4 py-14 sm:px-6 sm:py-16">
  <div className="mx-auto max-w-3xl space-y-5 text-[15px] font-light leading-[1.85] text-muted-foreground">
    <p>
      We've spent years putting together live events across Hyderabad — working with artists, 
      DJs, bands, performers, and the spaces that host them. Too many great nights happened 
      to half-empty rooms because the right people simply didn't hear about them.
    </p>
    <p>
      GoOutHyd is where that changes. One place to find what's happening — and for the people 
      making it happen to be found. If you make things in this city, you should be on here.
    </p>
  </div>
</section>
```

#### about/page.tsx pull-quote (Before)
```tsx
<blockquote className="text-xl italic leading-snug text-foreground sm:text-2xl md:text-3xl">
  It's not just about finding what's on this weekend. It's about building a city...
</blockquote>
<p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
  Discover. Connect. Experience.
</p>
```
#### about/page.tsx pull-quote (After)
```tsx
<blockquote className="font-serif text-xl italic leading-snug text-foreground sm:text-2xl md:text-3xl">
  It's not just about finding what's on this weekend. It's about building a city where 
  great things keep happening.
</blockquote>
{/* "Discover. Connect. Experience." deleted */}
```

#### about/page.tsx hero eyebrow (Before)
```tsx
<span className="mb-[14px] block text-[11px] font-medium uppercase tracking-[0.4em] text-yellow opacity-85">
  About
</span>
```
#### about/page.tsx hero eyebrow (After)
```tsx
<span className="mb-[14px] block text-[11px] font-medium uppercase tracking-[0.4em] text-yellow opacity-85">
  ABOUT · మా గురించి
</span>
```

### Phase 3 — HeroSection parallax

#### HeroSection.tsx (Before)
```tsx
useEffect(() => {
  const onScroll = () => {
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);
```
#### HeroSection.tsx (After)
```tsx
useEffect(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let raf = 0;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(raf);
  };
}, []);
```

### Phase 4 — Telugu font loading

#### app/layout.tsx (Before — schematic)
```tsx
import { DM_Sans, DM_Serif_Display } from "next/font/google";
```
#### app/layout.tsx (After)
```tsx
import { DM_Sans, DM_Serif_Display, Noto_Sans_Telugu } from "next/font/google";

const notoSansTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["300", "500"],
  variable: "--font-telugu",
  display: "swap",
});
// add notoSansTelugu.variable to <html> className
```
#### tailwind.config.ts (After — add font-telugu utility)
```ts
fontFamily: {
  telugu: ["var(--font-telugu)", "DM Sans", "sans-serif"],
}
```

---

## 11. Implementation Plan

### Phase 1: Delete dead code + V5 bg-secondary token sweep
**Goal:** Remove CategoryFilterCards, replace all bg-foreground/8 in public components

- [ ] **Task 1.1:** Delete `apps/web/components/events/CategoryFilterCards.tsx`
- [ ] **Task 1.2:** Grep for `bg-foreground/8` and `bg-foreground/\[0.06\]` in all public components
  - Files: `apps/web/components/`, `apps/web/app/(public)/`
  - Fix each occurrence: replace with `bg-secondary`
- [ ] **Task 1.3:** Fix EventCard.tsx image container + fallback div — `bg-foreground/8` → `bg-secondary`, gradient → solid `bg-secondary`
  - Files: `apps/web/components/events/EventCard.tsx`

### Phase 2: EventCard visual fixes
**Goal:** Date badge spec, hover behavior

- [ ] **Task 2.1:** Fix date badge text — `text-xs` → `text-[11px] font-medium tracking-[2px] uppercase`
  - Files: `apps/web/components/events/EventCard.tsx`
- [ ] **Task 2.2:** Fix title hover — `group-hover:text-foreground/70` → `transition-transform group-hover:-translate-y-[3px]`
  - Files: `apps/web/components/events/EventCard.tsx`
- [ ] **Task 2.3:** Add `hover:-translate-y-[3px] transition-transform` to the card Link wrapper (card-level lift)
  - Files: `apps/web/components/events/EventCard.tsx`

### Phase 3: About page copy + pull-quote + eyebrow + CTA cleanup
**Goal:** Trim prose, fix pull-quote font, remove corporate tagline, fix eyebrow Telugu, remove duplicate CTA

- [ ] **Task 3.1:** Trim body copy to 2 paragraphs, update text style
  - Files: `apps/web/app/(public)/about/page.tsx`
- [ ] **Task 3.2:** Apply `font-serif` to pull-quote blockquote (uses DM Serif Display)
  - Files: `apps/web/app/(public)/about/page.tsx`
- [ ] **Task 3.3:** Delete "Discover. Connect. Experience." `<p>` tag entirely
  - Files: `apps/web/app/(public)/about/page.tsx`
- [ ] **Task 3.4:** Update eyebrow text to `"ABOUT · మా గురించి"`
  - Files: `apps/web/app/(public)/about/page.tsx`
- [ ] **Task 3.5:** Remove the duplicate final CTA section (the `bg-secondary` section at the bottom with "Want to be part of it?")
  - Files: `apps/web/app/(public)/about/page.tsx`

### Phase 4: HeroSection parallax safety
**Goal:** rAF throttle + prefers-reduced-motion guard

- [ ] **Task 4.1:** Wrap parallax scroll handler in rAF, add motion preference guard
  - Files: `apps/web/components/landing/HeroSection.tsx`

### Phase 5: Footer bottom-bar legibility
**Goal:** Improve copyright text contrast

- [ ] **Task 5.1:** `text-white/25` → `text-white/40` on both copyright spans in bottom bar
  - Files: `apps/web/components/layout/Footer.tsx`

### Phase 6: Legal page typography
**Goal:** LastUpdated eyebrow style, body text consistency

- [ ] **Task 6.1:** Read `apps/web/components/legal/LastUpdated.tsx` and update to eyebrow style
  - Target: `text-[11px] uppercase tracking-[0.28em] text-foreground/50`
- [ ] **Task 6.2:** Read `apps/web/components/legal/LegalLayout.tsx` and verify/update body text
  - Target: prose body at `font-light text-[15px] leading-[1.85]`

### Phase 7: Telugu font loading
**Goal:** Noto Sans Telugu available sitewide via CSS variable

- [ ] **Task 7.1:** Read `apps/web/app/layout.tsx` and add Noto Sans Telugu font
  - Use `next/font/google` Noto_Sans_Telugu, weights 300 + 500, `--font-telugu` variable
  - Add variable to `<html>` className
- [ ] **Task 7.2:** Read `apps/web/tailwind.config.ts` and add `telugu` to fontFamily
  - `fontFamily: { telugu: ["var(--font-telugu)", "DM Sans", "sans-serif"] }`

### Phase 8: Marquee strip
**Goal:** Add local/Telugu words to the marquee

- [ ] **Task 8.1:** Read `apps/web/components/landing/MarqueeStrip.tsx` and add items
  - Add: `Irani Chai`, `Baithak Nights`, `Biryani Sundays`, `హైదరాబాద్`

### Phase 9: Basic Code Validation (AI-Only)
**Goal:** Run static analysis only

- [ ] **Task 9.1:** Run linting
  - Command: `cd apps/web && npm run lint`
- [ ] **Task 9.2:** Run type checking
  - Command: `cd apps/web && npm run type-check`
- [ ] **Task 9.3:** Confirm CategoryFilterCards.tsx is not imported anywhere
  - Grep: `CategoryFilterCards` across `apps/web/`

### Phase 10: Comprehensive Code Review (Mandatory)
- [ ] **Task 10.1:** Present "Implementation Complete!" and wait for user approval
- [ ] **Task 10.2:** Execute comprehensive code review if approved

### Phase 11: User Browser Testing
- [ ] **Task 11.1:** 👤 USER TESTING — Visit landing page (parallax), about page, events page, legal pages. Check Telugu rendering.

---

## 12. Task Completion Tracking

- [x] **Phase 1: Dead code + V5 token sweep** — complete
- [x] **Phase 2: EventCard visual fixes** — complete
- [x] **Phase 3: About page** — complete
- [x] **Phase 4: Parallax safety** — complete
- [x] **Phase 5: Footer bottom bar** — complete
- [x] **Phase 6: Legal typography** — complete
- [x] **Phase 7: Telugu font** — complete
- [x] **Phase 8: Marquee strip** — complete
- [x] **Phase 9: Code validation** — complete
- [x] **Phase 10: Code review** — skipped
- [ ] **Phase 11: User browser testing** — in progress

---

## 13. File Structure

### Files to Delete
```
apps/web/components/events/CategoryFilterCards.tsx
```

### Files to Modify
```
apps/web/components/events/EventCard.tsx
apps/web/components/cafes/CafeCard.tsx            (if any bg-foreground/* tokens remain after Week 1)
apps/web/app/(public)/about/page.tsx
apps/web/components/landing/HeroSection.tsx
apps/web/components/layout/Footer.tsx
apps/web/components/legal/LastUpdated.tsx
apps/web/components/legal/LegalLayout.tsx
apps/web/app/layout.tsx
apps/web/tailwind.config.ts
apps/web/components/landing/MarqueeStrip.tsx
apps/web/app/(public)/submit-event/page.tsx       (bg-foreground/8 on step icons, if not handled in Week 1)
```

### Dependencies to Add
None — Noto Sans Telugu is loaded via `next/font/google` (already a project dependency).

---

## 14. Potential Issues & Security Review

- **CategoryFilterCards deletion:** Before deleting, grep for any import of this component across the entire `apps/web/` directory. The events page already uses `CategoryFilterTabs`, but verify no other page imports `CategoryFilterCards`.
- **About page CTA removal:** The page currently ends with two CTA sections (hero partner CTA + bottom "Want to be part of it?"). After removing the duplicate, confirm the page still has a clear action — the hero section has no CTA, so the final CTA section is actually the only one. Reconsider: keep the final CTA as the single one, remove it from the hero if one exists, or keep it but trim. Read the full about page again before removing.
- **Telugu font bundle size:** Noto Sans Telugu is a large font file. Using `subsets: ["telugu"]` and `display: "swap"` keeps it non-blocking. Since it's only used on a few eyebrow labels, the load is minimal.
- **LegalLayout body text:** Changing global body text size/weight in LegalLayout will affect all 3 legal pages simultaneously. This is the correct approach (DRY), but visually verify all three pages after the change.

---

## 15. Deployment & Configuration
No environment variable changes. No database changes.

---

## 16. AI Agent Instructions

**Prerequisite:** Task 025 must be completed and merged before starting this task, since several of the V5 token fixes depend on what remains after the Week 1 rewrites (e.g., partner page icon wrappers may already be gone).

Follow the standard workflow. Key reminders:
- Read `apps/web/app/layout.tsx` before editing to understand current font setup
- Read `apps/web/tailwind.config.ts` before editing
- Read `apps/web/components/landing/MarqueeStrip.tsx` before editing
- Read `apps/web/components/legal/LastUpdated.tsx` and `LegalLayout.tsx` before editing
- Confirm `CategoryFilterCards` is not imported anywhere before deleting
- Re-read `about/page.tsx` before making copy changes to have the full current text

**👤 IMPLEMENTATION OPTIONS:**

**A) Preview High-Level Code Changes**
Show detailed before/after snippets for each file before touching anything.

**B) Proceed with Implementation**
Start phase-by-phase immediately.

**C) Provide More Feedback**
Adjust the plan first.

---

## 17. Notes

### CafeCard same-file hover fix note
Task 025 already fixes `group-hover:text-foreground/70` on CafeCard's title to `transition-transform group-hover:-translate-y-[3px]`. Confirm that fix is in 025; if not, do it here in Phase 1 alongside the bg-secondary token sweep.

### About page CTA audit (read before Phase 3)
Before removing the final "Want to be part of it?" CTA, re-read the full about page in its Week 1 state (after PageHero is applied). The about page uses PageHero from 025 which does NOT include a CTA. So the bottom CTA section is the only action on the page — evaluate whether to keep it with trimmed copy or remove entirely. Default: keep it but simplify to one button.

### V4 partner card radius
Task 025 fully rewrites the partner value cards. After that rewrite, confirm the new cards use `rounded-[10px]` (brand spec). If the rewrite accidentally uses `rounded-xl`, fix it here. No separate action needed if 025 gets it right.

---

## 18. Second-Order Consequences

- **Deleting CategoryFilterCards.tsx:** Zero user impact — it is not rendered anywhere. Verify with grep before deletion.
- **About page copy change:** The body text goes from 4 paragraphs (~200 words) to 2 (~70 words). This is a significant content reduction. Wilson should review before the page goes live with this change.
- **Footer bottom-bar contrast:** `text-white/40` is still subtle (40% opacity white on black), but comfortably above WCAG AA for large text at small sizes. This is intentional — the copyright line should be secondary, not prominent.
- **Parallax rAF:** No visual change for most users. Users with `prefers-reduced-motion: reduce` will see a static hero image — this is the correct accessible behaviour.
- **Telugu font:** First page load will trigger a font download (~150KB for Telugu subset). `display: "swap"` means the page renders immediately with DM Sans fallback and swaps when loaded — no layout shift for Latin text, possible FOUT for Telugu characters.

---

*Task created: 2026-05-10*
*Prerequisite: Task 025 must be complete*
*Audit source: May 2026 frontend design audit*
