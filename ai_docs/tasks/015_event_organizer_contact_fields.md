# Task 015 — Event organizer contact (phone + Instagram)

**Status:** Drafted — awaiting approval  
**Created:** 2026-04-20  
**Depends on:** Task 014 (local admin dashboard — event CRUD, public event pages)

> **Context for implementers:** Real events are not always run by listed cafés. Organizers may be individuals, studios, or brands; the physical **venue** may be a café, a private studio, or elsewhere. The product must **always** surface **event organizer contact** (at minimum phone and Instagram) on public event pages, independent of whether a café is linked. Today, contact is only read from `cafes.phone` / `cafes.instagram_handle` when `events.cafe_id` is set, so **`cafe_id = null`** events (custom venue) have no structured contact — matching the Srea Natural row in production.

---

## 1. Task Overview

### Task Title
**Title:** Add event-level organizer contact fields (phone + Instagram) and show them on public event UI and admin event forms

### Goal Statement
**Goal:** Model “who is running this event” separately from “where it happens.” Persist organizer phone and Instagram on each event, validate them in admin, and render an **Organizer** section on `/events/[slug]` (and in the event info card when appropriate) so visitors can reach the organizer even when the cafe is only the venue or when there is no cafe at all. Reuse existing helpers (`resolveInstagramHref`, `tel:` normalization) for consistent links.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
Organizer identity and venue are different concepts. Linking to a `cafes` row only to store phone/Instagram is a workaround and fails when the event is **not** café-centric. We need a first-class place on the **event** for organizer contact and a clear display rule when both a cafe and organizer fields exist.

### Solution Options Analysis

#### Option 1: Columns on `events` (organizer contact)
**Approach:** Add nullable columns such as `organizer_phone`, `organizer_instagram_handle`, and optionally `organizer_name` (or `organizer_label`) on `events`. Admin forms and public pages read these fields directly.

**Pros:**
- ✅ Simple for MVP; one migration; no extra joins
- ✅ Matches “every event has its own organizer” for low-volume curated listings
- ✅ Easy to export or show in admin CSV/tickets context later

**Cons:**
- ❌ Same organizer across many events → repeated data entry (acceptable at current scale)
- ❌ More columns on an already wide `events` table

**Implementation Complexity:** Low–Medium  
**Risk Level:** Low

#### Option 2: `organizers` table + `events.organizer_id` FK
**Approach:** Normalize organizers; events reference one organizer.

**Pros:**
- ✅ Deduplication across events; single place to update a brand’s Instagram

**Cons:**
- ❌ More UI (pick/create organizer), more queries, and scope creep for Phase 1
- ❌ Still need nullable FK + rules for one-off events

**Implementation Complexity:** Medium–High  
**Risk Level:** Medium

#### Option 3: JSON blob `organizer_contact` on `events`
**Pros:** Flexible fields later  

**Cons:** ❌ Weak typing, awkward validation in Zod/Drizzle, harder to query

**Implementation Complexity:** Medium  
**Risk Level:** Medium

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** **Option 1** — columns on `events`

**Why:**
1. **Fits the product** — curated events, not a multi-tenant organizer directory yet.
2. **Fast to ship** — extends existing `EventForm`, `createEvent` / `updateEvent`, and public components.
3. **Clear data model** — phone and Instagram are first-class; reuse `lib/utils/instagram.ts`.

**Display rules (implementer decision locked in this task):**
- Show an **“Organizer”** block when **organizer phone and/or organizer Instagram** are present (after trim).
- **Venue** remains as today: `VenueSection` uses cafe **or** `venue_*` custom fields.
- **When `cafe_id` is set and organizer fields are empty:** optional fallback — show **cafe** phone/Instagram in the Organizer block (same as current `EventInfoCard` behavior) **or** show only under Venue; **preferred:** keep **Organizer** section for explicit organizer fields only, and keep cafe contact under **Venue** / cafe card so we do not duplicate. If organizer fields are empty and cafe exists, **EventInfoCard** may continue to show cafe contact in the card summary (current behavior) **or** consolidate into one “Contact” area — **implementer chooses minimal duplication:** prefer **one** contact strip: organizer fields first, else cafe fallback for phone/IG.

**Refined rule for implementation:**  
`contactPhone` / `contactInstagram` for display = **organizer fields if present**, else **cafe** fields. Single block labeled **“Organizer & contact”** or separate **“Organizer”** vs **“Venue”** per design — default: **Organizer** title when organizer fields set; else **“Contact”** with cafe fallback.

**User decision:** Proceed with Option 1 unless product later needs a directory of organizers (then migrate to Option 2).

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Framework:** Next.js 15 (App Router), React 19, TypeScript strict (`apps/web`)
- **Database:** PostgreSQL (Supabase) via Drizzle ORM
- **UI:** Tailwind + shadcn/ui; **light-only** public theme (no dark mode requirement)
- **Patterns:** Server Components + Server Actions (`app/actions/admin/events.ts`); queries in `lib/queries/events.ts`

### Current State
- **`events`:** `cafe_id` nullable; `venue_name`, `venue_address`, `venue_maps_url`; no organizer columns.
- **`cafes`:** `phone`, `instagram_handle` — used by `EventInfoCard`, `VenueSection`, `QuickContactBar` when a cafe exists.
- **Gap:** For `cafe_id = null`, there is no phone/Instagram source in the DB except free text in `description` (not structured).

### Existing Context Providers Analysis
- **N/A** for public event pages — no React context required; data comes from `getEventBySlug` and props.

---

## 4. Context & Problem Definition

### Problem Statement
Workshops and ticketed events are often run by **non-café organizers**; a café may be only the **venue**. The platform must always expose **organizer contact** in a predictable way. The current schema and UI tie contact to **cafes** only, so independent-venue events cannot show phone or Instagram without abusing the description or creating fake cafe rows.

### Success Criteria
- [ ] `events` table has nullable `organizer_phone` and `organizer_instagram_handle` (or names aligned with Drizzle naming) plus optional `organizer_display_name` if we want a label (“Srea Natural”).
- [ ] Drizzle schema + migration + **`down.sql`** per `ai_docs/dev_templates/drizzle_down_migration.md`.
- [ ] Admin: `EventForm` includes organizer fields; Zod validation (Instagram optional; phone optional; at least one of organizer phone / organizer Instagram **or** explicit product rule — **minimum:** allow empty if cafe provides contact — document: **either** organizer fields **or** linked cafe with contact for published events is a **soft** check; implementer can add warning in admin only).
- [ ] Public `/events/[slug]`: visitors see organizer phone + Instagram using `resolveInstagramHref` and space-stripped `tel:` links.
- [ ] `npm run lint` and `npm run type-check` pass in `apps/web`.

---

## 5. Development Mode Context
- Treat as **production-aware**: additive migrations; avoid destructive changes.
- Existing events remain valid with null organizer fields.

---

## 6. Technical Requirements

### Functional Requirements
- Organizer **phone** stored as text (Indian formats; display as entered; `tel:` href strips spaces).
- Organizer **Instagram** accepts `@handle` or full URL; `resolveInstagramHref` builds the link.
- Public event page shows organizer contact when data exists; fallback to cafe contact when organizer fields are blank and `cafe_id` present (single coherent UX — see section 2).
- Admin `createEvent` / `updateEvent` persist new fields.

### Non-Functional Requirements
- **Performance:** No N+1; fields on same event row.
- **Security:** Admin Server Actions keep existing localhost checks from task 014.
- **Responsive:** Existing breakpoints.

### Technical Constraints
- **No new tables** in this task unless Option 1 is abandoned (use Option 1).
- Reuse `apps/web/lib/utils/instagram.ts`; consider a tiny shared `telHrefFromPhone(phone: string)` in the same utils area to avoid duplication across components.

---

## 7. Data & Database Changes

### Database Schema Changes (Drizzle — illustrative)
```ts
// apps/web/lib/drizzle/schema/events.ts — add columns
organizerDisplayName: text("organizer_display_name"), // optional
organizerPhone: text("organizer_phone"),
organizerInstagramHandle: text("organizer_instagram_handle"),
```

Exact column names may be adjusted for consistency (`snake_case` in DB).

### Data Migration Plan
- New columns nullable → existing rows unchanged.
- Optional: backfill Srea event from user-provided phone/Instagram once.

### Down Migration Safety
- Follow project rule: create `down.sql` **before** `npm run db:migrate`.

---

## 8. API & Backend Changes

### Server Actions
- **`app/actions/admin/events.ts`:** Extend create/update Zod schemas and inserts/updates with organizer fields.

### Queries
- **`lib/queries/events.ts`:** `getEventBySlug` already returns full `events` row; inferred types update automatically after schema change. Verify list queries if cards show a contact teaser (probably not for MVP).

### API Routes
- None required.

---

## 9. Frontend Changes

### Components / pages
- **`components/events/EventInfoCard.tsx`:** Use organizer fields with fallback to `cafe` for phone/Instagram; adjust section title/labels.
- **`components/events/VenueSection.tsx`:** Optionally add a short “Organizer” line for custom venue when organizer fields are set (or keep organizer only in `EventInfoCard` — avoid triple duplication; **one** primary place is enough).
- **`app/(public)/events/[slug]/page.tsx`:** Pass new fields into components as needed.
- **`components/admin/EventForm.tsx`:** New inputs for organizer name (optional), phone, Instagram.

### State Management
- No global state; form state + server actions.

---

## 10. Code Changes Overview

#### 📂 Current Implementation (Before)
`EventInfoCard` only shows phone/Instagram when `cafe` is present:

```tsx
// EventInfoCard.tsx (conceptual)
const instagramHref = cafe ? resolveInstagramHref(cafe.instagramHandle) : null;
const telHref = cafe?.phone ? `tel:${cafe.phone.replace(/\s+/g, "")}` : null;
// ...
{cafe && (cafe.phone || instagramHref) && ( /* contact block */ )}
```

#### 📂 After Refactor
- Compute display phone/IG from **organizer fields first**, then **cafe** fallback.
- Show contact block when `(organizerPhone || organizerInstagram) || (cafe && (phone || ig))`.

```tsx
// Pseudocode
const phoneForTel = event.organizerPhone ?? cafe?.phone ?? null;
const instagramRaw = event.organizerInstagramHandle ?? cafe?.instagramHandle ?? null;
const instagramHref = resolveInstagramHref(instagramRaw);
const telHref = phoneForTel ? `tel:${phoneForTel.replace(/\s+/g, "")}` : null;
```

#### 🎯 Key Changes Summary
- **Schema:** `events` +2–3 columns.
- **Admin:** Event form + Zod + actions.
- **Public:** `EventInfoCard` (+/- `VenueSection`) for fallback logic and labels.
- **Files:** `lib/drizzle/schema/events.ts`, new migration + `down.sql`, `app/actions/admin/events.ts`, `components/admin/EventForm.tsx`, `components/events/EventInfoCard.tsx`, possibly `page.tsx`.

---

## 11. Implementation Plan

### Phase 1: Schema + migration
- [x] Update `events.ts` schema; `npm run db:generate`; write `down.sql`; `npm run db:migrate`. ✓ 2026-04-20
  - Schema: `organizer_display_name`, `organizer_phone`, `organizer_instagram_handle` on `events`.
  - Migration: `apps/web/drizzle/migrations/0003_futuristic_fat_cobra.sql`
  - Down: `apps/web/drizzle/migrations/0003_futuristic_fat_cobra/down.sql`

### Phase 2: Admin
- [x] Extend Zod + `createEvent` / `updateEvent`; `EventForm` fields. ✓ 2026-04-20
  - `lib/validations/admin/event.ts`: `organizerDisplayName`, `organizerPhone`, `organizerInstagramHandle`
  - `app/actions/admin/events.ts`: `toRowPayload` maps into DB
  - `components/admin/EventForm.tsx`: Organizer section; removed obsolete venue-only phone/IG hint boxes

### Phase 3: Public UI
- [x] `EventInfoCard` + `page` props; optional `VenueSection` tweak; shared `tel` helper if desired. ✓ 2026-04-20
  - `lib/utils/phone.ts` — `telHrefFromPhone`
  - `lib/events/event-contact.ts` — `resolveEventContact` (organizer overrides café per field)
  - `EventInfoCard`, `VenueSection` (cafe + custom venue), `page.tsx` — `contact` prop
  - `QuickContactBar` — uses `telHrefFromPhone`

### Phase 4: Validation
- [ ] `npm run lint` and `npm run type-check` in `apps/web` (no `npm run build` per project rules).

### Phase 5: User testing
- [ ] Create/edit event in admin with only custom venue + organizer phone/IG; confirm public page.

---

## 12. Task Completion Tracking
(Implementer fills timestamps as work completes.)

---

## 13. File Structure & Organization

### Files to modify (expected)
- `apps/web/lib/drizzle/schema/events.ts`
- `drizzle/migrations/*` + `down.sql`
- `apps/web/app/actions/admin/events.ts`
- `apps/web/components/admin/EventForm.tsx`
- `apps/web/components/events/EventInfoCard.tsx`
- `apps/web/app/(public)/events/[slug]/page.tsx`
- Optionally `apps/web/components/events/VenueSection.tsx`
- Optionally `apps/web/lib/utils/phone.ts` or `contact.ts` for `telHrefFromPhone`

### Dependencies to add
- None expected.

---

## 14. Potential Issues & Security Review

- **Duplicate contact:** When both cafe and organizer are set — use precedence rule in section 2; avoid showing the same number twice in adjacent blocks.
- **Validation:** Strip whitespace; do not double-prefix Instagram URLs (already handled by `resolveInstagramHref`).
- **Admin:** Only localhost — unchanged.

---

## 15. Deployment & Configuration

- No new env vars.

---

## 16. AI Agent Instructions

- Read this task fully before coding.
- Do **not** run `npm run build` for validation; use `npm run lint` and `npm run type-check` in `apps/web`.
- **Down migration before migrate** (see `drizzle_down_migration.md`).
- After implementation, present **Implementation Complete!** and offer code review per `task_template.md` section 16.

---

## 17. Notes & References

- Instagram URL/handle rules: `apps/web/lib/utils/instagram.ts`
- Prior task: `ai_docs/tasks/014_local_admin_dashboard.md` (admin patterns, event CRUD)
- Example real row: Srea Natural event with `cafe_id` null — should be fixable by filling organizer fields after this task ships.

---

## 18. Second-Order Consequences

- **Ticket buyer support:** Organizer phone on events may appear in email templates later — out of scope unless referenced.
- **Future:** If organizer directory is needed, migrate rows to Option 2 with a one-off script.

---

*Task created from `ai_docs/dev_templates/task_template.md` (project-specific adaptations applied).*
