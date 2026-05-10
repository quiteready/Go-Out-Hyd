# Task 024 — About Page Content & UI Refresh

## 1. Task Overview

### Task Title
**Title:** About Page — Event-Focused Content Rewrite + UI Fixes

### Goal Statement
**Goal:** Replace the existing cafe-centric about page copy with the new event/creative-platform narrative agreed with the user, and fix three small UI bugs found during the audit (broken Instagram link, stale CTA button label, outdated metadata). No structural or component changes — same five-section layout is kept.

---

## 2. Strategic Analysis & Solution Options

Straightforward content + bug-fix task. No strategic analysis needed — single obvious approach: update the one file (`about/page.tsx`) in place.

---

## 3. Project Analysis & Current State

- **Framework:** Next.js 15.5.4 (App Router), React 19, TypeScript 5 strict
- **Styling:** Tailwind CSS 3.4.1, shadcn/ui, yellow/black design system
- **File in scope:** `apps/web/app/(public)/about/page.tsx`
- **Supporting component:** `apps/web/components/about/TeamSection.tsx` — no changes needed

### Current State

The about page has five sections:

| Section | Current content |
|---|---|
| Hero | `#0a0a0a` bg, "Built in Hyderabad, for Hyderabad" |
| Body | 3 paragraphs — Wilson / cafe owners / GoOut connecting them |
| Pull quote | "We believe Hyderabad's best experiences happen at independent cafes…" |
| Team | `TeamSection` component — Wilson, Founder (unchanged) |
| CTA | "Want to partner with us?" + "List Your Cafe" button + Instagram link |

**Bugs found in audit:**
- Instagram `<a>` href = `https://www.instagram.com/` — generic, not the GoOut Hyd account
- CTA button label = "List Your Cafe" — stale after platform scope expanded to events
- Metadata `description` = "The story behind Hyderabad's cafe discovery platform" — outdated

---

## 4. Context & Problem Definition

### Problem Statement
The about page still reads as a cafe-listing product. The platform has expanded to a full creative/event ecosystem (artists, DJs, bands, organisers, venues). The copy needs to reflect that shift, and three small bugs need fixing while we're in the file.

### Success Criteria
- [ ] Hero headline updated
- [ ] All body copy replaced with the 4 agreed event-focused paragraphs
- [ ] Pull quote updated
- [ ] "Discover. Connect. Experience." tagline added before the CTA section
- [ ] CTA heading updated to reflect broader platform scope
- [ ] "List Your Cafe" button label updated to "Partner with Us"
- [ ] Instagram link points to `https://www.instagram.com/goout_hyd?igsh=MTA5bXBlb3V3bGw0Mw==`
- [ ] Metadata `title` and `description` updated
- [ ] No TypeScript or lint errors

---

## 5. Development Mode Context

- New application in active development
- No backwards-compatibility concerns
- Aggressive changes are fine

---

## 6. Technical Requirements

### Functional Requirements
- All copy changes land in `apps/web/app/(public)/about/page.tsx` only
- Instagram link matches the one already used in `apps/web/components/layout/Footer.tsx`
- Partner CTA still links to `/partner`

### Non-Functional Requirements
- **Responsive:** existing section layout already works on all breakpoints — no layout changes
- **No dark mode:** site is light-only; about page hero uses `#0a0a0a` intentionally (dark hero strip)

### Technical Constraints
- `TeamSection` component is unchanged
- No new components, no new files
- No database changes

---

## 7. Data & Database Changes

None.

---

## 8. API & Backend Changes

None.

---

## 9. Frontend Changes

### Page Updates
- [x] `apps/web/app/(public)/about/page.tsx` — all changes listed below

### Code Changes Overview

#### Before (current `page.tsx` key sections)

```tsx
// Metadata
description: "The story behind Hyderabad's cafe discovery platform",

// Hero headline
<h1>Built in Hyderabad, for Hyderabad</h1>

// Body — 3 paragraphs
<p>GoOut Hyd grew out of years of running live events...</p>
<p>Along the way, the same cafe owners kept showing up...</p>
<p>GoOut Hyd connects that network with people looking for something real...</p>

// Pull quote
We believe Hyderabad's best experiences happen at independent cafes, not chains...

// CTA section
<h2>Want to partner with us?</h2>
<Link href="/partner">List Your Cafe</Link>
<a href="https://www.instagram.com/">Instagram</a>  ← broken link
```

#### After (new content)

```tsx
// Metadata
title: "About",
description: "GoOutHyd is Hyderabad's creative and cultural platform — connecting artists, organisers, venues, and people through live experiences.",

// Hero headline
<h1>Hyderabad's home for live experiences</h1>

// Body — 4 paragraphs
<p>GoOutHyd was built by people who have spent years putting together live events...</p>
<p>Too many great events happen to half-empty rooms...</p>
<p>GoOutHyd exists to fix that. One platform to discover live music, DJ nights...</p>
<p>We're building a creative ecosystem for this city...</p>

// Pull quote
It's not just about finding what's on this weekend. It's about building a city where great things keep happening.

// Tagline (new — sits between quote/team and CTA)
Discover. Connect. Experience.

// CTA section
<h2>Want to be part of it?</h2>
<Link href="/partner">Partner with Us</Link>
<a href="https://www.instagram.com/goout_hyd?igsh=MTA5bXBlb3V3bGw0Mw==">Instagram</a>  ← fixed
```

#### Key Changes Summary
- [x] **Metadata:** title stays "About", description updated to reflect event/creative platform
- [x] **Hero:** headline changed to event-focused
- [x] **Body:** 3 paragraphs → 4 paragraphs, completely replaced
- [x] **Pull quote:** replaced with the "building a city" version
- [x] **Tagline section:** new `<p>` or `<div>` with "Discover. Connect. Experience." — styled as a centred, muted serif line between the team section and CTA, or inside the CTA section
- [x] **CTA heading:** "Want to partner with us?" → "Want to be part of it?"
- [x] **CTA button:** "List Your Cafe" → "Partner with Us"
- [x] **Instagram href:** generic URL → correct GoOut Hyd URL
- **Files modified:** `apps/web/app/(public)/about/page.tsx` (1 file only)
- **Impact:** Visual copy change only — no behaviour or routing changes

---

## 10. Implementation Plan

### Phase 1: Update `about/page.tsx`
**Goal:** Apply all content and bug fixes in one pass

- [x] **Task 1.1:** Update `generateMetadata()` — description string
- [x] **Task 1.2:** Update hero `<h1>` text
- [x] **Task 1.3:** Replace body copy section (3 → 4 paragraphs)
- [x] **Task 1.4:** Replace pull quote text
- [x] **Task 1.5:** Add "Discover. Connect. Experience." tagline — placed as a centred line inside the existing pull-quote section or as its own small strip between the team and CTA sections
- [x] **Task 1.6:** Update CTA heading ("Want to be part of it?")
- [x] **Task 1.7:** Update CTA button label ("Partner with Us")
- [x] **Task 1.8:** Fix Instagram href to `https://www.instagram.com/goout_hyd?igsh=MTA5bXBlb3V3bGw0Mw==`

### Phase 2: Static Validation
**Goal:** Confirm no lint or type errors introduced

- [x] **Task 2.1:** Run `npm run lint` from `apps/web/`
- [x] **Task 2.2:** Run `npm run type-check` from `apps/web/`
- [x] **Task 2.3:** Read the updated file to verify all changes landed correctly

### Phase 3: Code Review & User Browser Test
- [x] **Task 3.1:** Present "Implementation Complete!" message
- [x] **Task 3.2:** Wait for user to confirm visually in browser

---

## 11. Task Completion Tracking

- [x] Task 1.1 — metadata description updated
- [x] Task 1.2 — hero headline updated
- [x] Task 1.3 — body copy replaced
- [x] Task 1.4 — pull quote replaced
- [x] Task 1.5 — tagline added
- [x] Task 1.6 — CTA heading updated
- [x] Task 1.7 — CTA button label updated
- [x] Task 1.8 — Instagram link fixed
- [x] Task 2.1 — lint passed
- [x] Task 2.2 — type-check passed
- [x] Task 2.3 — file verified

---

## 12. File Structure & Organisation

### Files to Modify
- [ ] `apps/web/app/(public)/about/page.tsx` — all changes (content + bug fixes)

### Files to Leave Untouched
- `apps/web/components/about/TeamSection.tsx` — no changes needed
- `apps/web/app/(public)/about/loading.tsx` — no changes needed
- `apps/web/app/(public)/about/error.tsx` — no changes needed

---

## 13. Potential Issues & Security Review

- No user input, no auth, no data fetching — zero security surface
- The Instagram URL contains a tracking parameter (`igsh=...`). This is fine — it's the same URL already used in the Footer.

---

## 14. Second-Order Consequences

- No API contracts or database touched
- No component interfaces changed
- `TeamSection` renders independently — unaffected
- The `/partner` route is unchanged — CTA still routes correctly
- SEO: metadata description update is a positive change (more accurate)

---

*Template Version: 1.3 | Task: 024 | Created: 2026-05-10*
