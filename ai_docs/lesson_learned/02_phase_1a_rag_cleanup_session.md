# Lesson Learned: Phase 1A — RAG Cleanup & GoOut Hyd Setup

**Date:** March 22, 2026
**Session:** Stripping all RAG code, applying GoOut Hyd design system, creating Drizzle schema, running first migration
**Task Doc:** `ai_docs/tasks/001_phase_1a_rag_cleanup_and_goout_setup.md`

---

## What Went Well

### Type-check as the cleanup safety net
After deleting ~55 files, running `npm run type-check` immediately surfaced every remaining broken import across the whole codebase. It caught 12 files that weren't on the original deletion list. Without this step, the app would have silently broken at runtime. **Type-check after bulk deletions is non-negotiable.**

### Task document with explicit file lists prevented missed deletions
Having the task doc enumerate every file to delete (by directory and by name) meant nothing was left to memory. The list wasn't perfect — hooks and contexts were missed — but it was the base that made the type-check sweep effective.

### Phase-by-phase confirmation loop prevented compounding errors
Completing one phase fully before moving to the next meant errors were caught close to their source. If all phases had been executed in one pass, a type error from Phase 2 would have been much harder to trace after Phase 4 changes.

### Down migration created before `db:migrate` ran
The migrate script enforces rollback file presence before applying any migration. Because the `down.sql` was created first, the migration proceeded cleanly the first time it connected successfully.

### Drizzle schema using array syntax for constraints
Following the `pgTable` array constraint rule (return `[...]` not `{...}`) from the cursor rules produced clean, warning-free schema files on the first try.

---

## Mistakes Made

### Deletion list missed files that import deleted modules
The original task doc listed which files to delete but didn't account for files that **import** from those deleted files. Six categories survived:

| Missed file | Why it broke |
|---|---|
| `contexts/ChatStateContext.tsx` | Imported `@ai-sdk/react`, deleted `chat-utils`, deleted schema types |
| `hooks/use-upload-queue.ts` and 7 other hooks | Imported deleted lib files |
| `hooks/index.ts` | Re-exported all the deleted hooks |
| `app/layout.tsx` | Imported `ThemeProvider` from uninstalled `next-themes` |
| `components/ui/sonner.tsx` | Imported `useTheme` from uninstalled `next-themes` |
| `lib/auth.ts` | Imported `User` and `users` from deleted schema files |
| `lib/drizzle/schema/index.ts` | Still exported all 6 deleted schema files |
| `lib/metadata.ts` | Not broken, but still had "RAGI" branding — caught visually |

**Fix:** After any bulk file deletion, immediately run `npm run type-check`. Treat all type errors as part of the deletion task, not a separate cleanup step. The deletion isn't done until the type-check passes.

### `(public)/layout.tsx` imported the deleted Navbar and Footer
The landing directory deletion included `Navbar.tsx` and `Footer.tsx`, but `app/(public)/layout.tsx` imported both. This would have crashed the app on first request. It wasn't on the deletion list because it's a route layout, not a component — easy to miss.

**Fix:** When deleting an entire component directory, search for imports of those components across the entire codebase (`lib/`, `app/`, other components) before deleting. In future sessions: `rg "from.*landing/"` before deleting `components/landing/`.

### npm workspace rename wasn't reflected in terminal commands
We renamed the web workspace from `web` to `goout-hyd-web` in `package.json`, but the root `package.json` scripts still use `--workspace=web`. Running `npm run db:generate` from the root failed with "No workspaces found" until we used `--workspace=goout-hyd-web` directly in the terminal.

**Fix:** When renaming a workspace, immediately update all `--workspace=` references in the root `package.json` scripts at the same time. Don't defer this — it will cause silent failures on the next command.

**Affected scripts to update:** `db:generate`, `db:generate:prod`, `db:generate:custom`, `db:generate:custom:prod`, `db:migrate`, `db:migrate:prod`, `db:rollback`, `db:rollback:prod`, `db:status`, `db:status:prod`, `db:seed`, `db:studio`, `web`, `web:build`, `web:start`, `type-check`, `lint`.

### Three attempts to get the Supabase DATABASE_URL right
1. **Attempt 1 — Direct connection URL** (`db.projectref.supabase.co:5432`): DNS fails (`ENOTFOUND`) because Supabase restricts direct connections by IP.
2. **Attempt 2 — Pooler URL with wrong username** (`postgres@pooler.supabase.com:6543`): "Tenant or user not found" because the Transaction pooler requires `postgres.projectref` as the username, not just `postgres`.
3. **Attempt 3 — Correct pooler URL** (`postgres.projectref@pooler.supabase.com:6543`): Success.

**Fix:** For any Supabase project, the `DATABASE_URL` must use the **Transaction mode pooler** URL with the project ref embedded in the username. In the Supabase dashboard: **Settings → Database → Connection string → Transaction mode → URI**. The correct format is:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### PowerShell `&&` is not a valid command separator
Attempted `cd "path"; npm run ...` chained with `&&` which PowerShell rejects. The token `&&` is not a valid statement separator in PowerShell (it works in bash/zsh but not PowerShell).

**Fix:** Always use `;` to chain commands in PowerShell, never `&&`. Example: `cd "path"; npm install` not `cd "path" && npm install`.

### `dir` with paths containing spaces failed
Using `dir "path with spaces"` in PowerShell threw "Second path fragment must not be a drive or UNC name." The `dir` alias doesn't handle quoted paths with spaces reliably.

**Fix:** Use the Glob or Read tools for directory exploration instead of shell `dir`/`ls` commands. Reserve shell commands for actual execution tasks (npm, git, etc.), not file system exploration.

### `sonner.tsx` needed updating beyond just removing ThemeProvider
Removing `ThemeProvider` from `layout.tsx` and uninstalling `next-themes` wasn't enough — the shadcn `sonner.tsx` component itself had a direct `useTheme` import. This caused a type error even though the component looked "safe" at a glance.

**Fix:** When removing a package, search for all import usages across the codebase before uninstalling: `rg "next-themes"` would have caught both `layout.tsx` and `sonner.tsx` in one sweep.

### ESLint failed due to missing `@next/eslint-plugin-next` in npm workspace
Running `npm run lint` from `apps/web` failed with "ESLint couldn't find the plugin `@next/eslint-plugin-next`". The package is a peer dependency of `eslint-config-next` and is not automatically installed by npm — it must be declared explicitly.

A follow-up `npm install --save-dev @next/eslint-plugin-next@latest` introduced a second problem: "latest" was a newer major version than `eslint-config-next@15.5.4`. The newer plugin exports a flat config object with a `name` property that the older `@eslint/eslintrc` compatibility layer rejects with "Unexpected top-level property `name`".

**Fix:** Always pin `@next/eslint-plugin-next` to the **exact same version** as `eslint-config-next`:
```bash
npm install --save-dev @next/eslint-plugin-next@15.5.4
```
Add this to `apps/web/package.json` devDependencies from the start of any Next.js project. A version mismatch between these two packages is a silent footgun.

---

## Key Decisions Made

| Decision | Choice | Reasoning |
|---|---|---|
| `next-themes` | Removed entirely | GoOut Hyd is light-only, no dark mode planned |
| Placeholder images | `picsum.photos` | Available immediately, no bucket setup needed for seed data |
| Navbar + Footer | Delete now, rebuild fresh in Phase 1B | Old RAG versions had wrong branding and layout — faster to start clean |
| `(public)/layout.tsx` | Stub with minimal wrapper | Removes dependency on deleted components while allowing the app to boot |
| shadcn CSS variables | Kept, remapped to GoOut Hyd palette | All shadcn components depend on these variables — remapping is safer than replacing |
| `lib/auth.ts` | Simplified to Supabase-only, no DB user lookup | No `users` table in Phase 1 — DB lookups would crash; Supabase auth helpers are dormant but safe to keep |
| Drizzle `migrate.ts` script | Used as-is | Already enforces down migration existence before applying — good safety behavior |

---

## Process Improvements for Next Phase

1. **Before any bulk deletion:** Run `rg "from.*[path-being-deleted]"` to find all importers first
2. **After any bulk deletion:** Run `npm run type-check` immediately — treat errors as part of the deletion task
3. **When renaming a workspace:** Update all `--workspace=` flags in root `package.json` in the same edit
4. **Supabase connection:** Always use Transaction pooler URL with `postgres.[project-ref]` username — document this in `.env.local` comments
5. **PowerShell:** Use `;` not `&&`; use Glob/Read tools not `dir` for file exploration
6. **Package removal:** Always `rg "package-name"` before uninstalling to catch all import sites
7. **New Next.js projects:** Always add `@next/eslint-plugin-next` pinned to the same version as `eslint-config-next` in `devDependencies` — it's a peer dependency that npm won't install automatically

---

## What Phase 1A Produced

After this session, the codebase is:
- ✅ All RAG/AI/payment code removed (routes, components, lib, schema, deps)
- ✅ `npm run lint` passes clean (0 errors) — `@next/eslint-plugin-next@15.5.4` added
- ✅ `npm run type-check` passes clean (0 errors)
- ✅ GoOut Hyd design tokens in Tailwind (espresso/caramel/cream palette)
- ✅ DM Serif Display + DM Sans loaded via `next/font/google`
- ✅ CSS custom properties mapped to GoOut Hyd palette in `globals.css`
- ✅ Middleware is a passthrough (no auth in Phase 1)
- ✅ `next.config.ts` allows `*.supabase.co` and `picsum.photos` images
- ✅ 5 Drizzle schema tables live in Supabase (cafes, cafe_images, menu_items, events, cafe_leads)
- ✅ Migration + down migration committed to repo
- ✅ `components/Logo.tsx` created with GoOut Hyd wordmark
- ✅ `lib/metadata.ts` updated with GoOut Hyd SEO copy
- ✅ Supabase Storage `images` bucket created (public-read)
- ✅ Seed data inserted — 4 cafes · 12 images · 20 menu items · 4 events (picsum.photos URLs)
- ✅ Seed data verified in Drizzle Studio

**Phase 1A is fully complete. Next: Phase 1B — build the public-facing pages.**