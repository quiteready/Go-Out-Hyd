# GoOut Hyd Development Roadmap

**App:** GoOut Hyd (goouthyd.com)
**Purpose:** Cafe discovery and event platform for Hyderabad, India
**Phase:** 1 (MVP -- public-only, no auth/payments/admin)
**Developer:** Solo
**Template:** rag-simple (Next.js 15, Supabase, Drizzle ORM, Tailwind CSS, Vercel)
**Approach:** Strip RAG code → Build GoOut Hyd features front-to-back

---

## Phase 1A: Cleanup, Schema & Seed

**Goal:** Strip all RAG code from the monorepo, apply the GoOut Hyd design system, create the new 5-table database schema, set up image storage, and populate seed data. After this phase, the app boots clean with GoOut Hyd branding, a working database with sample data, and images loadable from Supabase Storage.

### 1A.1 RAG Dependency Removal

[Goal: Remove all AI/RAG/payment dependencies so the app has a clean dependency tree with no unused packages]

- [x] Remove RAG/AI packages from `apps/web/package.json`: `@ai-sdk/google`, `@ai-sdk/react`, `ai`, `@google-cloud/aiplatform`, `@google-cloud/storage`
- [x] Remove content rendering packages: `react-markdown`, `remark-gfm`
- [x] Remove payment package: `stripe`
- [x] Remove any other unused RAG-related dependencies identified in `package.json`
- [x] Run `npm install` to clean the lockfile
- [x] Remove RAG deployment scripts from root `package.json`: `deploy:processor:*`, `deploy:gcs-handler:*`, `deploy:task-processor:*`, `setup:gcp:*`, `stripe:listen`, `storage:setup`

### 1A.2 RAG Code Deletion

[Goal: Delete all RAG-specific application code -- routes, components, lib files, contexts, and non-web directories -- leaving only reusable infrastructure]

**Monorepo cleanup:**

- [x] Delete `apps/rag-processor/` directory entirely (Python RAG processing service)
- [x] Audit repo root for any other non-web directories: Cloud Run configs, GCS handler dirs (`apps/rag-gcs-handler/`, `apps/rag-task-processor/`), Python scripts, GCP deployment files -- delete all of them
- [x] Remove any workspace references to deleted directories from root `package.json` workspaces config

**Routes to delete:**

- [x] Delete `app/(auth)/` directory (all auth routes: login, sign-up, forgot-password, update-password, confirm, sign-up-success, error)
- [x] Delete `app/(protected)/` directory (all protected routes: chat, documents, history, profile, admin)
- [x] Delete `app/api/chat/` directory
- [x] Delete `app/api/documents/` directory
- [x] Delete `app/api/webhooks/` directory (if exists)

**Components to delete:**

- [x] Delete `components/chat/` directory
- [x] Delete `components/documents/` directory
- [x] Delete `components/history/` directory
- [x] Delete `components/auth/` directory
- [x] Delete `components/profile/` directory
- [x] Delete `components/landing/` directory (RAG-specific landing sections: HeroSection, FeaturesSection, RAGDemoSection, PricingSection, FAQSection, etc.)
- [x] Delete `components/layout/AppSidebar.tsx` (dashboard sidebar, not needed for public site)
- [x] Delete `components/NavbarThemeSwitcher.tsx` and `components/SidebarThemeSwitcher.tsx` (no dark mode)
- [x] Delete `components/Logo.tsx` (rebuild with GoOut Hyd wordmark)

**Lib files to delete:**

- [x] Delete `lib/embeddings/` directory
- [x] Delete `lib/search/` directory
- [x] Delete `lib/rag/` directory
- [x] Delete `lib/documents.ts`, `lib/storage.ts`
- [x] Delete `lib/attachments.ts`, `lib/attachments-client.ts`
- [x] Delete `lib/chat-utils.ts`, `lib/chat-utils-client.ts`
- [x] Delete `lib/google-cloud.ts`
- [x] Delete all `lib/upload-*.ts` files (upload queue, error handling, file validation)
- [x] Delete all `lib/processing-*.ts` files (processing constants/utils)
- [x] Delete `lib/history.ts`, `lib/persistence.ts`

**Other files to delete:**

- [x] Delete `contexts/ChatStateContext.tsx` (if exists)
- [x] Delete `app/(public)/cookies/` directory (not in GoOut Hyd plan)

### 1A.3 Environment & Configuration Cleanup

[Goal: Update environment validation, middleware, and Next.js config to reflect GoOut Hyd's minimal service requirements]

- [x] Update `lib/env.ts`: remove `GEMINI_API_KEY`, `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_REGION`, `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY`, `GOOGLE_CLOUD_STORAGE_BUCKET`
- [x] Add `RESEND_API_KEY` to `lib/env.ts` server schema with Zod string validation (mark as `.optional()` so Phases 1-3 boot without it; Phase 4 will use it)
- [x] Keep: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`
- [x] Replace `middleware.ts` body with a passthrough: remove all Supabase session checks and auth redirect logic, return `NextResponse.next()` unconditionally. No DB call on every request when there's no auth to enforce. Add a comment: `// Phase 2: Re-enable Supabase session checks and auth redirects here when authentication is added`
- [x] Update `next.config.ts`: add Supabase Storage domain to `images.remotePatterns` for Next.js Image component (e.g., `{ protocol: 'https', hostname: '*.supabase.co' }`)
- [x] Update root and web `package.json` name and description from rag-simple references to GoOut Hyd
- [x] Run `npm run dev` to confirm the app boots cleanly after all deletions

### 1A.4 Design System Application

[Goal: Apply GoOut Hyd's espresso/caramel/cream visual identity so all subsequent UI work uses the correct brand tokens]

- [x] Update `tailwind.config.ts` with GoOut Hyd color tokens:
  - Brand: `espresso: '#1C1008'`, `roast: '#4A2C17'`, `caramel: '#C4813A'`, `gold: '#D4956A'`, `cream: '#F5ECD7'`, `milk: '#FAF5EC'`, `foam: '#FFFCF7'`
  - UI system: `border: '#E8DCC8'`, `input-border: '#D4C9B5'`, `success: '#2D7A4F'`, `warning: '#C4813A'`, `error: '#C43A3A'`
- [x] Add font family config to `tailwind.config.ts`: `heading: ['"DM Serif Display"', 'Georgia', 'serif']`, `body: ['"DM Sans"', 'system-ui', 'sans-serif']`
- [x] Update `app/layout.tsx`: import DM Serif Display (weight 400) and DM Sans (weights 300, 400, 500) via `next/font/google`, apply to `<body>` className
- [x] Update `app/globals.css` with GoOut Hyd CSS custom properties mapped to the color tokens
- [x] Update root layout metadata: title "GoOut Hyd", description "Discover Hyderabad's best independent cafes and events"

### 1A.5 Database Schema

[Goal: Replace all RAG tables with GoOut Hyd's 5-table schema for cafes, images, menus, events, and leads]

- [x] Delete all existing schema files in `lib/drizzle/schema/`: `documents.ts`, `document_chunks.ts`, `document_processing_jobs.ts`, `conversations.ts`, `messages.ts`, `users.ts`
- [x] Create `lib/drizzle/schema/cafes.ts`:
  - `cafe_status` enum: `active`, `inactive`
  - `cafes` table: id (uuid PK, `gen_random_uuid()`), name (text not null), slug (text not null unique), area (text not null), description (text), cover_image (text), phone (text), instagram_handle (text), google_maps_url (text), address (text), opening_hours (text), status (cafe_status, default `active`), created_at (timestamp with tz, default now), updated_at (timestamp with tz, default now)
  - Indexes: `cafes_slug_idx` (unique), `cafes_area_idx`, `cafes_status_idx`
- [x] Create `lib/drizzle/schema/cafe-images.ts`:
  - `cafe_images` table: id (uuid PK), cafe_id (uuid FK → cafes.id, cascade delete, not null), image_url (text not null), alt_text (text), sort_order (integer default 0), created_at (timestamp with tz, default now)
  - Index: `cafe_images_cafe_id_idx`
- [x] Create `lib/drizzle/schema/menu-items.ts`:
  - `menu_items` table: id (uuid PK), cafe_id (uuid FK → cafes.id, cascade delete, not null), category (text not null), name (text not null), price (integer not null), description (text), is_available (boolean default true), sort_order (integer default 0), created_at (timestamp with tz, default now)
  - Index: `menu_items_cafe_id_idx`
- [x] Create `lib/drizzle/schema/events.ts`:
  - `event_type` enum: `live_music`, `open_mic`, `workshop`, `comedy_night`, `gaming`
  - `event_status` enum: `upcoming`, `cancelled`, `completed`
  - `events` table: id (uuid PK), cafe_id (uuid FK → cafes.id, cascade delete, not null), title (text not null), slug (text not null unique), description (text), event_type (event_type not null), start_time (timestamp with tz not null), end_time (timestamp with tz), ticket_price (integer, nullable -- null means free), cover_image (text), status (event_status, default `upcoming`), created_at (timestamp with tz, default now), updated_at (timestamp with tz, default now)
  - Indexes: `events_slug_idx` (unique), `events_cafe_id_idx`, `events_event_type_idx`, `events_start_time_idx`, `events_status_idx`
- [x] Create `lib/drizzle/schema/cafe-leads.ts`:
  - `lead_status` enum: `new`, `contacted`, `converted`, `closed`
  - `cafe_leads` table: id (uuid PK), owner_name (text not null), cafe_name (text not null), phone (text not null), area (text not null), status (lead_status, default `new`), notes (text), created_at (timestamp with tz, default now)
  - Indexes: `cafe_leads_status_idx`, `cafe_leads_created_at_idx`
- [x] Update `lib/drizzle/schema/index.ts` to export all 5 new table schemas and 4 enums
- [x] Run `npm run db:generate` to create migration
- [x] Run `npm run db:migrate` to apply migration to Supabase

### 1A.6 Supabase Storage Setup

[Goal: Create the image storage bucket so placeholder and development images are loadable from Supabase during Phases 2-3]

- [x] Create public bucket in Supabase Storage via dashboard (bucket name: `images`)
- [x] Configure bucket public access policy (allow public reads, no RLS required for public bucket)
- [x] Upload a set of placeholder images for development: 4 cafe cover photos, 12-16 gallery photos (3-4 per cafe), 6 event cover images
- [x] Note the public URL pattern (e.g., `https://<project-ref>.supabase.co/storage/v1/object/public/images/...`) for use in seed data

### 1A.7 Seed Data

[Goal: Populate the database with fictional sample data using Supabase Storage image URLs so pages render with realistic content during development]

- [x] Create seed script at `lib/drizzle/seed.ts` (or update existing):
  - 4 fictional cafes across areas: "The Roast" (Banjara Hills), "Cafe Blend" (Jubilee Hills), "Clay & Coffee" (Kondapur), "Filter House" (Gachibowli)
  - Cover images pointing to Supabase Storage URLs uploaded in 1A.6
  - 3-5 cafe_images per cafe with Supabase Storage URLs
  - 5-8 menu_items per cafe across categories: Coffee (3-4 items, ₹149-₹299), Food (2-3 items, ₹249-₹449), Desserts (2 items, ₹199-₹349)
  - 6 upcoming events across types: 2 live_music, 1 open_mic, 1 workshop, 1 comedy_night, 1 gaming -- with start_times set to future dates, ticket_prices ranging from null (free) to ₹499, cover images from Supabase Storage
  - 2 sample cafe_leads entries (status: new, contacted)
- [x] Run `npm run db:seed` to populate database

---

## Phase 1B: Query Layer & Shared Layout

**Goal:** Build the data access layer and the visual shell (navigation + footer) that every page uses. After this phase, the app has a fully styled GoOut Hyd shell with working navigation and all database queries ready for feature pages.

### 1B.1 Area Slug Mapping

[Goal: Create a bidirectional mapping between URL-friendly slugs and display names for area filtering, used by filter pills, query functions, and page metadata]

- [x] Create `lib/constants/areas.ts`:
  - `AREAS` constant: array of `{ slug: string, name: string }` objects:
    - `{ slug: "banjara-hills", name: "Banjara Hills" }`
    - `{ slug: "jubilee-hills", name: "Jubilee Hills" }`
    - `{ slug: "kondapur", name: "Kondapur" }`
    - `{ slug: "gachibowli", name: "Gachibowli" }`
    - `{ slug: "madhapur", name: "Madhapur" }`
  - `getAreaNameFromSlug(slug: string): string | undefined` -- converts URL slug to display name
  - `getAreaSlugFromName(name: string): string` -- converts display name to URL slug
  - `AREA_SLUGS` -- array of all valid slugs (for validation)
  - `AREA_NAMES` -- array of all display names (for dropdowns and filtering)

### 1B.2 Query Layer

[Goal: Create reusable database query functions that all page components will call for data fetching via Drizzle ORM. Area data comes from `lib/constants/areas.ts` (not the database), so no areas query file is needed.]

- [x] Create `lib/queries/cafes.ts`:
  - `getAllCafes(areaSlug?: string)`: fetch active cafes, optionally filtered by area (convert slug to display name via `getAreaNameFromSlug` before querying), ordered by created_at desc
  - `getCafeBySlug(slug: string)`: fetch single cafe by slug with related cafe_images (ordered by sort_order), menu_items (available only, ordered by category then sort_order), and upcoming events (future only, ordered by start_time)
  - `getFeaturedCafes(limit = 6)`: fetch active cafes for landing page, ordered by created_at desc
- [x] Create `lib/queries/events.ts`:
  - `getUpcomingEvents(category?: string)`: fetch future events with cafe name/slug/area joined, optionally filtered by event_type, ordered by start_time asc
  - `getEventBySlug(slug: string)`: fetch single event by slug with full cafe data joined
  - `getEventsByCafe(cafeId: string)`: fetch upcoming events for a specific cafe
  - `getUpcomingEventsForLanding(limit = 4)`: fetch next N upcoming events with cafe info for landing page
- [x] **Do NOT create `lib/queries/areas.ts`** -- area data is served entirely by `lib/constants/areas.ts` (the single source of truth). All components (AreaFilterPills, BrowseByArea, PartnerForm dropdown, generateMetadata) import from constants, not from database queries

### 1B.3 Shared Layout Components

[Goal: Build the navigation bar and footer that wrap every page, establishing the GoOut Hyd visual shell]

- [x] Install any missing shadcn components: `npx shadcn@latest add sheet` (for mobile nav slide-out), `npx shadcn@latest add button` (if not already installed)
- [x] Create `components/layout/Navbar.tsx`:
  - Desktop: GoOut Hyd wordmark (DM Serif Display, cream text, links to `/`) aligned left. Nav links aligned right: Cafes (`/cafes`), Events (`/events`), About (`/about`). "List Your Cafe" as caramel CTA button linking to `/partner`
  - Mobile: GoOut Hyd wordmark left, hamburger menu icon (Menu from lucide-react) right. shadcn Sheet slide-out panel with all nav links + CTA
  - Espresso background across full width. Cream text, caramel on hover/active state
  - Active link indicator based on current pathname (use `usePathname()` in a client wrapper or pass pathname from server)
- [x] Create `components/layout/Footer.tsx`:
  - Three-column layout (stacks vertically on mobile)
  - Left: GoOut Hyd wordmark + tagline "Discover Hyderabad's best independent cafes and events"
  - Center: Quick links -- Cafes, Events, List Your Cafe, About, Privacy, Terms
  - Right: Instagram icon placeholder link + "Made with love in Hyderabad"
  - Espresso background, cream/foam text
- [x] Create or update `app/(public)/layout.tsx`:
  - Wrap all public pages: `<Navbar />` + `<main>{children}</main>` + `<Footer />`
  - Cream background on main content area
- [x] Update `app/(public)/page.tsx` with a temporary placeholder heading ("GoOut Hyd -- Coming Soon") to confirm layout renders correctly

---

## Phase 2: Cafe Discovery

**Goal:** Build the complete cafe browsing experience. After this phase, customers can browse cafes by area, view full cafe profiles with photos, menu, contact info, and upcoming events. Wilson can share cafe profile URLs during pitches.

### 2.1 Cafe Listing Page

[Goal: Create the main cafe discovery page where customers browse all listed cafes with area-based filtering]

- [x] Create `app/(public)/cafes/page.tsx` as async Server Component:
  - Accept `searchParams` for area filtering (Next.js 15: `searchParams: Promise<{ area?: string }>`, must `await searchParams`)
  - Fetch cafes via `getAllCafes(areaSlug)` from `lib/queries/cafes.ts`
  - Use `getAreaNameFromSlug()` to convert URL slug to display name for heading
  - Display dynamic heading: "Cafes" when unfiltered, "Cafes in Banjara Hills" when filtered by area
- [x] Create `components/cafes/AreaFilterPills.tsx` (`"use client"`):
  - Import `AREAS` from `lib/constants/areas.ts` for pill labels and slugs
  - Pills: "All Areas" + each area from `AREAS` array
  - Active pill: caramel background + foam text. Inactive: transparent + border + roast text
  - Clicking a pill navigates to `/cafes?area={slug}` using `useRouter().push()` with `useSearchParams()` for reading current state. "All Areas" navigates to `/cafes`
  - Horizontal scrollable container on mobile with `overflow-x-auto`
- [x] Create `components/cafes/CafeCard.tsx`:
  - Cover image via Next.js `Image` component (aspect-ratio 16:9, rounded-t-xl)
  - Cafe name in DM Sans 500 weight
  - Area tag badge (transparent bg, border, roast text, rounded-full, small text)
  - Short description (2-line clamp via `line-clamp-2`)
  - Entire card wrapped in Next.js `Link` to `/cafes/[slug]`
  - Foam background, warm border, rounded-xl, hover shadow transition
- [x] Build responsive card grid in listing page: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- [x] Create `components/cafes/CafeEmptyState.tsx`:
  - Message: "No cafes in [Area] yet -- check back soon!"
  - "Browse All Areas" button (shadcn Button, secondary variant) linking to `/cafes`
- [x] Add `generateMetadata` function to cafes page:
  - Title: "Cafes | GoOut Hyd" or "Cafes in [Area Display Name] | GoOut Hyd" when filtered
  - Description: "Browse independent cafes in Hyderabad" or area-specific description
  - OG tags with app URL

### 2.2 Cafe Profile Page

[Goal: Build the full cafe profile -- each cafe's digital home and the URL Wilson shares with owners during pitches as proof of work]

- [x] Create `app/(public)/cafes/[slug]/page.tsx` as async Server Component:
  - Await `params` for slug (Next.js 15: `params: Promise<{ slug: string }>`)
  - Fetch cafe with all related data via `getCafeBySlug(slug)`
  - Return `notFound()` if no cafe matches slug
- [x] Build cover photo hero section:
  - Full-width Next.js `Image` with gradient overlay (`bg-gradient-to-t from-espresso/80 to-transparent`)
  - Cafe name overlaid in DM Serif Display (cream text, large)
  - Area tag badge positioned below name
- [x] Create `components/cafes/QuickContactBar.tsx`:
  - Foam card with prominent styling, always visible below cover
  - Phone: lucide-react `Phone` icon + number rendered as `<a href="tel:+91...">` for mobile tap-to-call
  - Maps: lucide-react `MapPin` icon + "Directions" as `<a href={google_maps_url} target="_blank" rel="noopener noreferrer">`
  - Instagram: lucide-react `Instagram` icon + @handle as external link (new tab)
  - Full address text displayed below icons
- [x] Build About section: cafe description paragraphs on cream background, DM Sans body text
- [x] Create `components/cafes/PhotoGallery.tsx`:
  - Grid layout: `grid grid-cols-2 md:grid-cols-3 gap-3`
  - Each image via Next.js `Image` with alt text, rounded-lg, aspect-square with `object-cover`
  - Each image clickable (onClick opens lightbox at that index)
- [x] Create `components/cafes/PhotoLightbox.tsx` (`"use client"`):
  - Install shadcn Dialog if not present: `npx shadcn@latest add dialog`
  - Full-screen Dialog overlay with dark backdrop
  - Large image display centered
  - Left/right navigation via lucide-react `ChevronLeft`/`ChevronRight` icons
  - Touch swipe support via pointer events (`onPointerDown`, `onPointerMove`, `onPointerUp` tracking swipe direction)
  - Close on backdrop click, Escape key, or X button
  - Image index indicator (e.g., "3 / 8")
- [x] Create `components/cafes/MenuHighlights.tsx`:
  - Section heading: "Menu Highlights" (DM Serif Display)
  - Group items by category with category subheading (DM Sans 500, uppercase tracking)
  - Each item row: name (left-aligned), price formatted as `₹{price}` (right-aligned), optional description below name (roast text, small)
  - Only render items where `is_available = true`
  - Items ordered by `sort_order` within each category
- [x] Create `components/cafes/CafeUpcomingEvents.tsx`:
  - Section heading: "Upcoming Events at This Cafe" (DM Serif Display)
  - Horizontal list of compact event cards: event name, date (formatted short: "Mar 28"), event type badge, ticket price ("₹299" or "Free Entry")
  - Each card links to `/events/[slug]`
  - Empty state: "No upcoming events -- follow us on Instagram for updates" with subtle styling
- [x] Add `generateMetadata` function:
  - Title: "[Cafe Name] -- [Area] | GoOut Hyd"
  - Description: first 160 chars of cafe description
  - `openGraph.images`: cafe's cover_image URL

---

## Phase 3: Event Discovery

**Goal:** Build the complete event browsing experience. After this phase, customers can discover upcoming events by category, view full event details with venue info, and share event URLs.

### 3.1 Events Listing Page

[Goal: Create the event discovery page where customers find upcoming events across Hyderabad, filtered by category]

- [x] Create `app/(public)/events/page.tsx` as async Server Component:
  - Accept `searchParams` for category filtering (await searchParams)
  - Fetch events via `getUpcomingEvents(category)` -- future events only, chronological order
  - Display heading: "Events" or "Live Music Events" when filtered by category
- [x] Create `components/events/CategoryFilterCards.tsx` (`"use client"`):
  - Category cards with lucide-react icons:
    - All (LayoutGrid icon)
    - Live Music (Guitar icon)
    - Open Mic (Mic icon)
    - Workshop (Palette icon)
    - Comedy Night (Laugh icon)
    - Gaming (Gamepad2 icon)
  - Active category: caramel background + foam text. Inactive: foam background + espresso text + border
  - Clicking updates URL to `/events?category=live_music` via `useRouter().push()`. "All" navigates to `/events`
  - Horizontal scrollable on mobile
- [x] Create `components/events/EventCard.tsx`:
  - Cover image via Next.js `Image` (aspect-ratio 16:9, rounded-t-xl)
  - Date badge overlay on image (formatted: "SAT, MAR 28", small foam text on espresso/80 bg, rounded-md)
  - Event name (DM Sans 500)
  - "@ [Cafe Name]" + area on separate line (roast text, small)
  - Event type badge (caramel bg, foam text, rounded-full, small)
  - Ticket price: "₹299" or "Free Entry" (DM Sans 500)
  - Entire card wrapped in Next.js `Link` to `/events/[slug]`
  - Foam background, border, rounded-xl, hover shadow transition
- [x] Build responsive event card grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- [x] Create `components/events/EventEmptyState.tsx`:
  - "No upcoming [Category] events right now -- check back soon!"
  - "Browse All Events" button linking to `/events`
- [x] Add `generateMetadata`:
  - Title: "Events | GoOut Hyd" or "[Category] Events | GoOut Hyd"
  - Description: "Discover upcoming events at Hyderabad's best independent cafes"

### 3.2 Event Detail Page

[Goal: Build the full event detail page with shareable URLs that Wilson can send to customers or post on social media]

- [x] Create `app/(public)/events/[slug]/page.tsx` as async Server Component:
  - Await `params` for slug, fetch event with cafe data via `getEventBySlug(slug)`
  - Return `notFound()` if no event matches slug
- [x] Build cover image hero section:
  - Full-width cover image with gradient overlay
  - Event name in DM Serif Display (cream text)
  - Event type badge positioned below name
- [x] Create `components/events/EventInfoCard.tsx`:
  - Foam card with structured info:
  - Date/time: lucide-react `Calendar` icon + formatted "Saturday, March 28, 2026 at 7:00 PM"
  - Venue: lucide-react `MapPin` icon + cafe name (as `Link` to `/cafes/[cafe-slug]`) + ", " + area
  - Event type: lucide-react `Music` (or category-appropriate) icon + event type label
  - Ticket: lucide-react `Ticket` icon + "₹299" or "Free Entry"
- [x] Build event description section: full description on cream background, DM Sans body text
- [x] Create `components/events/VenueSection.tsx`:
  - Milk background section
  - Section heading: "Venue" (DM Serif Display)
  - Mini cafe card: cover image thumbnail (small, rounded-lg), cafe name, area
  - Contact row: phone (tel: link), Google Maps (external link), Instagram (external link) -- using lucide-react icons
  - "View Full Cafe Profile →" link to `/cafes/[cafe-slug]`
- [x] Add `generateMetadata`:
  - Title: "[Event Name] at [Cafe Name] | GoOut Hyd"
  - Description: event date + cafe name + area + first 120 chars of description
  - `openGraph.images`: event's cover_image URL

---

## Phase 4: Partner & Lead Capture

**Goal:** Build the partner lead capture system -- the most important conversion page in the app. After this phase, cafe owners can submit interest forms, Wilson receives email notifications with lead details, and lead data is saved to the database.

### 4.1 Partner Page Layout

[Goal: Build the pitch page that Wilson shares with potential cafe partners -- persuasive content above the form that sells the value before asking for info]

- [x] Create `app/(public)/partner/page.tsx`:
  - Hero section: espresso background, headline "Your Cafe Deserves to Be Discovered" (DM Serif Display, cream), subtitle "Join Hyderabad's only platform built for independent cafes" (foam)
  - Value proposition section (cream background): 4 cards in responsive grid with lucide-react icons:
    - `Search` icon: "Get Discovered" -- "Your cafe listed with photos, menu, and contact info where customers are looking"
    - `TrendingUp` icon: "Fill Empty Tables" -- "Reach thousands of experience-seeking customers in your area"
    - `Music` icon: "Host Events Effortlessly" -- "We bring the bands, manage the logistics, you just host"
    - `IndianRupee` icon: "Plans Starting at ₹999/month" -- "Affordable digital presence with no long-term contracts"
  - How It Works section (milk background): 3 numbered steps with icons:
    - Step 1: `FileText` icon -- "Fill the form below"
    - Step 2: `Phone` icon -- "We'll call you within 24 hours"
    - Step 3: `Rocket` icon -- "Your cafe goes live in days"
    - Steps connected with arrows/dividers

### 4.2 Partner Form & Validation

[Goal: Capture cafe owner leads with validation and spam prevention, save to database, and notify Wilson via email]

- [x] Install shadcn components if not present: `npx shadcn@latest add select input label`
- [x] Create `lib/validations/partner.ts`:
  - Import `AREA_NAMES` from `lib/constants/areas.ts`
  - Build allowed values: `[...AREA_NAMES, "Other"] as [string, ...string[]]`
  - Zod schema: `partnerFormSchema` with fields:
    - `owner_name`: `z.string().min(2).max(100)`
    - `cafe_name`: `z.string().min(2).max(100)`
    - `phone`: `z.string().regex(/^[+]?[0-9\s-]{10,15}$/)` (Indian phone numbers)
    - `area`: `z.enum(allowedAreas)` -- derived from `AREA_NAMES` + "Other" at runtime (single source of truth, no hardcoded strings)
    - `honeypot`: `z.string().max(0)` (must be empty)
- [x] Create `components/partner/PartnerForm.tsx` (`"use client"`):
  - Foam card container with heading "Get Started" (DM Serif Display)
  - Fields: Owner Name (Input), Cafe Name (Input), Phone Number (Input), Area/Location (Select with hardcoded options + "Other")
  - Hidden honeypot field: visually hidden (`className="sr-only"`), `aria-hidden="true"`, `tabIndex={-1}`
  - Submit button: "Request a Callback" (caramel bg, foam text, full-width, with loading spinner via `disabled` + lucide-react `Loader2` during submission)
  - Client-side field validation feedback before submission
  - On success: sonner toast "Thanks! Wilson will reach out within 24 hours" + form reset
  - On error: sonner toast with error message

### 4.3 Server Action & Email Integration

[Goal: Handle form submission server-side -- persist lead data first, then send notification email to Wilson]

- [x] Add Resend package: run `npm install resend` in `apps/web/`
- [x] Create `lib/email.ts`:
  - `sendLeadNotification(lead: { owner_name, cafe_name, phone, area, created_at })` function
  - Initialize Resend client with `env.RESEND_API_KEY`
  - Simple formatted HTML email body:
    - Subject: "New Cafe Lead: [cafe_name]"
    - Body: owner name, cafe name, phone number, area, submission timestamp
    - Supabase dashboard link to cafe_leads table
  - Send to Wilson's notification email (configured as constant or env var)
  - Return success/error result
- [x] Create `app/actions/leads.ts`:
  - `submitPartnerForm(formData: FormData)` Server Action with `"use server"`
  - Parse form data and validate with `partnerFormSchema`
  - Honeypot check: if honeypot field has content, return `{ success: true }` silently (don't alert bots)
  - Insert into `cafe_leads` table via Drizzle ORM
  - Call `sendLeadNotification()` wrapped in try/catch (lead data is saved regardless of email success)
  - Return `{ success: true }` or `{ success: false, error: "..." }`
- [x] Wire PartnerForm component to Server Action: import action, call on submit, handle response with toast
- [x] Add `generateMetadata` to partner page: title "List Your Cafe | GoOut Hyd", description "Join Hyderabad's only platform built for independent cafes"

---

## Phase 5: Landing Page & Content Pages

**Goal:** Build the landing page (the main entry point) and all remaining content pages. After this phase, all 8 GoOut Hyd pages are complete and functional.

### 5.1 Landing Page Implementation

[Goal: Build the composite landing page that showcases cafes, events, and the partner value prop in one scrollable experience]

- [x] Update `app/(public)/page.tsx` (replace temporary placeholder):
  - Async Server Component fetching `getFeaturedCafes(6)` and `getUpcomingEventsForLanding(4)`
  - Compose all landing sections in order: Hero → Browse by Area → Featured Cafes → Upcoming Events → Partner CTA → Footer (via layout)
- [x] Create `components/landing/HeroSection.tsx`:
  - Espresso background, full-width container
  - Headline: "Your Weekend Starts Here" (DM Serif Display, cream, large -- 48px desktop / 32px mobile)
  - Subtitle: "Discover Hyderabad's best independent cafes, live music nights, open mics, and more" (DM Sans, foam)
  - Two CTAs side by side (stack on mobile):
    - "Explore Cafes" -- primary button (caramel bg, foam text) → `/cafes`
    - "Browse Events" -- secondary button (transparent, caramel border, caramel text) → `/events`
- [x] Create `components/landing/BrowseByArea.tsx`:
  - Cream background section
  - Heading: "Find Your Spot" (DM Serif Display)
  - Import `AREAS` from `lib/constants/areas.ts`
  - Clickable area pills: each renders area name, links to `/cafes?area={slug}`
  - Pill styling: rounded-full, border, hover:caramel bg transition
  - Flex wrap layout centered
- [x] Create `components/landing/FeaturedCafes.tsx`:
  - Milk background section
  - Heading: "Cafes Worth the Drive" (DM Serif Display)
  - Reuse `CafeCard` component from Phase 2 in responsive grid
  - Props: receives cafes array from parent Server Component
  - "See All Cafes →" link at bottom (caramel text, right-aligned) linking to `/cafes`
- [x] Create `components/landing/UpcomingEventsSection.tsx`:
  - Cream background section
  - Heading: "What's Happening This Week" (DM Serif Display)
  - Reuse `EventCard` component from Phase 3 in responsive grid
  - Props: receives events array from parent Server Component
  - "See All Events →" link at bottom (caramel text, right-aligned) linking to `/events`
- [x] Create `components/landing/PartnerCTABanner.tsx`:
  - Espresso background, full-width container
  - Headline: "Own a Cafe? Let Hyderabad Find You" (DM Serif Display, cream)
  - Subtitle: "Plans starting at ₹999/month" (DM Sans, foam)
  - CTA button: "List Your Cafe" (caramel bg, foam text) → `/partner`
  - Centered layout with vertical padding
- [x] Add `generateMetadata` to landing page:
  - Title: "GoOut Hyd -- Discover Hyderabad's Best Cafes & Events"
  - Description: "Your weekend starts here. Browse independent cafes, discover live music nights, open mics, workshops, and more across Hyderabad."
  - OG tags with app URL

### 5.2 About Page

[Goal: Build the credibility page that cafe owners review when evaluating whether to partner with GoOut Hyd]

- [x] Create `app/(public)/about/page.tsx`:
  - Hero section: espresso background, "Built in Hyderabad, for Hyderabad" (DM Serif Display, cream)
  - Story section (cream background): 2-3 placeholder paragraphs about Wilson's event management background, his cafe relationships, the problem independent cafes face, and how GoOut Hyd solves it
  - Mission statement (milk background, centered): "We believe Hyderabad's best experiences happen at independent cafes, not chains. GoOut Hyd exists to make sure you never miss them." (DM Serif Display, italic or styled quote)
  - CTA section (cream background): "Want to partner with us?" heading + "List Your Cafe" caramel button linking to `/partner` + Instagram icon placeholder link
- [x] Add `generateMetadata`: title "About | GoOut Hyd", description "The story behind Hyderabad's cafe discovery platform"

### 5.3 Privacy & Terms Pages

[Goal: Adapt existing template legal pages for GoOut Hyd's data collection practices]

- [x] Update `app/(public)/privacy/page.tsx`:
  - Replace all RAG/template-specific content with GoOut Hyd context
  - Sections: Information We Collect (partner form: name, cafe name, phone, area), How We Use Your Information (lead follow-up, platform listing), Cookies & Analytics (Vercel Analytics), Data Retention, Contact Information
  - Update company name to "GoOut Hyd", domain to "goouthyd.com"
  - Update "Last updated" date
- [x] Update `app/(public)/terms/page.tsx`:
  - Replace RAG-specific content with GoOut Hyd context
  - Sections: Acceptance of Terms, Platform Usage, Cafe Listings, Event Information (display only, no ticketing), Intellectual Property, Limitation of Liability, Contact
  - Update company name and app references
- [x] Add `generateMetadata` to both pages: "Privacy Policy | GoOut Hyd", "Terms of Service | GoOut Hyd"

---

## Phase 6: SEO & Documentation

**Goal:** Add site-wide SEO infrastructure, a custom 404 page, and update project documentation. This is a focused close-out phase (~30 minutes) that ensures the app is crawlable and the project is documented for future work.

### 6.1 SEO Infrastructure

[Goal: Make the site discoverable by search engines with a proper sitemap, robots config, and branded 404 page]

- [x] Create `app/robots.ts`: export default robots config allowing all crawlers, pointing to sitemap URL
- [x] Create `app/sitemap.ts`: generate dynamic sitemap with:
  - Static routes: `/`, `/cafes`, `/events`, `/partner`, `/about`, `/privacy`, `/terms`
  - Dynamic routes: all active cafe slugs via `getAllCafes()`, all upcoming event slugs via `getUpcomingEvents()`
  - Set appropriate `changeFrequency` and `priority` per route type (landing = daily/1.0, cafe profiles = weekly/0.8, events = daily/0.9, static = monthly/0.3)
- [x] Create `app/not-found.tsx`: custom 404 page with GoOut Hyd branding:
  - Cream background, centered content
  - "Page not found" heading (DM Serif Display)
  - Friendly message + links to Cafes and Events pages
  - Consistent nav + footer via root layout

### 6.2 Project Documentation

[Goal: Rewrite project setup docs so a future developer (or AI agent) can understand and run the GoOut Hyd codebase]

- [x] Rewrite `SETUP.md` for GoOut Hyd:
  - Prerequisites: Node.js, npm, Supabase project, Resend account
  - Environment variables: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`
  - Database setup: `npm run db:migrate`, `npm run db:seed`
  - Local development: `npm run dev` (starts on localhost:3000)
  - Resend configuration: account setup, domain verification, Wilson's email
  - Supabase Storage: bucket creation, public access config, image upload workflow
  - Deployment: Vercel connected to repo, custom domain setup
  - Available scripts: `db:generate`, `db:migrate`, `db:rollback`, `db:seed`, `db:studio`

---

---

## Phase 7: Launch Preparation

**Goal:** Configure production infrastructure and deploy GoOut Hyd live at goouthyd.com with real cafe data.

### 7.1 Domain & Hosting
- [ ] Purchase `goouthyd.com` domain
- [ ] Add custom domain in Vercel project settings
- [ ] Configure DNS records (CNAME or A records as specified by Vercel)
- [ ] Update `NEXT_PUBLIC_APP_URL` environment variable in Vercel to `https://goouthyd.com`

### 7.2 Production Data
- [ ] Upload production images to Supabase Storage `images` bucket
- [ ] Enter real cafe information directly via Supabase dashboard
- [ ] Add menu_items and events with real data

### 7.3 Email & Analytics Configuration
- [ ] Create Resend production account and verify domain
- [ ] Configure Wilson's notification email address
- [ ] Enable Vercel Analytics and Speed Insights

### 7.4 Production Deploy & Favicon
- [ ] Generate and integrate favicon set
- [ ] Run `npm run lint` and `npm run type-check`
- [ ] Deploy to production via git push to main

---

## Phase 8: Operations & Payments (Post-MVP)

**Goal:** Implement administrative tools, payment processing, and production-ready operational features.

### 8.1 Admin Dashboard
- [x] Create localhost-only admin layout and middleware protection (Task 014)
- [x] Implement CRUD for Cafes and Events (Task 014)
- [x] Add Admin Password Auth for remote management (Task 019)

### 8.2 Payment & Ticketing (Razorpay)
- [x] Integrate Razorpay checkout for event tickets (Task 011)
- [x] Generate and email QR codes for tickets (Task 011)
- [x] Implement ticket verification page for organizers (Task 013)
- [x] Add convenience fees and order summaries (Task 017)

### 8.3 Operational Polish
- [x] Add on-demand cache revalidation for production (Task 016)
- [x] Implement "no GST" checkout logic and legal updates (Task 018)
- [x] Add organizer contact fields to events (Task 015)
- [x] Standardize color tokens across the UI (Task 009)
