# Task 011 — Razorpay Ticket Booking + QR Email Integration

---

## 1. Task Overview

### Task Title
**Title:** Razorpay Standard Checkout + Ticket QR Email Flow

### Goal Statement
**Goal:** Allow customers to book paid event tickets directly on the GoOut Hyd website. When a customer clicks "Book Now" on an event page, they fill in their details, pay via Razorpay, and instantly receive a ticket email with a scannable QR code. The booking is recorded in a new `tickets` table. Wilson can see all bookings in the Supabase dashboard. Free events (no `ticketPrice`) show "Free Entry" with no booking button.

---

## 2. Strategic Analysis

No strategic analysis needed — the approach is fully specified. Razorpay Standard Checkout is the only viable option for Indian payments at this scale. Server Actions (not API routes) handle all mutations per project architecture rules.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Framework:** Next.js 15.5.4 (App Router), React 19
- **Language:** TypeScript 5 — strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM 0.44.6
- **UI & Styling:** shadcn/ui + Tailwind CSS 3.4.1 — espresso/caramel/cream palette, light-only
- **Email:** Resend via `lib/email.ts` — pattern already established for partner leads
- **Key Patterns:** Server Components for data fetching, Server Actions for mutations, no API routes for internal operations
- **Auth:** Dormant in Phase 1 — all booking pages are public

### Current State
- `events` table exists with `ticketPrice: integer | null` (whole rupees), `status`, `startTime`, `slug`
- Event detail page at `app/(public)/events/[slug]/page.tsx` renders `EventInfoCard` + `VenueSection`
- `EventInfoCard` likely shows price — BookButton will be added alongside it
- `lib/email.ts` has `sendLeadNotification` — `sendTicketEmail` will be added following the same pattern
- `lib/env.ts` uses `@t3-oss/env-nextjs` — Razorpay vars need to be registered
- `.env.local` already has `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RESEND_API_KEY`
- No `tickets` table exists yet — needs schema + migration

### No Context Providers
This project has no global context providers — all data flows via Server Components and Server Actions. BookingModal receives event data as props.

---

## 4. Context & Problem Definition

### Problem Statement
GoOut Hyd events have ticket prices but no way to purchase them. Customers currently see the price with no action to take. This is the primary revenue mechanism for the platform — Wilson earns commission on ticket sales. Without a booking flow, the platform has no transactional value.

### Success Criteria
- [ ] Customer can click "Book Now" on a paid event, fill a form, pay via Razorpay popup, and receive a ticket email
- [ ] Ticket email contains a QR code (generated from the unique `ticket_code` UUID)
- [ ] Ticket is saved to the DB with `status: paid` only after signature verification passes
- [ ] Confirmation page (`/booking-confirmation?code=TICKET_CODE`) shows event details + QR code on screen
- [ ] Free events (`ticketPrice = null`) show "Free Entry" badge — no booking button
- [ ] Failed / abandoned payments leave ticket in `status: pending` — never marked paid
- [ ] If email fails, ticket is still saved — payment not rolled back
- [ ] Capacity tracking: `max_tickets` on events + sold count check before allowing booking
- [ ] `RAZORPAY_KEY_SECRET` never reaches the browser

---

## 5. Development Mode Context

- **New application in active development** — no backwards compatibility concerns
- **Data loss acceptable** — tickets table is new, no existing data
- **Aggressive implementation allowed** — write complete working code

---

## 6. Technical Requirements

### Functional Requirements
- Customer fills Name, Email, Phone, Quantity (min 1) → Server Action creates Razorpay order + pending ticket row
- Razorpay checkout popup opens with `order_id` — customer pays via card / UPI / netbanking / wallet
- On payment success, `handler` function calls `verifyPayment` Server Action
- Server verifies HMAC-SHA256 signature → updates ticket to `paid` → generates QR → sends email
- On redirect to `/booking-confirmation?code=UUID` → page fetches ticket by code → shows QR on screen
- Quantity × ticketPrice = total; total × 100 = paise for Razorpay; total in rupees stored in DB
- Capacity check: `tickets` with `status: paid` COUNT for `event_id` must be < `events.maxTickets` (if set)

### Non-Functional Requirements
- **Security:** `RAZORPAY_KEY_SECRET` server-only; verify signature before any paid status write
- **Resilience:** Email failure does not roll back payment — ticket stays `paid`
- **Responsive:** BookingModal works on 320px+ mobile (shadcn Dialog)
- **No dark mode** — light-only per project design system
- **No auth required** — all booking routes are public

### Technical Constraints
- Use Server Actions — no API routes for any booking operations
- Amount stored in DB as whole rupees (`integer`), converted to paise only when calling Razorpay API (`amount * 100`)
- Razorpay checkout script loaded dynamically in client component (not in `<head>`)
- Follow existing `pgTable` array-syntax for Drizzle constraints (per project cursor rule)
- Must create down migration before running `npm run db:migrate`

---

## 7. Data & Database Changes

### New Schema — `lib/drizzle/schema/tickets.ts`

```typescript
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { events } from "./events"

export const ticketStatusEnum = pgEnum("ticket_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
])

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    quantity: integer("quantity").notNull().default(1),
    amountPaid: integer("amount_paid").notNull(),       // whole rupees
    razorpayOrderId: text("razorpay_order_id").notNull().unique(),
    razorpayPaymentId: text("razorpay_payment_id"),    // filled after payment
    razorpaySignature: text("razorpay_signature"),     // filled after payment
    ticketCode: text("ticket_code").notNull().unique(), // UUID generated on order creation
    status: ticketStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("tickets_razorpay_order_id_idx").on(t.razorpayOrderId),
    uniqueIndex("tickets_ticket_code_idx").on(t.ticketCode),
    index("tickets_event_id_idx").on(t.eventId),
    index("tickets_status_idx").on(t.status),
    index("tickets_customer_email_idx").on(t.customerEmail),
  ],
)

export type Ticket = typeof tickets.$inferSelect
export type NewTicket = typeof tickets.$inferInsert
```

### Events Schema Update — add `maxTickets` to `events` table

Add `maxTickets: integer("max_tickets")` (nullable — null means unlimited) to `apps/web/lib/drizzle/schema/events.ts`.

### Down Migration Safety Protocol
- [ ] **Step 1:** Run `npm run db:generate` after schema edits
- [ ] **Step 2:** Create `drizzle/migrations/[timestamp]/down.sql` — `DROP TABLE IF EXISTS tickets; DROP TYPE IF EXISTS ticket_status;` + `ALTER TABLE events DROP COLUMN IF EXISTS max_tickets;`
- [ ] **Step 3:** Verify down.sql uses `IF EXISTS` throughout
- [ ] **Step 4:** Run `npm run db:migrate`

---

## 8. API & Backend Changes

### Data Access Pattern

| Operation | Pattern | File |
|---|---|---|
| Create Razorpay order + insert pending ticket | Server Action | `app/actions/tickets.ts` |
| Verify signature + update ticket to paid + send email | Server Action | `app/actions/tickets.ts` |
| Fetch ticket by code (confirmation page) | Direct in Server Component | `app/(public)/booking-confirmation/page.tsx` |
| Count sold tickets for capacity check | Query function (reused) | `lib/queries/tickets.ts` |

### Server Actions — `app/actions/tickets.ts`

**`createOrder(input)`**
- Input: `{ eventId, customerName, customerEmail, customerPhone, quantity }`
- Fetch event from DB — validate exists + status is `upcoming`
- If `maxTickets` set: count `paid` tickets for event — reject if sold out
- Calculate `amount = event.ticketPrice × quantity`
- Call `razorpay.orders.create({ amount: amount * 100, currency: 'INR', receipt: ticketCode })`
- Generate `ticketCode = crypto.randomUUID()`
- Insert ticket row with `status: 'pending'`
- Return: `{ orderId, ticketCode, amount, keyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID }`

**`verifyPayment(input)`**
- Input: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`
- Look up ticket by `razorpayOrderId`
- Verify HMAC-SHA256 signature: `hmac(razorpayOrderId + "|" + razorpayPaymentId, KEY_SECRET)`
- If invalid → return `{ success: false, error: 'Payment verification failed' }`
- If valid → update ticket: `status: 'paid'`, save `razorpayPaymentId` + `razorpaySignature`
- Fetch ticket + event + cafe data for email
- Generate QR code base64 from `ticketCode`
- Call `sendTicketEmail(...)` — email failure does NOT block success response
- Return: `{ success: true, ticketCode }`

### External Integrations
- **Razorpay Node.js SDK** (`razorpay` npm package) — server-side order creation
- **Resend** (already configured) — ticket email with QR attachment
- **qrcode** npm package — QR code generation as base64 data URL

---

## 9. Frontend Changes

### Existing Components in `components/events/` (already built)
The directory already contains: `EventCard.tsx`, `EventInfoCard.tsx`, `CategoryFilterCards.tsx`, `EventEmptyState.tsx`, `VenueSection.tsx`. Add `BookButton.tsx` and `BookingModal.tsx` to the same directory.

**`EventInfoCard` already handles price display** — it shows `₹{ticketPrice}` or `"Free Entry"` in the card. The `BookButton` goes **below** `EventInfoCard` in the page layout, not inside the card. Do not modify `EventInfoCard`.

### Available shadcn Components (already installed — do not re-install)
`dialog`, `button`, `input`, `label`, `select`, `badge`, `skeleton`, `sonner` (toast), `card`, `textarea`, `separator` — all present in `components/ui/`. BookingModal should use `Dialog` from shadcn.

### New Components to Create

- **`components/events/BookButton.tsx`** — Client component. Receives `event` (id, title, ticketPrice, slug). Renders "Book Now" button that opens BookingModal. Only rendered by the page when `ticketPrice > 0`.
- **`components/events/BookingModal.tsx`** — Client component (shadcn Dialog). Form: Full Name, Email, Phone, Quantity (number input, min 1, max 10). Shows live total price (`ticketPrice × quantity`). On submit → `createOrder` Server Action → loads Razorpay script dynamically → opens checkout popup. Handler on success → `verifyPayment` Server Action → `router.push('/booking-confirmation?code=...')`. Use `sonner` toast for errors.

### Page Updates

- **`app/(public)/events/[slug]/page.tsx`** — Add `BookButton` **below** `EventInfoCard` in the left column (lg:col-span-1). Only render `BookButton` when `event.ticketPrice !== null && event.ticketPrice > 0`. For null/zero price, `EventInfoCard` already shows "Free Entry" — no additional badge needed.
- **`app/(public)/booking-confirmation/page.tsx`** — New page. Reads `?code=` from searchParams. Fetches ticket by code from DB. Shows event name, date, venue, quantity, amount, QR code image on screen, ticket code text, "Check your email" note, back to events button.

### State Management
- No global state — BookingModal uses local `useState` for form fields + loading states
- `router.push()` for post-payment redirect

---

## 10. Code Changes Overview

### New Files (11 files)

```
apps/web/
├── lib/
│   ├── razorpay.ts                              ← Razorpay SDK singleton
│   ├── queries/tickets.ts                        ← getTicketByCode(), countSoldTickets()
│   └── drizzle/schema/tickets.ts                ← tickets table + ticketStatusEnum
├── app/
│   ├── actions/tickets.ts                        ← createOrder + verifyPayment Server Actions
│   └── (public)/booking-confirmation/
│       ├── page.tsx                              ← Confirmation page with QR on screen
│       ├── loading.tsx                           ← Skeleton loading state
│       └── error.tsx                             ← Error boundary
└── components/events/
    ├── BookButton.tsx                            ← "Book Now" trigger button
    └── BookingModal.tsx                          ← Form + Razorpay checkout popup
```

### Modified Files (5 files)

```
apps/web/
├── lib/
│   ├── drizzle/schema/events.ts                 ← Add maxTickets column
│   ├── drizzle/schema/index.ts                  ← Export tickets schema
│   ├── email.ts                                 ← Add sendTicketEmail function
│   └── env.ts                                   ← Register RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
└── app/(public)/events/[slug]/page.tsx          ← Add BookButton + Free Entry badge
```

### Key Changes Summary

**`lib/env.ts`** — add server vars `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`, client var `NEXT_PUBLIC_RAZORPAY_KEY_ID`

**`lib/email.ts`** — add `sendTicketEmail()` function following exact same Resend pattern as `sendLeadNotification`. Sender: `onboarding@resend.dev` (swapped to `tickets@goouthyd.com` once domain verified — one-line env change).

**`app/(public)/events/[slug]/page.tsx`** — conditionally render `<BookButton>` when `ticketPrice > 0`, or "Free Entry" badge when `ticketPrice` is null.

---

## 11. Implementation Plan

### Phase 0: Install Packages FIRST
**Goal:** Install npm packages before any code is written — required for type-checking to work

- [x] **Task 0.1:** `npm install razorpay qrcode` (from `apps/web/` directory)
- [x] **Task 0.2:** `npm install --save-dev @types/qrcode` (from `apps/web/` directory)

### Phase 1: Database Schema + Migration
**Goal:** Add tickets table + maxTickets to events, run migration safely

- [x] **Task 1.1:** Edit `lib/drizzle/schema/tickets.ts` — create tickets table + ticketStatusEnum
- [x] **Task 1.2:** Edit `lib/drizzle/schema/events.ts` — add `maxTickets` column
- [x] **Task 1.3:** Edit `lib/drizzle/schema/index.ts` — export tickets
- [x] **Task 1.4:** Run `npm run db:generate` from project root
- [x] **Task 1.5:** Create down migration file (`drizzle/migrations/0001_breezy_peter_quill/down.sql`)
- [x] **Task 1.6:** Run `npm run db:migrate`

### Phase 2: Server Infrastructure
**Goal:** Env vars, Razorpay client, query functions, Server Actions

- [x] **Task 2.1:** Edit `lib/env.ts` — register Razorpay env vars (optional, graceful degradation)
- [x] **Task 2.2:** Create `lib/razorpay.ts` — Razorpay SDK singleton
- [x] **Task 2.3:** Create `lib/queries/tickets.ts` — `getTicketByCode()` + `countSoldTickets()`
- [x] **Task 2.4:** Create `app/actions/tickets.ts` — `createOrder` + `verifyPayment` Server Actions
- [x] **Task 2.5:** Edit `lib/email.ts` — add `sendTicketEmail()` function (CID-attached QR)

### Phase 3: Frontend Components + Pages
**Goal:** BookButton, BookingModal, confirmation page, event page integration

- [x] **Task 3.1:** Create `components/events/BookButton.tsx`
- [x] **Task 3.2:** Create `components/events/BookingModal.tsx`
- [x] **Task 3.3:** Create `app/(public)/booking-confirmation/page.tsx` + `loading.tsx` + `error.tsx`
- [x] **Task 3.4:** Edit `app/(public)/events/[slug]/page.tsx` — add BookButton (Free Entry already handled by EventInfoCard)

### Phase 4: Install Packages
**Goal:** Add razorpay + qrcode npm packages

> ⚠️ Superseded by Phase 0 — packages were installed first as instructed.

- [x] **Task 4.1:** `npm install razorpay qrcode` (done in Phase 0)
- [x] **Task 4.2:** `npm install --save-dev @types/qrcode` (done in Phase 0)

### Phase 5: Validation
**Goal:** Static analysis only

- [x] **Task 5.1:** Run `npm run lint` in `apps/web/` — clean
- [x] **Task 5.2:** Run `npm run type-check` in `apps/web/` — clean
- [x] **Task 5.3:** Read all new/modified files and verify logic + edge case handling

### Phase 6: Code Review
- [x] **Task 6.1:** Present "Implementation Complete!" message
- [x] **Task 6.2:** Execute comprehensive code review — two post-test issues fixed (see Section 19)

### Phase 7: User Testing
- [x] **Task 7.1:** 👤 USER TESTING — Full flow verified with Razorpay test card (`4100 2800 0000 1007`)
  - Card payment succeeded, ticket saved, email delivered, QR code visible in Gmail, confirmation page rendered QR + details
  - Quantity input fix confirmed (typing `5`, `7`, etc. now works)

---

## 12. Task Completion Tracking

### Phase 1: Database Schema + Migration
- [x] **Task 1.1:** Create tickets schema ✓
- [x] **Task 1.2:** Add maxTickets to events ✓
- [x] **Task 1.3:** Export tickets from schema index ✓
- [x] **Task 1.4:** Generate migration ✓
- [x] **Task 1.5:** Create down migration ✓
- [x] **Task 1.6:** Apply migration ✓

### Phase 2: Server Infrastructure
- [x] **Task 2.1:** Register Razorpay env vars ✓
- [x] **Task 2.2:** Create lib/razorpay.ts ✓
- [x] **Task 2.3:** Create lib/queries/tickets.ts ✓
- [x] **Task 2.4:** Create app/actions/tickets.ts ✓
- [x] **Task 2.5:** Add sendTicketEmail to lib/email.ts ✓

### Phase 3: Frontend
- [x] **Task 3.1:** BookButton.tsx ✓
- [x] **Task 3.2:** BookingModal.tsx ✓
- [x] **Task 3.3:** booking-confirmation page ✓
- [x] **Task 3.4:** Update events/[slug]/page.tsx ✓

### Phase 4: Packages
- [x] **Task 4.1:** npm install razorpay qrcode ✓
- [x] **Task 4.2:** npm install @types/qrcode ✓

---

## 13. File Structure

```
apps/web/
├── lib/
│   ├── razorpay.ts                         NEW
│   ├── drizzle/schema/
│   │   ├── tickets.ts                      NEW
│   │   ├── events.ts                       MODIFIED (maxTickets)
│   │   └── index.ts                        MODIFIED (export tickets)
│   ├── queries/
│   │   └── tickets.ts                      NEW
│   ├── email.ts                            MODIFIED (sendTicketEmail)
│   └── env.ts                              MODIFIED (Razorpay vars)
├── app/
│   ├── actions/
│   │   └── tickets.ts                      NEW
│   └── (public)/
│       ├── events/[slug]/page.tsx          MODIFIED (BookButton)
│       └── booking-confirmation/
│           ├── page.tsx                    NEW
│           ├── loading.tsx                 NEW
│           └── error.tsx                   NEW
└── components/events/
    ├── BookButton.tsx                      NEW
    └── BookingModal.tsx                    NEW
```

### Dependencies to Add
```json
{
  "dependencies": {
    "razorpay": "latest",
    "qrcode": "latest"
  },
  "devDependencies": {
    "@types/qrcode": "latest"
  }
}
```

---

## 14. Potential Issues & Security Review

### Error Scenarios
- [ ] **Razorpay order creation fails** — surface error to user in modal, don't open checkout
- [ ] **User closes checkout popup without paying** — ticket stays `pending`, `ondismiss` resets loading state
- [ ] **Signature verification fails** — return `{ success: false }`, show error toast, do not update ticket
- [ ] **Email send fails** — log error, ticket is still `paid`, return success to frontend
- [ ] **Event sold out** — `createOrder` returns `{ success: false, error: 'Sold out' }` before Razorpay order is created
- [ ] **`ticketPrice` is null** — `createOrder` returns error; BookButton never renders for null price events

### Edge Cases
- [ ] **Duplicate order for same session** — Razorpay `order_id` is unique; `razorpayOrderId` column has UNIQUE constraint
- [ ] **`/booking-confirmation` with invalid code** — `getTicketByCode` returns null → `notFound()`
- [ ] **`/booking-confirmation` with pending ticket** — show "Payment pending" state, not the QR
- [ ] **Razorpay script fails to load** — catch script load error, show toast "Payment unavailable"
- [ ] **Phone format** — prefix `+91` if not already present before passing to Razorpay `prefill.contact`

### Security Review
- [ ] `RAZORPAY_KEY_SECRET` used only in Server Actions — never returned to client
- [ ] Signature must verify before `status: paid` write — verified in `verifyPayment` action
- [ ] `ticketCode` is a UUID — not guessable
- [ ] Confirmation page fetches ticket server-side — no sensitive payment data exposed in URL

---

## 15. Deployment & Configuration

### Environment Variables

Already in `.env.local`:
```bash
RAZORPAY_KEY_ID=rzp_test_SeXTdNgkR45MWU
RAZORPAY_KEY_SECRET=BEPiVBA6D9eKdQWFPDiYwzmJ
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_SeXTdNgkR45MWU
RESEND_API_KEY=re_KgGgxV18_4m8T94TDDmkJ65reJQMjC6d4
```

**Add to Vercel dashboard** (same 4 vars) before going live.

**When going live:**
1. Replace `rzp_test_*` keys with `rzp_live_*` keys in Vercel env vars
2. Swap email sender from `onboarding@resend.dev` → `tickets@goouthyd.com` (once domain verified in Resend)
3. Enable auto-capture in Razorpay Dashboard → Account & Settings → Payment Capture → Auto

---

## 16. Testing Checklist (User)

After implementation, test with Razorpay test credentials:

```
Test card:  4100 2800 0000 1007
CVV:        Any 3 digits
Expiry:     Any future date
OTP:        1234 (if prompted)

Test UPI:   success@razorpay
```

- [ ] Book Now button appears on paid event pages
- [ ] Free Entry badge shows on free/null-price events
- [ ] Booking form validates all fields
- [ ] Total price updates dynamically with quantity
- [ ] Razorpay popup opens correctly
- [ ] Test payment succeeds
- [ ] Ticket email arrives with QR code
- [ ] Confirmation page shows QR + event details
- [ ] Failed payment (close popup) — no ticket marked paid
- [ ] `/booking-confirmation?code=invalid` returns 404

---

## 17. Notes & Additional Context

### Reference Documents
- `ai_docs/razorpay_integration_reference.md` — condensed integration guide for this project (**read this first**)
- `ai_docs/Razor_pay/web_integration.md` — full Razorpay official docs (3208 lines, for deep reference only)
- `ai_docs/dev_templates/drizzle_down_migration.md` — mandatory template for creating down migration files

### QR Code Spec
```typescript
await QRCode.toDataURL(ticketCode, {
  width: 300,
  margin: 2,
  color: {
    dark: '#1C1008',   // espresso
    light: '#FFFCF7',  // foam
  }
})
```

### Email Sender
- Development / until domain verified: `onboarding@resend.dev`
- Production after domain verification: `tickets@goouthyd.com`
- This is a 1-line change in `lib/email.ts` when ready

### Razorpay Domain Approval
Domain submitted for approval — required only for live mode. Test mode is already active and fully functional for development and testing.

---

## 18. Second-Order Impact Analysis

### Breaking Changes
- `events` schema gets a new nullable column `max_tickets` — no existing queries break (nullable, no default required)
- New `ticket_status` enum is additive — no existing code references it

### Performance Implications
- Confirmation page adds one DB query (ticket by code) — negligible, indexed
- QR generation is CPU-light for a single UUID string — no concern
- Razorpay script (~80KB) loads lazily only when modal opens — no impact on initial page load

### Security Considerations
- ✅ Payment secret server-only
- ✅ Signature verified before status update
- ✅ Ticket codes are UUID v4 — not sequential/guessable
- ⚠️ No rate limiting on `createOrder` — acceptable for Phase 1 (low traffic)

### Maintenance
- When domain verified: 1-line change in `lib/email.ts`
- When going live: swap env var values in Vercel dashboard
- Razorpay SDK is well-maintained (used by thousands of Indian businesses)

---

### Confirmation Page — QR Code Display
The confirmation page fetches the ticket server-side using `getTicketByCode(code)`. Render the QR code using an `<Image>` tag with `src={ticket.qrCodeDataUrl}` — but note: **the QR code data URL is NOT stored in the DB**. It must be regenerated on the confirmation page using the `ticketCode` from the ticket row. Import `QRCode` from `qrcode` and call `QRCode.toDataURL(ticket.ticketCode, { ... })` in the server component.

### Correct Phase Order for Implementation
Run phases in this order: **0 (packages) → 1 (DB) → 2 (server) → 3 (frontend) → 5 (validation)**. Phase 4 in the plan is the old package phase — ignore it, Phase 0 replaces it.

---

*Task created: 2026-04-17*  
*Status: ✅ **COMPLETED** — all phases shipped, end-to-end verified in test mode*

---

## 19. Post-Test Fixes Applied

Two issues surfaced during User Testing (Phase 7) and were fixed before marking complete:

### Fix 1 — QR code invisible in Gmail
- **Symptom:** Ticket email arrived in Gmail showing a broken-image placeholder instead of the QR code. Confirmation page QR worked fine.
- **Root cause:** Gmail strips inline base64 `<img src="data:image/png;base64,...">` tags from HTML email bodies as a security policy.
- **Fix:** In `lib/email.ts`, switched from inline data URL to a PNG **attachment** with a `contentId`. The HTML now references it via `src="cid:goouthyd-ticket-qr"`, which renders inline in Gmail, Outlook, Apple Mail, and Yahoo. A data-URL fallback attribute is still injected for preview-only clients that strip CID.

### Fix 2 — Quantity input couldn't be typed
- **Symptom:** Typing any value between 1 and 10 in the Number of Tickets field didn't stick — only the up/down arrow buttons worked.
- **Root cause:** `onChange` was doing `parseInt(value)` and only committing state when `Number.isFinite(...)`. During typing, the field is briefly empty/invalid, so React never committed those intermediate states.
- **Fix:** In `BookingModal.tsx`, switched quantity state to a **string-backed** `quantityText` that accepts any input while typing. A derived `quantity` value (clamped 1–10) is computed every render for price display + API submission. `onBlur` normalizes the text to the clamped value so invalid entries like `99` or empty become `10` or `1` on focus loss.

---

## 20. Final Implementation Summary

### Files Created (11)
```
apps/web/
├── lib/
│   ├── razorpay.ts
│   ├── queries/tickets.ts
│   └── drizzle/schema/tickets.ts
├── app/
│   ├── actions/tickets.ts
│   └── (public)/booking-confirmation/
│       ├── page.tsx
│       ├── loading.tsx
│       └── error.tsx
├── components/events/
│   ├── BookButton.tsx
│   └── BookingModal.tsx
└── drizzle/migrations/
    ├── 0001_breezy_peter_quill.sql
    └── 0001_breezy_peter_quill/down.sql
```

### Files Modified (5)
```
apps/web/
├── lib/
│   ├── drizzle/schema/events.ts      (maxTickets column)
│   ├── drizzle/schema/index.ts       (export tickets)
│   ├── email.ts                      (sendTicketEmail + CID QR attachment)
│   ├── env.ts                        (Razorpay env vars)
│   └── queries/events.ts             (select + map maxTickets)
└── app/(public)/events/[slug]/page.tsx  (BookButton integration)
```

### Test Evidence
- ✅ Razorpay test card `4100 2800 0000 1007` → payment captured
- ✅ HMAC signature verified server-side before `status: paid` write
- ✅ Ticket row inserted with `paid` status, `razorpay_payment_id`, `razorpay_signature`
- ✅ Confirmation page renders QR + event details
- ✅ Email delivered to Gmail with scannable inline QR (after Fix 1)
- ✅ Quantity input accepts typed values 1–10 (after Fix 2)
- ✅ Failed/abandoned payments leave ticket in `pending` — never promoted to `paid`

### Going Live Checklist (when ready)
1. Swap `rzp_test_*` keys for `rzp_live_*` in Vercel env vars (3 vars)
2. Verify domain in Resend → change sender from `onboarding@resend.dev` to `tickets@goouthyd.com` (1-line change in `lib/email.ts`)
3. Enable auto-capture in Razorpay Dashboard (Account & Settings → Payment Capture → Auto)
4. Complete Razorpay KYC if not already done
5. Domain allowlisting in Razorpay (already submitted)
6. Do one real ₹1 transaction end-to-end before full cutover
