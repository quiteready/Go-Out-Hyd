# Task 021 — Event Status Fixes & Instagram Link Update

## 1. Task Overview

### Task Title
**Title:** Event Status Hardening — "Mark as Completed" Button, Pending Event URL Guard, Instagram Link Fix

### Goal Statement
**Goal:** Three focused fixes to the events system and site footer. (1) Give admins a one-click "Mark as Completed" button in the events dashboard so past events are correctly reflected in the database rather than staying stuck as "upcoming" forever. (2) Guard pending (organizer-submitted, not-yet-approved) events from being publicly viewable via a direct URL — they should return 404. (3) Update the generic Instagram footer link to the real GoOut Hyd profile.

---

## 2. Strategic Analysis & Solution Options

Strategic analysis is not required — all three changes have a single, obvious implementation path. The approaches are already established in the codebase (pattern from `cancelEvent` / `approveEvent` actions, existing `getEventBySlug` query, and the `Footer.tsx` component).

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Framework:** Next.js 15 (App Router), React 19
- **Language:** TypeScript (strict)
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui + Tailwind CSS
- **Authentication:** Custom admin cookie auth (`lib/admin/auth.ts`)
- **Key Patterns:** Server Components for data fetching, Server Actions for mutations (`app/actions/admin/events.ts`)

### Current State

**Issue 1 — No "Mark as Completed" button:**
- `app/actions/admin/events.ts` has `cancelEvent`, `approveEvent`, `deleteEvent` — but no `completeEvent` action.
- `app/(admin)/admin/events/page.tsx` shows an "Approve" button for pending events and no completion button for upcoming events.
- Past events with `status = 'upcoming'` never transition to `completed` in the DB. They are hidden from the public page (because `getUpcomingEvents` filters `startTime > now`), but sit stale in admin.

**Issue 2 — Pending events accessible via direct URL:**
- `lib/queries/events.ts` → `getEventBySlug(slug)` has no status filter.
- `app/(public)/events/[slug]/page.tsx` calls `getEventBySlug` and renders the full event page for any status including `pending`.
- An organizer who just submitted an event could share the URL before admin approves it, making the unpublished event publicly visible.

**Issue 3 — Generic Instagram link:**
- `components/layout/Footer.tsx` line 61: `href="https://instagram.com"` — links to the generic Instagram homepage instead of the GoOut Hyd profile.
- Correct URL: `https://www.instagram.com/goout_hyd?igsh=MTA5bXBlb3V3bGw0Mw==`

---

## 4. Context & Problem Definition

### Problem Statement
All three issues were discovered during an audit of the admin events dashboard and site footer. The stale "upcoming" status for past events creates a misleading admin view. The unguarded pending event slug is a pre-launch security/content concern — it lets unreviewed content be publicly accessed. The Instagram link is just wrong and should have been updated at launch.

### Success Criteria
- [ ] Admin can click "Mark as Completed" on any `upcoming` event and its status changes to `completed` in the DB immediately, with cache revalidation
- [ ] `GET /events/[slug]` for a `pending` event returns a 404 (not-found page)
- [ ] Footer Instagram link navigates to `https://www.instagram.com/goout_hyd?igsh=MTA5bXBlb3V3bGw0Mw==`
- [ ] No regression: `cancelled` and `completed` events still accessible via direct URL (only `pending` is blocked)
- [ ] Admin events list shows "Mark as Completed" button only for `upcoming` events (not pending/cancelled/completed)

---

## 5. Development Mode Context
- **Active production deployment** — changes must not break existing public pages
- **No DB schema changes** — `event_status` enum already includes `completed`; this is purely logic/UI
- **No new dependencies needed**

---

## 6. Technical Requirements

### Functional Requirements
- Admin can click "Mark as Completed" on an `upcoming` event → status → `completed`, page revalidated
- `getEventBySlug` must return `null` for events with `status = 'pending'`
- Footer Instagram `href` updated to correct URL

### Non-Functional Requirements
- **Security:** `completeEvent` server action must call `assertAdminSession()` (same as all other admin actions)
- **Cache:** `revalidatePath` + `requestProductionRevalidation` called after status change (same pattern as `cancelEvent`)
- **UX:** Button only shown for `upcoming` events; visual style consistent with existing admin table buttons

### Technical Constraints
- Must follow existing action pattern in `app/actions/admin/events.ts`
- Must not add status filter for `cancelled` or `completed` events in `getEventBySlug` (those can be viewed publicly)
- Must use existing `revalidateEventPaths` + `warnIfProductionRevalidateFailed` helpers

---

## 7. Data & Database Changes

**No schema changes required.** The `event_status` enum already has:
```ts
export const eventStatusEnum = pgEnum("event_status", [
  "pending",
  "upcoming",
  "cancelled",
  "completed",  // ✅ Already exists
]);
```

No migration needed.

---

## 8. API & Backend Changes

### Server Actions

**[MODIFY] `app/actions/admin/events.ts`**
Add a `completeEvent` action (and a void wrapper `completeEventVoid` for form use), following the exact same pattern as `cancelEvent`:

```ts
export async function completeEventVoid(id: string): Promise<void> {
  await completeEvent(id);
}

export async function completeEvent(id: string): Promise<EventActionResult> {
  await assertAdminSession();

  try {
    const [row] = await db
      .update(events)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning({ id: events.id, slug: events.slug });

    if (!row) {
      return { success: false, error: "Event not found" };
    }

    revalidatePath(`/admin/events/${id}`);
    revalidateEventPaths(row.slug);
    warnIfProductionRevalidateFailed(
      await requestProductionRevalidation(
        publicPathsForEventMutation(row.slug),
      ),
    );
    return { success: true, id: row.id, slug: row.slug };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to complete event",
    };
  }
}
```

### Query Changes

**[MODIFY] `lib/queries/events.ts` → `getEventBySlug`**
Add a `pending` status guard:

```ts
// Before:
.where(eq(events.slug, slug))

// After:
.where(
  and(
    eq(events.slug, slug),
    ne(events.status, "pending"),
  )
)
```

This means `pending` events return `null` → the page calls `notFound()` → 404. `cancelled` and `completed` remain publicly visible (organizers/attendees may share cancelled event URLs and we want them to see the cancellation banner).

Import `and` and `ne` from `drizzle-orm` (both already used elsewhere in the file — need to confirm `ne` is imported).

---

## 9. Frontend Changes

### Admin Events Page — "Mark as Completed" Button

**[MODIFY] `app/(admin)/admin/events/page.tsx`**

Current action buttons column (per row):
```tsx
{isPending && (
  <form action={approveEventVoid.bind(null, event.id)}>
    <Button ...>Approve</Button>
  </form>
)}
<Button asChild ...><Link href={`/events/${event.slug}`}>...</Link></Button>
<Button asChild ...><Link href={`/admin/events/${event.id}`}>...</Link></Button>
```

Add a "Mark as Completed" button for `upcoming` events:
```tsx
const isUpcoming = event.status === "upcoming";

{isUpcoming && (
  <form action={completeEventVoid.bind(null, event.id)}>
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
      aria-label="Mark event as completed"
    >
      <CheckCircle2 className="mr-1 h-4 w-4" />
      Complete
    </Button>
  </form>
)}
```

Import `completeEventVoid` from `@/app/actions/admin/events`.

### Footer Instagram Link

**[MODIFY] `components/layout/Footer.tsx`**

```tsx
// Before (line 61–62):
href="https://instagram.com"

// After:
href="https://www.instagram.com/goout_hyd?igsh=MTA5bXBlb3V3bGw0Mw=="
```

---

## 10. Code Changes Overview

### Files Modified

| File | Change |
|---|---|
| `app/actions/admin/events.ts` | Add `completeEvent` + `completeEventVoid` actions |
| `lib/queries/events.ts` | Add `ne(events.status, "pending")` filter to `getEventBySlug` |
| `app/(admin)/admin/events/page.tsx` | Import `completeEventVoid`, add "Complete" button for `upcoming` rows |
| `components/layout/Footer.tsx` | Update Instagram href to real profile URL |

### Key Changes Summary
- **No DB migration** — `completed` status already exists in the enum
- **Pattern consistency** — `completeEvent` is identical in structure to `cancelEvent`
- **Minimal public surface change** — only `getEventBySlug` is touched; public listing query (`getUpcomingEvents`) is unchanged
- **Security** — `pending` events now return 404 publicly; admin can still see and edit them via the admin panel (admin query has no `pending` exclusion)

---

## 11. Implementation Plan

### Phase 1: Backend — Server Action
**Goal:** Add `completeEvent` and `completeEventVoid` to the admin events actions file

- [ ] **Task 1.1:** Add `completeEvent` and `completeEventVoid` to `app/actions/admin/events.ts`
  - Files: `app/actions/admin/events.ts`
  - Details: Follow exact pattern of `cancelEvent`. Export both functions.

### Phase 2: Query Guard — Pending Events
**Goal:** Prevent pending events from being publicly accessible via slug

- [ ] **Task 2.1:** Update `getEventBySlug` in `lib/queries/events.ts`
  - Files: `lib/queries/events.ts`
  - Details: Add `ne(events.status, "pending")` to the WHERE clause. Ensure `ne` and `and` are imported from `drizzle-orm`.

### Phase 3: Frontend — Admin UI & Footer
**Goal:** Wire up the Complete button in admin and fix the Instagram link

- [ ] **Task 3.1:** Add "Mark as Completed" button to admin events table
  - Files: `app/(admin)/admin/events/page.tsx`
  - Details: Import `completeEventVoid`, add `isUpcoming` variable, render Complete button for `upcoming` rows.

- [ ] **Task 3.2:** Fix Instagram link in Footer
  - Files: `components/layout/Footer.tsx`
  - Details: Replace `https://instagram.com` with `https://www.instagram.com/goout_hyd?igsh=MTA5bXBlb3V3bGw0Mw==`

### Phase 4: Code Validation
**Goal:** Static verification only

- [ ] **Task 4.1:** Run TypeScript type-check
  - Command: `npm run type-check` in `apps/web/`
- [ ] **Task 4.2:** Read all modified files to verify correctness of imports, logic, and integration

### Phase 5: Code Review & Completion
- [ ] **Task 5.1:** Present "Implementation Complete!" message
- [ ] **Task 5.2:** Comprehensive code review of all 4 modified files

### Phase 6: User Browser Testing
- [ ] **Task 6.1:** User verifies "Mark as Completed" button appears and works in admin
- [ ] **Task 6.2:** User verifies a pending event URL returns 404
- [ ] **Task 6.3:** User verifies footer Instagram link navigates to GoOut Hyd profile

---

## 12. Task Completion Tracking

### Phase 1: Backend — Server Action
- [x] **Task 1.1:** Add `completeEvent` + `completeEventVoid` to `app/actions/admin/events.ts` ✓ 2026-04-30
  - Added both functions at line 278–319, following exact pattern of `cancelEvent`
  - `completeEventVoid` is the void wrapper for form `action` prop binding
  - `completeEvent` sets `status: "completed"`, calls `assertAdminSession()`, revalidates paths ✓

### Phase 2: Query Guard — Pending Events
- [x] **Task 2.1:** Update `getEventBySlug` in `lib/queries/events.ts` ✓ 2026-04-30
  - Added `ne` to drizzle-orm import (line 1) ✓
  - Wrapped WHERE clause in `and(eq(events.slug, slug), ne(events.status, "pending"))` ✓
  - Comment clarifies cancelled/completed remain accessible ✓

### Phase 3: Frontend — Admin UI & Footer
- [x] **Task 3.1:** Add "Mark as Completed" button to admin events table ✓ 2026-04-30
  - Imported `completeEventVoid` alongside `approveEventVoid` ✓
  - Added `isUpcoming` variable per row ✓
  - Complete button rendered for `upcoming` events (blue, ghost variant) ✓
- [x] **Task 3.2:** Fix Instagram link in Footer ✓ 2026-04-30
  - `href` updated to `https://www.instagram.com/goout_hyd?igsh=MTA5bXBlb3V3bGw0Mw==` ✓

### Phase 4: Code Validation
- [x] **Task 4.1:** TypeScript type-check ✓ 2026-04-30
  - `npm run type-check` → `tsc --noEmit` → exit code 0, no errors ✓
- [x] **Task 4.2:** All 4 modified files reviewed ✓ 2026-04-30

### Phase 5: Code Review
- [ ] **Task 5.1:** Present completion message
- [ ] **Task 5.2:** Comprehensive review

### Phase 6: User Browser Testing
- [ ] **Task 6.1:** Admin Complete button test
- [ ] **Task 6.2:** Pending event URL → 404 test
- [ ] **Task 6.3:** Instagram footer link test

---

## 13. File Structure & Organization

### Files to Modify
- [ ] `app/actions/admin/events.ts` — Add `completeEvent`, `completeEventVoid`
- [ ] `lib/queries/events.ts` — Add pending guard to `getEventBySlug`
- [ ] `app/(admin)/admin/events/page.tsx` — Add Complete button
- [ ] `components/layout/Footer.tsx` — Fix Instagram link

### No New Files Required

---

## 14. Potential Issues & Security Review

- [ ] **Edge Case — Completing an already-completed event:** The DB update will succeed silently (no harm). The button is only shown for `upcoming` events in the UI, so this is not reachable via normal flow.
- [ ] **Edge Case — Completing an event with pending tickets:** Not a concern — `completed` is a terminal status that doesn't affect ticket validity. QR verification (`/verify`) is independent of event status.
- [ ] **Security — `completeEvent` action:** Must call `assertAdminSession()` to prevent unauthenticated calls. ✅ Included in plan.
- [ ] **Public event detail for cancelled events:** `cancelled` events remain accessible (they render the "This event has been cancelled" banner). Only `pending` is blocked. ✅

---

## 15. Deployment & Configuration

No environment variable changes required.
After implementation, trigger a production deploy so Vercel picks up the updated `Footer.tsx` and query logic.

---

## 16. Log

- **2026-04-30:** Task created. Scope: 3 fixes — `completeEvent` action, pending slug guard, Instagram link update. No DB migration needed.
