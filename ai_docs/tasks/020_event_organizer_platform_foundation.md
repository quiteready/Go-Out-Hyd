# AI Task Template: `020_event_organizer_platform_foundation.md`

## 1. Task Overview

### Task Title
**Title:** Event Organizer Platform Foundation — Public Submission, GoOut Official Badge & Venue TBA Support

### Goal Statement
**Goal:** Extend the existing events system to support a 3-sided marketplace: GoOut Hyd runs its own events (marked "GoOut Official"), independent organizers can submit events for admin approval via a public form, and events can be created with a TBA venue that is announced later. This is a targeted, additive change — the entire existing cafe and event infrastructure remains untouched.

---

## 2. Strategic Analysis & Solution Options

Strategic analysis was completed in conversation. Single clear approach approved.

### Recommendation & Rationale
**🎯 RECOMMENDED SOLUTION:** Additive schema migration + new public submission form + admin workflow additions.

**Why this is the best choice:**
1. **Minimal risk** — All changes are additive. No existing fields are modified, no existing data is affected.
2. **Leverages existing infrastructure** — Email system (`lib/email.ts`), admin dashboard, server action patterns, and validation patterns are all reused.
3. **Admin-gated publishing** — Every community-submitted event requires explicit admin approval before going public, protecting the GoOut Hyd brand.

**👤 USER DECISION REQUIRED:** Confirmed by user — proceed with this approach.

---

## 3. Project Analysis & Current State

- **Frameworks & Versions:** Next.js 15 App Router, React 19, TypeScript strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS, GoOut Hyd design tokens (espresso/caramel/cream)
- **Authentication:** Admin-only JWT cookie auth in `middleware.ts` (only `/admin` routes protected)
- **Key Architectural Patterns:** Server Components for data fetching, Server Actions for mutations, `lib/queries/` for complex queries

### Current State of Events Schema (`lib/drizzle/schema/events.ts`)

Already present and working:
- `cafeId` — **Already nullable** (`onDelete: "set null"`, no `.notNull()`) ✅
- `venueName` — **Already exists** (free text, nullable) ✅
- `venueAddress` — Already exists ✅
- `venueMapsUrl` — Already exists ✅
- `organizerDisplayName` — Already exists ✅
- `organizerPhone` — Already exists ✅
- `organizerInstagramHandle` — Already exists ✅
- `earlyBirdPrice` — Already exists ✅
- `maxTickets` — Already exists ✅

**What is genuinely missing:**
- `is_goout_official` boolean — NOT in schema
- `venue_tba` boolean — NOT in schema
- `pending` status — NOT in `event_status` enum (only: upcoming, cancelled, completed)

### Admin Dashboard Current State
- `/admin/events` — Lists all events with venue, type, status, sold/max ✅
- `/admin/events/new` — Create event form ✅
- `/admin/events/[id]` — Edit event form ✅
- No filter by status (pending vs upcoming) — needs adding
- No GoOut Official toggle — needs adding
- No "Approve" action for pending events — needs adding

### Existing Context Providers Analysis
- No UserContext/UsageContext (public site, no auth for users)
- Admin session context is cookie-based JWT only

---

## 4. Context & Problem Definition

### Problem Statement
GoOut Hyd operates as a 3-sided marketplace:
1. **GoOut Hyd** runs its own events (needs "GoOut Official" badge and visual distinction)
2. **Independent organizers** (bands, comedy groups, workshop organizers) want to list their events — currently no public way to do this
3. **Events sometimes have TBA venues** — announced 2-3 days before the event

The platform currently has no way for external organizers to submit events, no way to mark GoOut's own events as official, and no clean way to handle TBA venues.

### Success Criteria
- [ ] `is_goout_official`, `venue_tba` fields exist in the events table
- [ ] `pending` status exists in the `event_status` enum
- [ ] Public `/submit-event` page allows organizers to submit events
- [ ] Submitted events arrive in admin dashboard with `pending` status
- [ ] Admin can approve a pending event (status → upcoming) in one click
- [ ] Admin can mark any event as "GoOut Official" via toggle
- [ ] Public events listing excludes `pending` events
- [ ] Events with `venue_tba = true` display "Venue TBA" on public pages instead of crashing
- [ ] GoOut Official badge visible on event cards and event detail pages
- [ ] Wilson receives email notification when an organizer submits an event

---

## 5. Development Mode Context
- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** — additive changes only
- **Priority: Speed and simplicity**

---

## 6. Technical Requirements

### Functional Requirements
- Organizer fills public form → event created with `status: pending` → admin notified by email
- Admin reviews pending events in `/admin/events` (filterable by status)
- Admin approves: one-click changes `pending` → `upcoming`
- Admin can toggle `is_goout_official` on any event (including their own)
- Public listing: filters out `pending`, shows "GoOut Official" badge, handles `venue_tba`
- No prices shown anywhere on the public submission form or public pages (per business decision)

### Non-Functional Requirements
- **Performance:** No additional DB queries on public pages — `pending` filter added to existing queries
- **Security:** Submission form has honeypot spam protection; no auth required (open submission)
- **Responsive Design:** Submit form must work on mobile (320px+)
- **No dark mode** — GoOut Hyd is forced light mode

### Technical Constraints
- Must follow existing server action pattern (`app/actions/[feature].ts`)
- Must use existing email infrastructure (`lib/email.ts` + Resend)
- Must use existing Zod validation pattern (`lib/validations/`)
- Admin approval must use `revalidatePath()` to purge ISR cache

---

## 7. Data & Database Changes

### Database Schema Changes

```sql
-- Add venue_tba column to events
ALTER TABLE events ADD COLUMN venue_tba BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_goout_official column to events  
ALTER TABLE events ADD COLUMN is_goout_official BOOLEAN NOT NULL DEFAULT FALSE;

-- Add 'pending' value to event_status enum
ALTER TYPE event_status ADD VALUE 'pending';
```

### Data Model Updates (`lib/drizzle/schema/events.ts`)

```typescript
// ADD to events table definition (after status field):
venueTba: boolean("venue_tba").notNull().default(false),
isGooutOfficial: boolean("is_goout_official").notNull().default(false),

// MODIFY event_status enum (add 'pending'):
export const eventStatusEnum = pgEnum("event_status", [
  "pending",      // ← ADD THIS
  "upcoming",
  "cancelled",
  "completed",
]);
```

> **⚠️ NOTE on enum migration:** PostgreSQL allows adding values to enums with `ADD VALUE` but not removing them without dropping the type. The `pending` value is safe to add. However, once added, it cannot be removed without a full enum recreation. This is acceptable for our use case.

### Data Migration Plan
- No existing records need migration — new boolean fields default to `false`, existing events unaffected
- No existing events will have `pending` status — only newly submitted events

### 🚨 MANDATORY: Down Migration Safety Protocol
- [ ] **Step 1:** Run `npm run db:generate` to create migration
- [ ] **Step 2:** Create `drizzle/migrations/[timestamp]/down.sql` following `drizzle_down_migration.md`
- [ ] **Step 3:** Down migration must: `ALTER TABLE events DROP COLUMN IF EXISTS venue_tba; ALTER TABLE events DROP COLUMN IF EXISTS is_goout_official;` (cannot remove enum value, document this)
- [ ] **Step 4:** Apply migration only after down.sql is created

---

## 8. API & Backend Changes

### Server Actions

#### [NEW] `app/actions/submit-event.ts`
```typescript
'use server';
// submitEventForm(formData: FormData) — public organizer submission
// 1. Parse + validate with eventSubmissionSchema
// 2. Honeypot check (silent return if triggered)
// 3. Insert into events table with status: 'pending', isGooutOfficial: false
// 4. Send email notification to admin via sendEventSubmissionNotification()
// 5. Return { success: true } or { success: false, error: string }
```

### Database Queries

#### MODIFY `lib/queries/admin/events.ts`
- `listEventsForAdmin(statusFilter?: string)` — add optional status filter so admin can view pending events separately

#### MODIFY `lib/queries/events.ts`
- `getUpcomingEvents()` — ensure `status = 'upcoming'` filter is present (excludes pending)
- `getUpcomingEventsForLanding()` — same check

### Email Integration

#### MODIFY `lib/email.ts`
- Add `sendEventSubmissionNotification(event: { title, organizerName, organizerPhone, eventType, startTime, venueName | 'TBA' })` function
- Follows same Resend pattern as `sendLeadNotification()`
- Subject: `"New Event Submission: [title]"`
- Sent to Wilson's notification email

---

## 9. Frontend Changes

### New Components

- [ ] **`components/submit-event/EventSubmitForm.tsx`** (`"use client"`) — Public submission form
  - Fields: Event Title, Event Type (select), Date & Time, Organizer Name, Organizer Phone, Organizer Instagram (optional), Venue Name OR "Venue TBA" checkbox, Description, Ticket Price (or "Free event" toggle), Cover Image URL (optional)
  - Hidden honeypot field
  - Submit → server action → success toast + form reset
  - No price shown in any label — just the number field for internal admin use

- [ ] **`components/events/GooutOfficialBadge.tsx`** — Small badge component
  - Renders "GoOut Official" with a star icon when `isGooutOfficial = true`
  - Used on EventCard and event detail page

### Page Updates

- [ ] **`app/(public)/submit-event/page.tsx`** [NEW] — Public organizer submission page
- [ ] **`app/(public)/submit-event/loading.tsx`** [NEW]
- [ ] **`app/(public)/submit-event/error.tsx`** [NEW]
- [ ] **`app/(admin)/admin/events/page.tsx`** — Add status filter tabs (All / Pending / Upcoming / Completed / Cancelled) + Approve button on pending rows
- [ ] **`components/events/EventCard.tsx`** — Add GoOut Official badge rendering
- [ ] **`app/(public)/events/[slug]/page.tsx`** — Handle `venue_tba = true` display ("Venue TBA"), show GoOut Official badge

---

## 10. Code Changes Overview

### 📂 Current `lib/drizzle/schema/events.ts` (key section)
```typescript
export const eventStatusEnum = pgEnum("event_status", [
  "upcoming",
  "cancelled",
  "completed",
]);

export const events = pgTable("events", {
  // ...
  cafeId: uuid("cafe_id").references(() => cafes.id, { onDelete: "set null" }),
  venueName: text("venue_name"),
  venueAddress: text("venue_address"),
  status: eventStatusEnum("status").notNull().default("upcoming"),
  // ...
});
```

### 📂 After Changes
```typescript
export const eventStatusEnum = pgEnum("event_status", [
  "pending",      // ← NEW: organizer submissions awaiting approval
  "upcoming",
  "cancelled",
  "completed",
]);

export const events = pgTable("events", {
  // ...existing fields unchanged...
  venueTba: boolean("venue_tba").notNull().default(false),           // ← NEW
  isGooutOfficial: boolean("is_goout_official").notNull().default(false), // ← NEW
});
```

### 🎯 Key Changes Summary
- [ ] **Schema:** 2 new boolean columns + 1 new enum value — all additive, zero data loss risk
- [ ] **New public page:** `/submit-event` — organizer submission form
- [ ] **Admin workflow:** Pending filter + Approve button + GoOut Official toggle
- [ ] **Email:** New notification template for event submissions
- [ ] **Public display:** GoOut Official badge + Venue TBA handling

---

## 11. Implementation Plan

### Phase 1: Database Schema Migration ✅
**Goal:** Add the 3 new fields safely with down migration ready

- [x] **Task 1.1:** Updated `lib/drizzle/schema/events.ts`
  - Added `pending` to `eventStatusEnum`
  - Added `jamming` to `eventTypeEnum`
  - Added `venueTba` and `isGooutOfficial` boolean fields
- [x] **Task 1.2:** Ran `npm run db:generate` → created `0004_empty_captain_marvel.sql`
- [x] **Task 1.3:** Created down migration `drizzle/migrations/0004_empty_captain_marvel/down.sql`
- [x] **Task 1.4:** Ran `npm run db:migrate` → applied successfully

### Phase 2: Email Notification ✅
**Goal:** Extend existing email infrastructure for event submission alerts

- [x] **Task 2.1:** Added `sendEventSubmissionNotification()` to `lib/email.ts`
  - Followed existing `sendLeadNotification()` pattern exactly
  - Includes event title, type, organizer name, phone, Instagram (optional), start time (IST), venue or TBA, description (optional), submitted at timestamp
  - Reuses `LEAD_NOTIFICATION_EMAIL` env var — no new config required
  - Email failure does not fail the submission (graceful degradation)

### Phase 3: Validation + Server Action ✅
**Goal:** Build the submission pipeline

- [x] **Task 3.1:** Created `lib/validations/event-submission.ts`
  - Zod schema with all fields: title, eventType, startTime (coerced from datetime-local string), organizerName, organizerPhone, organizerInstagram (optional), venueName (conditional), venueTba (checkbox preprocessed), description (optional), ticketPrice (optional integer), coverImage (optional URL), honeypot
  - Cross-field refinement: venueName required unless venueTba is true
  - Also updated `lib/constants/events.ts` to add `jamming` to labels and VALID_EVENT_TYPES
- [x] **Task 3.2:** Created `app/actions/submit-event.ts`
  - Honeypot check first (early silent success)
  - Validates via eventSubmissionSchema.safeParse()
  - Auto-generates slug: `{title-slug}-{random-5-char-suffix}` to avoid collisions
  - Inserts with `status: 'pending'`, `isGooutOfficial: false`
  - Sends admin email in inner try/catch (non-blocking)
  - Returns `{ success: true }` or `{ success: false; error: string }`

### Phase 4: Public Submission Page ✅
**Goal:** The form organizers will see

- [x] **Task 4.1:** Created `components/submit-event/EventSubmitForm.tsx`
  - Follows exact PartnerForm pattern: `useActionState`, `useEffect` toast, `handleSubmit` client-side Zod validation
  - eventType Select with hidden input (same area pattern)
  - venueTba Checkbox with `useState` that conditionally hides/shows venueName input
  - Sonner toast on success (with form reset + state reset) and error
  - Honeypot field with `sr-only`, `tabIndex={-1}`, `aria-hidden`
- [x] **Task 4.2:** Created `app/(public)/submit-event/page.tsx`
  - generateMetadata for SEO
  - Espresso hero section: "Bring Your Event to Hyderabad"
  - How-it-works 3-step section (milk bg, matching partner pattern)
  - Form section mounting `<EventSubmitForm />`
- [x] **Task 4.3:** Created `loading.tsx` and `error.tsx` alongside page
  - Loading: animated pulse skeleton matching partner loading
  - Error: `reset` button with AlertCircle matching partner error

### Phase 5: Admin Dashboard Updates ✅
**Goal:** Give admins visibility and control over pending submissions

- [x] **Task 5.1:** Updated `lib/queries/admin/events.ts`
  - Added optional `statusFilter` parameter to `listEventsForAdmin()`
  - Uses Drizzle `.where(eq(events.status, ...))` when filter is provided
- [x] **Task 5.2:** Added to `app/actions/admin/events.ts`
  - `approveEvent(id)` — sets status to 'upcoming', revalidates all event paths
  - `toggleGooutOfficial(id, value)` — sets isGooutOfficial, revalidates all event paths
  - Both call `assertAdminSession()` and follow existing patterns
- [x] **Task 5.3:** Rewrote `app/(admin)/admin/events/page.tsx`
  - Status filter pill tabs (All / Pending / Upcoming / Completed / Cancelled) via `?status=` searchParam
  - GoOut Official ⭐ star icon in title column when `isGooutOfficial = true`
  - Venue TBA shown as "Venue TBA" instead of em dash
  - Approve button (form with `approveEvent.bind(null, id)`) shown on pending rows only
  - Fixed `statusVariant()` to handle `pending` → `outline` badge variant
- [x] **Task 5.4:** Updated `components/admin/EventForm.tsx` + supporting files
  - `lib/validations/admin/event.ts` — added `venueTba`, `isGooutOfficial`, `pending` status
  - `EventForm.tsx` — added Venue TBA Switch + GoOut Official Switch section, updated `buildInitialValues` and `STATUS_OPTIONS`
  - `app/actions/admin/events.ts` — updated `toRowPayload` to include `venueTba` and `isGooutOfficial`

### Phase 6: Public Display Updates ✅
**Goal:** Pending events hidden; GoOut badge visible; TBA venue handled

- [x] **Task 6.1:** Created `components/events/GooutOfficialBadge.tsx`
  - Props: `show: boolean`, `size: "sm" | "md"` (default "md")
  - `sm` — amber badge for event cards (light bg context)
  - `md` — amber badge for event detail hero (dark overlay context)
  - Returns `null` when `show = false` — no empty space rendered
- [x] **Task 6.2:** Updated `components/events/EventCard.tsx`
  - `venueLabel` now checks `venueTba` first → shows "Venue TBA"
  - Shows `<GooutOfficialBadge show size="sm" />` above title when `isGooutOfficial = true`
  - Updated `components/events/EventInfoCard.tsx`:
    - Added `Guitar` icon for `jamming` event type
    - Venue block now checks `venueTba` first → shows *"Venue TBA — location coming soon"* (italic, muted)
- [x] **Task 6.3:** Updated `app/(public)/events/[slug]/page.tsx`
  - `generateMetadata` skips venue in SEO title/description when `venueTba = true`
  - Hero overlay now renders `<GooutOfficialBadge show={event.isGooutOfficial} size="md" />` alongside the event type pill
  - `VenueSection` only renders when `event.cafe` or `customVenue` exist — TBA events naturally skip it
- [x] **Task 6.4:** Verified `lib/queries/events.ts` ✅
  - `getUpcomingEvents()` — `eq(events.status, "upcoming")` ✅ pending excluded
  - `getUpcomingEventsForLanding()` — `eq(events.status, "upcoming")` ✅ pending excluded
  - `getEventsByCafe()` — `eq(events.status, "upcoming")` ✅ pending excluded
  - `getEventBySlug()` — no status filter (intentional: admin links + cancelled banners need it)

### Phase 7: Basic Code Validation ✅
**Goal:** Static analysis only

- [x] **Task 7.1:** `npm run lint` — ✅ zero errors (user confirmed)
- [x] **Task 7.2:** `npm run type-check` — Fixed 2 TS errors, then ✅ clean pass
  - Error 1: `statusVariant()` in `admin/events/[id]/page.tsx` — extended union to include `"pending"` → `"outline"` badge variant
  - Error 2: `approveEvent.bind(null, id)` — added `approveEventVoid(id): Promise<void>` wrapper in `app/actions/admin/events.ts`; form `action` now uses the void wrapper
- [x] **Task 7.3:** All new files reviewed — logic verified correct

## 12. Task Completion Tracking — MANDATORY WORKFLOW

🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [x] **Phase 1: Schema Migration** — ✅ Completed 2026-04-29
- [x] **Phase 2: Email Notification** — ✅ Completed 2026-04-29
- [x] **Phase 3: Validation + Server Action** — ✅ Completed 2026-04-29
- [x] **Phase 4: Public Submission Page** — ✅ Completed 2026-04-29
- [x] **Phase 5: Admin Dashboard Updates** — ✅ Completed 2026-04-29
- [x] **Phase 6: Public Display Updates** — ✅ Completed 2026-04-29
- [x] **Phase 7: Code Validation** — ✅ Completed 2026-04-29 (lint clean, tsc clean)

---

## 13. File Structure & Organization

```
project-root/
├── lib/
│   ├── drizzle/schema/
│   │   └── events.ts                          # MODIFY — add 3 fields
│   ├── validations/
│   │   └── event-submission.ts                # NEW — Zod schema
│   └── email.ts                               # MODIFY — add submission notification
├── app/
│   ├── actions/
│   │   ├── submit-event.ts                    # NEW — public submission action
│   │   └── admin-events.ts                    # NEW — approve + toggle official
│   ├── (public)/
│   │   └── submit-event/
│   │       ├── page.tsx                       # NEW — public submission page
│   │       ├── loading.tsx                    # NEW
│   │       └── error.tsx                      # NEW
│   └── (admin)/admin/events/
│       ├── page.tsx                           # MODIFY — pending filter + approve
│       └── [id]/page.tsx                      # MODIFY — GoOut Official toggle + venueTba
├── components/
│   ├── submit-event/
│   │   └── EventSubmitForm.tsx                # NEW — public form component
│   └── events/
│       ├── EventCard.tsx                      # MODIFY — GoOut badge + TBA venue
│       └── GooutOfficialBadge.tsx             # NEW — badge component
```

---

## 14. Potential Issues & Security Review

### Error Scenarios
- [ ] **Spam submissions:** Honeypot field mitigates bots. No rate limiting needed at this stage.
  - **Potential Fix:** If spam becomes an issue, add server-side rate limiting per IP
- [ ] **Enum migration irreversibility:** PostgreSQL enum ADD VALUE cannot be rolled back without dropping the type
  - **Mitigation:** Down migration documents this limitation with clear warning. The `pending` value is correct and permanent.
- [ ] **Email failure on submission:** Email send is wrapped in try/catch — event is saved to DB regardless
  - **Code Review Focus:** Verify `sendEventSubmissionNotification()` failure does not fail the server action

### Security & Access Control Review
- [ ] **Admin-only approval:** Approve/toggleOfficial actions are only in `app/(admin)/admin/` — protected by middleware ✅
- [ ] **Public form input validation:** All inputs validated server-side via Zod before DB insert ✅
- [ ] **No price exposure:** Submission form collects ticket price for internal use only — never shown publicly ✅
- [ ] **Honeypot:** Hidden field with max(0) validation silently drops bot submissions ✅

---

## 15. Deployment & Configuration

No new environment variables required. Uses existing:
- `RESEND_API_KEY` — already configured for email
- `DATABASE_URL` — already configured

---

## 18. Second-Order Consequences & Impact Analysis

🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- ✅ None — all changes are additive. Existing events, cafes, tickets, and admin flows are unaffected.

**TypeScript Impact:**
- The `event_status` enum gains a new value `'pending'`. Any switch/if statements on `event.status` in existing code that don't handle `'pending'` will need a default case. The `statusVariant()` function in `app/(admin)/admin/events/page.tsx` must be updated to handle `'pending'`.
- **Action:** Add `'pending'` handling in `statusVariant()` and any other status-dependent UI.

**Query Impact:**
- Existing public queries (`getUpcomingEvents`, `getUpcomingEventsForLanding`, `getCafeBySlug`) filter by `status = 'upcoming'` — pending events will naturally be excluded. ✅ Verify this is actually the case in Phase 6.

**Performance Implications:**
- Adding 2 boolean columns to `events` — negligible performance impact
- New `/submit-event` page is a static Server Component — no additional DB load

**User Experience Impacts:**
- Public users: no visible change (pending events are hidden)
- Admin users: new filter tabs and approve button in events list
- Organizers: new public page to submit events

**🚨 USER ATTENTION REQUIRED:**
The `pending` value added to the `event_status` enum **cannot be removed** from PostgreSQL without dropping and recreating the entire enum type. This is a permanent addition. This is acceptable because `pending` is a valid and permanent business state.
