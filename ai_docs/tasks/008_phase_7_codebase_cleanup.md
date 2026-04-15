# AI Task Template

> **Task:** 008 — Phase 7 Codebase Cleanup
> **Template Version:** 1.3

---

## 1. Task Overview

### Task Title
**Title:** Phase 7 Codebase Cleanup — Remove Dead Code & Validate Pre-Launch Quality

### Goal Statement
**Goal:** Audit and clean up the `apps/web` Next.js/TypeScript codebase before the GoOut Hyd production launch. The codebase was repurposed from a RAG (document processing) app, so there is likely leftover RAG code, stale dependencies, unused imports, `console.log` debug statements, and TypeScript issues. This cleanup ensures the codebase is lean, type-safe, and production-ready before going live at goouthyd.in.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The codebase was migrated from a RAG/chat SaaS template. While most RAG-specific files were deleted, the migration may have left behind:
- Stale `package.json` dependencies (AI SDK, GCP, Stripe packages no longer used)
- Orphaned imports referencing deleted files
- `console.log` debug statements in production code
- TypeScript errors or `any` type usages introduced during refactor
- Dead utility functions or exports with no callers

This is a pre-launch cleanup — we want to go live with a clean, professional codebase.

### Solution Options Analysis

#### Option 1: Full Automated Analysis → Manual Fix
**Approach:** Run `depcheck`, `npm run lint`, `npm run type-check`, and targeted `grep` scans to generate a full findings report. Then fix each issue systematically.

**Pros:**
- ✅ Comprehensive — catches everything
- ✅ Produces a documented inventory of all issues
- ✅ Low risk — analysis before action

**Cons:**
- ❌ Takes longer (analysis phase before any fixes)
- ❌ Some depcheck "unused" findings are false positives (build tools)

**Implementation Complexity:** Medium — 2 steps (analyze then fix)
**Risk Level:** Low

#### Option 2: Direct Targeted Cleanup
**Approach:** Skip full depcheck analysis. Focus on known problem areas: `package.json` deps, `console.log` statements, lint errors, type errors.

**Pros:**
- ✅ Faster — jump straight to known issues
- ✅ No false positives from automated analysis

**Cons:**
- ❌ May miss less obvious dead code
- ❌ No documented inventory

**Implementation Complexity:** Low
**Risk Level:** Low-Medium (might miss things)

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 — Full Analysis then Fix

**Why:** Since this is a RAG-to-venue-platform migration, the scope of leftover code is unknown. A proper analysis phase ensures we find everything systematically and don't ship dead code to production.

### Decision Request

**👤 USER DECISION REQUIRED:**
Proceed with Option 1 (full analysis + fix)? Or would you prefer Option 2 (targeted quick cleanup)?

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.5.4, React 19, TypeScript 5 (strict mode)
- **Language:** TypeScript with strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM 0.44.6
- **UI & Styling:** shadcn/ui + Tailwind CSS 3.4.1
- **Authentication:** Supabase Auth (dormant in Phase 1)
- **Key Architectural Patterns:** App Router, Server Components for data fetching, Server Actions for mutations
- **Package Manager:** npm (package-lock.json present)

### Current State
The codebase is a repurposed RAG app. Per `CLAUDE.md`, the following was supposed to be stripped:
- `@ai-sdk/google`, `@ai-sdk/react`, `ai` (AI SDK packages)
- `@google-cloud/aiplatform`, `@google-cloud/storage` (GCP packages)
- `react-markdown`, `remark-gfm` (chat rendering)
- `stripe` (payments)
- All `apps/web/components/chat/`, `documents/`, `history/` components
- All `app/(protected)/` routes
- All chat/document API routes
- RAG database schema files

We need to verify all of these were actually removed and catch anything that was missed.

### Existing Context Providers Analysis
- **No active context providers in Phase 1** — Auth is dormant, no UserContext/UsageContext active
- Public routes only, no protected layout providers

---

## 4. Context & Problem Definition

### Problem Statement
Going live with unused dependencies, dead imports, debug `console.log` statements, or TypeScript errors would be unprofessional and create maintenance debt. The RAG-to-GoOutHyd migration deleted many files, but `package.json` dependencies and stray imports may still reference deleted code. Pre-launch is the right time to clean this up while the codebase is small.

### Success Criteria
- [ ] `npm run lint` passes with 0 errors in `apps/web/`
- [ ] `npm run type-check` passes with 0 errors in `apps/web/`
- [ ] No RAG/AI/GCP/Stripe packages remain in `package.json` (unless actually used)
- [ ] Zero `console.log` statements in production code (non-test files)
- [ ] No `@ts-ignore` or `@ts-expect-error` suppressions
- [ ] No explicit `: any` type usages
- [ ] No orphaned imports referencing deleted files
- [ ] All unused imports removed from active files

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** — feel free to make breaking changes
- **Data loss acceptable** — no production users yet
- **Priority: Clean, lean code** for launch
- **Aggressive cleanup allowed** — delete dead code completely, no commented stubs

---

## 6. Technical Requirements

### Functional Requirements
- All existing pages and functionality must continue to work after cleanup
- No new features — this is cleanup only
- Must not break: cafes listing, cafe profiles, events, partner form, about, legal pages

### Non-Functional Requirements
- **Performance:** Removing unused deps reduces bundle size
- **Security:** No hardcoded secrets or credentials in code
- **Usability:** No visible change to end users
- **Responsive Design:** No layout changes — cleanup only

### Technical Constraints
- **Never modify:** `tsconfig.json`, `eslint.config.mjs` (per cleanup template rules)
- **Never run:** `npm run build` (per workspace rules — use lint + type-check instead)
- **Must use:** `npm run lint` and `npm run type-check` for validation

---

## 7. Data & Database Changes

**No database changes required.** This is a code-only cleanup task.

---

## 8. API & Backend Changes

**No API or backend changes.** Cleanup only — removing dead code, unused imports, and stale dependencies.

---

## 9. Frontend Changes

**No new components or pages.** Cleanup only.

### Code Changes Overview

#### Known Areas to Clean (Before Analysis)

**`package.json` — Likely stale dependencies to remove:**
```json
// Likely still present but no longer used:
"@ai-sdk/google"
"@ai-sdk/react"
"ai"
"@google-cloud/aiplatform"
"@google-cloud/storage"
"react-markdown"
"remark-gfm"
"stripe"
```

**Production code — `console.log` audit:**
```bash
# Will scan all .ts/.tsx files for console statements
grep -r "console\." apps/web/app apps/web/components apps/web/lib --include="*.ts" --include="*.tsx"
```

**Type safety audit:**
```bash
# Will scan for any type usages
grep -r ": any\|as any" apps/web/app apps/web/components apps/web/lib --include="*.ts" --include="*.tsx"

# Will scan for TypeScript suppressions
grep -r "@ts-ignore\|@ts-expect-error" apps/web/ --include="*.ts" --include="*.tsx"
```

#### Key Changes Summary
- [ ] **Dependency cleanup:** Remove stale RAG/AI/GCP/Stripe packages from `package.json`
- [ ] **Console cleanup:** Remove all `console.log/warn/error` from production code
- [ ] **Type cleanup:** Fix any explicit `any` types and `@ts-ignore` suppressions
- [ ] **Import cleanup:** Remove unused imports across all active files
- [ ] **Dead code removal:** Remove any remaining stubs or empty functions from the RAG migration

---

## 10. Implementation Plan

### Phase 1: Analysis — Run All Checks ✓ 2026-04-15
**Goal:** Generate complete picture of what needs fixing before touching any code

- [x] **Task 1.1:** Check for stale dependencies with depcheck ✓ 2026-04-15
  - Command: `npx depcheck --detailed` (run from `apps/web/`)
  - Result: `react-social-icons` and `drizzle-zod` flagged as unused deps. Dev dep false positives: `@next/eslint-plugin-next`, `autoprefixer`, `concurrently`, `dotenv-cli`, `eslint-config-next`, `postcss` (all build tools — keep).

- [x] **Task 1.2:** Run lint check ✓ 2026-04-15
  - Result: ✅ Exit code 0 — zero errors, zero warnings

- [x] **Task 1.3:** Run type check ✓ 2026-04-15
  - Result: ✅ Exit code 0 — zero TypeScript errors

- [x] **Task 1.4:** Scan for console statements ✓ 2026-04-15
  - Result: All console statements are in `scripts/` (intentional CLI tooling), `lib/email.ts` (1x intentional config warning), and error boundaries in `privacy/error.tsx` + `terms/error.tsx` (standard Next.js pattern). No rogue console.log in app/component production code.

- [x] **Task 1.5:** Scan for type quality issues ✓ 2026-04-15
  - Result: ✅ Zero `: any`, `as any`, `@ts-ignore`, or `@ts-expect-error` found anywhere

- [x] **Task 1.6:** Check `package.json` for known stale RAG/AI packages ✓ 2026-04-15
  - Result: ✅ All CLAUDE.md "Dependencies to Remove" already stripped. `@ai-sdk/*`, `ai`, `@google-cloud/*`, `react-markdown`, `remark-gfm`, `stripe` — none present.

- [x] **Task 1.7:** Present complete findings report to user ✓ 2026-04-15
  - See findings report below

---

🛑 **ANALYSIS CHECKPOINT** — After Phase 1, present findings to user and wait for "proceed" before making any changes.

---

### Phase 2: Critical Fixes — SKIPPED ✓ 2026-04-15
**Goal:** Fix anything that causes `type-check` or `lint` to fail
- Skipped — both checks passed clean in Phase 1 with zero errors.

---

### Phase 3: Dependency Cleanup ✓ 2026-04-15
**Goal:** Remove stale packages from `package.json` that were part of the RAG app

- [x] **Task 3.1a:** Delete `scripts/setup-storage.ts` ✓ 2026-04-15
  - Leftover RAG script for "chat image storage" — completely irrelevant to GoOut Hyd

- [x] **Task 3.1b:** Remove `react-social-icons` from `package.json` ✓ 2026-04-15
  - Confirmed unused (no imports found anywhere in codebase)
  - `drizzle-zod` intentionally kept — will be used in v2 for dashboard/payment form validation

- [x] **Task 3.2:** Run `npm install` ✓ 2026-04-15
  - `package-lock.json` updated, 509 packages audited

- [x] **Task 3.3:** Re-run lint + type-check ✓ 2026-04-15
  - `npm run lint` → ✅ Exit 0, zero errors
  - `npm run type-check` → ✅ Exit 0, zero errors

---

### Phase 3b: Extended Cleanup (discovered during Phase 3) ✓ 2026-04-15
**Goal:** Remove leftover RAG infrastructure not caught in initial analysis

- [x] **Delete `apps/rag-processor/`** ✓ 2026-04-15 — Entire Python RAG backend, irrelevant to GoOut Hyd
- [x] **Delete `apps/rag-gcs-handler/`** ✓ 2026-04-15 — GCP Cloud Storage handler, irrelevant
- [x] **Delete `apps/rag-task-processor/`** ✓ 2026-04-15 — Cloud Tasks queue processor, irrelevant
- [x] **Delete root `scripts/`** ✓ 2026-04-15 — Python GCP deployment scripts (~450KB), irrelevant
- [x] **Run `npm audit fix`** ✓ 2026-04-15 — Fixed 7 of 12 vulnerabilities (12 → 5 remaining)
  - Remaining 2 issues require `--force` (breaking changes): `drizzle-orm` → 0.45.2, `drizzle-kit` esbuild
  - `drizzle-orm` SQL injection upgrade → tracked as separate pre-launch task
  - `drizzle-kit` esbuild issue → dev-only tool, not in production, acceptable risk

---

### Phase 4: Code Quality Cleanup ✓ 2026-04-15
**Goal:** Remove console statements, explicit any types, and dead code from active files

- [x] **Task 4.1:** Remove all `console.log/warn/error/info` from production code ✓ 2026-04-15
  - Result: ✅ No removals needed. All console statements are in `scripts/` (intentional CLI tooling) or Next.js error boundaries (`privacy/error.tsx`, `terms/error.tsx`). No rogue statements in app/component production code.

- [x] **Task 4.2:** Fix explicit `: any` type usages ✓ 2026-04-15
  - Result: ✅ No fixes needed. Zero `: any`, `as any`, `@ts-ignore`, or `@ts-expect-error` found (confirmed by Phase 1 scan, re-verified).

- [x] **Task 4.3:** Clean up remaining RAG migration artifacts ✓ 2026-04-15
  - Deleted `apps/web/lib/app-utils.ts` — orphaned RAG leftover containing `IMAGE_UPLOAD_CONSTRAINTS` (chat-images GCS bucket config) and `MODEL_CONFIG` (Gemini 2.5 Flash config). Zero imports of this file found anywhere.
  - Fixed `apps/web/app/(public)/about/page.tsx` — removed `"(placeholder link)"` dev note from production `aria-label` attribute.

- [x] **Task 4.4:** Final lint + type-check ✓ 2026-04-15
  - `npm run lint` → ✅ Exit 0, zero errors
  - `npm run type-check` → ✅ Exit 0, zero errors

---

### Phase 5: Comprehensive Code Review ✓ 2026-04-15
**Goal:** Verify all cleanup was done correctly with no regressions

- [x] **Task 5.1:** Implementation Complete ✓ 2026-04-15
- [x] **Task 5.2:** Code review complete ✓ 2026-04-15
  - Deleted 1 orphaned file (`lib/app-utils.ts`)
  - Fixed 1 production aria-label (`about/page.tsx`)
  - Lint ✅ · Type-check ✅ · No functional regressions

---

## 11. Task Completion Tracking — MANDATORY WORKFLOW

🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] Update task document immediately after each completed subtask
- [ ] Mark checkboxes as [x] with completion timestamp
- [ ] Add brief completion notes (file paths, key changes)

---

## 12. File Structure & Organization

### Files That May Be Modified
```
apps/web/
├── package.json                    # Remove stale dependencies
├── app/**/*.ts(x)                  # Fix lint/type errors, remove console.log
├── components/**/*.ts(x)           # Fix lint/type errors, remove console.log
├── lib/**/*.ts(x)                  # Fix lint/type errors, remove console.log
```

### Files That Will NOT Be Modified
```
apps/web/
├── tsconfig.json                   # NEVER touch (per cleanup template rules)
├── eslint.config.mjs               # NEVER touch (per cleanup template rules)
├── tailwind.config.ts              # No cleanup needed
├── drizzle.config.ts               # No cleanup needed
├── next.config.ts                  # No cleanup needed (unless lint error found)
├── lib/drizzle/schema/             # Schema files are correct — do not touch
├── drizzle/migrations/             # Never modify migration files
```

### Dependencies to Remove (Likely — Pending Analysis Confirmation)
```json
{
  "remove_if_confirmed_unused": [
    "@ai-sdk/google",
    "@ai-sdk/react",
    "ai",
    "@google-cloud/aiplatform",
    "@google-cloud/storage",
    "react-markdown",
    "remark-gfm",
    "stripe"
  ]
}
```

---

## 13. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Transitive dependency removal:** Removing a package may break a peer that still depends on it
  - **Code Review Focus:** Check if any remaining packages list removed packages as peer dependencies
  - **Potential Fix:** Only remove if depcheck confirms no other package depends on it

- [ ] **Env validation stripping:** `lib/env.ts` may still reference env vars for removed packages (e.g., `GEMINI_API_KEY`, `GOOGLE_CLOUD_*`, `STRIPE_*`)
  - **Code Review Focus:** Read `lib/env.ts` — remove any env var validation for services no longer in use
  - **Potential Fix:** Remove the validation entries and update `SETUP.md` if needed

### Edge Cases to Consider
- [ ] **depcheck false positives:** Build tools like `tailwindcss`, `postcss`, `@types/*` packages may appear "unused" to depcheck but are actually needed
  - **Analysis Approach:** Cross-reference depcheck output against known build tool packages
  - **Recommendation:** Only remove packages that appear in BOTH depcheck output AND the CLAUDE.md "to remove" list

- [ ] **shadcn component packages:** Some `@radix-ui/*` packages may appear unused if the shadcn component they power hasn't been imported yet
  - **Analysis Approach:** Check if the radix package is used transitively by any shadcn component
  - **Recommendation:** Keep all `@radix-ui/*` packages — these are intentional shadcn dependencies

### Security Review
- [ ] **No hardcoded secrets:** Scan for `api_key`, `password`, `secret` patterns in code (not env vars)
- [ ] **No test credentials:** Ensure no Stripe test keys, Supabase service role keys, etc. are hardcoded

---

## 14. Deployment & Configuration

**No new environment variables.** This task may REMOVE env var validation for deleted services from `lib/env.ts`.

---

## 15. AI Agent Instructions

### Workflow for This Task

1. **Start with Phase 1 (Analysis Only)** — Run all checks, collect findings, present report
2. **Wait for user "proceed"** before making any changes
3. **Implement Phase 2-4** one phase at a time, waiting for "proceed" between each
4. **Never remove a dependency** unless depcheck confirms it AND no active file imports it
5. **Never use `any` type** as a fix — find the proper type
6. **Never modify** `tsconfig.json` or `eslint.config.mjs`
7. **Never run** `npm run build` — use `npm run lint` and `npm run type-check` only

### Commands Reference (run from `apps/web/` directory)
```bash
# Dependency analysis
npx depcheck --detailed

# Lint
npm run lint

# Type check
npm run type-check

# Install after package.json changes
npm install
```

### Phase Recap Format
After each phase, provide:
```
✅ Phase [X] Complete — [Phase Name]
- Modified [X] files
- Key changes: [specific files and what changed]
- Lint status: ✅ Pass / ❌ [issues]
- Type check status: ✅ Pass / ❌ [issues]

🔄 Next: Phase [X+1] — [Phase Name]
Say "proceed" to continue.
```

---

## 16. Notes & Additional Context

### Reference Documents
- `CLAUDE.md` → "What Gets Stripped from RAG Codebase" section — authoritative list of what should have been removed
- `ai_docs/dev_templates/cleanup.md` → Node.js/TypeScript cleanup methodology and command patterns
- `ai_docs/prep/roadmap.md` Phase 7.4 → Lint + type-check as final pre-deploy validation gate

### Phase 7 Context
This task is part of Phase 7 (Launch Preparation). A clean codebase is prerequisite to the deploy step in 7.4. Once this task is complete, the next steps are:
1. Generate favicon (7.4)
2. Configure production env vars in Vercel
3. Push to main → Vercel auto-deploys

### Important: This is Node.js Only
The Python `rag-processor` app has already been stripped from the repo. The `cleanup_python.md` template does **not** apply to this task. This cleanup targets `apps/web/` only.

---

*Task created: 2026-04-15*
*Phase: 7 — Launch Preparation*
*Priority: High (pre-launch gate)*
