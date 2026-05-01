# Task 023 — Global Color Token Migration (Dead Palette Purge)

## 1. Task Overview

### Task Title
**Title:** Global Color Token Migration — Purge All Dead Palette Tokens from Non-Landing Pages

### Goal Statement
**Goal:** Eliminate every remaining instance of the old Irani-cafe color tokens (`caramel`, `espresso`, `roast`, `cream`, `milk`, `foam`, `brand-border`, `input-border`, `font-heading`) from all public pages and components **outside** `components/landing/`. The landing page rebrand (Task 022) is complete. This task finishes the job for the events, cafes, about, partner, submit-event, legal, and 404 pages. Admin dashboard components are already clean — no changes needed there.

---

## 2. Strategic Analysis

*No strategic analysis required — the approach is a direct mechanical token swap using the established cheat sheet from Task 022. All decisions are already made.*

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15 (App Router), React 19
- **Language:** TypeScript (strict mode)
- **UI & Styling:** shadcn/ui + Tailwind CSS v4
- **Key Architectural Patterns:** Server Components, Server Actions, `app/(public)/` route group

### Current State

Task 022 completed the landing page and fixed cross-cutting violations (Navbar, Footer, GooutOfficialBadge, EventEmptyState). However, the following files still use dead tokens confirmed by grep scan on 2026-05-01:

**`app/` pages (public):**
- `app/not-found.tsx` — `bg-cream`, `text-caramel`, `font-heading`, `text-espresso`, `text-roast`, `bg-caramel`, `text-foam`, `focus-visible:ring-caramel`, `focus-visible:ring-offset-cream`, `hover:bg-caramel`
- `app/(public)/submit-event/page.tsx` — `bg-espresso`, `font-heading`, `text-cream`, `bg-milk`, `text-espresso`, `bg-caramel/20`, `text-caramel`, `bg-cream`
- `app/(public)/submit-event/loading.tsx` — `bg-espresso`, `bg-cream/10`, `bg-milk`, `bg-roast/10`, `brand-border`, `bg-foam`, `bg-cream`
- `app/(public)/partner/page.tsx` — `bg-espresso`, `font-heading`, `text-cream`, `bg-cream`, `text-espresso`, `brand-border`, `bg-foam`, `bg-caramel/15`, `text-caramel`, `bg-milk`, `text-roast/80`, `text-roast/80`, `bg-caramel/20`, `text-espresso`
- `app/(public)/partner/loading.tsx` — `bg-espresso`, `bg-cream/10`, `bg-cream`, `bg-roast/10`, `brand-border`, `bg-foam`, `bg-milk`
- `app/(public)/verify/[code]/page.tsx` — `border-caramel/40`, `bg-foam`, `bg-caramel/15`, `text-caramel`, `font-heading`, `text-espresso`, `text-roast/70`, `text-roast/50`
- `app/(public)/terms/page.tsx` — `text-caramel`, `hover:text-espresso` (line 123)

**`components/` (non-landing, non-admin):**
- `components/cafes/CafeCard.tsx` — `brand-border`, `bg-foam`, `bg-roast/10`, `bg-caramel/5`, `font-heading`, `text-caramel/40`, `bg-milk`, `text-roast/70`, `font-heading`, `text-espresso`, `group-hover:text-caramel`, `text-roast/60`
- `components/cafes/CafeUpcomingEvents.tsx` — `font-heading`, `text-espresso`, `brand-border`, `bg-foam`, `text-espresso`, `group-hover:text-caramel`, `text-roast/60`, `bg-caramel/10`, `text-caramel`, `text-espresso`, `text-roast/50`
- `components/cafes/MenuHighlights.tsx` — `font-heading`, `text-espresso`, `text-roast/60`, `text-espresso`, `text-roast/70`, `text-roast/50`
- `components/cafes/PhotoGallery.tsx` — `font-heading`, `text-espresso`
- `components/cafes/QuickContactBar.tsx` — `brand-border`, `bg-foam`, `text-espresso`, `hover:text-caramel`, `text-caramel` (icons), `text-roast/70`
- `components/about/TeamSection.tsx` — `bg-cream`, `font-heading`, `text-espresso`, `bg-caramel/10`, `font-heading`, `text-caramel`, `text-espresso`, `text-roast/60`
- `components/partner/PartnerForm.tsx` — `brand-border`, `bg-foam`, `font-heading`, `text-espresso`, `text-roast/80`, `text-roast/50`, `border-input-border`, `bg-caramel`, `text-foam`, `hover:bg-caramel/90`
- `components/submit-event/EventSubmitForm.tsx` — `brand-border`, `bg-foam`, `font-heading`, `text-espresso`, `text-roast/80`, `text-roast/50`, `border-input-border`, `bg-caramel`, `text-foam`, `hover:bg-caramel/90`

**Admin components:** ✅ Already clean — zero hits in `components/admin/`.

---

## 4. Context & Problem Definition

### Problem Statement
The landing page is fully rebranded but users visiting `/cafes`, `/partner`, `/submit-event`, `/verify`, `/terms`, and the 404 page still see the old warm-cafe aesthetic: orange caramel CTAs, espresso dark-navy text, cream backgrounds, serif `font-heading` headings. This creates an inconsistent brand experience. The new design system uses `#0a0a0a` near-black, `#f8f7f2` warm white, `#fbf497` yellow, and DM Sans (`font-sans font-medium`) everywhere.

### Success Criteria
- [ ] Zero instances of `caramel`, `espresso`, `roast`, `cream`, `milk`, `foam`, `brand-border`, `input-border`, `font-heading` in any `.tsx` file under `apps/web/` (excluding `tailwind.config.ts` and `globals.css` which are already handled, and admin components which are already clean)
- [ ] All CTA buttons on public pages use `bg-[#0a0a0a] text-[#fbf497] hover:bg-[#0a0a0a]/90`
- [ ] All section backgrounds use `bg-background`, `bg-secondary`, or `bg-[#0a0a0a]`
- [ ] All headings use `font-sans font-medium` (or `text-foreground`), not `font-heading`
- [ ] Lint + type-check pass with zero errors after all changes

---

## 5. Development Mode Context
- **🚨 Active development — no backwards compatibility concerns**
- Pure visual/class-name changes — no logic, schema, or API changes
- Aggressive find-and-replace is appropriate and expected

---

## 6. Technical Requirements

### The Token Replacement Cheat Sheet

| Old token | Replacement |
|---|---|
| `text-espresso` | `text-foreground` |
| `text-roast` / `text-roast/70` / `text-roast/80` | `text-muted-foreground` |
| `text-roast/60` / `text-roast/55` | `text-muted-foreground` |
| `text-roast/50` | `text-foreground/40` |
| `bg-foam` | `bg-card` |
| `bg-milk` | `bg-secondary` |
| `bg-cream` | `bg-background` |
| `bg-caramel` | `bg-[#0a0a0a]` |
| `text-caramel` | `text-[#fbf497]` |
| `text-foam` | `text-[#0a0a0a]` |
| `border-brand-border` | `border-border` |
| `border-input-border` | `border-input` |
| `font-heading` | *(delete the class — no replacement)* |
| `hover:text-caramel` | `hover:text-foreground/70` |
| `hover:text-espresso` | `hover:text-foreground/70` |
| `hover:bg-caramel/90` | `hover:bg-[#0a0a0a]/90` |
| `hover:bg-caramel/10` | `hover:bg-foreground/5` |
| `focus-visible:ring-caramel` | `focus-visible:ring-[#fbf497]` |
| `focus-visible:ring-offset-cream` | `focus-visible:ring-offset-background` |
| `bg-caramel/20` / `bg-caramel/15` | `bg-[#fbf497]/20` (icon bg on dark) or `bg-foreground/8` (icon bg on light) |
| `bg-caramel/10` | `bg-foreground/8` |
| `bg-caramel/5` | `bg-foreground/5` |
| `text-caramel/40` | `text-foreground/20` |
| `bg-cream/10` | `bg-white/10` (skeleton on dark `bg-[#0a0a0a]`) |
| `text-caramel/40` on arrows | `text-foreground/30` |
| `group-hover:text-caramel` | `group-hover:text-foreground/70` |

### Special decisions:
- **`bg-espresso` sections (dark hero bands):** Replace with `bg-[#0a0a0a]`
- **`text-cream` on dark backgrounds:** Replace with `text-[#f8f7f2]` or `text-foreground`
- **`text-foam/90` on dark backgrounds:** Replace with `text-[#f8f7f2]/90`
- **`font-body` class:** Replace with nothing (DM Sans is the default `font-sans`) — or just delete it
- **Icon accent colors (`text-caramel` on icons inside contact/feature cards):** `text-muted-foreground`
- **Verification page valid border `border-caramel/40`:** `border-[#fbf497]/40`
- **Verification page valid badge `bg-caramel/15 text-caramel`:** `bg-[#fbf497]/20 text-[#0a0a0a]`
- **`input-border` on Input/Textarea/Select:** Replace `border-input-border` with `border-input`

### Technical Constraints
- Must not touch `components/admin/` — already correct
- Must not touch `components/ui/` (shadcn primitives)
- Must not touch `app/(admin)/` or any admin pages
- Must not touch `tailwind.config.ts` or `app/globals.css` — already done in Task 022
- Must not touch any `lib/`, `drizzle/`, or `app/actions/` files — purely visual changes

---

## 7. Data & Database Changes
**None.** Pure CSS class changes only.

---

## 8. API & Backend Changes
**None.**

---

## 9. Frontend Changes

### Files to Modify

**`app/` pages:**
- [ ] `app/not-found.tsx`
- [ ] `app/(public)/submit-event/page.tsx`
- [ ] `app/(public)/submit-event/loading.tsx`
- [ ] `app/(public)/partner/page.tsx`
- [ ] `app/(public)/partner/loading.tsx`
- [ ] `app/(public)/verify/[code]/page.tsx`
- [ ] `app/(public)/terms/page.tsx`

**`components/` (public-facing):**
- [ ] `components/cafes/CafeCard.tsx`
- [ ] `components/cafes/CafeUpcomingEvents.tsx`
- [ ] `components/cafes/MenuHighlights.tsx`
- [ ] `components/cafes/PhotoGallery.tsx`
- [ ] `components/cafes/QuickContactBar.tsx`
- [ ] `components/about/TeamSection.tsx`
- [ ] `components/partner/PartnerForm.tsx`
- [ ] `components/submit-event/EventSubmitForm.tsx`

### No New Files
This task is entirely modifications — no new files, no deletions.

---

## 10. Code Changes Overview

The changes are uniform token swaps across 15 files. Representative examples:

**`not-found.tsx` — hero CTA button (before)**
```tsx
className="... bg-caramel px-6 py-2.5 text-sm font-medium text-foam ... hover:bg-caramel/90 focus-visible:ring-caramel focus-visible:ring-offset-cream"
```
**After:**
```tsx
className="... bg-[#0a0a0a] px-6 py-2.5 text-sm font-medium text-[#fbf497] ... hover:bg-[#0a0a0a]/90 focus-visible:ring-[#fbf497] focus-visible:ring-offset-background"
```

**`CafeCard.tsx` — card heading (before)**
```tsx
<h3 className="font-heading text-lg text-espresso ... group-hover:text-caramel">
```
**After:**
```tsx
<h3 className="text-lg font-medium text-foreground ... group-hover:text-foreground/70">
```

**`PartnerForm.tsx` / `EventSubmitForm.tsx` — submit button (before)**
```tsx
className="w-full bg-caramel text-foam hover:bg-caramel/90"
```
**After:**
```tsx
className="w-full bg-[#0a0a0a] text-[#fbf497] hover:bg-[#0a0a0a]/90"
```

---

## 11. Implementation Plan

### Phase 1: App Pages
**Goal:** Update all route-level page and loading files.

- [ ] **Task 1.1:** Update `app/not-found.tsx`
  - Details: `bg-cream → bg-background`, `text-caramel → text-[#fbf497]`, `font-heading → (delete)`, `text-espresso → text-foreground`, `text-roast → text-muted-foreground`, CTA buttons `bg-caramel → bg-[#0a0a0a]`, `text-foam → text-[#fbf497]`, outline button `border-caramel → border-foreground/20`, `hover:bg-caramel/10 → hover:bg-foreground/5`, ring tokens fixed.

- [ ] **Task 1.2:** Update `app/(public)/submit-event/page.tsx`
  - Details: `bg-espresso → bg-[#0a0a0a]`, `font-heading → (delete)`, `text-cream → text-[#f8f7f2]`, step arrow `text-caramel/40 → text-foreground/30`, step icon circle `bg-caramel/20 text-caramel → bg-[#fbf497]/20 text-[#0a0a0a]`, `text-espresso → text-foreground`, `bg-milk → bg-secondary`, `bg-cream → bg-background`.

- [ ] **Task 1.3:** Update `app/(public)/submit-event/loading.tsx`
  - Details: `bg-espresso → bg-[#0a0a0a]`, `bg-cream/10 → bg-white/10`, `bg-milk → bg-secondary`, `bg-roast/10 → bg-foreground/8`, `border-brand-border → border-border`, `bg-foam → bg-card`, `bg-cream → bg-background`.

- [ ] **Task 1.4:** Update `app/(public)/partner/page.tsx`
  - Details: `bg-espresso → bg-[#0a0a0a]`, `font-heading → (delete)`, `text-cream → text-[#f8f7f2]`, `bg-cream → bg-background`, `text-espresso → text-foreground`, `brand-border → border-border`, `bg-foam → bg-card`, `bg-caramel/15 text-caramel → bg-foreground/8 text-foreground` (icon bg), section headings `font-heading → font-medium`, `text-roast/80 → text-muted-foreground`, chevron arrows `text-caramel/40 → text-foreground/30`, step icon `bg-caramel/20 text-caramel → bg-foreground/8 text-foreground`, `bg-milk → bg-secondary`.

- [ ] **Task 1.5:** Update `app/(public)/partner/loading.tsx`
  - Details: `bg-espresso → bg-[#0a0a0a]`, `bg-cream/10 → bg-white/10`, `bg-cream → bg-background`, `bg-roast/10 → bg-foreground/8`, `brand-border → border-border`, `bg-foam → bg-card`, `bg-milk → bg-secondary`.

- [ ] **Task 1.6:** Update `app/(public)/verify/[code]/page.tsx`
  - Details: `border-caramel/40 bg-foam → border-[#fbf497]/40 bg-card` (valid state), `bg-caramel/15 text-caramel → bg-[#fbf497]/20 text-[#0a0a0a]` (VALID badge), `font-heading → (delete)`, `text-espresso → text-foreground`, `text-roast/70 → text-muted-foreground`, `text-roast/50 → text-foreground/40`.

- [ ] **Task 1.7:** Update `app/(public)/terms/page.tsx`
  - Details: `text-caramel underline ... hover:text-espresso → text-foreground underline ... hover:text-foreground/70` (refund link).

### Phase 2: Components (cafes, about, partner, submit-event)
**Goal:** Update all public-facing non-landing, non-admin components.

- [ ] **Task 2.1:** Update `components/cafes/CafeCard.tsx`
  - Details: `border-brand-border bg-foam → border-border bg-card`, `bg-roast/10 → bg-foreground/8`, `bg-caramel/5 → bg-foreground/5`, `font-heading text-caramel/40 → text-foreground/20` (placeholder initial), `bg-milk → bg-secondary`, `text-roast/70 → text-muted-foreground`, `font-heading text-espresso group-hover:text-caramel → font-medium text-foreground group-hover:text-foreground/70`, `text-roast/60 → text-muted-foreground`.

- [ ] **Task 2.2:** Update `components/cafes/CafeUpcomingEvents.tsx`
  - Details: `font-heading text-espresso → font-medium text-foreground` (h2), `border-brand-border bg-foam → border-border bg-card` (event cards), `text-espresso group-hover:text-caramel → text-foreground group-hover:text-foreground/70`, `text-roast/60 → text-muted-foreground`, `bg-caramel/10 text-caramel → bg-[#0a0a0a] text-[#fbf497]` (event type pill), `text-espresso → text-foreground`, `text-roast/50 → text-foreground/40`.

- [ ] **Task 2.3:** Update `components/cafes/MenuHighlights.tsx`
  - Details: `font-heading text-espresso → font-medium text-foreground` (h2), `text-roast/60 → text-muted-foreground` (category label), `text-espresso → text-foreground` (item name), `text-roast/70 → text-muted-foreground` (price), `text-roast/50 → text-foreground/40` (description).

- [ ] **Task 2.4:** Update `components/cafes/PhotoGallery.tsx`
  - Details: `font-heading text-espresso → font-medium text-foreground` (h2 "Gallery").

- [ ] **Task 2.5:** Update `components/cafes/QuickContactBar.tsx`
  - Details: `border-brand-border bg-foam → border-border bg-card`, all `text-espresso hover:text-caramel → text-foreground hover:text-foreground/70`, all icon `text-caramel → text-muted-foreground`, `text-roast/70 → text-muted-foreground`.

- [ ] **Task 2.6:** Update `components/about/TeamSection.tsx`
  - Details: `bg-cream → bg-background`, `font-heading text-espresso → font-medium text-foreground` (h2), `bg-caramel/10 → bg-foreground/8` (avatar bg), `font-heading text-caramel → text-foreground` (initials span), `font-medium text-espresso → font-medium text-foreground` (name), `text-roast/60 → text-muted-foreground` (role).

- [ ] **Task 2.7:** Update `components/partner/PartnerForm.tsx`
  - Details: `border-brand-border bg-foam → border-border bg-card`, `font-heading text-espresso → font-medium text-foreground` (CardTitle), `text-roast/80 → text-muted-foreground` (CardDescription), `text-roast/50 → text-muted-foreground` (optional labels), all `border-input-border → border-input`, `bg-caramel text-foam hover:bg-caramel/90 → bg-[#0a0a0a] text-[#fbf497] hover:bg-[#0a0a0a]/90` (submit button).

- [ ] **Task 2.8:** Update `components/submit-event/EventSubmitForm.tsx`
  - Details: Same pattern as PartnerForm — `border-brand-border bg-foam → border-border bg-card`, `font-heading text-espresso → font-medium text-foreground`, `text-roast/80 → text-muted-foreground`, `text-roast/50 → text-muted-foreground`, `border-input-border → border-input`, submit button `bg-caramel text-foam hover:bg-caramel/90 → bg-[#0a0a0a] text-[#fbf497] hover:bg-[#0a0a0a]/90`.

### Phase 3: Code Validation
**Goal:** Confirm zero dead tokens remain.

- [ ] **Task 3.1:** Grep for remaining dead tokens
  - Command: `Get-ChildItem -Path "apps\web\components","apps\web\app" -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "caramel|espresso|roast|bg-cream|bg-milk|bg-foam|brand-border|font-heading|input-border" | Where-Object { $_.Path -notmatch "admin" }`
  - Expected: zero results (excluding any comment strings in the layout.tsx rename comment which is harmless)

- [ ] **Task 3.2:** Run lint
  - Command: `cd apps/web && npx eslint components/cafes/ components/about/ components/partner/ components/submit-event/ app/not-found.tsx "app/(public)/submit-event/" "app/(public)/partner/" "app/(public)/verify/" "app/(public)/terms/" --max-warnings 0`
  - Expected: zero errors, zero warnings

---

## 12. Task Completion Tracking

### Phase 1: App Pages
- [x] **Task 1.1:** Update `app/not-found.tsx` ✓
- [x] **Task 1.2:** Update `app/(public)/submit-event/page.tsx` ✓
- [x] **Task 1.3:** Update `app/(public)/submit-event/loading.tsx` ✓
- [x] **Task 1.4:** Update `app/(public)/partner/page.tsx` ✓
- [x] **Task 1.5:** Update `app/(public)/partner/loading.tsx` ✓
- [x] **Task 1.6:** Update `app/(public)/verify/[code]/page.tsx` ✓
- [x] **Task 1.7:** Update `app/(public)/terms/page.tsx` ✓

### Phase 2: Components
- [x] **Task 2.1:** Update `components/cafes/CafeCard.tsx` ✓
- [x] **Task 2.2:** Update `components/cafes/CafeUpcomingEvents.tsx` ✓
- [x] **Task 2.3:** Update `components/cafes/MenuHighlights.tsx` ✓
- [x] **Task 2.4:** Update `components/cafes/PhotoGallery.tsx` ✓
- [x] **Task 2.5:** Update `components/cafes/QuickContactBar.tsx` ✓
- [x] **Task 2.6:** Update `components/about/TeamSection.tsx` ✓
- [x] **Task 2.7:** Update `components/partner/PartnerForm.tsx` ✓
- [x] **Task 2.8:** Update `components/submit-event/EventSubmitForm.tsx` ✓

### Phase 3: Validation
- [x] **Task 3.1:** Zero dead tokens confirmed ✓ 2026-05-01 — grep count = 0 across all non-admin .tsx/.ts files
- [ ] **Task 3.2:** Lint clean

---

## 13. File Structure

### Files Modified (15 total)
```
apps/web/
├── app/
│   ├── not-found.tsx                          [MODIFY]
│   └── (public)/
│       ├── submit-event/
│       │   ├── page.tsx                       [MODIFY]
│       │   └── loading.tsx                    [MODIFY]
│       ├── partner/
│       │   ├── page.tsx                       [MODIFY]
│       │   └── loading.tsx                    [MODIFY]
│       ├── verify/[code]/
│       │   └── page.tsx                       [MODIFY]
│       └── terms/
│           └── page.tsx                       [MODIFY]
└── components/
    ├── cafes/
    │   ├── CafeCard.tsx                       [MODIFY]
    │   ├── CafeUpcomingEvents.tsx             [MODIFY]
    │   ├── MenuHighlights.tsx                 [MODIFY]
    │   ├── PhotoGallery.tsx                   [MODIFY]
    │   └── QuickContactBar.tsx                [MODIFY]
    ├── about/
    │   └── TeamSection.tsx                    [MODIFY]
    ├── partner/
    │   └── PartnerForm.tsx                    [MODIFY]
    └── submit-event/
        └── EventSubmitForm.tsx                [MODIFY]
```

### Files NOT touched
- `components/admin/**` — already clean ✅
- `app/(admin)/**` — already clean ✅
- `components/ui/**` — shadcn primitives, never touched
- `tailwind.config.ts` — done in Task 022 ✅
- `app/globals.css` — done in Task 022 ✅
- `components/layout/Navbar.tsx` — done in Task 022 ✅
- `components/layout/Footer.tsx` — done in Task 022 ✅
- `components/events/GooutOfficialBadge.tsx` — done in Task 022 ✅
- `components/events/EventEmptyState.tsx` — done in Task 022 ✅

---

## 14. Potential Issues & Security Review

- [ ] **`font-body` class on page wrappers:** `submit-event/page.tsx` and `partner/page.tsx` use `<div className="font-body">`. `font-body` maps to the same DM Sans as the default `font-sans`. Safe to delete this class entirely — the global CSS already sets the body font.
- [ ] **`border-sand` in `verify/[code]/page.tsx` line 59:** Not in the dead list — it's a shadcn token alias. Leave untouched.
- [ ] **`text-foam/90` on dark hero sections:** This is `text-foam` with opacity which is white text on dark bg. Replace with `text-[#f8f7f2]/90`.

---

## 15. Reference
- **Task 022 (completed):** `ai_docs/tasks/022_landing_page_rebrand.md`
- **Token cheat sheet:** Provided by user, reproduced in Section 6 of this document
- **Scan date:** 2026-05-01 — grep confirmed zero hits in `components/admin/`
