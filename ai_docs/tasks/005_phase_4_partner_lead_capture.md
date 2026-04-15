# AI Task Document

---

## 1. Task Overview

### Task Title
**Title:** Phase 4 — Partner & Lead Capture (Partner Page, Form, Server Action, Resend Email)

### Goal Statement
**Goal:** Build the partner lead capture system — the primary conversion funnel for GoOut Hyd. After this phase, cafe owners can submit interest from `/partner`, submissions persist to `cafe_leads`, and Wilson receives email notifications with lead details (when Resend is configured). Navbar and footer already link to `/partner`; this task replaces the 404 with the full experience.

---

## 2. Strategic Analysis & Solution Options

Strategic analysis is not required. The roadmap defines a single clear stack: Zod validation, honeypot anti-spam, Drizzle insert, Resend for outbound email, and a Server Action for the mutation. No competing architecture is needed.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.5.4 (App Router), React 19
- **Language:** TypeScript 5, strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM 0.44.6
- **UI & Styling:** shadcn/ui (Radix primitives + CVA), Tailwind CSS 3.4.1 with GoOut Hyd design tokens (`espresso`, `caramel`, `cream`, `foam`, `milk`, etc.)
- **Typography:** DM Serif Display (headings), DM Sans (body)
- **Authentication:** Dormant in Phase 1 — middleware is a passthrough
- **Key Architectural Patterns:** Server Components by default; **mutations → `app/actions/[feature].ts`** with `"use server"`. No API routes for internal form posts.
- **Notifications:** `sonner` via `components/ui/sonner.tsx` (already used elsewhere)
- **Relevant existing pieces:**
  - `lib/drizzle/schema/cafe-leads.ts` — `cafe_leads` table with `owner_name`, `cafe_name`, `phone`, `area`, `status` (default `new`), `notes`, `created_at`
  - `lib/constants/areas.ts` — `AREA_NAMES` (single source of truth for Hyderabad areas)
  - `lib/env.ts` — `RESEND_API_KEY` already declared as **optional** (comment: partner lead email); may need tightening or documented behavior when absent
  - `components/ui/input.tsx`, `label.tsx`, `select.tsx` — already present (no need to run shadcn add unless something is missing at implementation time)
  - `components/layout/Navbar.tsx` and `Footer.tsx` — already include `/partner` links

### Current State
- **Database:** `cafe_leads` schema and indexes already exist from Phase 1A. No new tables or columns are required for the roadmap’s partner form fields.
- **Routes:** `app/(public)/partner/` does **not** exist — `/partner` returns 404 despite nav/footer links.
- **Server Actions:** No `app/actions/*.ts` files with `"use server"` yet — this phase introduces the first mutation path.
- **Email:** `resend` is **not** listed in `apps/web/package.json`; it must be added. `lib/email.ts` does not exist.

### Existing Context Providers Analysis
- No app-wide React context for Phase 1 public pages. Partner page is a public route; form state is local to `PartnerForm` (client component).

---

## 4. Context & Problem Definition

### Problem Statement
Potential partners need a persuasive landing page and a low-friction way to request a callback. Wilson needs leads in the database for follow-up and an email alert so nothing is missed. The platform must reject obvious bots (honeypot) without teaching them they were blocked.

### Success Criteria
- [ ] `/partner` renders the full layout: hero, four value cards, “How it works” steps, and the lead form
- [ ] Form validates on the client (Zod) and on the server (`partnerFormSchema`); area options use `AREA_NAMES` plus `"Other"` (no duplicated area strings)
- [ ] Honeypot field: if filled, Server Action returns `{ success: true }` **silently** (no error toast)
- [ ] Valid submissions insert a row into `cafe_leads` via Drizzle with `status` defaulting to `new`
- [ ] After successful DB insert, `sendLeadNotification()` runs in try/catch — **lead save succeeds even if email fails**
- [ ] Success: sonner toast “Thanks! Wilson will reach out within 24 hours” and form reset
- [ ] Failure: sonner toast with a safe error message
- [ ] `generateMetadata` on partner page: title `List Your Cafe | GoOut Hyd`, description per roadmap
- [ ] `loading.tsx` and `error.tsx` alongside `partner/page.tsx`
- [ ] `npm run lint` and `npm run type-check` pass on touched files

---

## 5. Development Mode Context

### Development Mode Context
- **Active development** — prioritize clarity and correctness
- **No schema migration** required for core lead fields (table already matches)
- **Priority:** Reliable persistence + optional email in dev

---

## 6. Technical Requirements

### Functional Requirements
- Public `/partner` page (no auth)
- Partner form fields: owner name, cafe name, phone, area (select from `AREA_NAMES` + “Other”)
- Hidden honeypot field (`sr-only`, `aria-hidden`, `tabIndex={-1}`)
- Server Action `submitPartnerForm(formData: FormData)` validates with Zod, applies honeypot rule, inserts lead, attempts email
- Email: subject `New Cafe Lead: [cafe_name]`, HTML body with owner, cafe, phone, area, timestamp, and a link to the `cafe_leads` table in Supabase (dashboard URL derived from known env, e.g. project ref from `SUPABASE_URL`, or a dedicated `NEXT_PUBLIC_SUPABASE_DASHBOARD_LEADS_URL` if needed — implementer should choose one clear approach)

### Non-Functional Requirements
- **Performance:** Single insert + one email per submission; no unnecessary client bundles
- **Security:** Server-side validation always; honeypot; never expose internal errors to clients
- **Usability:** Full-width primary CTA, loading state on submit (`Loader2` + disabled)
- **Responsive Design:** Mobile-first, 320px+
- **Theme:** **Light-only** — no dark mode (per project spec; do not add `dark:` classes)
- **Compatibility:** Modern evergreen browsers

### Technical Constraints
- Must use `AREA_NAMES` from `lib/constants/areas.ts` for allowed area enum (plus `"Other"`)
- Must not add Phase 2 features (auth, admin UI, WhatsApp)
- Use `npm run db:*` scripts only for Drizzle (no direct `npx drizzle-kit`)
- Add `resend` via `npm install resend` in `apps/web/` (not `pip`)

---

## 7. Data & Database Changes

### Database Schema Changes
**None.** The `cafe_leads` table in `lib/drizzle/schema/cafe-leads.ts` already supports the required columns.

### Data Model Updates
No new Drizzle tables. Inserts use `NewCafeLead`-compatible fields (`ownerName`, `cafeName`, `phone`, `area` — map from validated form payload).

### Data Migration Plan
- [ ] Not applicable

### Down Migration Safety Protocol
Not applicable — no new migration in this phase.

---

## 8. API & Backend Changes

### Data Access Pattern
- **Mutation only:** `app/actions/leads.ts` — `submitPartnerForm` with `"use server"`
- **No new read APIs** — partner page is static + form (no listing of leads in public UI)

### Server Actions
- **`submitPartnerForm(formData: FormData)`** — parse, validate, honeypot branch, `db.insert(cafeLeads)`, call `sendLeadNotification`, return discriminated result `{ success: true }` | `{ success: false, error: string }`

### Database Queries
- **Insert only** — direct Drizzle insert in the Server Action (simple, single table)

### API Routes
None.

### External Integrations
- **Resend** — `npm install resend`; `sendLeadNotification` in `lib/email.ts` using `env.RESEND_API_KEY`
- **Recipient address** — add a server-only env var (e.g. `LEAD_NOTIFICATION_EMAIL` or `PARTNER_LEADS_NOTIFY_EMAIL`) and validate in `lib/env.ts` so production cannot misconfigure silently

---

## 9. Frontend Changes

### New Components

**`components/partner/`**

- [ ] **`PartnerForm.tsx`** (`"use client"`) — foam card, “Get Started” heading (DM Serif Display), fields wired to shadcn `Input`, `Label`, `Select`, honeypot input, submit button (caramel bg, foam text, full width), `Loader2` when pending, `useTransition` or local `isSubmitting`, toasts via sonner

**New / updated pages**

- [ ] **`app/(public)/partner/page.tsx`** — Server Component composing hero, value grid, how-it-works section, and `<PartnerForm />`
- [ ] **`app/(public)/partner/loading.tsx`** — skeleton consistent with other public routes
- [ ] **`app/(public)/partner/error.tsx`** — client error boundary with reset

### Partner Page Content Spec (from roadmap)

**Hero**
- Background: espresso; headline: “Your Cafe Deserves to Be Discovered” (DM Serif Display, cream); subtitle: “Join Hyderabad’s only platform built for independent cafes” (foam)

**Value proposition (cream background) — 2×2 grid on sm+**
- `Search` — “Get Discovered” / copy
- `TrendingUp` — “Fill Empty Tables” / copy
- `Music` — “Host Events Effortlessly” / copy
- `IndianRupee` — “Plans Starting at ₹999/month” / copy (if `IndianRupee` is unavailable in the pinned lucide version, use the closest icon per project convention, e.g. `CircleDollarSign`)

**How it works (milk background)**
- Step 1 `FileText` — “Fill the form below”
- Step 2 `Phone` — “We’ll call you within 24 hours”
- Step 3 `Rocket` — “Your cafe goes live in days”
- Visual connection: arrows or dividers between steps

### State Management
Local component state + Server Action response handling; no global store.

---

## 10. Code Changes Overview

### Before
- No `app/(public)/partner/` route — `/partner` 404
- No `lib/validations/partner.ts`, `lib/email.ts`, `app/actions/leads.ts`
- `resend` package absent

### After (expected new / touched files)
```
apps/web/
├── app/(public)/partner/
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
├── app/actions/
│   └── leads.ts
├── components/partner/
│   └── PartnerForm.tsx
├── lib/
│   ├── validations/partner.ts
│   └── email.ts
├── lib/env.ts                 # extend with notification email + tighten Resend if needed
└── package.json               # add "resend"
```

### Key Changes Summary
- [x] **New public partner page** with marketing sections and form
- [x] **First Server Action** for lead persistence
- [x] **Resend integration** for Wilson notifications
- [x] **Impact:** `/partner` becomes the primary conversion URL; nav/footer links work

---

## 11. Implementation Plan

### Phase 1: Dependencies & Environment
**Goal:** Add Resend and wire env for API key + notification recipient

- [x] **Task 1.1:** Run `npm install resend` in `apps/web/` ✓ 2026-04-13
  - Added `resend` `^6.10.0` to `apps/web/package.json`
- [x] **Task 1.2:** Extend `lib/env.ts` with a server env for the **notification recipient** (required in production; document dev fallback if needed) ✓ 2026-04-13
  - Added `LEAD_NOTIFICATION_EMAIL` (optional, validated email when set); `emptyToUndefined` preprocess for empty strings
- [x] **Task 1.3:** Decide behavior when `RESEND_API_KEY` is missing (e.g. skip email with structured log vs. fail closed in prod — **prefer saving lead always** and documenting dev setup) ✓ 2026-04-13
  - **Decision:** Both `RESEND_API_KEY` and `LEAD_NOTIFICATION_EMAIL` remain optional. When either is unset, the email layer (Phase 2) must not send; lead persistence is independent. JSDoc on `env` documents this; structured logging will live in `lib/email.ts` when implemented.

### Phase 2: Validation & Email Layer
**Goal:** Shared Zod schema and Resend helper

- [x] **Task 2.1:** Create `lib/validations/partner.ts` — `allowedAreas = [...AREA_NAMES, "Other"] as const`, `partnerFormSchema` with `owner_name`, `cafe_name`, `phone`, `area`, `honeypot` ✓ 2026-04-13
  - Exports `PARTNER_AREA_OPTIONS`, `partnerFormSchema`, `PartnerFormValues`; honeypot coerces null to `""`; strings trimmed where applicable
- [x] **Task 2.2:** Create `lib/email.ts` — `sendLeadNotification({ owner_name, cafe_name, phone, area, created_at })` returning `{ ok: true } | { ok: false, error: string }` or similar; HTML email; Supabase dashboard link to `cafe_leads` ✓ 2026-04-13
  - Skips send with `console.warn` when API key or recipient missing (`{ ok: true }`); Resend `from` uses `onboarding@resend.dev`; editor URL derived from `SUPABASE_URL` hostname

### Phase 3: Server Action
**Goal:** Persist leads and invoke email safely

- [x] **Task 3.1:** Create `app/actions/leads.ts` — `submitPartnerForm(formData)`; honeypot early return `{ success: true }`; validate with `partnerFormSchema.safeParse`; map to Drizzle insert; try/catch around email only; return typed results ✓ 2026-04-13
  - Honeypot checked on raw string before Zod; DB insert in outer try/catch; `sendLeadNotification` in inner try/catch; `revalidatePath("/partner")` on success; exports `SubmitPartnerFormResult`

### Phase 4: Partner UI
**Goal:** Page layout + client form

- [x] **Task 4.1:** Create `components/partner/PartnerForm.tsx` — form fields, honeypot, client-side Zod pre-check optional (must mirror server), `action={submitPartnerForm}` or programmatic `startTransition` + `useFormState`/`useActionState` per Next 15 patterns ✓ 2026-04-13
  - `useActionState(submitPartnerForm, null)`; client `partnerFormSchema.safeParse` in `onSubmit` with `preventDefault` + toast on failure; honeypot `sr-only`; area via Radix Select + hidden `name="area"`; success/error toasts + form reset
- [x] **Task 4.2:** Create `app/(public)/partner/page.tsx` — compose sections per spec; `generateMetadata` ✓ 2026-04-13
  - Hero (espresso), value grid (cream, `CircleDollarSign` for pricing), how-it-works (milk, `ol`/`li` + chevrons), form section; metadata title `List Your Cafe` (template → `| GoOut Hyd`)
- [x] **Task 4.3:** Create `app/(public)/partner/loading.tsx` and `error.tsx` ✓ 2026-04-13

### Phase 5: Validation (AI-Only Static)
**Goal:** Lint and type-check — **do not** run `npm run dev` or `npm run build`

- [ ] **Task 5.1:** `npm run lint` and `npm run type-check` from `apps/web/`

---

## 12. Task Completion Tracking

Track completion in this document with timestamps when implementing (per project workflow).

- **2026-04-13:** Phase 1 complete — `resend` installed; `lib/env.ts` extended with `LEAD_NOTIFICATION_EMAIL` and documented skip-email-when-unset behavior; `npm run type-check` passed.
- **2026-04-13:** Phase 2 complete — `lib/validations/partner.ts` and `lib/email.ts` added; `npm run type-check` and ESLint on new files passed.
- **2026-04-13:** Phase 3 complete — `app/actions/leads.ts` with `submitPartnerForm`; type-check and ESLint passed.
- **2026-04-13:** Phase 4 complete — partner page, `PartnerForm`, loading/error routes; `submitPartnerForm` first arg `_prevState` for `useActionState`; type-check and ESLint passed.

---

## 13. File Structure & Organization

### Dependencies to Add
```json
{
  "dependencies": {
    "resend": "^6.10.0"
  }
}
```

### Files to Modify
- [x] **`lib/env.ts`** — notification email + Resend configuration ✓ 2026-04-13

---

## 14. Potential Issues & Security Review

### Error Scenarios
- **Resend failure:** Lead must still be saved; user sees success if DB succeeded (or align UX with product: always toast success after DB — roadmap: email wrapped in try/catch)
- **Invalid phone / area:** Server returns validation error; client shows toast
- **Bot fills honeypot:** Silent `{ success: true }` — no toast spam

### Security
- [ ] No PII in client error messages
- [ ] Honeypot not focusable or visible to screen readers (except `aria-hidden` on hidden field — ensure assistive tech is not confused; `sr-only` + `tabIndex={-1}` per roadmap)

---

## 15. Deployment & Configuration

### Environment Variables
```bash
# apps/web/.env.local (server)
RESEND_API_KEY=re_...
LEAD_NOTIFICATION_EMAIL=wilson@example.com   # or chosen name — must match lib/env.ts

# existing
DATABASE_URL=...
SUPABASE_URL=...   # used to build dashboard link if implemented that way
```

Document new variables in project README or `.env.local.example` **only if** that file exists and is maintained (optional; do not create unrelated docs unless requested).

---

## 16. AI Agent Instructions

Follow the default workflow in `ai_docs/dev_templates/task_template.md` Section 16: **do not implement** until the user approves this task or chooses implementation options (A/B/C) as defined in the template.

**Forbidden commands** during AI validation (per project rules): `npm run build`, `next build`, starting the dev server.

**Allowed:** `npm run lint`, `npm run type-check` from `apps/web/`.

---

## 17. Notes & Additional Context

- **Single source of truth for areas:** `AREA_NAMES` in `lib/constants/areas.ts` — the Zod enum must be derived from it at runtime, not hardcoded strings.
- **Supabase dashboard URL:** Construct from `SUPABASE_URL` (extract project ref) or document a single env-based URL pattern for the email body.

---

## 18. Second-Order Consequences & Impact Analysis

- **New dependency:** `resend` increases bundle only on server (Node); minimal client impact.
- **Email deliverability:** Resend domain verification required in production — Wilson must configure sender domain in Resend.
- **Spam:** Honeypot reduces simple bots; rate limiting is **not** in scope for Phase 4 but could be a follow-up if abuse appears.

---

*Task document created for Phase 4 Partner & Lead Capture. Aligns with `ai_docs/prep/roadmap.md` § Phase 4 and `CLAUDE.md` Phase 1 constraints.*
