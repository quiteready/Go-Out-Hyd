# Lesson Learned: Master Idea + App Name + UI Theme Session

**Date:** March 19, 2026
**Session:** Building the Master Idea Document, App Name, UI Theme, Logo decision, CLAUDE.md, and Cursor Rules
**Templates Used:** 01_generate_master_idea.md, 02_generate_app_name.md, 03_generate_ui_theme.md, 04_chatgpt_logo_generation.md

---

## What Went Well

### Structured questioning forces decisions early
Walking through the Master Idea template step by step forced 30+ decisions that would have been left vague otherwise. Questions like "what does the customer do when WhatsApp is Phase 2?" and "what happens when a customer likes a cafe?" revealed gaps that would have become bugs during development.

### "What NOT to build" prevents scope creep
The Phase 1 constraints list (no auth, no payments, no WhatsApp, no admin UI, no tags, no dark mode) became one of the most valuable outputs. Every feature feels like "just one more thing" during development. Having a documented "no" list prevents that.

### Cross-referencing AI output against the real codebase catches major errors
Externally generated cursor rules had 8 significant errors (wrong Next.js version, wrong folder structure, wrong CTA strategy, missing Drizzle ORM, missing shadcn/ui). The AI in the IDE caught all of them by reading actual config files. Never trust externally generated project configs without verification.

### Evaluating AI-generated designs critically saves rework
The AI-generated mockups and color palettes were a useful starting point but had real problems (all-dark design hurting readability, too-literal coffee brown palette, clashing neon coral). Professional critique before committing to a direction avoided building the wrong thing.

### Deciding the brand name early unblocks everything
Choosing "GoOut Hyd" over "CafeConnect" early meant all documents (CLAUDE.md, cursor rules, master_idea.md, app_name.md, ui_theme.md) could be aligned immediately. If the name had stayed as "TBD," every subsequent document would need rework later.

---

## Mistakes Made

### Using an external AI chat tool to generate project-specific rules without codebase access
The pasted cursor rules assumed Next.js 14 (actual: 15), a `src/` folder structure (actual: `apps/web/`), and "WhatsApp only" CTAs (contradicted our own Master Idea decisions). External tools that cannot see your code will guess, and those guesses compound into real bugs.

**Fix:** Always generate project rules from within the IDE where the AI can read `package.json`, folder structure, and existing configs. Use external chat for brainstorming only, not for configuration files.

### Not updating all prep documents at once
After updating `master_idea.md`, the other 6 prep docs (`wireframe.md`, `system_design.md`, `initial_data_schema.md`, etc.) still describe the old RAG app. Any AI agent reading those files will get conflicting instructions.

**Fix:** When pivoting a project, update or flag ALL reference documents, not just the primary one. Stale docs in the same folder are worse than no docs because they look authoritative.

### Accepting AI-generated designs without professional critique
The first set of AI mockups used an all-dark layout, overly literal coffee-brown palette, and clashing accent colors. If these had been accepted as-is, the platform would have had poor readability for a discovery app where users need to scan lots of cards and text.

**Fix:** Always evaluate AI-generated designs against the actual use case. Ask: "Will a 25-year-old scrolling through 20 cafe cards on their phone find this readable and enjoyable?" Don't accept visuals just because they look polished.

### Brand decisions were initially deferred too long
Domain name, colors, and typography were initially deferred to "discuss with Wilson." This is fine for early ideation but would have blocked UI development if left unresolved.

**Fix:** Make working-name decisions early. They can always change later, but having a concrete name and design direction lets all documents stay aligned. The consumer-facing brand is a display string, not an architectural dependency.

---

## Key Decisions Made

| Decision | Choice | Reasoning |
|---|---|---|
| Brand name | GoOut Hyd (goouthyd.in) | Supports expansion to bars/clubs/rooftops. Action-oriented. Hyderabad identity. |
| Previous name | CafeConnect (replaced) | Too limiting for venue expansion. B2B clarity was good but consumer appeal was weak. |
| Color palette | Espresso/caramel/cream | Warm, premium, appetizing. Works for cafes, bars, breweries. Not too literal. |
| Primary accent | Caramel #C4813A | Present in all AI-generated options -- clearly resonated. Warm without being brown. |
| Typography heading | DM Serif Display | Warm serif with enough weight for mobile. Same design family as body font. |
| Typography body | DM Sans | Clean, readable, warm personality. Excellent number rendering for prices/dates. |
| Dark mode | Light-only for MVP | Discovery apps need scannable, airy layouts. Dark mode adds complexity with no demand. |
| Layout approach | Dark hero/footer, light content | Atmosphere in hero, readability in browsing areas. Proven pattern. |
| Logo | Text wordmark only | "GoOut Hyd" in DM Serif Display. No icon logo until brand is validated. |
| Star ratings | Removed from MVP | No review system = no real data. Fake ratings hurt credibility. |
| Search bar | Removed from MVP | Phase 2 feature. MVP uses area-based quick navigation. |
| Category colors | Phase 2 (documented now) | Purple for clubs, teal for rooftops, burnt orange for live music. Ready when needed. |
| WhatsApp CTA | Phase 2 | Keep MVP simple. Phone, Google Maps link, Instagram, address instead. |
| Customer auth | Phase 2 | Phase 1 is entirely public, no friction. |
| Cafe tags/filtering | Phase 2 | Not enough cafes at launch to make filtering useful. |
| Admin UI for Wilson | Phase 2 | Wilson uses Supabase dashboard directly for MVP. |
| 3D landing animation | Phase 2 | Too complex for one-week MVP timeline. |
| Events page design | Category cards as filters + event list below | Cleaner than separate pages per category. |
| Contact info | Phone, Google Maps link, Instagram, address | Google Maps opens directions externally, no embedded maps. |
| Partner form | 4 fields only (name, cafe, phone, area) | Minimal friction for cafe owner sign-up. |
| Notifications | Email only on lead submission | WhatsApp notifications deferred to Phase 2. |
| Architecture scope | Built to expand to bars/clubs/rooftops | Use "venue" in code, "cafe" in UI for Phase 1. |
| Codebase approach | Repurpose existing repo | Keep infra (Next.js 15, Supabase, Drizzle), strip RAG code. |
| Next.js version | Stay on 15 | Already configured, downgrading creates more problems. Stable for over a year. |

---

## AI Design Critique Summary

### What the AI-generated mockups got wrong
1. All-dark layout hurts usability for information-dense browsing
2. Coffee-brown palette is too literal -- looks like a coffee brand, not a discovery platform
3. Neon coral (#E8403A) clashes with warm browns -- creates urgency/danger signals
4. Missing the "curated Instagram feed" feel that 20-35 year olds expect
5. Included Phase 2 features (search bar, ratings, tag filters) creating scope confusion

### What the AI-generated mockups got right
1. Page layout flow: Hero → Featured → Events → All Venues → Owner CTA
2. Card-based browsing is the correct pattern
3. Event type badges on cards
4. Category color analysis (caramel works for cafes/bars/breweries, needs adjustment for clubs/live music)
5. "Hyderabad's Weekend Guide" positioning badge

### Design principle established
"Photography does the heavy lifting. The color system supports without competing. Light, airy, cream-toned backgrounds let content breathe."

---

## Files Created/Updated This Session

| File | Action | Content |
|---|---|---|
| `ai_docs/prep/master_idea.md` | Rewritten | Complete CafeConnect → GoOut Hyd Master Idea |
| `ai_docs/prep/app_name.md` | Rewritten | Name analysis, competitive research, GoOut Hyd selection |
| `ai_docs/prep/ui_theme.md` | Rewritten | Full design system: colors, typography, layout, tokens |
| `CLAUDE.md` | Rewritten | Updated for GoOut Hyd with accurate tech stack |
| `.cursor/rules/cafeconnect-project.mdc` | Created + updated | Project rules with design system and Phase 1 constraints |
| `ai_docs/lesson_learned/01_master_idea_session.md` | Created + updated | This file |

---

## Things to Remember for Next Sessions

1. **Stale prep docs still exist.** `wireframe.md`, `system_design.md`, `initial_data_schema.md`, `system_architecture.md`, `app_pages_and_functionality.md` still describe the old RAG app. Regenerate them before they mislead future work.
2. **The Master Idea Document is the source of truth.** If any other doc contradicts it, the Master Idea wins.
3. **SEO needs research.** Flagged as important but no specific strategy defined yet. Critical for "go out Hyderabad" search queries.
4. **Wilson conversation still needed for:** Final domain confirmation, social media handles, and buy-in on the GoOut Hyd name.
5. **The one-week MVP timeline** is ambitious. Keep scope disciplined -- every "nice to have" threatens it.
6. **Python cursor rules need cleanup.** ~15 Python-specific rules in `.cursor/rules/` should be removed since the Python backend is being stripped.
7. **Always critique AI-generated designs** against the actual user scenario before accepting them.
8. **Category colors are designed but not implemented.** Purple (#6C3FC4) for clubs, teal (#1A7A6A) for rooftops, burnt orange (#D4600A) for live music -- ready for Phase 2.

---

# Lesson Learned: Pages, Wireframes & Data Models Session

**Date:** March 21, 2026
**Session:** App Pages & Functionality Blueprint, Wireframes, Initial Data Schema
**Templates Used:** 05_generate_app_pages_and_functionality.md, 06_generate_wireframe.md, 07_generate_initial_data_models.md

---

## What Went Well

### Presenting options only when the decision genuinely matters
Instead of asking 19 open-ended questions, the AI made smart defaults for 17 of them and only presented 2 decisions that required actual business judgment (pricing visibility on partner page, whether to include an about page). This kept momentum high and avoided decision fatigue.

### The "make decisions for me, give options when you can't" instruction
Telling the AI explicitly "if you need my decision give me 2 or more options, if not make decisions for me" produced dramatically better output than open-ended questions. The AI made confident architectural choices (top nav over sidebar, scrollable page over tabs, text field over separate areas table) and only escalated genuine business decisions.

### Adapting the SaaS template to a public-only platform
The pages template was designed for authenticated SaaS apps (sidebar nav, auth flow, billing, admin dashboard). Recognizing that GoOut Hyd Phase 1 has zero auth, zero payments, and zero admin UI -- and stripping all of that from the blueprint -- prevented building unnecessary infrastructure. The result was 8 focused public pages instead of 15+ pages with unused auth/billing flows.

### Feature-to-schema mapping catches missing queries early
Mapping every page section to its exact SQL query (e.g., "Browse by Area pills" -> `SELECT DISTINCT area FROM cafes WHERE status = 'active'`) revealed that areas don't need a separate table. Without this mapping, a developer might create an `areas` table thinking it was needed for the area filter pills.

### Whole rupees over paise for operator convenience
The initial decision was "store prices in paise (29900 = ₹299)" following standard payment industry practice. But recognizing that Wilson enters data manually in Supabase dashboard -- and would have to type 29900 instead of 299 for every menu item -- led to switching to whole rupees. The conversion to paise can happen in the payment service layer when Phase 2 adds Razorpay. Design for the current user (Wilson), not the future system.

---

## Mistakes Made

### Initially over-questioning the user
The first response had 19 detailed questions across 6 categories. This would have caused decision fatigue and slowed the session. The user course-corrected with "if you need my decision give me 2 or more options, if not make decisions for me" -- which was the right approach from the start.

**Fix:** Default to making smart decisions based on existing documents. Only ask questions when there's a genuine business trade-off the AI cannot resolve (e.g., pricing visibility is a sales strategy decision, not a technical one).

### The paise pricing assumption
Defaulting to paise (integer * 100) for price storage is standard for payment systems, but GoOut Hyd Phase 1 has no payments. Wilson manually entering 29900 instead of 299 in Supabase would have been a daily friction point.

**Fix:** Always consider who is entering the data and how. "Best practice" for payment systems is not best practice for a manually-operated MVP with no payment processing.

---

## Key Decisions Made

| Decision | Choice | Reasoning |
|---|---|---|
| Landing page sections | Hero + Browse by Area + Featured Cafes + Upcoming Events + Partner CTA + Footer | Serves both audiences (customers browsing, cafe owners considering partnership) |
| Featured cafes logic | All active cafes (Wilson curates a small set) | Not enough cafes at launch for algorithmic featuring |
| Cafe listing layout | Area pills + card grid (3 cols desktop, 2 mobile) | Standard discovery pattern, simple to build |
| Cafe profile layout | Single scrollable page (not tabs) | Better mobile UX, no hidden content, simpler to build |
| Event detail pages | Yes, at `/events/[slug]` | SEO value, shareable URLs, Wilson can share links in pitches |
| Event date filtering | Category cards only, no date filter | Keep MVP simple. Category is the primary discovery axis. |
| Partner page pricing | Show starting price only ("Plans from ₹999/month") | Hooks interest without overwhelming. Wilson discusses details on call. |
| About page | Include at `/about` | Builds credibility for cafe owners evaluating the platform |
| Navigation type | Top nav bar (not sidebar) | Public discovery site, not a dashboard. Logo left, links right, hamburger on mobile. |
| Nav links | Cafes, Events, About, List Your Cafe (CTA button) | "List Your Cafe" as caramel CTA button stands out for cafe owners. |
| Legal pages | Privacy + Terms included | Required for any public site. Trivial to add. |
| Footer content | Wordmark, quick links, social, "Made with love in Hyderabad" | Standard footer, consistent across all pages |
| Empty states | Friendly message + alternative CTA | "No cafes in this area yet" with "Browse All Areas" button |
| Toast notifications | Partner form success only | "Thanks! Wilson will reach out within 24 hours" |
| Users table | Remove entirely | Phase 2 auth needs will differ. Adding back is a 2-minute migration. Clean MVP. |
| Event timing | Start time + end time | Lets customers know "7 PM - 10 PM". Small extra effort for Wilson. |
| Cafe opening hours | Text field added | "10 AM - 11 PM, Closed Mondays". Useful for customers, low effort. |
| Area storage | Text field on cafes table (not separate table) | `SELECT DISTINCT area` is sufficient. No extra joins needed. |
| Event types | Postgres enum (5 types) | Type-safe, extensible via migration. Types well-defined in master idea. |
| Price storage | Whole rupees (integer) | Wilson enters 299 not 29900. No payments in Phase 1. Convert at payment layer in Phase 2. |
| Schema approach | Complete replacement | 0% reuse from RAG schema. Drop all 6 old tables, create 5 new ones. |
| Lead tracking | 4-status enum (new, contacted, converted, closed) | Simple pipeline for Wilson to track in Supabase dashboard. |
| Schema migration | Single migration: drop all old, create all new | Clean break. Not incremental -- the app is fundamentally different. |

---

## Architecture Decisions Documented

### Navigation structure
Top navigation bar on all pages. No sidebar. Public discovery sites don't use sidebars -- those are for authenticated dashboard apps. Mobile uses hamburger menu with slide-out panel.

### Route structure
All pages under `(public)/` layout group. No `(auth)`, `(protected)`, or `(admin)` groups in Phase 1. Single shared layout with nav + footer wrapping all pages.

### Backend architecture
No API routes needed for Phase 1. All data fetched server-side by Server Components using lib queries. Only user interaction (partner form) uses a Server Action. This is simpler and more performant than API routes.

### Database design philosophy
5 tables, 4 enums. Designed for Wilson's workflow (manual data entry in Supabase dashboard). Prices in whole rupees, areas as free text, menu categories as free text. Type-safe where it matters (event types, statuses), flexible where Wilson needs freedom (area names, menu categories, opening hours).

---

## Files Created/Updated This Session

| File | Action | Content |
|---|---|---|
| `ai_docs/prep/app_pages_and_functionality.md` | Created | 8-page blueprint with functionality specs, nav structure, route mapping |
| `ai_docs/prep/wireframe.md` | Created | ASCII wireframes for all pages (desktop + mobile), navigation flow map |
| `ai_docs/prep/initial_data_schema.md` | Created | 5 new tables, 4 enums, feature-to-schema mapping, migration strategy |
| `ai_docs/lesson_learned/01_master_idea_session.md` | Updated | Added this session's lessons |

---

## Things to Remember for Next Sessions

1. **Stale prep docs are now resolved.** `app_pages_and_functionality.md`, `wireframe.md`, and `initial_data_schema.md` are all updated for GoOut Hyd. The old RAG versions have been replaced.
2. **System design and system architecture docs** still need to be generated/updated (if those templates exist).
3. **The schema migration will be destructive.** All existing data in the database will be lost when old tables are dropped. Ensure no important data exists before running.
4. **Wilson's Supabase workflow drives schema decisions.** Every field type, naming convention, and storage format should be evaluated through the lens of "can Wilson easily enter this in the Supabase table editor?"
5. **SEO strategy still undefined.** Meta tags and OG images are planned per page but no keyword research or sitemap strategy has been done.
6. **Email notification system for leads** is specified but no email service has been chosen (Resend, SendGrid, Supabase Edge Functions, etc.).
7. **Image storage approach** is Supabase Storage with URLs in the database, but the bucket structure and upload workflow haven't been defined.
8. **Seed data** for 3-5 sample cafes needs to be created for development and Wilson's demo pitches.
9. **The "ask me options or decide for me" instruction** should be the default approach for all future planning sessions. It dramatically reduces decision fatigue.

---

# Lesson Learned: System Architecture Session

**Date:** March 22, 2026
**Session:** System Architecture Blueprint generation
**Templates Used:** 08_generate_system_design.md

---

## What Went Well

### Recommending decisions instead of just listing options
The system architecture template asks targeted questions about email services, image storage, rendering strategy, etc. Instead of dumping 7 open-ended questions on the user, the AI presented clear recommendations with reasoning for each one (Resend over SendGrid, public buckets over signed URLs, SSR over ISR). The user only had to validate, not research.

### "Suggest what's good for our application" as a user instruction
When presented with 7 architecture decisions, the user asked the AI to recommend rather than choosing from options. This continued the pattern from Session 2 ("make decisions for me, give options when you can't") and produced faster, more confident architecture decisions. The AI has enough context from planning docs to make informed recommendations.

### Catching CLAUDE.md inconsistencies during review
The system architecture review surfaced that `CLAUDE.md` was missing 4 routes (`/events/[slug]`, `/about`, `/privacy`, `/terms`) and had incorrect API routes listed (`/api/leads`, `/api/cafes`, `/api/events`) when Phase 1 has no API routes at all. Fixing these during architecture planning prevents misleading future AI agents that read `CLAUDE.md` for context.

### Keeping the extension count to exactly one
Phase 1 adds exactly one external service (Resend for email) beyond what the template already provides. Every other need (image storage, spam prevention, analytics, monitoring) is handled by existing template infrastructure or zero-dependency application logic. This constraint keeps the system simple enough for a solo developer to maintain.

---

## Mistakes Made

### None significant this session
The session followed a clean flow: read all planning docs, identify gaps, ask targeted questions, get validation, generate blueprint. The prior sessions established strong enough planning documents that no major course corrections were needed.

---

## Key Decisions Made

| Decision | Choice | Reasoning |
|---|---|---|
| Email service | Resend | 100 free emails/day, first-class Next.js support, simple API. Only 1-3 emails/day expected at launch. |
| Image storage | Supabase Storage, public bucket, direct URLs | Developer uploads via dashboard. No signed URLs needed. Next.js Image component handles optimization. |
| Rendering strategy | Full SSR (server-side rendering) | Simplest mental model. Changes appear instantly. Dataset too small for ISR to matter. Optimize later if needed. |
| OG images | Static (use cover images directly) | Zero extra infrastructure. Cover photo + title/description is sufficient for MVP social sharing. |
| Form spam prevention | Honeypot field only | Hidden field bots fill, real users never see. Zero dependencies, zero user friction. Add Turnstile if spam appears. |
| Monitoring | Vercel Analytics only | Free, zero-config, auto-enabled. Skip Sentry at MVP. App has one form and read-only pages. |
| Environment strategy | Production only + Vercel preview deploys | One Supabase project, one Vercel project. Solo dev with manual data entry. Add staging DB in Phase 2 when owners self-serve. |
| API routes | None in Phase 1 | Server Components fetch via Drizzle. Partner form uses Server Action. No REST layer needed. |
| CLAUDE.md routes | Updated to include all 8 pages | Added /events/[slug], /about, /privacy, /terms. Removed incorrect /api/* routes. Added Server Action reference. |

---

## Architecture Decisions Documented

### Single external service dependency
Resend is the only new dependency. The partner form Server Action inserts the lead into the database first, then sends the email. If Resend fails, the lead data is safe. Wilson can check Supabase directly as a fallback.

### No API routes in Phase 1
All data fetching happens in Server Components via Drizzle ORM queries. No REST API layer to design, document, or secure. The only write operation (partner form) uses a Server Action, not an API route.

### Image delivery through Next.js Image component
Supabase Storage serves public URLs. Next.js `Image` component handles lazy loading, responsive sizing, and format optimization on the frontend. When traffic grows, Vercel's built-in image optimization sits between browser and storage with zero code changes.

### Production-only environment
One Supabase project, one Vercel project. Preview deployments use the same database. No staging environment overhead for a solo developer manually entering 10-50 cafes. Add staging Supabase project when Phase 2 introduces self-serve features.

---

## Files Created/Updated This Session

| File | Action | Content |
|---|---|---|
| `ai_docs/prep/system_architecture.md` | Created | Full system architecture blueprint with Mermaid diagram, extension strategy, risk assessment, implementation roadmap |
| `CLAUDE.md` | Updated | Fixed route structure: added 4 missing routes, removed incorrect API routes, added Server Action reference |
| `ai_docs/lesson_learned/01_master_idea_session.md` | Updated | Added this session's lessons |

---

## Things to Remember for Next Sessions

1. **All 4 planning docs are now complete.** master_idea.md, app_pages_and_functionality.md, wireframe.md, initial_data_schema.md, and system_architecture.md are all aligned for GoOut Hyd Phase 1.
2. **CLAUDE.md is now accurate.** Route structure matches app_pages doc. No more stale API routes.
3. **Resend account needs setup.** API key, verified sending domain, and Wilson's notification email address all need to be configured before the partner form works.
4. **The build order is defined.** Strip RAG -> Schema -> Cafes pages -> Events pages -> Partner form -> Landing page -> Static pages -> Launch. Follow system_architecture.md.
5. **Seed data is still needed.** 3-5 sample cafes with images, menu items, and events for development and demo.
6. **SEO keyword research still undefined.** Meta tags are planned per page but no actual keyword strategy exists yet.
7. **The "recommend what's good" instruction** continues to work well. AI makes informed recommendations from planning docs, user validates. Faster than open-ended questions.
8. **Previously resolved items from Session 2:** Email service (Resend), image storage (public Supabase bucket), environment strategy (production only). These are no longer open questions.

---

# Lesson Learned: Development Roadmap Session

**Date:** March 22, 2026
**Session:** Development roadmap generation using build order template
**Templates Used:** 09_rag_generate_build_order.md (adapted -- GoOut Hyd is not a RAG app)

---

## What Went Well

### Adapting a RAG-specific template to a non-RAG project
The build order template (09_rag_generate_build_order.md) is designed for RAG-SaaS applications with document upload, vector search, and AI chat integration. GoOut Hyd has none of these. Rather than forcing the template's RAG-specific phases (RAG Processing Integration, Status Monitoring, Vector Search), the AI correctly identified that all RAG sections should be skipped and produced a roadmap structured around GoOut Hyd's actual features: cafe discovery, event discovery, partner lead capture, and a composite landing page.

### Thorough questioning before roadmap generation
The AI asked 10 structured questions covering timeline, infrastructure state, seed data, RAG stripping approach, auth dormancy strategy, content readiness, email format, and scope confirmation. Every answer directly shaped the roadmap -- no question was wasted. The answers resolved ambiguity that would have produced a wrong roadmap (e.g., "Option A: Clean Sweep First" for RAG stripping meant Phase 1 is cleanup-only, not "strip as you go" which would create import errors mid-development).

### Feature analysis before roadmap generation
The template's multi-step process (identify features → categorize by pattern → analyze database requirements → map dependencies → present for validation → then generate roadmap) prevented premature roadmap generation. The dependency chain analysis caught that the landing page must be built last (it depends on cafe and event queries), and that cafes must come before events (FK dependency).

### Iterative refinement caught real issues
Three rounds of user feedback caught issues the initial roadmap missed:
- SEO metadata should be built inline per page, not as a separate pass (reopening every file is wasteful)
- `RESEND_API_KEY` env var should be added in Phase 1 as optional, not introduced in Phase 4 (avoids touching env.ts twice)
- About/Privacy/Terms are trivial pages that don't deserve phase space alongside the partner form (the most important conversion page)
- Area slug ↔ display name mapping needs an explicit utility (URL uses `banjara-hills`, database stores `Banjara Hills`, metadata needs display name)
- `getActiveAreas()` database query creates a second source of truth when `lib/constants/areas.ts` already exists
- Middleware needs to be explicitly gutted to a passthrough, not just "updated" (leaving Supabase session checks wastes a DB call per request)
- Seed script must never run against production (fictional data overwrites real cafes)

### Single source of truth discipline
The user caught two violations of single-source-of-truth during review: (1) `getActiveAreas()` query would duplicate the area list from `lib/constants/areas.ts`, and (2) the Zod enum in the partner form hardcoded area names instead of deriving from `AREA_NAMES`. Both were fixed before the roadmap was finalized. This discipline prevents the bug where "add a new area" requires changes in 3 different files.

---

## Mistakes Made

### Initial roadmap bundled unrelated pages into one phase
Phase 4 originally combined the partner form (the most important conversion page with Server Action, Zod validation, honeypot, Resend integration) with About, Privacy, and Terms pages (trivial static content). The partner form deserves focused attention as its own phase. Static content pages belong with the landing page phase since they're all simple Server Components with no data dependencies.

**Fix:** Give conversion-critical features their own phase. Group static content pages together. A phase should contain features of similar complexity and importance.

### Forgot to include Supabase Storage setup for development
The initial roadmap placed Supabase Storage bucket creation in Phase 6 (Launch Preparation), but cafe profile and event pages in Phases 2-3 need images to render properly during development. Without a storage bucket and placeholder images, the developer would be building image-heavy pages with broken `<Image>` components.

**Fix:** Infrastructure that feature development depends on must be set up before the features, not after. Move storage setup to the foundation phase.

### Missed the area slug mapping problem
The initial roadmap had area filter pills linking to `/cafes?area=banjara-hills` (slugified URLs) but the database stores `"Banjara Hills"` (display text). No task existed for the conversion utility. This would have surfaced as a bug mid-build when the query receives a slug and finds no matching area in the database.

**Fix:** When URL parameters don't match database values, create an explicit mapping layer. Don't assume the developer will figure it out during implementation.

### next.config.js vs next.config.ts inconsistency
The roadmap referenced `next.config.js` but Next.js 15 projects typically use `next.config.ts`. A developer searching for the wrong filename wastes time. Small inconsistencies like this compound when an AI agent is following the roadmap literally.

**Fix:** Always check the actual filename in the codebase before referencing config files in documentation.

### Created a duplicate data source with getActiveAreas()
The initial roadmap included both `lib/constants/areas.ts` (hardcoded area list) and `lib/queries/areas.ts` with `getActiveAreas()` (database query). Two sources of truth for the same data. A future developer adding a new area would update one and not the other.

**Fix:** When you create a constants file as the source of truth, explicitly document that no database query should duplicate that data. The roadmap now says "Do NOT create lib/queries/areas.ts" with an explanation.

---

## Key Decisions Made

| Decision | Choice | Reasoning |
|---|---|---|
| RAG stripping approach | Clean Sweep First (Option A) | Dedicate first phase to stripping all RAG code before feature work. Prevents import errors and confusion during development. |
| Phase 1 density | Split into 1A (cleanup + schema + seed) and 1B (queries + layout) | Too dense as a single phase. 1A is backend/infrastructure, 1B produces visible UI (nav + footer). |
| Partner form phasing | Own dedicated phase (Phase 4) | Most important conversion page. Deserves focused attention, not bundled with static content pages. |
| Static pages grouping | About/Privacy/Terms in Phase 5 with Landing Page | All static content, similar complexity, no data dependencies beyond what landing page already needs. |
| SEO infrastructure | Dedicated Phase 6 close-out (~30 minutes) | robots.ts, sitemap.ts, not-found.tsx, SETUP.md rewrite. Focused close-out, not buried at end of another phase. |
| Area data source | `lib/constants/areas.ts` only (no database query) | Single source of truth. All components import from constants. `getActiveAreas()` query removed to prevent duplication. |
| Area slug mapping | Bidirectional utility in `lib/constants/areas.ts` | `getAreaNameFromSlug()` and `getAreaSlugFromName()` handle URL ↔ display name conversion. |
| Partner form Zod enum | Derived from `AREA_NAMES` at runtime | `z.enum([...AREA_NAMES, "Other"])` -- one place to add a new area. No hardcoded strings in validation. |
| Middleware approach | Full passthrough (`NextResponse.next()`) | Remove all Supabase session checks. No DB call per request when there's no auth. Comment marks where Phase 2 auth goes. |
| Supabase Storage timing | Phase 1A (before feature development) | Images needed during Phases 2-3 for cafe/event pages. Can't develop image-heavy pages without working storage. |
| Seed data vs production | Seed script is dev-only, never run against production | Real cafe data entered directly via Supabase dashboard. Seed script contains fictional data that would overwrite real records. |
| RESEND_API_KEY timing | Added in Phase 1A as `.optional()` | Env var exists from the start but doesn't block boot. Actual Resend package installed in Phase 4 when the partner form is built. |
| Config file reference | `next.config.ts` (not `.js`) | Next.js 15 projects use TypeScript config. Consistent with actual codebase. |
| Total phases | 8 (1A, 1B, 2, 3, 4, 5, 6, 7) | Well-paced for solo developer. Each phase is a complete milestone with visible progress. |

---

## Roadmap Structure (Final)

| Phase | Name | Key Deliverables |
|---|---|---|
| **1A** | Cleanup, Schema & Seed | RAG code stripped, design system applied, 5-table schema, Supabase Storage bucket, seed data |
| **1B** | Query Layer & Shared Layout | Area constants, Drizzle query functions, Navbar + Footer, public layout shell |
| **2** | Cafe Discovery | `/cafes` listing with area pills, `/cafes/[slug]` profile with gallery lightbox, menu, contact, events |
| **3** | Event Discovery | `/events` listing with category cards, `/events/[slug]` detail with venue section |
| **4** | Partner & Lead Capture | `/partner` pitch page + form + Zod validation + honeypot + Server Action + Resend email to Wilson |
| **5** | Landing Page & Content Pages | Composite `/` page, `/about`, `/privacy`, `/terms` |
| **6** | SEO & Documentation | robots.ts, sitemap.ts, not-found.tsx, SETUP.md rewrite |
| **7** | Launch Preparation | Domain purchase + DNS, production data via Supabase dashboard, Resend prod config, favicon, deploy |

---

## Files Created/Updated This Session

| File | Action | Content |
|---|---|---|
| `ai_docs/prep/roadmap.md` | Created | 8-phase development roadmap with ~80 implementation tasks |
| `ai_docs/lesson_learned/01_master_idea_session.md` | Updated | Added this session's lessons |

---

## Things to Remember for Next Sessions

1. **The roadmap is the build guide.** `ai_docs/prep/roadmap.md` is the authoritative task list. Follow phases sequentially. Each phase must be complete before starting the next.
2. **All 6 planning docs are now complete.** master_idea.md, app_name.md, ui_theme.md, app_pages_and_functionality.md, wireframe.md, initial_data_schema.md, system_architecture.md, and roadmap.md are all aligned.
3. **`lib/constants/areas.ts` is the single source of truth for areas.** No database query for areas. All components (filter pills, form dropdown, metadata, landing page pills) import from this file. Adding a new area = one file change.
4. **Middleware is a passthrough in Phase 1.** `NextResponse.next()` with no session checks. Comment marks where Phase 2 auth re-enables it.
5. **Seed script is development-only.** Never run against production. Real data goes directly into Supabase dashboard.
6. **RESEND_API_KEY is optional in env.ts.** App boots without it in Phases 1-3. Resend package installed in Phase 4.
7. **Supabase Storage bucket must exist before Phase 2.** Cafe and event pages need images to render during development.
8. **Phase 4 (Partner form) is the most important conversion page.** It gets its own phase for focused implementation and testing.
9. **SEO keyword research is still undefined.** Meta tags and sitemap are built into the roadmap, but no actual keyword strategy or content optimization has been done.
10. **Python cursor rules still need cleanup.** ~15 Python-specific rules in `.cursor/rules/` should be removed. Not in the roadmap but should happen during or after Phase 1A.
