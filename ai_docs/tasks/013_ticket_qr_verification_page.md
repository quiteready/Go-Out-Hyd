# Task 013 — Ticket QR Verification Page (`/verify/[code]`)

**Status:** 📝 Drafted — awaiting approval
**Created:** 2026-04-18
**Depends on:** Task 011 (Razorpay integration), Task 012 (Razorpay go-live)

---

## 1. Task Overview

### Task Title
**Title:** Make ticket QR codes actually usable at the venue by encoding a verification URL and adding a staff-facing verify page.

### Goal Statement
**Goal:** Today, the QR code on the booking confirmation page and the ticket email encodes only the raw ticket UUID (e.g. `e514846e-a506-416a-a51b-2de16660cabe`). When a phone camera scans this, it treats the string as a search query (Google returned "no results") rather than opening anything actionable. We want the QR to encode a URL like `https://goouthyd.com/verify/<ticket_code>` so that any phone's native camera, when scanned by venue staff, opens a simple page showing whether the ticket is valid — ticket holder name, event, date, paid/used status. This is the minimum viable "door scan" experience for the MVP, with zero extra apps required.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The `qrcode` library we already use will happily encode any string. The question is _what_ to encode and _where_ the scan should land. A raw UUID forces venue staff to install a special scanner app, which we are not going to build for MVP. A URL-based QR leverages every smartphone's built-in scanner.

### Solution Options Analysis

#### Option 1: URL QR + public read-only verify page (RECOMMENDED)
**Approach:** QR encodes `${NEXT_PUBLIC_APP_URL}/verify/${ticketCode}`. Page is public (no auth), server-renders ticket status from Supabase via Drizzle, displays a clear "VALID ✓" or "NOT FOUND ✗" banner with ticket details.

**Pros:**
- ✅ Works with any phone's native camera — zero friction
- ✅ Ships in a few hundred lines of code, fits in one phase
- ✅ Matches the ticket-UX standard (Razorpay, BookMyShow, District all do this)
- ✅ Lays groundwork for Phase 2 "mark as used" button

**Cons:**
- ❌ Ticket codes are UUIDs but are technically guessable-scale-wise (1 in 5.3×10³⁶ — not a real security concern for MVP, and the page only shows name + event + date, no PII like phone/email)
- ❌ Requires internet at the venue (all modern venues have this)

**Implementation Complexity:** Low — one new route, one QR encode change in two files
**Risk Level:** Low — isolated read-only feature, no schema changes

#### Option 2: Signed JWT in QR + verify page that decodes it
**Approach:** QR encodes a signed token; server verifies signature before showing status.

**Pros:**
- ✅ Ticket codes can't be forged or enumerated
- ✅ Works offline if we pre-share a public key

**Cons:**
- ❌ Overkill for MVP — no value exchange risk; the ticket code itself is the only truth, not the QR
- ❌ Adds crypto dependency, key management, rotation story
- ❌ Not what users expect (sharing a long unreadable link)

**Implementation Complexity:** Medium
**Risk Level:** Medium — new surface area, key management

#### Option 3: Dynamic signed URL with short-lived token
**Approach:** Same as Option 1 but with `?token=...&exp=...` query string signed by a secret.

**Pros:**
- ✅ Prevents sharing of QR publicly

**Cons:**
- ❌ Tokens expire — breaks the "screenshot your ticket" user expectation
- ❌ Needs token refresh logic in the confirmation page
- ❌ Overengineered for an MVP with ~dozens of tickets/week

**Implementation Complexity:** Medium
**Risk Level:** Medium

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 — URL QR + public read-only verify page.

**Why:**
1. **Solves the real user problem** — door staff can scan with any phone, no tooling required.
2. **Proportional to risk** — we're selling ₹250 tickets, not boarding passes. UUID unguessability is sufficient.
3. **Ships fast** — estimated ~1 hour of dev work, all in one phase.
4. **Forward-compatible** — the verify page can gain a "Mark as used" button in Phase 2 with one column added to `tickets`.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Framework:** Next.js 15.5.4 App Router
- **Database:** Supabase Postgres via Drizzle ORM
- **QR library:** `qrcode` (already installed)
- **Relevant files:**
  - `apps/web/app/(public)/booking-confirmation/page.tsx` — confirmation page, generates QR
  - `apps/web/lib/email.ts` — ticket email, generates QR (two places: `toBuffer` and `toDataURL`)
  - `apps/web/lib/queries/tickets.ts` — `getTicketByCode()` already exists and returns everything we need
  - `apps/web/lib/drizzle/schema/tickets.ts` — `tickets` schema with `ticketCode`, `status`, `customerName`, `quantity`, etc.
  - `apps/web/lib/env.ts` — `NEXT_PUBLIC_APP_URL` already defined

### Current State
- QR codes on confirmation page and email encode the raw UUID string.
- Scanning with a phone camera does nothing useful — phones treat the string as a search query.
- `getTicketByCode(code)` exists and returns ticket + event + cafe joined data.
- No `/verify/[code]` route exists.

---

## 4. Context & Problem Definition

### Problem Statement
The MVP is live and taking payments. When customers arrive at a venue, staff cannot verify tickets in any automated way. The QR currently printed on the ticket and confirmation page is effectively decorative. The first event is coming up soon and Wilson / door staff need a simple way to confirm "this QR = real paid ticket for tonight's event."

### Success Criteria
- [ ] Scanning the QR on the confirmation page with any phone's native camera opens a web page on `goouthyd.com`.
- [ ] The page clearly shows: VALID / INVALID status, event title, event date/time, attendee name, ticket quantity, ticket code (last 8 chars).
- [ ] If the code doesn't exist in DB → clear "Ticket not found" page with 404 status.
- [ ] If the ticket exists but `status !== 'paid'` → shows "Not yet paid" warning.
- [ ] Works on mobile (staff will scan with phones).
- [ ] QR in the email inlined PNG attachment also encodes the URL (keep QR in email body + as attachment).
- [ ] Existing confirmation page still renders the QR correctly.

---

## 5. Development Mode Context
- Phase 1 MVP, real paying users now but volume is low.
- No backwards compat needed — old QRs (from the smoke tests only) can be regenerated if needed.
- Priority: ship fast, safely.

---

## 6. Technical Requirements

### Functional Requirements
- QR encodes `${NEXT_PUBLIC_APP_URL}/verify/${ticketCode}` instead of raw `ticketCode`.
- New public page at `/verify/[code]` renders ticket status server-side.
- Page is mobile-first (expected primary viewer: venue staff on phone).

### Non-Functional Requirements
- **Performance:** Server-rendered, single Drizzle query (`getTicketByCode`) — sub-300ms TTFB.
- **Security:** Public page is OK; only displays non-sensitive fields (name, event, date, quantity). Never show email, phone, amount paid, or payment IDs.
- **Responsive:** Mobile-first; large clear status banner visible at arm's length.
- **Theme:** Light mode only (project standard).

### Technical Constraints
- Must reuse `getTicketByCode` from `lib/queries/tickets.ts` — do not write a new query.
- Must use existing `NEXT_PUBLIC_APP_URL` env var for the URL — no new env vars.
- QR encoding logic must be shared between confirmation page and email (DRY).

---

## 7. Data & Database Changes

**No database changes required.** Existing `tickets` schema is sufficient.

---

## 8. API & Backend Changes

No Server Actions, no API routes. This is a pure read, rendered directly in a Server Component using the existing `getTicketByCode` query.

---

## 9. Frontend Changes

### New Files
- `apps/web/app/(public)/verify/[code]/page.tsx` — server component, renders status
- `apps/web/app/(public)/verify/[code]/loading.tsx` — loading skeleton
- `apps/web/app/(public)/verify/[code]/not-found.tsx` — (optional) or use `notFound()` + root not-found

### Files to Modify
- `apps/web/app/(public)/booking-confirmation/page.tsx` — change QR payload from `ticket.ticketCode` to the verify URL
- `apps/web/lib/email.ts` — change both `QRCode.toBuffer` and `QRCode.toDataURL` calls to encode the verify URL
- (Optional but preferred) `apps/web/lib/tickets-qr.ts` — new helper `buildVerifyUrl(code)` used by all three call sites

---

## 10. Code Changes Overview

### 📂 Before (current)

```typescript
// apps/web/app/(public)/booking-confirmation/page.tsx
return await QRCode.toDataURL(ticket.ticketCode, { ... });

// apps/web/lib/email.ts
qrPngBuffer = await QRCode.toBuffer(ticket.ticketCode, { ... });
qrDataUrlFallback = await QRCode.toDataURL(ticket.ticketCode, { ... });
```

### 📂 After

```typescript
// apps/web/lib/tickets-qr.ts (new)
import { env } from "@/lib/env";

export function buildVerifyUrl(ticketCode: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}/verify/${ticketCode}`;
}
```

```typescript
// apps/web/app/(public)/booking-confirmation/page.tsx
import { buildVerifyUrl } from "@/lib/tickets-qr";
return await QRCode.toDataURL(buildVerifyUrl(ticket.ticketCode), { ... });

// apps/web/lib/email.ts
import { buildVerifyUrl } from "@/lib/tickets-qr";
const verifyUrl = buildVerifyUrl(ticket.ticketCode);
qrPngBuffer = await QRCode.toBuffer(verifyUrl, { ... });
qrDataUrlFallback = await QRCode.toDataURL(verifyUrl, { ... });
```

```typescript
// apps/web/app/(public)/verify/[code]/page.tsx (new)
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTicketByCode } from "@/lib/queries/tickets";

export const metadata: Metadata = { title: "Ticket Verification | GoOut Hyd" };

interface PageProps { params: Promise<{ code: string }> }

function formatEventDate(date: Date): string {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function VerifyPage({ params }: PageProps) {
  const { code } = await params;
  const ticket = await getTicketByCode(code);
  if (!ticket) notFound();

  const isValid = ticket.status === "paid";
  const venueLine = ticket.event.cafe
    ? `${ticket.event.cafe.name}, ${ticket.event.cafe.area}`
    : "Venue TBC";

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className={`rounded-lg border p-6 text-center ${
        isValid
          ? "border-caramel/40 bg-foam"
          : "border-red-300 bg-red-50"
      }`}>
        <div className={`inline-flex rounded-full px-4 py-1 text-sm font-semibold ${
          isValid ? "bg-caramel/15 text-caramel" : "bg-red-200 text-red-800"
        }`}>
          {isValid ? "VALID TICKET" : "NOT PAID"}
        </div>
        <h1 className="mt-4 font-heading text-2xl text-espresso">
          {ticket.event.title}
        </h1>
        <dl className="mt-6 space-y-2 text-left text-sm">
          <div className="flex justify-between"><dt className="text-roast/70">Name</dt><dd className="font-medium">{ticket.customerName}</dd></div>
          <div className="flex justify-between"><dt className="text-roast/70">Tickets</dt><dd className="font-medium">{ticket.quantity}</dd></div>
          <div className="flex justify-between"><dt className="text-roast/70">Date</dt><dd className="font-medium text-right">{formatEventDate(ticket.event.startTime)}</dd></div>
          <div className="flex justify-between"><dt className="text-roast/70">Venue</dt><dd className="font-medium text-right">{venueLine}</dd></div>
        </dl>
        <p className="mt-4 font-mono text-xs text-roast/50">
          {ticket.ticketCode.slice(0, 8)}…{ticket.ticketCode.slice(-4)}
        </p>
      </div>
    </div>
  );
}
```

### 🎯 Key Changes Summary
- **New helper** `lib/tickets-qr.ts` — single source of truth for verify URL
- **New route** `/verify/[code]` — public staff-facing verify page
- **QR payload change** in 3 call sites — encode URL instead of raw code
- **Files modified:** 2 existing, 3 new
- **Impact:** scanning the QR with any phone opens a verification page on the live site

---

## 11. Implementation Plan

### Phase 1: QR URL Helper + Verify Route
- [ ] **Task 1.1:** Create `apps/web/lib/tickets-qr.ts` with `buildVerifyUrl()`
- [ ] **Task 1.2:** Create `apps/web/app/(public)/verify/[code]/page.tsx`
- [ ] **Task 1.3:** Create `apps/web/app/(public)/verify/[code]/loading.tsx` (simple skeleton)
- [ ] **Task 1.4:** Update `booking-confirmation/page.tsx` to use `buildVerifyUrl()`
- [ ] **Task 1.5:** Update `lib/email.ts` (both QR calls) to use `buildVerifyUrl()`

### Phase 2: Validation
- [ ] **Task 2.1:** `npm run lint`
- [ ] **Task 2.2:** `npm run type-check`

### Phase 3: User Browser Testing
- [ ] Book a ₹1 test ticket in prod (or reuse existing paid test ticket).
- [ ] Scan QR on confirmation page with phone camera — confirm it opens `goouthyd.com/verify/<code>`.
- [ ] Verify page renders: VALID banner, event, name, date.
- [ ] Try `/verify/nonsense-code` → 404.
- [ ] Open ticket email on another device, scan the embedded QR — same result.

### Phase 4: Commit & Deploy
- [ ] Conventional commit, push to `main`, Vercel auto-deploys.

---

## 12. Task Completion Tracking
(To be filled in during execution.)

---

## 13. File Structure & Organization

### New Files
```
apps/web/
├── app/(public)/verify/[code]/
│   ├── page.tsx
│   └── loading.tsx
└── lib/
    └── tickets-qr.ts
```

### Files to Modify
- `apps/web/app/(public)/booking-confirmation/page.tsx`
- `apps/web/lib/email.ts`

### Dependencies to Add
None.

---

## 14. Potential Issues & Security Review

### Error Scenarios
- [ ] **Invalid code in URL** → `getTicketByCode` returns null → `notFound()` → 404 page.
- [ ] **Ticket exists but unpaid** → show "NOT PAID" banner instead of VALID. (Should be rare; Razorpay verify flow only creates tickets on success.)
- [ ] **`NEXT_PUBLIC_APP_URL` misconfigured** → QR URL would be wrong. Already validated in `env.ts` at build time.

### Edge Cases
- [ ] **Old test tickets with raw-UUID QR codes** → those QRs keep working because the UUID is still indexed; only the _scan behavior_ changes for new tickets. No DB migration needed.
- [ ] **Staff scanning the same ticket twice** → page just shows VALID both times. Phase 2 will add "mark as used."

### Security Review
- [ ] **Public page, no PII** — we only show customer name, event info. No email, phone, amount, payment IDs.
- [ ] **Ticket code enumeration** — UUIDs are 128-bit; enumerating is computationally infeasible.
- [ ] **Rate limiting** — not needed at MVP scale. Re-evaluate if abuse appears.

---

## 15. Deployment & Configuration

### Environment Variables
None added. Uses existing `NEXT_PUBLIC_APP_URL`.

### Post-deploy verification
- Confirm `NEXT_PUBLIC_APP_URL=https://goouthyd.com` is set in Vercel Production.
- Test one live QR scan end-to-end.

---

## 16. Second-Order Consequences

- **Existing paid tickets (pre-deploy):** Their QRs still encode raw UUIDs. If we want them to also work via URL scan, the user can re-open their confirmation page — QR is regenerated server-side on each render, so existing customers revisiting the link will get the new URL-based QR automatically. Email QRs already-sent keep the old raw-UUID payload; acceptable because we've only sent 1–2 smoke-test emails so far.
- **SEO:** `/verify/[code]` pages should be `noindex`. Add `robots: { index: false }` in metadata.
- **Phase 2 extension:** Adding a `used_at timestamp` column + "Mark as used" button on the verify page is a natural next step but explicitly out of scope here.

---

*Ready for approval. On go-ahead I'll execute Phase 1 start-to-finish in one pass (small, isolated change), then report back for lint/type-check confirmation.*
