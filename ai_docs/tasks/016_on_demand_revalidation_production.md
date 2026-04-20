# AI Task: On-Demand Revalidation (Production)

> **Source template:** `ai_docs/dev_templates/task_template.md`  
> **Task file:** `ai_docs/tasks/016_on_demand_revalidation_production.md`

---

## 1. Task Overview

### Task Title

**Title:** On-demand revalidation API and local-admin → production cache purge

### Goal Statement

**Goal:** When Wilson edits content through **localhost-only** admin while pointed at the **production** database, production pages (especially `/` and `/events`) must refresh their Next.js cache so visitors see current data. Today `revalidatePath()` runs only on the local dev server, so `goouthyd.com` can serve stale HTML/RSC indefinitely. This task adds a **secret-protected** Route Handler on the deployed app and invokes it from server actions after successful mutations, without exposing admin on the public internet.

---

## 2. Strategic Analysis & Solution Options

### Problem Context

Local admin is intentional (`middleware.ts` 404s `/admin` on non-localhost; `assertLocalhost()` guards server actions). Database writes hit production Supabase, but **cache invalidation does not**, so listing pages diverge from direct slug URLs.

### Solution Options Analysis

#### Option 1: On-demand revalidation (recommended)

**Approach:** `POST /api/revalidate` on Vercel verifies `REVALIDATE_SECRET`, calls `revalidatePath` for an allowlisted set of paths (and optional slug paths from the body). Local admin server actions call this URL using `REVALIDATE_BASE_URL` (production origin) plus the same secret after each successful mutation, in addition to existing local `revalidatePath` calls.

**Pros:**

- ✅ Keeps admin localhost-only and static/ISR-friendly pages elsewhere  
- ✅ Instant updates for production visitors after edits  
- ✅ Standard Next.js pattern ([On-Demand Revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration))

**Cons:**

- ❌ Requires env configuration on Vercel and in local `.env.local`  
- ❌ New attack surface if secret leaks (mitigate with long random secret, HTTPS only)

**Implementation Complexity:** Medium — new route, env schema, shared helper, wire ~4 action files.

**Risk Level:** Low–Medium — secret handling and path allowlisting must be correct.

#### Option 2: `dynamic = "force-dynamic"` on listing pages

**Approach:** Force dynamic rendering for `/`, `/events`, `/cafes`, etc.

**Pros:**

- ✅ No HTTP callback; simpler mental model

**Cons:**

- ❌ Does not fix CDN/full-route cache edge cases as cleanly as explicit purge; higher TTFB and DB load  
- ❌ Still no cross-origin invalidation if other layers cache

**Implementation Complexity:** Low

**Risk Level:** Low

#### Option 3: Host admin on production with auth

**Approach:** Remove localhost-only guard; use Supabase auth for admin.

**Pros:**

- ✅ Native `revalidatePath` on the same deployment

**Cons:**

- ❌ Large product/security scope; contradicts current Phase 1 “local admin” model

**Implementation Complexity:** High

**Risk Level:** Medium

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 — On-demand revalidation

**Why this is the best choice:**

1. **Preserves the security model** — Admin stays on localhost; production only exposes a minimal POST endpoint gated by a secret.  
2. **Targeted invalidation** — Only listed paths refresh; no blanket dynamic downgrade.  
3. **Aligns with Next.js docs** for updating ISR/Full Route Cache from external systems.

**Key decision factors:**

- **Performance:** Occasional POST after mutations; no per-request DB cost increase for anonymous traffic.  
- **Security:** Single high-entropy secret; constant-time comparison; strict path allowlist (no arbitrary paths from clients).  
- **Maintainability:** One helper (`lib/revalidate-production.ts` or similar) reused by admin actions.

**Alternative consideration:** Option 2 is acceptable if the team prefers zero env surface; combine Option 1 + short `revalidate` only if needed later.

### Decision Request

**👤 USER DECISION:** Strategy is **approved** in the request that spawned this task (on-demand revalidation). If scope changes, update this section before implementation.

---

## 3. Project Analysis & Current State

### Technology & Architecture

- **Frameworks & Versions:** Next.js 15 App Router (`apps/web`), React 19, TypeScript strict  
- **Language:** TypeScript 5  
- **Database & ORM:** PostgreSQL (Supabase) via Drizzle — unchanged for this task  
- **UI & Styling:** N/A for this task (no UI)  
- **Authentication:** Admin is localhost-only; no session for public revalidate route (secret-based)  
- **Key patterns:** Server Actions in `app/actions/admin/*.ts` already call `revalidatePath` after mutations  
- **Relevant files:** `apps/web/middleware.ts`, `apps/web/lib/env.ts`, `apps/web/app/actions/admin/events.ts`, `cafes.ts`, `menu-items.ts`, `cafe-images.ts`, `apps/web/app/actions/leads.ts` (partner flow), `apps/web/app/actions/admin/leads.ts`

### Current State

- `revalidateEventPaths` in `app/actions/admin/events.ts` revalidates `/`, `/events`, `/admin`, `/admin/events`, and `/events/[slug]`.  
- `revalidateCafePaths` and related paths in `cafes.ts`, `menu-items.ts`, `cafe-images.ts` revalidate `/`, `/cafes`, `/cafes/[slug]`.  
- These run **on whichever server handled the action** (localhost when using local admin).  
- `middleware.ts` only restricts `/admin` and `/api/admin`; a new route under `app/api/revalidate/` is **not** admin-prefixed and remains publicly reachable — **must** be secret-gated.

### Existing Context Providers Analysis

**N/A** — No React context or client providers involved.

---

## 4. Context & Problem Definition

### Problem Statement

Production homepage and event listing can show **deleted** or **missing** events while `events` rows in Supabase and slug pages are correct, because the Full Route Cache for `/` and `/events` is never invalidated on Vercel when mutations originate from localhost.

### Success Criteria

- [ ] Deployed site exposes `POST /api/revalidate` (or agreed path) that returns **401** without valid secret and **200** with valid secret after purging allowlisted paths.  
- [ ] After creating/updating/deleting an event from local admin against production DB, **production** `/` and `/events` reflect changes without requiring a manual redeploy.  
- [ ] Same behavior for cafe-related mutations that affect `/`, `/cafes`, and `/cafes/[slug]`.  
- [ ] If remote revalidation env is **unset** (pure local dev against local DB), server actions behave as today (no failed `fetch` spam).  
- [ ] `REVALIDATE_SECRET` never appears in client bundles; documented in deployment notes only.

---

## 5. Development Mode Context

- Production users exist on `goouthyd.com`; avoid breaking public routes.  
- **No database migrations** for this task.  
- Env vars must be documented for Vercel production and optional local `.env.local` when editing prod data.

---

## 6. Technical Requirements

### Functional Requirements

- [ ] Route handler accepts only **POST** (or POST + GET behind feature flag — **prefer POST only** for mutations).  
- [ ] Request authenticates via `Authorization: Bearer <secret>` **or** body field `secret` — pick **one** documented approach (Bearer preferred).  
- [ ] Handler calls `revalidatePath` for a fixed allowlist plus optional slug segments passed in a **validated** JSON body (e.g. `{ "paths": ["/events/some-slug"] }` only if each path matches a strict pattern).  
- [ ] Server-side helper `requestProductionRevalidation({ paths: string[] })` (name flexible) invoked after successful mutations from: `events.ts`, `cafes.ts`, `menu-items.ts`, `cafe-images.ts`; evaluate `leads.ts` / `admin/leads.ts` if they affect cached public pages (admin/leads: probably not; `leads.ts` may not affect `/` — document decision).  
- [ ] Local `revalidatePath` calls **remain** so local dev UX stays instant.

### Non-Functional Requirements

- **Performance:** Remote `fetch` should use a short timeout (e.g. 10s) and **not** block returning success to the admin UI if optional: either await and log failure, or fire-and-forget with structured logging — **task implementer: choose await + log on failure** so Wilson knows if prod purge failed.  
- **Security:** Cryptographic random secret (≥32 chars); use `timingSafeEqual` (Node `crypto`) for comparison; reject unknown paths with 400.  
- **Compatibility:** Works on Vercel Node runtime.

### Technical Constraints

- Must use `npm run lint` / `npm run type-check` for validation (no `npm run build` per project rules).  
- Do not use direct `npx drizzle-kit` for this task (no schema changes).  
- `"use server"` files must export **only** async functions — put shared sync helpers in `lib/`, not re-exported from action files.

---

## 7. Data & Database Changes

**None.** No schema, migration, or seed changes.

### 🚨 Down migration protocol

**N/A** — no `npm run db:migrate`.

---

## 8. API & Backend Changes

### Data access pattern

- **API Route (allowed):** Webhook-style on-demand revalidation per template section 8 (`app/api/revalidate/route.ts`).  
- **lib helper:** Server-only module for `fetch` + error handling; imported from server actions.

### API Routes

- [ ] **`POST /api/revalidate`** — Validates secret, allowlists paths, calls `revalidatePath` for each; returns JSON `{ revalidated: true, paths: string[] }` on success.

### Server Actions (modify)

- [ ] **`app/actions/admin/events.ts`** — After successful create/update/delete/cancel, call production revalidation helper with paths aligned with `revalidateEventPaths`.  
- [ ] **`app/actions/admin/cafes.ts`** — Same for cafe paths.  
- [ ] **`app/actions/admin/menu-items.ts`** — Revalidate cafe slug + listing paths as today.  
- [ ] **`app/actions/admin/cafe-images.ts`** — Same.  
- [ ] **`app/actions/leads.ts`** — Include only if partner or home content is statically cached and should update (default: **skip** unless product requires).

### External integrations

- None beyond HTTPS `fetch` to `REVALIDATE_BASE_URL`.

---

## 9. Frontend Changes

**None** — no new components or pages with UI. Optional: none.

---

## 10. Code Changes Overview

### Current implementation (before)

`app/actions/admin/events.ts` (conceptual):

```typescript
function revalidateEventPaths(slug?: string | null): void {
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/events/${slug}`);
  }
}
// called only on local server after insert/update/delete
```

### After implementation

- **New:** `app/api/revalidate/route.ts` — `export async function POST(req: Request)` using `revalidatePath` from `next/cache`.  
- **New:** `lib/revalidate-production.ts` (or equivalent) — reads `env.REVALIDATE_SECRET`, `env.REVALIDATE_BASE_URL`; posts Bearer token; maps mutation type → path list; strict allowlist.  
- **Updated:** `lib/env.ts` — add optional `REVALIDATE_SECRET`, optional `REVALIDATE_BASE_URL` (preprocess empty strings to undefined). When `REVALIDATE_BASE_URL` is unset, helper no-ops (returns success skip). When set but secret missing, log warning and skip or fail closed per implementer choice (**recommend:** skip + log to avoid breaking local-only workflows).  
- **Updated:** Each admin action file — after DB success + existing `revalidatePath` calls, `await requestProductionRevalidation([...paths])`.

### Key changes summary

- [ ] **Change 1:** Secret-gated revalidate API on production.  
- [ ] **Change 2:** Shared helper + env wiring for cross-origin purge.  
- [ ] **Files modified:** `lib/env.ts`, `app/actions/admin/events.ts`, `cafes.ts`, `menu-items.ts`, `cafe-images.ts`, new `app/api/revalidate/route.ts`, new `lib/revalidate-production.ts`.  
- [ ] **Impact:** Production listings stay in sync with Supabase when editing via local admin.

---

## 11. Implementation Plan

### Phase 1: Environment and types

**Goal:** Typed, optional env for secret and target base URL.

- [x] **Task 1.1:** Extend `apps/web/lib/env.ts` with `REVALIDATE_SECRET` and `REVALIDATE_BASE_URL` (optional strings; preprocess empty → undefined). Document minimum secret length in comments. ✓ 2026-04-20  
  - Files: `apps/web/lib/env.ts` — `REVALIDATE_SECRET` optional `min(32)`; `REVALIDATE_BASE_URL` optional `https` URL via `z.refine`.  
- [x] **Task 1.2:** Document vars in task section 15 and optionally `.env.example` if the repo maintains one under `apps/web/`. ✓ 2026-04-20  
  - No prior `apps/web/.env.example`; added `apps/web/.env.example` with revalidation block + core placeholders. Section 15 unchanged (already documents Vercel/local); schema lives in `env.ts` comments.

### Phase 2: Route handler + lib helper

**Goal:** Secure POST endpoint and reusable caller.

- [x] **Task 2.1:** Implement `apps/web/app/api/revalidate/route.ts` — POST only; Bearer auth; path allowlist (prefix allowlist for `/events/` and `/cafes/` slugs with safe regex); use `revalidatePath`. ✓ 2026-04-20  
  - Files: `apps/web/app/api/revalidate/route.ts`, `apps/web/lib/revalidate-allowlist.ts` (shared allowlist).  
  - `GET` returns **405**. `POST` returns **503** if `REVALIDATE_SECRET` unset, **401** if Bearer missing/wrong, **400** for bad JSON or disallowed path. `runtime = "nodejs"` for `crypto` / `Buffer`.  
- [x] **Task 2.2:** Implement `lib/revalidate-production.ts` — `requestProductionRevalidation(paths: string[])` dedupes paths, filters to allowlist client-side mirror, `fetch` with `AbortSignal.timeout`, returns result type for logging. ✓ 2026-04-20  
  - File: `apps/web/lib/revalidate-production.ts`. Skips when `REVALIDATE_BASE_URL` or `REVALIDATE_SECRET` unset; success payload includes `droppedPaths` for observability.

### Phase 3: Wire server actions

**Goal:** Every admin mutation that already calls `revalidatePath` also triggers production purge when `REVALIDATE_BASE_URL` is set.

- [x] **Task 3.1:** `events.ts` — call helper with same path set as `revalidateEventPaths`. ✓ 2026-04-20  
  - After each successful `createEvent` / `updateEvent` / `cancelEvent` / `deleteEvent`: `requestProductionRevalidation(publicPathsForEventMutation(slug))` + `warnIfProductionRevalidateFailed`.  
- [x] **Task 3.2:** `cafes.ts`, `menu-items.ts`, `cafe-images.ts` — mirror existing path sets. ✓ 2026-04-20  
  - Cafes: `publicPathsForCafeMutation(slug)` for create/update/delete.  
  - Menu items + cafe images: `publicPathsForCafeDetailOnly(slug)` (matches prior public `revalidatePath` scope). Helpers live in `lib/revalidate-production.ts`.  
- [x] **Task 3.3:** Confirm `middleware.ts` does not block `/api/revalidate`. ✓ 2026-04-20  
  - Matcher is only `/admin` and `/api/admin`; comment added clarifying `/api/revalidate` is secret-gated in the route.

### Phase 4: Validation (AI-only)

- [ ] **Task 4.1:** `cd apps/web && npm run lint`  
- [ ] **Task 4.2:** `cd apps/web && npm run type-check`  
- [ ] **Task 4.3:** Manual reasoning: secret not logged; no `"use server"` helper re-exports.

### Phase 5–6

Follow template **section 16** for code review and user browser testing after implementation.

---

## 12. Task Completion Tracking

Use timestamps when implementing; leave unchecked until work is done.

---

## 13. File Structure & Organization

### New files

```
apps/web/
├── app/api/revalidate/route.ts
├── lib/revalidate-allowlist.ts
└── lib/revalidate-production.ts
```

### Files to modify

- [ ] `apps/web/lib/env.ts`  
- [ ] `apps/web/app/actions/admin/events.ts`  
- [ ] `apps/web/app/actions/admin/cafes.ts`  
- [ ] `apps/web/app/actions/admin/menu-items.ts`  
- [ ] `apps/web/app/actions/admin/cafe-images.ts`

### Dependencies to add

**None** expected (use Node `crypto` built-in).

---

## 14. Potential Issues & Security Review

| Item | Mitigation |
|------|------------|
| Secret brute force | Long secret; optional rate limit note for future |
| SSRF via `REVALIDATE_BASE_URL` | Restrict to `https` URLs only in zod; optional hostname allowlist (`www.goouthyd.com`) |
| Path injection | Allowlist fixed roots + validated slug pattern `[a-z0-9-]+` |
| Double revalidation failure | Log error; admin mutation still succeeds if DB write succeeded |
| `REVALIDATE_BASE_URL` points at preview | Document: set explicitly to production URL when mutating prod DB |

---

## 15. Deployment & Configuration

### Schema (`lib/env.ts`)

| Variable | Required | Rules |
|----------|----------|--------|
| `REVALIDATE_SECRET` | No | If set, minimum **32** characters (use `openssl rand -hex 32` or similar). |
| `REVALIDATE_BASE_URL` | No | If set, must be a valid URL with **`https://`** scheme. |

Both use empty-string → unset preprocessing like other optional server vars.

### Vercel (production)

```bash
# Required for the route to accept requests:
REVALIDATE_SECRET=<generate with openssl rand -hex 32>

# Optional on production (usually omit — same-origin revalidatePath already runs if actions ever run on prod):
# REVALIDATE_BASE_URL=https://www.goouthyd.com
```

### Local machine (when using local admin against **production** DB)

```bash
# Same secret as production (must match):
REVALIDATE_SECRET=<same as Vercel>

# Origin of the deployed site to purge:
REVALIDATE_BASE_URL=https://www.goouthyd.com
```

`NEXT_PUBLIC_APP_URL` may remain `http://localhost:3000` for local dev; **do not** rely on it for the revalidation target when mutating production data.

### Example file

See `apps/web/.env.example` for commented placeholders including revalidation vars.

---

## 16. AI Agent Instructions

Follow the template’s default workflow: implement after explicit user approval of this task; use **lint + type-check** only (no dev server/build commands initiated by agent per project rules).

---

## 17. Notes & Additional Context

- Next.js: [On-Demand Revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)  
- Prior investigation: local `revalidatePath` does not invalidate Vercel cache; slug pages can still resolve from DB.

---

## 18. Second-Order Consequences & Impact Analysis

**Breaking changes:** None to public APIs beyond new endpoint (undocumented URL; secret required).

**Performance:** Negligible extra latency on admin save (one HTTPS round-trip).

**Security (red flag if mishandled):** If secret is committed to git, attackers could purge cache — **store only in Vercel env / local env, never in repo.**

**Maintenance:** Wilson must keep local `.env.local` in sync with production secret when editing prod from laptop.

---

*Task created: 2026-04-20*  
*Template Version: 1.3 (source `ai_docs/dev_templates/task_template.md`)*
