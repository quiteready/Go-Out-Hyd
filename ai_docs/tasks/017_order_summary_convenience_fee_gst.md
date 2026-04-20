# Task 017 — Order Summary: Convenience Fee, GST & Ticket Line UX

> **Superseded for tax/pricing:** While the business is **not GST-registered**, do **not** implement the GST line or GST-on-fee math here. Use **`018_pre_launch_legal_and_checkout_no_gst.md`** instead (convenience fee only + legal pages). Revisit 017’s GST portions only after CA advice and registration.

---

## 1. Task Overview

### Task Title
**Title:** Payment order summary — 3% convenience fee, GST on fee, conditional ticket line copy

### Goal Statement
**Goal:** Implement the agreed order-summary breakdown for ticket checkout (and any related confirmation UI): subtotal from tickets, convenience fee calculated as **3% of ticket subtotal** (rounded to whole rupees per business rules), **GST at 18% on the convenience fee only**, and a **Total** that matches the single amount sent to Razorpay. Adjust the **Tickets** row label so that for **exactly one ticket** we show a simple line (`Tickets` + amount) **without** `(1 × price)`; for **two or more tickets**, show quantity explicitly, e.g. `Tickets (2) × ₹499` with the correct line total. This extends the pricing model described in Task 011 (today: `quantity × ticketPrice` only).

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
**Skipped** — the user specified the fee model, tax scope (GST on convenience fee), display copy rules, and reference layout. Implementation details (rounding order, paise conversion) should be documented in code and verified for consistency with Razorpay order amount.

### Problem Context
Checkout must show a clear, honest breakdown, compute one authoritative total server-side (never trust client-only math), and persist line items or a structured breakdown if needed for receipts and support.

### Recommendation & Rationale
**RECOMMENDED:** Centralize calculation in a **server-trusted** pure function (e.g. `lib/pricing/ticket-order.ts` or extend existing booking helpers), input: `unitPricePaise` or whole rupees (match existing schema), `quantity`. Output: `ticketSubtotal`, `convenienceFee`, `gstOnFee`, `total`, all with explicit rounding rules. UI consumes the same shape for BookingModal order summary and confirmation email/PDF if applicable.

**Rounding (default spec — confirm in implementation):**
- Ticket subtotal: `quantity × unitPrice` (integer rupees; schema uses whole rupees per Task 011).
- Convenience fee: `round(0.03 × ticketSubtotal)` to integer rupees (banker’s vs half-up — pick one and document).
- GST on fee: `round(0.18 × convenienceFee)` or use paise internally then round once for display + Razorpay.
- Total: `ticketSubtotal + convenienceFee + gstOnFee` — must equal Razorpay `amount` in paise (`total * 100`).

### Decision Request
**USER DECISION:** None pending for scope — fee %, GST %, and ticket-line UX are set. Optional later: whether ticket price itself is GST-inclusive from the organizer (separate from fee GST) — out of scope unless CA requires it.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15 (App Router), React 19, TypeScript strict
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle — `events.ticketPrice`, `tickets` per Task 011
- **UI & Styling:** shadcn/ui + Tailwind — **light-only** (no dark mode)
- **Payments:** Razorpay Standard Checkout — order `amount` in paise
- **Key Architectural Patterns:** Server Actions for create order / verify payment; client modal for checkout UI

### Current State
- Task **011** defines booking flow: `quantity × ticketPrice` → Razorpay amount; no convenience fee or GST lines yet.
- No dedicated `UserContext` / `UsageContext` — data via props and Server Components.
- **Implement this task when/where the booking UI and server-side order creation exist** (or as part of 011 follow-up if not merged yet).

### Existing Context Providers Analysis
- **N/A** — no global user/billing context; order summary receives computed totals from server action response or shared calculator.

---

## 4. Context & Problem Definition

### Problem Statement
Customers need a transparent breakdown (tickets, convenience fee, taxes). The product owner wants **3%** fee on ticket subtotal (rounded), **18% GST on that fee**, and specific **copy rules** for the ticket row: no `(1 × ₹…)` when quantity is 1; show `(n) × ₹…` when `n > 1`. The charged total must stay consistent across UI, Razorpay, DB, and emails.

### Success Criteria
- [ ] Order summary matches the target layout (see §10) with correct numbers for sample: 1×₹499 → fee ₹15, GST ₹2.70, total ₹516.70 (subject to rounding policy).
- [ ] **One ticket:** label `Tickets` with amount **only** — **no** `Tickets (1 × ₹499)`.
- [ ] **Multiple tickets:** label `Tickets (n) × ₹{unit}` (or equivalent approved copy) with line total = `n × unit`.
- [ ] Server-side order creation uses the **same** total as displayed; Razorpay `amount` in paise matches.
- [ ] Edge cases: `quantity` min 1; large quantities; free events unchanged (no booking / no fee path).

---

## 5. Development Mode Context

- Active development; prefer clear types and a single source of truth for pricing.
- Coordinate with Task 011 schema: if storing `amount_paid` only, ensure it reflects new total; optional follow-up columns for `convenience_fee`, `gst_amount` if reconciliation needed (separate mini-task if scope creep).

---

## 6. Technical Requirements

### Functional Requirements
- Compute: ticket subtotal, convenience fee (3% rounded), GST on fee (18%), grand total.
- Display: ticket line per copy rules; `Convenience fee`; `Taxes (as applicable)` or `GST @ 18% on convenience fee` — **align label with legal/marketing preference** (task uses “Taxes (as applicable)” per user).
- Pass grand total to Razorpay order creation and persist paid amount consistently.

### Non-Functional Requirements
- **Security:** Totals computed server-side for order creation; client display may mirror but must not be sole source of truth.
- **Responsive:** Summary readable on 320px+.
- **Theme:** Light-only; **do not** require dark mode (template default overridden for this project).

### Technical Constraints
- Follow CLAUDE.md Phase 1 / booking tasks: no `any`; explicit return types.
- **Do not** run `npm run build` for validation — use `npm run lint` and `npm run type-check` in `apps/web`.

---

## 7. Data & Database Changes

### Database Schema Changes
**Optional for MVP:** If only `total` is stored today, storing breakdown columns is **recommended** for support and receipts:

- `convenience_fee_rupees` (integer)
- `gst_on_fee_rupees` (integer)  
Or store subunits in paise — **align with Task 011 `tickets` table** when implementing.

If no schema change: store composite `amount_paid` only and add `notes` / internal metadata — document trade-off.

### Data Migration Plan
- [ ] Only if new columns: generate migration + **down migration** per project rules.

---

## 8. API & Backend Changes

### Server Actions / booking flow
- [ ] Extend **create order** path: accept `quantity`, load `ticketPrice`, run pricing calculator, create Razorpay order with computed `amount` (paise).
- [ ] **verify payment** / ticket finalization: persist total (and optional line items).

### API Routes
- **None** for internal booking — webhooks only if Razorpay webhook added later (Task 011 scope).

---

## 9. Frontend Changes

### New / updated components
- [ ] Order summary block inside booking/checkout UI — props: `quantity`, `unitPrice`, `breakdown` from server or shared client-safe calculator **only for display** if server sends final numbers.

### Page Updates
- [ ] Event booking modal / checkout step showing the breakdown.
- [ ] Confirmation page / email template: same numbers if required for parity.

### State Management
- Server Action returns breakdown + `razorpayOrderId`; client renders returned figures.

---

## 10. Code Changes Overview

### Target layout (reference)

**Single ticket (note: no “1 ×” in label)**

```text
Tickets                                 ₹499.00
Convenience fee                          ₹15.00
Taxes (as applicable)                     ₹2.70
────────────────────────────────────────────────
Total                                   ₹516.70
```

**Multiple tickets (example: 2 × ₹499 — numbers depend on rounding policy)**

```text
Tickets (2) × ₹499                      ₹998.00
Convenience fee                          ₹30.00   ← e.g. 3% of 998 = 29.94 → ₹30
Taxes (as applicable)                     ₹5.40   ← 18% of ₹30 convenience fee
────────────────────────────────────────────────
Total                                  ₹1,033.40
```

*(Implement one rounding rule everywhere; example assumes fee rounded to whole rupees then GST on that fee.)*

### Key Changes Summary
- [ ] **Pricing module:** pure function(s) for subtotal, fee, GST, total + rounding.
- [ ] **Booking UI:** conditional **Tickets** row string: `quantity === 1` → short form; else `Tickets (n) × ₹{formattedUnit}`.
- [ ] **Server:** use module when creating Razorpay order and saving ticket.

**Files (expected — adjust to repo when implementing):**
- `lib/.../ticket-pricing.ts` (or similar) — calculator
- Booking modal / checkout component — summary UI
- `app/actions/...` booking — wire calculator to order amount

---

## 11. Implementation Plan

### Phase 1: Pricing logic
- [ ] Implement calculator with tests or manual matrix (1×499, 2×499, edge quantities).
- [ ] Document rounding in file header comment (business logic, not changelog).

### Phase 2: UI + server integration
- [ ] Server action returns breakdown; UI renders ticket line per copy rules.
- [ ] Razorpay order `amount` uses computed total.

### Phase 3: Persistence & receipts (optional)
- [ ] Add DB columns or document limitation; update confirmation email if Task 011 sends plain total only.

### Phase 4: Validation (AI)
- [ ] `cd apps/web && npm run lint` && `npm run type-check`

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

- [ ] Update this document with timestamps as work completes.

---

## 13. File Structure & Organization

### New files (typical)
```
apps/web/lib/ticket-pricing.ts          # or lib/pricing/ticket-order.ts
apps/web/components/events/OrderSummary.tsx   # if extracted
```

### Files to modify
- Booking modal / checkout component(s) from Task 011
- Server action creating Razorpay order

---

## 14. Potential Issues & Security Review

- **Client tampering:** Never accept client-submitted `total`; recompute on server.
- **Rounding drift:** Use integer paise end-to-end or one rounding point before Razorpay.
- **Free events:** `ticketPrice` null — skip fee/GST path entirely.

---

## 15. Deployment & Configuration

No new env vars unless fee % / GST % are made configurable later (`CONVENIENCE_FEE_PERCENT` etc.) — optional.

---

## 16. AI Agent Instructions

- Implement only after user approves this task (or as sprint item).
- Do not run `npm run dev` / `npm run build` per project rules.
- Reference Task **011** for booking flow integration.

---

## 17. Notes & Additional Context

### Research Links
- Task `011_razorpay_ticket_booking_integration.md`
- Razorpay Orders API — `amount` in paise

### Relation to user request
User chose: **3% convenience fee (rounded)**, **GST on fee**, **“Taxes (as applicable)”** line, **remove** `Tickets (1 × ₹…)` in favor of plain `Tickets` + amount when quantity is 1; **show** `Tickets (n) × ₹…` when `n > 1`.

---

## 18. Second-Order Consequences & Impact Analysis

- **Task 011** fee model change: any hard-coded `quantity * ticketPrice` must switch to new total.
- **Refunds:** If only total stored, refunds are simple; if line items stored, easier accounting.
- **Reporting:** Wilson may want fee vs. tax in Supabase — optional columns.

---

*Task created from `ai_docs/dev_templates/task_template.md`*  
*Task number: 017*
