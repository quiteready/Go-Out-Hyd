# Lesson Learned: Phase 1B — Query Layer & Shared Layout

**Date:** March 24, 2026
**Session:** Area constants, Drizzle query functions, Navbar, Footer, public layout wiring
**Task Doc:** `ai_docs/tasks/002_phase_1b_query_layer_and_shared_layout.md`

---

## What Went Well

### Clean phase-by-phase execution with zero rework
All 4 phases completed without backtracking. Reading schema files before writing query functions meant column names and types were exact on the first attempt. No corrections needed post-lint or post-type-check.

### Reading existing files before writing new ones
Before writing Navbar and Footer, read `tailwind.config.ts` (color tokens), `button.tsx` (variants), and `Logo.tsx` (className override pattern). This prevented guessing at class names and avoided writing a component that wouldn't compile. **Never write a component that depends on existing tokens or primitives without reading those files first.**

### `as const` on the AREAS array gives literal types for free
Using `as const` on the `AREAS` array allows deriving `AreaSlug` and `AreaName` as union literal types directly from the data:
```ts
export type AreaSlug = (typeof AREAS)[number]["slug"];
```
This means the type system enforces valid slugs at compile time. No separate enum or manual type definition needed — the data is the source of truth for both runtime and types.

### `Promise.all` in `getCafeBySlug` for parallel sub-queries
Rather than three sequential awaits for images, menu items, and events, `Promise.all` runs them in parallel. For a cafe detail page load, this trims the database round-trip time from `~3 × query_time` to `~1 × query_time`. This pattern should be the default for any "fetch parent + fetch all related children" query.

### Server/client boundary discipline from the start
Three distinct file categories were created with clear boundaries:
- `lib/constants/areas.ts` — client-safe (pure data, no imports)
- `lib/queries/*.ts` — server-only (imports `db`)
- `components/layout/Navbar.tsx` — client component (`usePathname`)

Having this written in the task doc before coding prevented any accidental mixing. The linter never had to catch a boundary violation.

### `SheetClose asChild` pattern for mobile nav links
Wrapping each mobile nav link in `<SheetClose asChild>` means tapping any link automatically closes the Sheet. Without this, the panel stays open after navigation — a common mobile UX bug. This is the correct pattern for any Sheet-based navigation.

---

## Mistakes Made

### PowerShell `&&` still being used
Despite being caught in Phase 1A, the first lint command was still written with `&&`:
```
cd "path" && npm run lint
```
This failed immediately. PowerShell only accepts `;` as a command separator, not `&&`.

**Fix (permanent):** Always use the `working_directory` parameter on Shell tool calls instead of `cd`. This avoids the separator problem entirely and is cleaner. Only use `;` if chaining is truly necessary.

### `Button asChild` with custom bg color needs explicit override
The shadcn `Button` default variant uses `bg-primary` (a CSS variable). To apply the caramel brand color, the className must explicitly override it:
```tsx
<Button asChild className="bg-caramel text-espresso hover:bg-gold">
  <Link href="/partner">Partner with Us</Link>
</Button>
```
The CVA `cva()` base class and variant classes are merged with `cn()`, so Tailwind's `bg-caramel` wins over `bg-primary` in the class order. This works, but it's worth knowing: any direct Tailwind color class on a Button will override the variant, which is the desired behavior here but could be unexpected elsewhere.

---

## Key Decisions Made

| Decision | Choice | Reasoning |
|---|---|---|
| Area data location | `lib/constants/areas.ts` only — no DB table, no query file | Areas don't change, no CRUD needed, importing from a constant is cheaper and simpler than a DB round-trip |
| `getCafeBySlug` sub-queries | `Promise.all` parallel fetch | Cafe detail page needs images + menu + events simultaneously — no dependency between them, parallel is free performance |
| Event time filtering | Filter by `startTime > now()` using `gt()` from drizzle-orm | Keeps upcoming events accurate at query time; `status: "upcoming"` alone isn't enough since past events may not be manually marked complete |
| Navbar structure | `"use client"` wrapper for the whole Navbar | `usePathname()` requires client — simpler to mark the whole component than to split into server shell + client active-link sub-component |
| Mobile nav close-on-navigate | `SheetClose asChild` on each link | Standard shadcn pattern; avoids sheet staying open after route change |
| Footer copyright year | `new Date().getFullYear()` inline | Always shows correct year without a manual update each January |
| Center Navbar text | "Made with love in Hyderabad" (user revised twice before settling) | User initially asked to make it "warmer/more human", then after seeing the alternative ("Homegrown in Hyderabad") chose to revert to the original — keep originals until explicitly replaced |

---

## Process Improvements for Next Phase

1. **Always use `working_directory` on Shell calls** — eliminates the PowerShell `&&` issue entirely, never chain `cd &&`
2. **Read token/primitive files before writing components** — `tailwind.config.ts`, any `components/ui/*.tsx` being used, any shared utility — 5 minutes of reading saves 30 minutes of fixing
3. **For any "parent + children" DB fetch**, default to `Promise.all` — sequential awaits are a performance regression with no benefit
4. **Server/client file categories** — decide before writing, not after. Put it in the task doc: constants (client-safe), queries (server-only), hooks (client-only)
5. **`SheetClose asChild` on every link inside a Sheet nav** — standard pattern, always do this

---

## What Phase 1B Produced

After this session, the codebase has:
- ✅ `lib/constants/areas.ts` — 5 Hyderabad areas, bidirectional slug↔name mapping, `AreaSlug`/`AreaName` literal types
- ✅ `lib/queries/cafes.ts` — `getAllCafes(areaSlug?)`, `getFeaturedCafes(limit)`, `getCafeBySlug(slug)` with parallel sub-queries
- ✅ `lib/queries/events.ts` — `getUpcomingEvents(category?)`, `getUpcomingEventsForLanding(limit)`, `getEventBySlug(slug)`, `getEventsByCafe(cafeId)`
- ✅ `components/layout/Navbar.tsx` — espresso bar, brand wordmark, "Made with love in Hyderabad", "Partner with Us" CTA, mobile Sheet nav
- ✅ `components/layout/Footer.tsx` — three-column espresso footer, quick links, Instagram link, copyright
- ✅ `app/(public)/layout.tsx` — Navbar + cream main + Footer wrapping all public pages
- ✅ `app/(public)/page.tsx` — styled landing placeholder
- ✅ `npm run lint` — exit 0
- ✅ `npm run type-check` — exit 0

**Phase 1B is fully complete. Next: Phase 1C — Cafe Discovery pages (`/cafes`, `/cafes/[slug]`).**
