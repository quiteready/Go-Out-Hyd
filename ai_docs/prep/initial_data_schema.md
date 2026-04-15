## Strategic Database Planning Document

### App Summary

**App Name:** GoOut Hyd
**Domain:** goouthyd.in
**Template Used:** rag-simple (repurposed -- all RAG code being stripped)
**Core Features:** Cafe discovery by area, cafe profiles with photos/menu/contact, event discovery by category, event detail pages, partner lead capture form

---

## Current Database State

### Existing Tables (rag-simple Template)

The current schema has 6 tables, all RAG-specific:

- **`users`** -- Auth user profiles (email, full_name, role). References Supabase auth.users.
- **`documents`** -- Uploaded files with GCS paths and processing status
- **`document_chunks`** -- Vector embeddings for text/multimodal search (768/1408 dimensions)
- **`conversations`** -- Chat conversation threads per user
- **`messages`** -- Chat messages with attachments and sender role
- **`document_processing_jobs`** -- Background job tracking for document processing pipeline

### Existing Enums

- `document_status` (uploading, processing, completed, error)
- `file_category` (documents, images, videos, audio)
- `message_sender` (user, assistant)
- `message_status` (success, error)
- `document_processing_job_status` (pending, processing, processed, error, retry_pending, cancelled, partially_processed)

### Template Assessment

**0% fit.** None of these tables serve a cafe discovery platform. The entire schema is built for document upload, vector embedding, and AI chat -- features being completely removed from GoOut Hyd.

**Action:** Remove all 6 existing tables and all 5 existing enums. Create 5 new tables and 4 new enums from scratch.

---

## New Schema: GoOut Hyd Phase 1

### Tables to Create

#### 1. `cafes` -- Cafe Profiles

The core table. Every cafe listed on the platform.

- `id` -- uuid, PK, auto-generated
- `name` -- text, not null (cafe display name)
- `slug` -- text, not null, unique (URL-friendly: "cafe-blend")
- `area` -- text, not null (free text: "Banjara Hills", "Kondapur", etc.)
- `description` -- text (2-3 paragraphs about the cafe, written by Wilson)
- `cover_image` -- text (Supabase Storage URL for the main hero image)
- `phone` -- text (Indian mobile: "+91 98765 43210")
- `instagram_handle` -- text (without @: "cafeblend")
- `google_maps_url` -- text (full Google Maps directions URL)
- `address` -- text (full street address)
- `opening_hours` -- text (free text: "10 AM - 11 PM, Closed Mondays")
- `status` -- enum cafe_status, default "active"
- `created_at` -- timestamp with tz, default now
- `updated_at` -- timestamp with tz, default now

**Indexes:**
- `cafes_slug_idx` on slug (unique constraint handles this)
- `cafes_area_idx` on area (area filtering on /cafes page)
- `cafes_status_idx` on status (active/inactive filtering)

**Enum `cafe_status`:** active, inactive

---

#### 2. `cafe_images` -- Photo Gallery

Multiple photos per cafe. Wilson uploads via Supabase Storage, URLs stored here.

- `id` -- uuid, PK, auto-generated
- `cafe_id` -- uuid, FK to cafes.id, not null, cascade delete
- `image_url` -- text, not null (Supabase Storage URL)
- `alt_text` -- text (accessibility description)
- `sort_order` -- integer, default 0 (controls display order in gallery)
- `created_at` -- timestamp with tz, default now

**Indexes:**
- `cafe_images_cafe_id_idx` on cafe_id (fetch all images for a cafe)

---

#### 3. `menu_items` -- Menu Highlights

Signature items per cafe. Not a full menu -- just highlights Wilson curates.

- `id` -- uuid, PK, auto-generated
- `cafe_id` -- uuid, FK to cafes.id, not null, cascade delete
- `category` -- text, not null (free text: "Coffee", "Food", "Desserts", "Drinks")
- `name` -- text, not null (item name: "Cappuccino", "Truffle Mushroom Toast")
- `price` -- integer, not null (whole rupees: 299 = ₹299)
- `description` -- text (optional one-line description)
- `is_available` -- boolean, default true (Wilson can hide items without deleting)
- `sort_order` -- integer, default 0 (display order within category)
- `created_at` -- timestamp with tz, default now

**Indexes:**
- `menu_items_cafe_id_idx` on cafe_id (fetch all menu items for a cafe)

**Price storage:** Integer in whole rupees (not paise). Phase 1 is display-only with no payment processing. Wilson enters "299" in Supabase, not "29900". If Phase 2 adds Razorpay, the rupees-to-paise conversion happens in the payment service layer.

---

#### 4. `events` -- Events Tied to Cafes

Every event happens at a specific cafe. Wilson creates events via Supabase dashboard.

- `id` -- uuid, PK, auto-generated
- `cafe_id` -- uuid, FK to cafes.id, not null, cascade delete
- `title` -- text, not null (event name: "Jazz Night Under the Stars")
- `slug` -- text, not null, unique (URL-friendly: "jazz-night-under-the-stars")
- `description` -- text (full event description)
- `event_type` -- enum event_type, not null
- `start_time` -- timestamp with tz, not null (date + time of event start)
- `end_time` -- timestamp with tz (nullable -- some events have no fixed end)
- `ticket_price` -- integer (whole rupees, nullable -- null means free entry)
- `cover_image` -- text (Supabase Storage URL)
- `status` -- enum event_status, default "upcoming"
- `created_at` -- timestamp with tz, default now
- `updated_at` -- timestamp with tz, default now

**Indexes:**
- `events_slug_idx` on slug (unique constraint handles this)
- `events_cafe_id_idx` on cafe_id (fetch events for a specific cafe)
- `events_event_type_idx` on event_type (category filtering on /events page)
- `events_start_time_idx` on start_time (chronological sorting, filtering past events)
- `events_status_idx` on status (filter by upcoming/cancelled/completed)

**Enum `event_type`:** live_music, open_mic, workshop, comedy_night, gaming

**Enum `event_status`:** upcoming, cancelled, completed

---

#### 5. `cafe_leads` -- Partner Form Submissions

Every time a cafe owner fills the form on /partner, a row lands here. Wilson tracks follow-ups.

- `id` -- uuid, PK, auto-generated
- `owner_name` -- text, not null
- `cafe_name` -- text, not null
- `phone` -- text, not null (Indian mobile number)
- `area` -- text, not null (from dropdown on partner form)
- `status` -- enum lead_status, default "new"
- `notes` -- text (Wilson's internal notes after calls -- optional)
- `created_at` -- timestamp with tz, default now

**Indexes:**
- `cafe_leads_status_idx` on status (pipeline filtering)
- `cafe_leads_created_at_idx` on created_at (sort by newest)

**Enum `lead_status`:** new, contacted, converted, closed

---

## Feature-to-Schema Mapping

### Landing Page (`/`)

- "Cafes Worth the Drive" section -> `SELECT * FROM cafes WHERE status = 'active' ORDER BY created_at DESC LIMIT 6`
- "What's Happening This Week" section -> `SELECT events.*, cafes.name, cafes.area FROM events JOIN cafes ON events.cafe_id = cafes.id WHERE events.start_time > NOW() AND events.status = 'upcoming' ORDER BY events.start_time ASC LIMIT 4`
- "Browse by Area" pills -> `SELECT DISTINCT area FROM cafes WHERE status = 'active' ORDER BY area`

### Cafe Listing (`/cafes`)

- All cafes -> `SELECT * FROM cafes WHERE status = 'active'`
- Filtered by area -> `WHERE area = 'Banjara Hills'`
- Card display uses: name, slug, area, cover_image, description (truncated)

### Cafe Profile (`/cafes/[slug]`)

- Cafe data -> `SELECT * FROM cafes WHERE slug = $1 AND status = 'active'`
- Photos -> `SELECT * FROM cafe_images WHERE cafe_id = $1 ORDER BY sort_order`
- Menu -> `SELECT * FROM menu_items WHERE cafe_id = $1 AND is_available = true ORDER BY category, sort_order`
- Events -> `SELECT * FROM events WHERE cafe_id = $1 AND start_time > NOW() AND status = 'upcoming' ORDER BY start_time`

### Events Listing (`/events`)

- All upcoming -> `SELECT events.*, cafes.name, cafes.slug, cafes.area FROM events JOIN cafes ON events.cafe_id = cafes.id WHERE events.start_time > NOW() AND events.status = 'upcoming' ORDER BY events.start_time`
- Filtered by category -> `WHERE event_type = 'live_music'`

### Event Detail (`/events/[slug]`)

- Event + cafe -> `SELECT events.*, cafes.* FROM events JOIN cafes ON events.cafe_id = cafes.id WHERE events.slug = $1`

### Partner Form (`/partner`)

- Submit -> `INSERT INTO cafe_leads (owner_name, cafe_name, phone, area) VALUES ($1, $2, $3, $4)`
- Email notification to Wilson triggered by server action after insert

---

## Tables to Remove

All existing RAG tables and enums must be removed:

**Tables:**
1. `users` -- Not needed in Phase 1 (no auth)
2. `documents` -- RAG document uploads
3. `document_chunks` -- RAG vector embeddings
4. `conversations` -- RAG chat threads
5. `messages` -- RAG chat messages
6. `document_processing_jobs` -- RAG processing pipeline

**Enums:**
1. `document_status`
2. `file_category`
3. `message_sender`
4. `message_status`
5. `document_processing_job_status`

**Migration strategy:** Create a single migration that drops all old tables/enums and creates all new tables/enums. This is a clean break, not an incremental change.

---

## Schema Summary

| Table | Rows (estimated at launch) | Primary queries |
|---|---|---|
| cafes | 10-50 | By slug, by area, all active |
| cafe_images | 50-300 | By cafe_id |
| menu_items | 100-500 | By cafe_id, available only |
| events | 20-100 | By slug, by cafe_id, by event_type, upcoming only |
| cafe_leads | 10-100 | By status, by created_at |

Total: 5 tables, 4 enums. No joins required for most pages except events (which join cafes for venue info).

---

## Implementation Priority

### Phase 1 (MVP -- build now)

1. Remove all RAG tables and enums
2. Create all 5 new tables with enums and indexes
3. Seed with 3-5 sample cafes for development and Wilson's demo pitches

### Phase 2 (when auth activates)

- Add `users` table (redesigned for GoOut Hyd roles: customer, cafe_owner, admin)
- Add `favorites` table (customer saves cafes)
- Add `reviews` or `ratings` table (if customer reviews are added)
- Extend `cafes` table with `owner_id` FK to users (self-serve dashboard)

### Phase 2 (when ticketing activates)

- Add `tickets` table (Razorpay integration, QR codes)
- Add `payments` table (transaction records)
- Convert `ticket_price` from display-only integer to payment-ready amount (consider paise at that point)

---

## Strategic Advantage

The rag-simple template provides zero schema reuse, but the infrastructure around it is valuable:

- **Drizzle ORM setup** -- drizzle.config.ts, db.ts connection, migration scripts all stay ✅
- **Supabase connection** -- DATABASE_URL, admin client, server client all stay ✅
- **Migration workflow** -- npm run db:generate/migrate/rollback all stay ✅
- **Type inference** -- drizzle-zod for Zod schemas from tables stays ✅

The schema is a complete replacement, but the tooling that manages it is battle-tested and ready.

**Next Steps:**
1. Delete all existing schema files in `lib/drizzle/schema/`
2. Create new schema files: `cafes.ts`, `cafe_images.ts`, `menu_items.ts`, `events.ts`, `cafe_leads.ts`
3. Update `index.ts` to export new schemas
4. Run `npm run db:generate` to create migration
5. Run `npm run db:migrate` to apply
6. Seed sample data for development

> **Development Approach:** Build one page at a time. Start with cafes (schema + seed + listing + profile), then events, then partner form. Each page has a clear schema dependency and can be developed and tested independently.
