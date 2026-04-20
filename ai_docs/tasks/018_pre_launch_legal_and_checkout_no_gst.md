# Task 018 — Pre-launch legal pages, checkout disclosures & pricing (no GST)

---

## 1. Task Overview

### Task Title
**Title:** Terms/Privacy/Refund updates, footer & checkout legal line, order summary without GST

### Goal Statement
**Goal:** Prepare GoOut Hyd for collecting real payments while **not** charging or displaying GST (business is not GST-registered; CA guidance: no GST line item). Implement the **3% convenience fee** on ticket subtotal only (no tax row), update **Terms §4** and **Privacy Policy** with ticketing/payment language, add a dedicated **`/refunds`** page, surface **support email** and **Refund Policy** in the footer, and add the **“By completing this purchase…”** agreement line with links on the booking checkout UI. **Supersedes the GST-related portions of Task 017** — do **not** implement GST on convenience fee until/unless registered with GSTIN and advised by a CA.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
**Skipped for tax treatment** — user and advisor direction is explicit: **unregistered = no GST line**. Strategic choice remains only for **rounding** (half-up vs floor for 3% fee) — document in `lib/` and use consistently in `createOrder` and UI.

### Recommendation & Rationale
- **Single source of truth** for rupees/paise totals: shared module (extend or add alongside `lib/events/ticket-pricing.ts`) computing `ticketSubtotal`, `convenienceFeeRupees`, `totalRupees` — **no `gst` field**.
- **Server action** returns breakdown fields so `BookingModal` cannot drift from charged amount.
- **Legal copy** lives in page components (same pattern as existing `terms/page.tsx`, `privacy/page.tsx`); **last updated** dates bumped on publish.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- Next.js 15 App Router, `LegalPageWrapper` + `LegalLayout` + `TableOfContents` for `/terms`, `/privacy`.
- **Booking:** `app/actions/tickets.ts` — `amountRupees = unitRupees * quantity` only; Razorpay `amount` in paise.
- **UI:** `components/events/BookingModal.tsx` — shows single **Total** and **Pay ₹{total}**; no convenience fee yet.
- **Footer:** `components/layout/Footer.tsx` — Legal links only Privacy + Terms; **no** support email in footer; **no** Refunds link.

### Current State
- **Terms §4** still states events are display-only and **does not sell tickets in Phase 1** — **incorrect** once payments are live; must be replaced.
- **Privacy** does not describe ticket purchases or Razorpay — must be extended.
- **No `/refunds` route** — create `app/(public)/refunds/page.tsx` (+ `loading.tsx`, `error.tsx` per project pattern).
- **Task 017** assumed GST on convenience fee — **do not follow**; use this task instead for pricing + policy work.

### Existing Context Providers
- N/A (no global user context).

---

## 4. Context & Problem Definition

### Problem Statement
Collecting money without GST registration requires **no fake tax lines**, clear **platform vs organiser** roles, **refund/cancellation** rules, and **payment processor** disclosures. Checkout must match Razorpay amount and show **Tickets + Convenience fee + Total** (and ticket-line UX from 017: plain `Tickets` for qty 1, `Tickets (n) × ₹…` for n > 1).

### Success Criteria
- [ ] No UI or server path charges or labels **GST**, **IGST**, **CGST/SGST**, or generic **Taxes** as a government tax while unregistered.
- [ ] `createOrder` / Razorpay order amount = **ticket subtotal + rounded 3% convenience fee** (same as Task 017 math **minus** GST).
- [ ] Terms §4 replaced with structure and substance per §6.1 below (user-provided outline; exact wording can be tightened but meaning preserved).
- [ ] Privacy: new subsections for ticket purchase data, Razorpay, retention (~12 months) per §6.2.
- [ ] `/refunds` page live, linked from footer + checkout line.
- [ ] Checkout: visible line **By completing this purchase you agree to our Terms of Service and Refund Policy** (links to `/terms`, `/refunds`).
- [ ] Support email visible (footer and/or refunds page — `hello@goouthyd.com` unless product owner changes).
- [ ] `npm run lint` and `npm run type-check` in `apps/web` pass.

---

## 5. Development Mode Context
- No backwards-compatibility requirement for draft 017 GST math.
- Coordinate **amountPaid** in DB: today stores total rupees — must store **new** total including convenience fee once fee is implemented.

---

## 6. Technical Requirements

### Functional Requirements

**Pricing (no GST)**
- Ticket subtotal = `quantity × unitPayableRupees` (existing `getPayablePricePerTicketRupees`).
- Convenience fee = `round(0.03 × ticketSubtotal)` to whole rupees (confirm rounding mode in code comment).
- Total = subtotal + convenience fee — **only** these two components before Razorpay.

**Legal content**
- Replace **§4 Event Information** in `terms/page.tsx` with new **§4 Ticket Purchases & Events** (subsections 4.1–4.5 as below).
- Insert Privacy sections after existing data-collection content (or integrate logically): **Ticket purchases**, **Payment processing (Razorpay)**, **Ticket records / retention**.
- New refunds policy page at **`/refunds`** with sections: title, last updated, customer cancellations, organiser cancellation, rescheduling, contact + response time.

**Checkout / discovery**
- Booking modal: order summary rows + total + pay button label + agreement links.
- Footer: add **Refund & Cancellation Policy** link; add **Contact** or support email line if not redundant with About.

### Non-Functional Requirements
- Light-only UI; readable on mobile.
- Accessibility: link text meaningful (`Terms of Service`, not “click here”).

### Technical Constraints
- Do not run `npm run build` for validation — use lint + type-check.
- Razorpay keys remain server-only; no card data stored.

### Non-code checklist (owner / ops — document in task notes when done)
- [ ] Razorpay dashboard: display name, test → live keys.
- [ ] Bookkeeping spreadsheet (date, customer, event, amount, order id) — user process.
- [ ] Future GST registration — revisit Task 017-style tax line **only** after CA advice.

---

## 7. Data & Database Changes

### Schema
- **`tickets.amountPaid`**: already total rupees — must equal new **subtotal + fee** once implemented.
- **Optional (nice-to-have):** `convenience_fee_rupees` integer nullable for analytics — **not required** for MVP if `amountPaid` and server logs suffice.

### Migrations
- Only if optional columns added — follow `npm run db:generate` + down migration rules.

---

## 8. API & Backend Changes

### `app/actions/tickets.ts`
- Import pricing helper for **subtotal + fee + total** (from `lib/events/` or `lib/pricing/`).
- Replace `amountRupees = unitRupees * quantity` with total including fee.
- Extend `CreateOrderResult` success type to include **`ticketSubtotalRupees`**, **`convenienceFeeRupees`**, **`amountPaise`** (unchanged meaning: full charge).

### API routes
- None unless webhooks added later.

---

## 9. Frontend Changes

### New files
- `app/(public)/refunds/page.tsx` (+ `loading.tsx`, `error.tsx`)
- Optional: `components/events/OrderSummary.tsx` if summary grows beyond modal

### Modify
- `components/events/BookingModal.tsx` — breakdown, agreement text, use server-returned amounts for Pay button (not client-only `payablePrice * quantity`).
- `components/layout/Footer.tsx` — Refunds link + support email
- `app/(public)/terms/page.tsx` — §4 replacement; TOC array update for new section ids/titles
- `app/(public)/privacy/page.tsx` — new sections; TOC update

### Metadata
- `generateLegalMetadata` for `/refunds` consistent with other legal pages.

---

## 10. Code Changes Overview

### Terms §4 — target structure (implement as legal prose on site)

**4. Ticket Purchases & Events**

- **4.1** GoOut Hyd acts as a **platform** connecting event organisers and attendees; not the organiser unless explicitly stated.
- **4.2** Ticket prices are **inclusive of all charges** as shown; a **convenience fee** may apply and is shown at checkout before payment.
- **4.3** **All sales are final**; non-refundable except where the event is **cancelled by the organiser** (adjust wording to match `/refunds` — keep consistent).
- **4.4** If cancelled: notify at checkout email; refunds within **7 business days** to original payment method.
- **4.5** Not liable for **changes** to venue, time, artist by organiser after purchase.

### Privacy — add (substance)

- **Ticket purchases:** name, email, phone — delivery, reminders, support.
- **Payment processing:** Razorpay; no card/UPI/bank storage; link to Razorpay privacy policy; store transaction references for confirmation.
- **Retention:** ticket records ~**12 months** for support/disputes (align with actual practice).

### Refunds page — substance

- **Customer cancellations:** non-refundable; transfer option via contact **≥24h** before event (email placeholder: same as site support).
- **Organiser cancellation:** full refund including convenience fee within **7 business days**.
- **Rescheduling:** ticket valid for new date; if cannot attend, contact within **48h** of announcement for full refund.
- **Contact:** support email + **response within 24 hours** (best-effort statement).

### Pricing example (no GST)

```text
Tickets                         ₹499.00    ← or "Tickets (2) × ₹499" when n>1
Convenience fee (3%, rounded)    ₹15.00
────────────────────────────────────────
Total                            ₹514.00
```

### Key Changes Summary
- [ ] Remove any planned GST from **017**; implement **018** pricing only.
- [ ] Legal + checkout + footer + server total alignment.

**Files:** `tickets.ts`, `BookingModal.tsx`, `Footer.tsx`, `terms/page.tsx`, `privacy/page.tsx`, new `refunds/*`, optional `ticket-order-pricing.ts` or extend existing lib.

---

## 11. Implementation Plan

### Phase 1: Pricing module + server action
- [x] Add `computeTicketCheckoutRupees(quantity, unitRupees)` → subtotal, fee, total (no tax). ✓ 2026-04-20
  - Files: `apps/web/lib/events/ticket-checkout-pricing.ts` (3% fee, `Math.round`, `totalRupeesToPaise`)
- [x] Wire `createOrder` and persist `amountPaid` = total. ✓ 2026-04-20
  - Files: `apps/web/app/actions/tickets.ts`; `BookingModal` uses same helper for displayed totals + breakdown

### Phase 2: Booking UI
- [x] Show breakdown + **Pay ₹{total}** from server response. ✓ 2026-04-20
  - `BookingModal` keeps client preview; after successful `createOrder`, `serverCheckout` state mirrors `orderResult` subtotal/fee/total for display.
- [x] Add agreement line with `<Link>` to `/terms` and `/refunds`. ✓ 2026-04-20
  - `BookingModal` copy + links; new route `app/(public)/refunds/page.tsx` (+ loading/error).

### Phase 3: Legal pages
- [x] Update Terms §4; bump `lastUpdated`. ✓ 2026-04-20
  - Replaced §4 with **Ticket Purchases & Events** (platform role, pricing/fees, refunds pointer to `/refunds`, organiser cancellations, changes); TOC id `ticket-purchases-events`.
- [x] Extend Privacy; bump `lastUpdated`. ✓ 2026-04-20
  - New §3 **Ticket Purchases & Payments** (checkout data, Razorpay + link, ~12 month ticket records); renumbered following sections; retention cross-reference.
- [x] Add `/refunds` with `LegalPageWrapper`. ✓ 2026-04-20 (done in Phase 2; unchanged this pass)

### Phase 4: Footer & polish
- [x] Footer: Refunds + visible `hello@goouthyd.com` (or chosen support address). ✓ 2026-04-20
  - Refund Policy link (Phase 2); `mailto:hello@goouthyd.com` in brand column under Instagram.

### Phase 5: Validation
- [x] `cd apps/web && npm run lint && npm run type-check` ✓ 2026-04-20

---

## 12. Task Completion Tracking
- [ ] Mark checkboxes and timestamps as work completes.

---

## 13. File Structure & Organization

```
apps/web/app/(public)/refunds/page.tsx
apps/web/app/(public)/refunds/loading.tsx
apps/web/app/(public)/refunds/error.tsx
apps/web/lib/events/ticket-checkout-pricing.ts   # or similar — fee-only math
```

---

## 14. Potential Issues & Security Review

- **Mismatch:** Client must use **server-returned** totals after order creation (or pre-compute with same pure function imported from client-safe `*-client.ts` if split — prefer server as source of truth post-`createOrder`).
- **Legal:** This task is **not** legal advice; owner should have a **CA consult** before go-live if uncertain.

---

## 15. Deployment & Configuration
- No new env vars for copy.
- Ensure production Razorpay live keys when switching from test.

---

## 16. AI Agent Instructions
- Implement after user approval.
- **Deprecate** implementation of GST from **017**; if 017 file is kept, add a one-line note at top: *Superseded for tax/pricing by 018.*
- No `npm run dev` / `npm run build`.

---

## 17. Notes & Additional Context

### Relation to Task 017
- **017** — Order summary with **GST on fee** → **do not implement** while unregistered.
- **018** — Same UX ideas (ticket line copy, 3% fee) **without** any tax line.

### Research
- Razorpay Orders API `amount` in paise.
- Existing `LegalPageWrapper`, `generateLegalMetadata`.

---

## 18. Second-Order Consequences

- Confirmation emails / booking confirmation page should show **same** breakdown if they show amounts (check `sendTicketEmail`, confirmation UI).
- Admin ticket export may need column for fee if stored later.

---

*Task created from `ai_docs/dev_templates/task_template.md`*  
*Task number: 018*
