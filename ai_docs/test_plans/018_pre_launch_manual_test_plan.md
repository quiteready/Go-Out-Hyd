# Manual test plan — Task 018 (checkout, legal, no GST)

**Scope:** Convenience fee (3%), order summary, `createOrder` / Razorpay alignment, Terms §4, Privacy ticketing sections, `/refunds`, footer links + `hello@goouthyd.com`, checkout agreement line.

**Not automated:** This is a **manual** checklist for QA in browser. Run in **Razorpay test mode** until you intend to charge real money.

---

## 0. Prerequisites

| Step | Action | Pass criteria |
|------|--------|----------------|
| P-1 | `apps/web` has valid `.env.local`: DB, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_*`, Resend if testing email | Dev server starts without env errors |
| P-2 | Seed or admin: at least **one upcoming paid event** (`ticketPrice` > 0), optional `maxTickets` | Event visible on `/events` and detail page |
| P-3 | Start dev: `cd apps/web && npm run dev` | `http://localhost:3000` loads |

---

## 1. Pricing & order summary (Booking modal)

| ID | Case | Steps | Expected |
|----|------|--------|----------|
| C-1 | Single ticket line copy | Open **Book** on a paid event, qty **1** | Summary shows label **Tickets** (not `1 ×`), subtotal = unit price, **Convenience fee (3%)**, **Total** = subtotal + fee. **No** GST / tax / IGST line. |
| C-2 | Multi-ticket line copy | Set qty **2** (or more) | First row reads **Tickets (n) × ₹{unit}**; subtotal = n × unit; fee = 3% of subtotal **rounded** to whole rupees; total = subtotal + fee. |
| C-3 | Math spot-check | Use unit **₹499**, qty **1** | Subtotal ₹499; fee ₹15; total **₹514** (not ₹516.70 with tax). |
| C-4 | Pay button | Before submit | Button text **Pay ₹{total}** matches **Total** row. |
| C-5 | Agreement line | Scroll modal | Text: agreement to **Terms of Service** and **Refund Policy**; both are links. |
| C-6 | Terms link | Click **Terms of Service** | Opens `/terms` (new tab per current implementation). Page loads; §4 is **Ticket Purchases & Events**. |
| C-7 | Refunds link | Click **Refund Policy** | Opens `/refunds`; policy sections visible. |

---

## 2. End-to-end payment (test mode)

| ID | Case | Steps | Expected |
|----|------|--------|----------|
| E-1 | Create order | Fill name, email, phone; submit | Razorpay checkout opens; **amount** matches modal **Total** (in INR / paise on backend). |
| E-2 | Success path | Complete test payment (Razorpay test card/UPI per dashboard) | Redirect to booking confirmation; ticket email may fire if Resend configured. |
| E-3 | DB / amount | (Optional) Check `tickets.amount_paid` in Supabase or admin | `amount_paid` equals **total including convenience fee** (rupees), not ticket subtotal only. |

---

## 3. Legal pages & content

| ID | Case | Steps | Expected |
|----|------|--------|----------|
| L-1 | Terms §4 | Visit `/terms` | **Last updated** shows **2026-04-20** (or current published date). §4 title **Ticket Purchases & Events**; subsections on platform role, fees, refunds pointer, organiser cancellation, changes. **No** “Phase 1 / we don’t sell tickets” wording. |
| L-2 | Terms → Refunds | In §4, follow link to Refund & Cancellation Policy | Navigates to `/refunds`. |
| L-3 | Privacy | Visit `/privacy` | **Last updated** bumped. New section **Ticket Purchases & Payments** (Razorpay, no full card storage, external privacy link). Ticket retention ~**12 months**. Section numbering consistent (through **10. Contact**). |
| L-4 | Refunds page | Visit `/refunds` | Title **Refund & Cancellation Policy**; customer cancellations, organiser cancellation, rescheduling, contact `hello@goouthyd.com`. |
| L-5 | Metadata / SEO smoke | View page titles in tab bar | Reasonable titles (e.g. “Terms of Service \| GoOut Hyd”). |

---

## 4. Footer (site-wide)

| ID | Case | Steps | Expected |
|----|------|--------|----------|
| F-1 | Legal links | Scroll footer on home, `/events`, `/cafes` | **Privacy**, **Terms**, **Refund Policy** present and work. |
| F-2 | Support email | In footer brand column | **hello@goouthyd.com** visible; `mailto:` opens client mail. |
| F-3 | Mobile | Narrow viewport (e.g. 375px) | Footer readable; links tappable; no overlap. |

---

## 5. Edge & negative cases

| ID | Case | Steps | Expected |
|----|------|--------|----------|
| N-1 | Free event | Open event with no paid ticket price | **Book** not offered or flow not available; no broken modal. |
| N-2 | Sold out | Event with `maxTickets` reached | `createOrder` returns error; toast/message; no charge. |
| N-3 | Razorpay dismiss | Start checkout; close Razorpay without paying | Modal usable again; loading state clears; no false “paid” confirmation. |
| N-4 | Invalid quantity | If UI allows edge values | Qty clamped 1–10; totals stay consistent. |

---

## 6. Regression & polish

| ID | Case | Expected |
|----|------|----------|
| R-1 | Early-bird pricing (if configured) | Payable per-ticket price matches event detail; checkout uses same unit for fee calculation. |
| R-2 | Booking confirmation page | **Amount paid** (or displayed total) reflects **full** charge including fee. |
| R-3 | Ticket email (if enabled) | Amount line matches paid total. |

---

## 7. Production smoke (when going live)

| ID | Action | Expected |
|----|--------|----------|
| PR-1 | Switch to **live** Razorpay keys in Vercel; redeploy | ₹1 or minimal real test; then refund per Razorpay docs. |
| PR-2 | `NEXT_PUBLIC_APP_URL` | Matches production domain on confirmation links / emails. |

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|--------|
| Tester | | | |
| Product | | | |

---

*Derived from `ai_docs/tasks/018_pre_launch_legal_and_checkout_no_gst.md`.*
