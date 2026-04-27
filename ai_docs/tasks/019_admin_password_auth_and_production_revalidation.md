# Task 019 — Admin password auth + production revalidation

> **Template:** `ai_docs/dev_templates/task_template.md`  
> **Status:** Ready to implement  
> **Depends on:** [014_local_admin_dashboard.md](./014_local_admin_dashboard.md), [016_on_demand_revalidation_production.md](./016_on_demand_revalidation_production.md)

---

## 1. Task Overview

### Task Title

**Title:** Admin password session auth + Vercel env for production on-demand revalidation

### Goal Statement

**Goal:** Replace the localhost-only gate on `/admin` and `/api/admin` with a shared-password login that sets a signed, http-only session cookie so operators (e.g. Wilson) can use the admin dashboard from any device on production. In parallel, document and require the Vercel environment variables for `REVALIDATE_SECRET` and `REVALIDATE_BASE_URL` so on-demand ISR purge works without manual redeploys after mutations. Middleware remains the primary gate; server actions use a secondary session check (defense in depth).

---

## 2. Strategic Analysis & Solution Options

### Problem Context

Two issues: (1) production cache was not reliably purged because revalidation env vars were missing on Vercel; (2) middleware returns 404 for non-localhost hosts, blocking remote admin access. Multiple auth patterns exist (OAuth, Supabase roles, shared password). Trade-offs: security vs implementation speed vs Edge runtime constraints (middleware must not import `next/headers` cookie APIs through a mixed module).

### Solution Options Analysis

#### Option 1: Password + JWT session cookie (`jose`) + middleware + `assertAdminSession`

**Approach:** Single shared `ADMIN_PASSWORD`; successful login issues HS256 JWT stored in http-only cookie; middleware verifies JWT for `/admin/*` and `/api/admin/*`; server actions call `assertAdminSession()`.

**Pros:**

- ✅ Aligns with Task 014/016 direction and small-operator model
- ✅ Works on Edge if JWT verify/sign helpers are isolated from `cookies()` setters (see implementation note)
- ✅ Defense in depth: actions still validate session if middleware were misconfigured

**Cons:**

- ❌ Shared secret rotation requires coordinating password + redeploy
- ❌ Not multi-user auditing (no per-user identity in logs)

**Implementation Complexity:** Medium  
**Risk Level:** Medium — session module layout must respect Edge/server boundaries

#### Option 2: Supabase Auth / OAuth for admins

**Approach:** Real user accounts with email magic link or OAuth for `/admin`.

**Pros:**

- ✅ Per-user revocation and audit trail

**Cons:**

- ❌ Larger scope than this task; schema and UX changes

**Implementation Complexity:** High  
**Risk Level:** Low long-term, high short-term scope

#### Option 3: IP allowlist only

**Approach:** Replace localhost check with fixed IPs on middleware.

**Cons:**

- ❌ Poor mobile/roaming UX; IPs change

**Implementation Complexity:** Low  
**Risk Level:** High operational friction

### Recommendation & Rationale

**RECOMMENDED SOLUTION:** Option 1 — Password + JWT cookie + middleware + `assertAdminSession`

**Why:**

1. Matches dependencies 014/016 and immediate business need (Wilson from his machine).
2. `jose` is Edge-compatible when verification does not pull Node-only or `next/headers` into the middleware bundle incorrectly.
3. **Split modules:** keep JWT sign/verify + `COOKIE_NAME` in middleware-safe code paths; keep `cookies()` set/delete in server-only modules imported from Server Actions only (avoid importing a file that top-level imports `next/headers` from middleware if the bundler includes it).

**Key decision factors:**

- **Security:** Http-only cookie, strong `ADMIN_COOKIE_SECRET`, timing-safe password compare in Server Action (Node `crypto`).
- **UX:** Login page, optional safe redirect to `from` query (only allow internal paths under `/admin`).
- **Maintainability:** One cookie name and one verify path.

**Alternative consideration:** Option 2 when the product needs multiple admins with separate credentials.

### Decision Request

**Direction:** Proceed with Option 1 unless product requires full auth provider before launch.

---

## 3. Project Analysis & Current State

### Technology & Architecture

- **Frameworks & Versions:** Next.js `^15.5.4`, React `19.2.4`, Turbopack dev (`apps/web/package.json`).
- **Language:** TypeScript 5.x (strict).
- **Database & ORM:** Postgres via Drizzle (admin actions mutate events, cafes, etc.).
- **UI & Styling:** Tailwind CSS, Radix/shadcn-style primitives, Lucide icons; admin uses `components/admin/AdminSidebar.tsx`.
- **Authentication:** No end-user Supabase session gating in admin middleware today; admin gated only by localhost check.
- **Patterns:** App Router, Server Actions under `app/actions/admin/*.ts`, `@t3-oss/env-nextjs` in `lib/env.ts`.

### Current State

- **`middleware.ts`:** For `/admin/:path*` and `/api/admin/:path*`, requests are allowed only when `Host` is `localhost` or `127.0.0.1`; otherwise **404** (to avoid advertising routes). `/api/revalidate` is **not** in this matcher (correct).
- **`lib/env.ts`:** `REVALIDATE_SECRET` and `REVALIDATE_BASE_URL` already defined (optional, trimmed); production purge fails silently or rejects until vars are set on Vercel.
- **`lib/admin/auth.ts`:** Exports `assertLocalhost()` — checks `headers().get("host")` for localhost; used by all admin server actions.
- **`app/api/revalidate/route.ts`:** Task 016 — gated by secret header/body; no change expected beyond env being set.

### Existing Context Providers Analysis

**N/A for this task.** Admin area does not rely on a global UserContext for authorization; authorization is localhost + action guard today, becoming cookie session + action guard.

---

## 4. Context & Problem Definition

### Problem Statement

1. **Revalidation:** Without `REVALIDATE_SECRET` and `REVALIDATE_BASE_URL` on Vercel, production caches do not purge after admin mutations; operators redeploy manually.
2. **Admin access:** Localhost-only middleware prevents legitimate access from `https://www.goouthyd.com` (404), blocking remote operators.

### Success Criteria

- [ ] Vercel Production has `ADMIN_PASSWORD`, `ADMIN_COOKIE_SECRET`, `REVALIDATE_SECRET`, `REVALIDATE_BASE_URL` documented and set; local `.env.example` / `.env.local` documented for dev parity.
- [ ] Visiting `/admin` or `/api/admin/*` without session redirects to `/admin/login` (not 404), except login route and login Server Action POST target.
- [ ] Correct password sets http-only cookie; wrong password shows error; logout clears cookie.
- [ ] All admin server actions use `await assertAdminSession()` (or equivalent) instead of `assertLocalhost()`.
- [ ] After deploy, mutating content triggers visible updates on public pages within expected ISR/revalidation behavior (no mandatory redeploy for cache bust).
- [ ] `npm run lint` and `npm run type-check` pass in `apps/web`.

---

## 5. Development Mode Context

This task touches **production security and caching**. Do **not** apply “aggressive refactoring / data loss acceptable” from the generic template: keep changes scoped, preserve existing admin behavior aside from auth and env.

---

## 6. Technical Requirements

### Functional Requirements

- Operators can open production `/admin`, sign in with shared password, use dashboard for a bounded session (e.g. 8 hours).
- Unauthenticated users cannot access admin UI or admin APIs (redirect or consistent refusal for API).
- On-demand revalidation path remains `POST /api/revalidate` with secret; callers use `REVALIDATE_BASE_URL` + `REVALIDATE_SECRET` as already implemented in Task 016.

### Non-Functional Requirements

- **Security:** Http-only session cookie; `secure` in production; `sameSite` appropriate (e.g. `lax`); no session secret in client bundle; password compare timing-safe in Server Action.
- **Performance:** JWT verify on middleware should be lightweight (no DB round-trip per request).
- **Edge:** Middleware must not depend on Node-only APIs; verify `jose` usage in Edge.

### Technical Constraints

- Extend `lib/env.ts` with `emptyToUndefinedTrimmed` / `runtimeEnv` patterns consistent with existing vars.
- Follow workspace rules: no `any`, explicit types, Next.js 15 async `searchParams` on login page if used.
- Do not protect `/api/revalidate` with admin cookie — it stays secret-based (existing design).

---

## 7. Data & Database Changes

**None.** No schema migrations.

### Down migration protocol

**N/A** — no database migrations.

---

## 8. API & Backend Changes

### Server Actions

- [ ] **`adminLogin`** — Validate password, create JWT, set cookie; redirect to `/admin` or safe `from` path.
- [ ] **`adminLogout`** — Clear cookie; redirect to `/admin/login`.

### Admin mutations (existing files)

- [ ] Replace `assertLocalhost()` with `await assertAdminSession()` in: `app/actions/admin/cafes.ts`, `cafe-images.ts`, `events.ts`, `leads.ts`, `menu-items.ts`, `upload.ts`.

### API routes

- [ ] **No new admin API routes required** for login — use Server Actions. Existing `/api/admin/*` routes remain protected by middleware + optional handler checks.

### External integrations

- **Vercel env:** Production values for the four variables in §15.

---

## 9. Frontend Changes

### New components

- [ ] **`components/admin/LoginForm.tsx`** — Client form with `useActionState` calling `adminLogin`; displays errors.

### New pages

- [ ] **`app/(admin)/admin/login/page.tsx`** — Minimal login shell; embed `LoginForm`; Next.js 15 `searchParams` as `Promise` if passing redirect target server-side.

### Updates

- [ ] **`components/admin/AdminSidebar.tsx`** — Add sign-out control (`form` → `adminLogout`).

### State management

Session is cookie-based only; no global React context required.

### Context usage strategy

**N/A** — no UserContext wiring for admin.

---

## 10. Code Changes Overview

### Current implementation (before)

**`apps/web/middleware.ts`** (abbreviated):

```typescript
function isLocalhost(host: string | null): boolean {
  if (!host) return false;
  const hostOnly = host.split(":")[0];
  return hostOnly === "localhost" || hostOnly === "127.0.0.1";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith(ADMIN_PATH_PREFIX) ||
    pathname.startsWith(ADMIN_API_PREFIX)
  ) {
    if (!isLocalhost(request.headers.get("host"))) {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }
  return NextResponse.next();
}
```

**`apps/web/lib/admin/auth.ts`:**

```typescript
export async function assertLocalhost(): Promise<void> {
  const h = await headers();
  const host = h.get("host");
  const hostOnly = host?.split(":")[0];
  if (hostOnly !== "localhost" && hostOnly !== "127.0.0.1") {
    throw new Error("Not Found");
  }
}
```

### After refactor

**Middleware:**

- Async middleware: read session cookie by name; `verify` JWT with shared secret (from env readable in Edge — prefer `process.env.ADMIN_COOKIE_SECRET` in middleware if `@/lib/env` Edge validation is problematic, or ensure env package is Edge-safe).
- Allow `/admin/login` without session.
- Invalid/missing session → redirect to `/admin/login?from=…`.

**`lib/admin/auth.ts`:**

- Replace or supplement with `assertAdminSession()` verifying same cookie JWT as middleware.

### Key changes summary

| Change | Purpose |
|--------|---------|
| Env: `ADMIN_PASSWORD`, `ADMIN_COOKIE_SECRET` | Credentials + signing key |
| Env on Vercel: `REVALIDATE_*` | Production cache purge |
| Middleware cookie check | Remote admin access |
| Login page + actions | Acquire/end session |
| `assertAdminSession` in actions | Defense in depth |
| **Split session helpers** | Middleware Edge bundle must not incorrectly bundle `next/headers` |

**Files modified (expected):**

- `apps/web/lib/env.ts`, `apps/web/.env.example`
- `apps/web/middleware.ts`
- `apps/web/lib/admin/auth.ts` (+ new session helper file(s))
- `apps/web/app/actions/admin/auth.ts` (new)
- `apps/web/app/actions/admin/*.ts` (assert swap)
- `apps/web/app/(admin)/admin/login/page.tsx` (new)
- `apps/web/components/admin/LoginForm.tsx` (new)
- `apps/web/components/admin/AdminSidebar.tsx`
- `apps/web/package.json` — add `jose`

**Impact:** Production `/admin` reachable after login; ISR revalidation works when env is set.

---

## 11. Implementation Plan

### Phase 1: Operations (can precede or ship with code)

**Goal:** Vercel Production has correct secrets and base URL.

- [x] **Task 1.1:** Add `ADMIN_PASSWORD`, `ADMIN_COOKIE_SECRET`, `REVALIDATE_SECRET`, `REVALIDATE_BASE_URL` to Vercel (Production). ✓ 2026-04-27 — Values added in Vercel Production (strong random secrets per task).
- [x] **Task 1.2:** Update `apps/web/.env.local` and `apps/web/.env.example` with placeholders and comments (no real secrets committed). ✓ 2026-04-27 — `.env.example` documents all four vars + generation commands; `.env.local` has commented `ADMIN_*` placeholders (uncomment when Task 019 code lands).
- [x] **Task 1.3:** Redeploy production once after env apply so new vars bind and caches refresh. ✓ 2026-04-27 — User confirmed Production redeploy after env apply.

### Phase 2: Dependencies and env schema

**Goal:** Install `jose`; extend `createEnv` server schema and `runtimeEnv`.

- [x] **Task 2.1:** `cd apps/web && npm install jose` ✓ 2026-04-27 — `jose` ^6.2.3 in `apps/web/package.json` / root lockfile.
- [x] **Task 2.2:** Add `ADMIN_PASSWORD` (min length per policy, e.g. 12+) and `ADMIN_COOKIE_SECRET` (min 32 chars); use `emptyToUndefinedTrimmed` where appropriate. ✓ 2026-04-27 — See `apps/web/lib/env.ts`; `.env.example` lists `ADMIN_PASSWORD=` / `ADMIN_COOKIE_SECRET=`.

### Phase 3: Session layer + middleware

**Goal:** Cookie issuance server-only; JWT verify usable from middleware.

- [x] **Task 3.1:** Implement session helpers (split files if needed: verify/sign vs cookie read/write). ✓ 2026-04-27 — `lib/admin/session-token.ts` (JWT sign/verify + `COOKIE_NAME`, Edge-safe), `lib/admin/session-cookie.ts` (http-only cookie via `next/headers`).
- [x] **Task 3.2:** Update `middleware.ts`: async; allow `/admin/login`; redirect unauthenticated users; keep matcher covering `/admin/:path*` and `/api/admin/:path*` only. ✓ 2026-04-27 — `/api/admin/*` returns **401 JSON** when unauthenticated (no redirect). `GET /api/admin/tickets/export` also verifies JWT in handler.

### Phase 4: Login UI and actions

**Goal:** Login and logout flows.

- [x] **Task 4.1:** `app/actions/admin/auth.ts` — `adminLogin`, `adminLogout`; timing-safe compare for password. ✓ 2026-04-27
- [x] **Task 4.2:** `admin/login/page.tsx` + `LoginForm.tsx`. ✓ 2026-04-27 — Route at `app/admin/login/page.tsx` (outside `(admin)` shell so login has no sidebar chrome).
- [x] **Task 4.3:** Optional: post-login redirect to `from` if path is safe (starts with `/admin`, reject open redirects). ✓ 2026-04-27 — `lib/admin/safe-redirect.ts` + hidden `from` field on form.

### Phase 5: Defense in depth + UX

**Goal:** Replace localhost asserts; sign out in UI.

- [x] **Task 5.1:** Implement `assertAdminSession()`; replace all `assertLocalhost()` imports/usages. ✓ 2026-04-27 — `lib/admin/auth.ts`; all `app/actions/admin/*.ts` updated.
- [x] **Task 5.2:** Add sign-out to `AdminSidebar.tsx`. ✓ 2026-04-27 — Also **Sign out** in `AdminHeader.tsx` mobile sheet.

### Phase 6: Validation (static)

**Goal:** Lint and type-check.

- [x] **Task 6.1:** `cd apps/web && npm run lint && npm run type-check` ✓ 2026-04-27 — `type-check` passed; targeted `eslint` on changed files passed.

### Phase 7: User browser testing (human)

- [ ] Login/logout, deep link `from`, production smoke after deploy, revalidation behavior after mutation.

---

## 12. Task Completion Tracking

Track progress here during implementation (timestamps when completing items).

---

## 13. File Structure & Organization

### New files (expected)

```
apps/web/
├── lib/admin/
│   └── session*.ts          # JWT + cookie helpers (split if needed for Edge)
├── app/actions/admin/
│   └── auth.ts              # adminLogin, adminLogout
├── app/(admin)/admin/login/
│   └── page.tsx
└── components/admin/
    └── LoginForm.tsx
```

### Dependencies to add

```json
{
  "dependencies": {
    "jose": "^5.x"
  }
}
```

(Use latest compatible `jose` 5.x when installing.)

---

## 14. Potential Issues & Security Review

| Scenario | Mitigation |
|----------|------------|
| Open redirect after login | Only allow `from` paths under `/admin` |
| Edge middleware imports `cookies()` | Split modules; middleware only imports verify |
| Secret length / whitespace | Trim via existing env preprocess patterns |
| `/api/admin` JSON errors vs redirect | API routes return 401 JSON if preferred; align with existing API style |
| Brute force login | Rate limiting out of scope; optional follow-up (Vercel WAF / edge rate limit) |

---

## 15. Deployment & Configuration

### Environment variables

Set on **Vercel → Project → Settings → Environment Variables → Production** (and document Preview if needed):

```bash
ADMIN_PASSWORD=<strong shared password>
ADMIN_COOKIE_SECRET=<64 hex chars from CSPRNG>
REVALIDATE_SECRET=<matches Task 016 — min 32 chars when set>
REVALIDATE_BASE_URL=https://www.goouthyd.com
```

Local `apps/web/.env.local` (developer-specific — never commit secrets):

- Mirror structure in `.env.example` with empty placeholders and comments.

**Coordinate:** Deploy code that removes localhost check **in the same release** as cookie auth, so `/admin` is not exposed without login.

---

## 16. AI Agent Instructions

Follow the workflow in `task_template.md` Section 16 with these overrides:

- **No database migrations** — skip Drizzle down-migration checkpoints.
- **Forbidden commands** per project rules: do not run `npm run dev` / `npm run build` unless user explicitly requests; `npm run lint` and `npm run type-check` are allowed for validation.
- After implementation, present **Implementation Complete!** and offer comprehensive code review per template.

---

## 17. Notes & Additional Context

### Research links

- [jose](https://github.com/panva/jose) — JWT for Web Crypto / Edge
- Next.js middleware: [NextResponse.redirect](https://nextjs.org/docs/app/building-your-application/routing/middleware)

### References in repo

- Task 014 — admin dashboard scope
- Task 016 — `REVALIDATE_SECRET`, `REVALIDATE_BASE_URL`, `/api/revalidate`

---

## 18. Second-Order Consequences & Impact Analysis

**Breaking changes:** Operators must use password login on production; bookmarks to `/admin` without session hit login page (expected).

**Security:** Shared password is weaker than per-user IdP; acceptable for small team if secret is strong and HTTPS enforced.

**Caching:** Setting `REVALIDATE_*` may change behavior of local admin hitting production DB — ensure docs clarify expected URLs.

**Mitigation:** Document rotation procedure for `ADMIN_PASSWORD` and `ADMIN_COOKIE_SECRET`; consider future migration to proper auth (Option 2).

---

*Task document version: 1.0 — 2026-04-27*
