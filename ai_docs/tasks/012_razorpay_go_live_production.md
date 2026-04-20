# Task 012 — Razorpay Go-Live: Switch to Production (goouthyd.com)

> **Status:** 🟡 In Progress
> **Created:** 2026-04-18
> **Depends on:** Task 011 (Razorpay Ticket Booking Integration — COMPLETED in test mode)
> **Related:** `ai_docs/Razor_pay/razorpay_integration_reference.md`, `ai_docs/Razor_pay/web_integration.md`

---

## 1. Task Overview

### Task Title
**Title:** Razorpay Go-Live — Switch from Test Mode to Live Mode on goouthyd.com

### Goal Statement
**Goal:** Take the ticket booking + payments flow live on the production domain `goouthyd.com`. Razorpay account is now approved for live mode. This task covers: verifying Resend domain (Step 1 ✅ done), swapping email senders to `@goouthyd.com` addresses, migrating `goouthyd.in` → `goouthyd.com` across the codebase, generating Razorpay live keys, updating Vercel production env vars, redeploying, running a ₹1 end-to-end smoke test with a real card, and refunding the test payment.

---

## 2. Strategic Analysis & Solution Options

**Not needed** — the path is prescribed:
- Domain is fixed (`goouthyd.com`)
- Provider stack is fixed (Resend for email, Razorpay for payments, Vercel for hosting)
- Keys already defined in env schema; only values change
- Step sequence is mandatory (can't test until keys are live; can't swap keys until Resend domain is verified; etc.)

The only notable decision was how to handle **dual recipients** for partner lead notifications (Wilson's business Gmail + personal Gmail). Chosen approach: parse comma-separated values in the existing `LEAD_NOTIFICATION_EMAIL` env var rather than adding a new variable. Keeps env schema small.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Framework:** Next.js 15.5.4 (App Router), React 19, TypeScript 5 strict
- **Database:** Supabase Postgres via Drizzle ORM 0.44.6
- **Email:** Resend (`apps/web/lib/email.ts`) — used for partner lead alerts + ticket confirmations with inline QR codes
- **Payments:** Razorpay (`apps/web/lib/razorpay.ts`) — Server Action creates order, client opens Razorpay checkout, Server Action verifies HMAC signature and creates ticket
- **Env validation:** `@t3-oss/env-nextjs` with Zod (`apps/web/lib/env.ts`) — schema already supports all needed keys
- **Hosting:** Vercel (production deployment already live)

### Current State (what exists today)
- ✅ Razorpay integration fully implemented and tested in **test mode** (`rzp_test_*` keys)
- ✅ Ticket booking flow works end-to-end locally: event page → Book button → modal → Razorpay checkout → signature verification → ticket row inserted → QR email sent → confirmation page
- ✅ Resend domain `goouthyd.com` verified (Tokyo region, verified 2026-04-18)
- ❌ Email `from` addresses still use Resend sandbox (`onboarding@resend.dev`) — only reach pre-approved recipients
- ❌ Razorpay keys in Vercel Production scope are still `rzp_test_*`
- ❌ Codebase and docs reference `goouthyd.in` in 17+ places (legacy from initial setup — actual domain is `.com`)
- ❌ `LEAD_NOTIFICATION_EMAIL` currently sends to a single personal Gmail; needs to fan out to business Gmail + personal Gmail

### Files Directly Involved
- `apps/web/lib/email.ts` — two `from: "GoOut Hyd <onboarding@resend.dev>"` strings to replace; also needs to split `LEAD_NOTIFICATION_EMAIL` on comma for multi-recipient
- `apps/web/lib/env.ts` — no schema change needed (email is already `z.string().email().optional()` — we'll relax validation to accept comma-separated)
- `CLAUDE.md` — 1 reference to `goouthyd.in`
- `SETUP.md` — references to `goouthyd.in`
- `apps/web/app/(public)/terms/page.tsx`
- `apps/web/app/(public)/privacy/page.tsx`
- `apps/web/components/legal/LegalPageWrapper.tsx`
- `.cursor/rules/cafeconnect-project.mdc`
- `ai_docs/prep/*.md` (several) and `ai_docs/tasks/*.md` (several legacy task docs)

---

## 4. Context & Problem Definition

### Problem Statement
The app is fully built and tested in Razorpay test mode with emails delivering from Resend's shared sandbox address. To accept real money from real customers, we need a coordinated switchover: Resend must send from an owned-domain address (so emails don't land in spam and aren't restricted to pre-approved recipients), Razorpay must use live keys (so actual cards are charged), Vercel production env must hold the new secrets, and the codebase domain references must match the actual domain (`goouthyd.com`, not `goouthyd.in`).

### Success Criteria
- [ ] Resend domain `goouthyd.com` verified (Step 1 ✅ already done)
- [ ] Ticket emails send from `tickets@goouthyd.com`; lead emails send from `leads@goouthyd.com`
- [ ] Partner lead notification emails land in **both** business Gmail + personal Gmail
- [ ] All `goouthyd.in` references replaced with `goouthyd.com` across the entire codebase
- [ ] Razorpay live keys generated with auto-capture enabled
- [ ] Vercel Production env vars updated to `rzp_live_*` and new email recipient list
- [ ] Production redeploy successful
- [ ] ₹1 end-to-end smoke test succeeds: real card charged, signature verified, ticket row created, confirmation email + QR delivered, confirmation page displays correctly
- [ ] ₹1 test payment refunded from Razorpay live dashboard
- [ ] No test-mode keys remain in any environment scope

---

## 5. Development Mode Context

- **🚨 This is a live production cutover**, not a dev-mode change. Unlike most tasks in this repo, this one touches real money.
- **No data migration needed** — no existing tickets in production (first live ticket will be the ₹1 smoke test).
- **Rollback plan**: if smoke test fails, revert Vercel env vars to test keys and redeploy. Razorpay test-mode infra remains intact; only the switch is reversible.
- **User-facing impact**: none during cutover — production deploy is zero-downtime (Vercel atomic swap). First user to book after cutover will pay real money.

---

## 6. Technical Requirements

### Functional Requirements
- FR1: Ticket confirmation emails must send from `tickets@goouthyd.com` to the customer's entered email
- FR2: Partner lead notification emails must send from `leads@goouthyd.com` to a **list** of recipients parsed from `LEAD_NOTIFICATION_EMAIL` (comma-separated)
- FR3: Razorpay checkout must charge real money through live mode keys
- FR4: Payment signature verification must continue to work (HMAC-SHA256 of `order_id|payment_id` using `RAZORPAY_KEY_SECRET`)
- FR5: Orders paid via live mode must auto-capture (no manual capture step)

### Non-Functional Requirements
- **Security:** Razorpay secret must never appear in client bundle or logs. Keys in Vercel must be Production scope only (not Preview or Development).
- **Deliverability:** Emails must authenticate via SPF + DKIM (Resend handles this once domain is verified ✅)
- **Observability:** Resend dashboard must show sends; Razorpay dashboard must show live order + captured payment

### Technical Constraints
- Cannot regenerate test-mode keys (they're already in Task 011 artifacts — leave alone)
- Cannot change env var names (already referenced in `apps/web/lib/env.ts` and throughout the codebase)
- Must keep test-mode keys usable in local `.env.local` for future dev work — only Production Vercel scope gets live keys

---

## 7. Data & Database Changes

**None.** No schema changes, no migrations. The `tickets` and `cafe_leads` tables already exist and are production-ready.

---

## 8. API & Backend Changes

### Code Changes in `apps/web/lib/email.ts`

#### Change 1 — Ticket email `from` address
```ts
from: "GoOut Hyd <onboarding@resend.dev>",  // BEFORE (line 237)
from: "GoOut Hyd <tickets@goouthyd.com>",   // AFTER
```

#### Change 2 — Lead email `from` address
```ts
from: "GoOut Hyd <onboarding@resend.dev>",  // BEFORE (line 110)
from: "GoOut Hyd <leads@goouthyd.com>",     // AFTER
```

#### Change 3 — Multi-recipient support in `sendLeadNotification`
```ts
// BEFORE (line 95, 111)
const to = env.LEAD_NOTIFICATION_EMAIL;
...
to: [to],

// AFTER
const rawTo = env.LEAD_NOTIFICATION_EMAIL;
if (!apiKey || !rawTo) { /* skip */ }
const toList = rawTo.split(",").map((addr) => addr.trim()).filter(Boolean);
if (toList.length === 0) { /* skip */ }
...
to: toList,
```

### Env Schema Update in `apps/web/lib/env.ts`

`LEAD_NOTIFICATION_EMAIL` is currently validated as a single email. Loosen to accept a comma-separated list:

```ts
// BEFORE
LEAD_NOTIFICATION_EMAIL: z.preprocess(
  emptyToUndefined,
  z.string().email().optional(),
),

// AFTER
LEAD_NOTIFICATION_EMAIL: z.preprocess(
  emptyToUndefined,
  z.string()
    .refine(
      (val) => val.split(",").every((addr) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr.trim())),
      { message: "Must be a valid email or comma-separated list of emails" },
    )
    .optional(),
),
```

### No Server Action / API Route Changes
The Razorpay flow (`apps/web/app/actions/tickets.ts`, `apps/web/lib/razorpay.ts`) is key-agnostic — it reads from `env.RAZORPAY_KEY_ID` / `env.RAZORPAY_KEY_SECRET`. Swapping env values at Vercel level is enough. **No code changes for Razorpay**.

### External Integrations
- **Razorpay Live Mode:** generate new `rzp_live_*` keys; enable auto-capture in dashboard settings
- **Resend:** domain verified ✅; sending from `@goouthyd.com` is now allowed

---

## 9. Frontend Changes

**None for Razorpay go-live itself.** The only frontend changes are domain-string replacements (`goouthyd.in` → `goouthyd.com`) in legal pages and components. No component structure, props, or UX changes.

---

## 10. Code Changes Overview

### 📂 Current Implementation (Before)

```typescript
// apps/web/lib/email.ts — line 110 (sendLeadNotification)
const resend = new Resend(apiKey);
const { error } = await resend.emails.send({
  from: "GoOut Hyd <onboarding@resend.dev>",
  to: [to],
  subject,
  html,
});

// apps/web/lib/email.ts — line 237 (sendTicketEmail)
const { error } = await resend.emails.send({
  from: "GoOut Hyd <onboarding@resend.dev>",
  to: [ticket.customerEmail],
  subject,
  html: htmlWithFallback,
  attachments: [...],
});
```

### 📂 After Refactor

```typescript
// apps/web/lib/email.ts — sendLeadNotification
const toList = rawTo.split(",").map((a) => a.trim()).filter(Boolean);
const resend = new Resend(apiKey);
const { error } = await resend.emails.send({
  from: "GoOut Hyd <leads@goouthyd.com>",
  to: toList,
  subject,
  html,
});

// apps/web/lib/email.ts — sendTicketEmail
const { error } = await resend.emails.send({
  from: "GoOut Hyd <tickets@goouthyd.com>",
  to: [ticket.customerEmail],
  subject,
  html: htmlWithFallback,
  attachments: [...],
});
```

### 🎯 Key Changes Summary
- **Email senders:** swap sandbox `onboarding@resend.dev` → owned-domain addresses (`tickets@` and `leads@`)
- **Lead recipients:** parse `LEAD_NOTIFICATION_EMAIL` as comma-separated list
- **Domain strings:** bulk replace `goouthyd.in` → `goouthyd.com` across codebase (17+ files)
- **Env schema:** loosen `LEAD_NOTIFICATION_EMAIL` to accept comma-separated list
- **Files modified:** `apps/web/lib/email.ts`, `apps/web/lib/env.ts`, `CLAUDE.md`, `SETUP.md`, 3 frontend files, cursor rules, and doc files
- **Impact:** emails now deliver to any recipient (not just pre-approved Resend sandbox list), emails authenticate via SPF/DKIM, partner leads reach both business + personal Gmail, docs reflect reality

---

## 11. Implementation Plan

> **Step numbering** follows the 7-step go-live plan from the chat. Steps 1 and 6/7 are manual (user-driven); Steps 2–5 mix code + dashboard work.

### Phase 1 (Step 1): Verify goouthyd.com in Resend — ✅ COMPLETED
**Goal:** Authenticate the `goouthyd.com` domain with Resend so emails can send from owned addresses.

- [x] **Task 1.1:** Add domain in Resend dashboard ✓ 2026-04-18
  - Region selected: Tokyo (ap-northeast-1)
- [x] **Task 1.2:** Add 4 DNS records (DKIM TXT, SPF MX, SPF TXT, DMARC TXT) at Spaceship registrar ✓ 2026-04-18
  - Fixed initial issue where `@` prefix was incorrectly added in front of subdomain hosts
- [x] **Task 1.3:** Click "I've added the records" in Resend and wait for verification ✓ 2026-04-18
  - DNS verified at 3:58 PM; domain verified at 4:00 PM
- [x] **Task 1.4:** Confirm status shows "Verified" with green checkmark ✓ 2026-04-18

### Phase 2 (Step 2): Code + Documentation Updates
**Goal:** Update email sender addresses, support multi-recipient lead notifications, and migrate all `goouthyd.in` → `goouthyd.com` references.

- [x] **Task 2.1:** Update `apps/web/lib/email.ts` — `sendTicketEmail` ✓ 2026-04-18
  - Files: `apps/web/lib/email.ts` (line 252)
  - Details: Changed `from` to `"GoOut Hyd <tickets@goouthyd.com>"`
- [x] **Task 2.2:** Update `apps/web/lib/email.ts` — `sendLeadNotification` ✓ 2026-04-18
  - Files: `apps/web/lib/email.ts` (lines 94–125)
  - Details:
    - Changed `from` to `"GoOut Hyd <leads@goouthyd.com>"`
    - Replaced single-`to` with comma-split `toList` logic (trim + filter empty)
    - Added fast-return when parsed list is empty
- [x] **Task 2.3:** Loosen `LEAD_NOTIFICATION_EMAIL` validation in env schema ✓ 2026-04-18
  - Files: `apps/web/lib/env.ts` (lines 27–47)
  - Details: Replaced `z.string().email()` with `.refine()` that validates each comma-split entry against an email regex
- [x] **Task 2.4:** Bulk replace `goouthyd.in` → `goouthyd.com` across codebase ✓ 2026-04-18
  - Files (from Grep scan):
    - `CLAUDE.md`
    - `SETUP.md`
    - `apps/web/app/(public)/terms/page.tsx`
    - `apps/web/app/(public)/privacy/page.tsx`
    - `apps/web/components/legal/LegalPageWrapper.tsx`
    - `.cursor/rules/cafeconnect-project.mdc`
    - `ai_docs/prep/roadmap.md`
    - `ai_docs/prep/system_architecture.md`
    - `ai_docs/prep/initial_data_schema.md`
    - `ai_docs/prep/app_pages_and_functionality.md`
    - `ai_docs/prep/master_idea.md`
    - `ai_docs/prep/app_name.md`
    - `ai_docs/tasks/001_phase_1a_rag_cleanup_and_goout_setup.md`
    - `ai_docs/tasks/006_phase_5_landing_and_content_pages.md`
    - `ai_docs/tasks/008_phase_7_codebase_cleanup.md`
    - `ai_docs/tasks/011_razorpay_ticket_booking_integration.md`
  - Details: 52 occurrences replaced across 17 files (CLAUDE.md, SETUP.md, terms/privacy/LegalPageWrapper, .cursor rule, 6 prep docs, 4 task docs). Only remaining ".in" reference is inside Task 012 itself, documenting the migration intentionally.
- [x] **Task 2.5:** Run lint + type-check on modified TS files ✓ 2026-04-18
  - Command: `npm run lint && npm run type-check` in `apps/web`
  - Result: ✅ Both passed, zero errors introduced

### Phase 3 (Step 3): Generate Razorpay Live Keys — 👤 USER ACTION
**Goal:** Get `rzp_live_*` credentials ready for Vercel.

- [x] **Task 3.1:** Toggled Live Mode in Razorpay dashboard ✓ 2026-04-18
- [x] **Task 3.2:** Generated live Key ID + Key Secret, copied securely ✓ 2026-04-18
- [x] **Task 3.3:** Auto-capture enabled ✓ 2026-04-18
- [x] **Task 3.4:** Keys confirmed copied before leaving page ✓ 2026-04-18

### Phase 4 (Step 4): Update Vercel Production Environment Variables — 👤 USER ACTION
**Goal:** Point production deployment at live Razorpay keys and the new lead recipient list.

- [ ] **Task 4.1:** (User) Open Vercel dashboard → project → **Settings → Environment Variables**
- [ ] **Task 4.2:** (User) Update or add these vars, **Production scope only** (not Preview, not Development):
  - `RAZORPAY_KEY_ID` → `rzp_live_xxxxxxxxxxxxxxxx`
  - `RAZORPAY_KEY_SECRET` → `<live secret from dashboard>`
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID` → `rzp_live_xxxxxxxxxxxxxxxx` (same value as `RAZORPAY_KEY_ID`)
  - `LEAD_NOTIFICATION_EMAIL` → `goouthyd@gmail.com,<your.personal@gmail.com>` (exact format: comma-separated, no spaces required but safe)
- [ ] **Task 4.3:** (User) Confirm `RESEND_API_KEY` is already set in Production (unchanged)
- [ ] **Task 4.4:** (User) Confirm `NEXT_PUBLIC_APP_URL` is set to `https://goouthyd.com` (not `.in`)
- [ ] **Task 4.5:** (User) Click **Save** on each variable

### Phase 5 (Step 5): Redeploy on Vercel — 👤 USER ACTION
**Goal:** Trigger a new deployment so the updated env vars (and Step 2 code changes after push) take effect.

- [x] **Task 5.1:** Commit and push Phase 2 code changes to main branch ✓ 2026-04-18
  - Commit: `8e84062` — "feat: Razorpay ticket booking + go-live on goouthyd.com"
  - Scope: 40 files, +7,115 / −177 lines (Task 011 ticketing feature + Task 012 Phase 2 config)
  - Pushed to `origin/main` — triggers Vercel auto-deploy
- [x] **Task 5.2:** Watch Vercel dashboard for deployment to complete ✓ 2026-04-18
  - First build failed: missing `@types/qrcode` — fixed in commit `1a61ff8`
  - Second build succeeded; production traffic now on live Razorpay keys + `@goouthyd.com` email senders
- [ ] **Task 5.3:** Not needed — code push triggered fresh build, picks up new env vars automatically

### Phase 6 (Step 6): ₹1 End-to-End Smoke Test — 👤 USER ACTION
**Goal:** Validate the full live-mode flow with a real card for ₹1 before opening to real users.

- [ ] **Task 6.1:** (User + AI) Decide how to create the ₹1 test ticket (decision deferred to this step):
  - **Option A — Temporary hidden event:** insert a row in `events` with `title: "GO-LIVE SMOKE TEST"`, `ticket_price: 100` (paise → ₹1), `status: "draft"` or an unpublished flag, slug like `smoke-test-2026-04-18`. Access directly by slug URL, don't list on /events.
  - **Option B — Edit existing event:** pick a low-traffic upcoming event, note its original price, change to ₹1 in Supabase, do the booking, revert immediately.
  - Option A is safer; Option B is faster. Decide together at this step.
- [x] **Task 6.2:** Navigated to test event and clicked Book Tickets ✓ 2026-04-18
  - Event: Stand-Up Night: Hyderabad Laughs (Filter House)
  - Original price noted (reverted in Phase 7): 250 rupees
- [x] **Task 6.3:** Filled booking modal ✓ 2026-04-18
- [x] **Task 6.4:** Razorpay popup in live mode, ₹1 paid via UPI ✓ 2026-04-18
  - Order: `order_Sez8pTldKP8HBH`, Payment: `pay_Sez969LnSXwYya`
- [x] **Task 6.5:** Verified success chain (first attempt) ✓ 2026-04-18
  - ✅ Redirect to `/booking-confirmation?code=5f5bb7ba-ae12-41a4-b860-e188ce1fe396`
  - ✅ Confirmation page shows event + name + QR
  - ❌ Ticket email DID NOT arrive — root cause: `RESEND_API_KEY` missing in Vercel Production scope
  - Fix applied: added `RESEND_API_KEY` to Production, redeployed (`dpl_5U9dA5NHf`)
  - Re-test after fix: ✅ Ticket email arrives from `tickets@goouthyd.com`
- [x] **Task 6.6:** Verified backend state ✓ 2026-04-18
  - ✅ Supabase `tickets` table: row exists with status `paid`, `amount_paid: 1` (rupees — NOT paise; spec had wrong unit)
  - ✅ Razorpay dashboard: ₹1 captured via UPI, 100% in overview
  - ✅ Order ID in DB matches Razorpay dashboard
- [x] **Task 6.7:** No rollback needed — smoke test passed after env var fix ✓ 2026-04-18

### Phase 7 (Step 7): Refund the ₹1 Test Payment — 👤 USER ACTION
**Goal:** Return the test rupee to yourself; leave books clean.

- [ ] **Task 7.1:** (User) Razorpay dashboard → Payments → find the ₹1 capture → click **Refund** (or **Issue Refund**) → full refund
- [ ] **Task 7.2:** (User) If Option A (temporary event) was used: delete the smoke-test event row from `events` in Supabase, or mark it `status: "archived"`
- [ ] **Task 7.3:** (User) If Option B (edited existing event) was used: revert the event's `ticket_price` to the original value in Supabase immediately
- [ ] **Task 7.4:** (User) Optional: mark the test ticket row in `tickets` as deleted or leave it (has no user-facing impact since the event is hidden/archived)

### Phase 8: Post-Launch Verification
**Goal:** Confirm stable state and document completion.

- [ ] **Task 8.1:** Tail Resend logs for the next ~24h to confirm deliveries (no bounces, no spam placement)
- [ ] **Task 8.2:** Tail Razorpay logs for any webhook failures or auth errors
- [ ] **Task 8.3:** Update this task doc's status to ✅ Completed with date
- [ ] **Task 8.4:** Update Task 011 header to note: "Superseded for production by Task 012; test-mode flow retained for local dev"

---

## 12. Task Completion Tracking

Update this section in real-time as tasks complete. Use actual date (2026-04-18 onward) — not a made-up date.

---

## 13. File Structure & Organization

### Files to Modify
- `apps/web/lib/email.ts` — 2 `from` addresses + multi-recipient parsing
- `apps/web/lib/env.ts` — loosen `LEAD_NOTIFICATION_EMAIL` validator
- `CLAUDE.md`, `SETUP.md` — domain references
- `apps/web/app/(public)/terms/page.tsx`, `privacy/page.tsx` — domain references
- `apps/web/components/legal/LegalPageWrapper.tsx` — domain references
- `.cursor/rules/cafeconnect-project.mdc` — domain references
- `ai_docs/prep/*.md` and `ai_docs/tasks/*.md` — historical references (update for consistency)

### Files to Create
**None.**

### Dependencies to Add
**None.** All necessary packages (`resend`, `qrcode`, `razorpay`) are already installed.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze

- [ ] **Scenario 1: Live payment succeeds but ticket email lands in spam**
  - **Cause:** DMARC policy `p=none` (lenient) should be fine; aggressive mail filters may still flag first emails from a new domain
  - **Mitigation:** Warm up the domain — send the ₹1 smoke test email, mark as "Not Spam" in Gmail, flag the sender as trusted. Subsequent emails deliver reliably.

- [ ] **Scenario 2: `LEAD_NOTIFICATION_EMAIL` parsing error with new format**
  - **Code Review Focus:** `sendLeadNotification` in `apps/web/lib/email.ts`
  - **Mitigation:** Add `.filter(Boolean)` after trim to drop empty strings from trailing commas. Already planned in Task 2.2.

- [ ] **Scenario 3: Razorpay signature verification fails in live mode**
  - **Cause:** Secret mismatch between Vercel and Razorpay dashboard (e.g. copied test secret with live key ID)
  - **Code Review Focus:** `apps/web/lib/razorpay.ts` signature verification function
  - **Mitigation:** During smoke test, if verification fails, compare first 4 and last 4 chars of Key ID and Secret between Vercel env and Razorpay dashboard — confirm both are `rzp_live_*` / matching live secret.

- [ ] **Scenario 4: Client-side Razorpay popup shows test-mode warning banner**
  - **Cause:** `NEXT_PUBLIC_RAZORPAY_KEY_ID` still `rzp_test_*` while server-side is live (mismatch)
  - **Mitigation:** Verify both `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` are the same `rzp_live_*` value in Vercel Production.

### Edge Cases

- [ ] **Customer email bounces:** Resend returns an error; current code logs it but ticket still exists. Acceptable for Phase 1 — Wilson can manually resend from dashboard.
- [ ] **Razorpay capture delay:** Auto-capture should be instant; if it's set to manual accidentally, payment sits in "authorized" state and user sees confirmation but business hasn't been paid. Step 3.3 prevents this.
- [ ] **Duplicate bookings:** existing code handles this at the Server Action level via unique `ticket_code`. No change needed for go-live.

### Security & Access Control Review

- [x] **Razorpay secret protection:** Only set as server-side env var (no `NEXT_PUBLIC_` prefix). ✓ Already correct.
- [x] **Key rotation:** If any live key leaks, regenerate immediately in Razorpay dashboard and update Vercel. Old key is instantly invalidated.
- [x] **Email domain spoofing:** SPF + DKIM via Resend prevents someone else sending "from" `@goouthyd.com`. ✓ Set up in Step 1.
- [x] **Payment tampering:** HMAC signature verification on every callback prevents client-side amount tampering. ✓ Already in place.

---

## 15. Deployment & Configuration

### Environment Variables (Vercel Production Scope)

```bash
# CHANGES
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx           # was rzp_test_*
RAZORPAY_KEY_SECRET=<live_secret_from_dashboard>    # was test secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx  # was rzp_test_*
LEAD_NOTIFICATION_EMAIL=goouthyd@gmail.com,<personal>@gmail.com  # was single address

# UNCHANGED (verify still set)
RESEND_API_KEY=re_xxxxxxxx
DATABASE_URL=postgres://...supabase.co...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://goouthyd.com          # verify this is .com not .in
```

### Local `.env.local` (unchanged)
Keep test-mode keys locally so dev work doesn't charge real cards:
```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=<test_secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
LEAD_NOTIFICATION_EMAIL=<your dev email>
```

---

## 16. AI Agent Instructions

### Execution Order
1. Phase 1 is already complete (DNS verified). Start at Phase 2.
2. Do Phase 2 (code changes) as the AI. Lint, type-check, stop.
3. Present "Phase 2 complete" recap and wait for user to proceed to Phases 3–7 (mostly user dashboard work).
4. For Phase 6 (smoke test), wait for user to decide Option A vs B, then guide them through it.
5. Phase 8 wraps the task.

### Command Restrictions
- ✅ `npm run lint`, `npm run type-check`
- ❌ `npm run build`, `npm run dev` (user has dev server running; no builds for validation)
- ❌ `npm run db:migrate` (no DB changes in this task)

### Pre-commit
Commit with conventional message:
```
chore(prod): go-live — swap to @goouthyd.com email senders, update domain references

- Change ticket email sender to tickets@goouthyd.com
- Change lead email sender to leads@goouthyd.com
- Support comma-separated LEAD_NOTIFICATION_EMAIL for multi-recipient alerts
- Replace goouthyd.in → goouthyd.com across codebase + docs
- Part of Razorpay go-live cutover (Task 012)
```

---

## 17. Notes & Additional Context

### Decisions locked in before starting

| Question | Answer |
|---|---|
| Production domain | `goouthyd.com` (was incorrectly `goouthyd.in` in docs) |
| Business notification email | `goouthyd@gmail.com` |
| From address — tickets | `tickets@goouthyd.com` |
| From address — leads | `leads@goouthyd.com` |
| Lead notification recipients | Both business Gmail + personal Gmail (comma-separated) |
| Smoke test event strategy | Decided at Phase 6 (Option A vs B) |
| Domain reference cleanup scope | Entire codebase (grep-all approach) |
| Resend domain region | Tokyo (ap-northeast-1) |
| Domain registrar | Spaceship |

### Reference Links
- Task 011 (test-mode build): `ai_docs/tasks/011_razorpay_ticket_booking_integration.md`
- Razorpay integration reference: `ai_docs/Razor_pay/razorpay_integration_reference.md`
- Razorpay web integration guide: `ai_docs/Razor_pay/web_integration.md`
- Resend domain page: https://resend.com/domains
- Razorpay dashboard: https://dashboard.razorpay.com
- Vercel dashboard: https://vercel.com/dashboard

---

## 18. Second-Order Consequences & Impact Analysis

### 🚨 Red Flags
- **Real money risk:** once live keys are active, real customers can pay. If any logic bug exists (duplicate charges, failed captures treated as successes, etc.), it hits real users. Mitigation: ₹1 smoke test before any announcement + Razorpay dashboard visibility.
- **Email deliverability risk:** first emails from a new domain may be flagged. Mitigation: smoke test inbox check, Gmail "not spam" marking, DMARC starts at `p=none` (lenient).

### ⚠️ Yellow Flags
- **`LEAD_NOTIFICATION_EMAIL` schema change:** loosening from strict email to comma-split regex. Existing single-email values continue to work. No breaking change.
- **Test-mode keys still valid in Razorpay:** they remain usable for local dev. No risk of confusion as long as `.env.local` stays test and Vercel Production stays live.

### User Experience Impacts
- **Zero downtime** for users during cutover (Vercel atomic deploy).
- **First real booker** after cutover will be paying with real money — should be a friendly contact, not a stranger. Suggestion: run the ₹1 smoke test as yourself first, then announce launch.

### Maintenance Burden
- **Minimal.** Email addresses and keys are config, not code. Future rotation is an env-var swap.
- **Monitoring gap:** no explicit alerting on payment failures yet. Acceptable for Phase 1 given low volume; revisit when daily bookings > ~10.

---

*Template Version: 1.3*
*Created: 2026-04-18*
