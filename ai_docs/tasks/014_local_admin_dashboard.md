# Task 014 — Local Admin Dashboard (`/admin/*`)

**Status:** 📝 Drafted — awaiting approval
**Created:** 2026-04-19
**Depends on:** Task 011 (Razorpay integration), Task 012 (Razorpay go-live), Task 013 (QR verify page)

> **⚠️ CONTEXT NOTE FOR IMPLEMENTING AGENT:** This task was scoped in a previous chat but will be **implemented in a new conversation with no prior context**. Read this entire document carefully before starting — every decision is captured here and there will be no opportunity to ask clarifying questions of the original requester mid-implementation. When in doubt, default to the **MVP-simplest** option that ships safely on `localhost`.

---

## 1. Task Overview

### Task Title
**Title:** Build a local-only admin dashboard at `/admin/*` so the developer (Daniel) can manage cafes, events, menu items, cafe images, partner leads, and view ticket bookings without touching the Supabase dashboard. First real-world use: create the **Srea Natural "Little Soap Makers" workshop event** through the dashboard.

### Goal Statement
**Goal:** GoOut Hyd's first real client (Srea Natural — a soap-making workshop on 23 Apr 2026) needs to be live on the site within 24–48 hours. Currently, adding a new venue + event requires manually inserting rows into Supabase (UUIDs, slugs, timestamps in IST→UTC conversion, image URLs typed by hand), which is slow and error-prone. We are building a local-only admin dashboard at `/admin/*` — protected by **strict-localhost middleware** (no password, no auth — Daniel only runs this on his own laptop) — that lets him CRUD cafes, events, menu items, and cafe images via proper forms with image upload, IST datetime pickers, and validation. The dashboard also surfaces the partner-form leads and the ticket bookings (with CSV export) that are now flowing in from real Razorpay payments. After this ships, creating a new event becomes a 2-minute task instead of a 30-minute SQL exercise.

---

## 2. Strategic Analysis & Solution Options

### Decisions Already Made (do not re-evaluate)

These were locked in during the scoping conversation. The implementing agent should not present alternatives:

| Decision | Choice | Reason |
|---|---|---|
| Auth model | **Strict localhost-only middleware, no password** | Daniel runs it on his own laptop only; nobody else touches it |
| Schema for non-cafe venues | **Make `events.cafe_id` nullable + add denormalized `venue_name`/`venue_address`/`venue_maps_url` to `events`** | Srea Natural is a residential studio, not a cafe |
| Time slots per event | **Two separate event records** | Cleaner ticket inventory per slot than overloading one event |
| Early-bird pricing | **Add `early_bird_price` + `early_bird_ends_at` columns to `events`** | Reusable across future events |
| Image upload backend | **Supabase Storage (existing stack)** | No new service, free, already integrated |
| Mobile vs desktop images | **One image, 16:9, 1600×900** | `next/image` with `object-cover` handles responsive cropping |
| Portrait flyer / poster | **Skip for now** — Daniel will request a landscape version from the client | No `poster_image` column |
| Event gallery | **Skip entirely** | Out of scope for this task |
| Menu items management UI | **Inline section on the cafe edit page** | Fewer clicks |
| Cafe images management UI | **Inline section on the cafe edit page** | Same reason |
| Image gallery reordering | **Up/down arrow buttons** | Zero new deps |
| Confirmation prompts | **shadcn `AlertDialog`** | Already in the stack via Radix |
| Tickets surfaces | **BOTH** a global `/admin/tickets` page AND a "Bookings" tab on the event edit page | Same query, two views |
| CSV export columns | Booking Date, Customer Name, Email, Phone, Quantity, Amount Paid, Ticket Code, Status, Event Title, Event Date | — |
| Cancel event | Implement: sets `event.status = 'cancelled'` | One-click |
| **Refund tickets** | **STUB ONLY** — render a disabled "Refund tickets" button with a tooltip saying "Coming soon (Phase 2)". **DO NOT call Razorpay refund API.** | Refund logic is complicated (partial failures, webhooks, fee handling, idempotency) and intentionally deferred |
| Cafe leads UI | Read-only list page | Wilson can update status later if needed |
| Dashboard nav theme | Distinct neutral look (grays/whites) — visually separate from public site | So Daniel never confuses admin with public |
| Overview/home page | Simple counts widget (cafes, events, tickets sold this week, new leads) | Quick glance |

### Refund Status — Pending (explicit)

> **🛑 Refund implementation is intentionally deferred to a future task.** The dashboard MUST render a `Refund all tickets` button on the cancel-event flow and per-row `Refund` buttons in the tickets list, but they MUST be **disabled** with a tooltip explaining that refunds are not yet implemented. **Do not write any Razorpay refund code in this task.** A separate follow-up task will own that. This is documented here so the implementing agent does not get tempted to "just wire it up."

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Framework:** Next.js 15.5.4 (App Router, Turbopack), React 19, TypeScript 5 strict mode
- **DB/ORM:** Supabase Postgres via Drizzle ORM 0.44.6 + drizzle-zod 0.8.2
- **Styling:** Tailwind CSS 3.4.1 + shadcn/ui (Radix + CVA) + tailwindcss-animate
- **Images:** Supabase Storage (NEW for this task — buckets need to be created)
- **Env:** `@t3-oss/env-nextjs` with Zod (`apps/web/lib/env.ts`)
- **Auth:** Supabase Auth (dormant in Phase 1; **not used by admin dashboard**)
- **Middleware:** `apps/web/middleware.ts` (currently handles public-route allowlist for Supabase auth refresh)
- **Public routes already built (do not touch):** `/`, `/cafes`, `/cafes/[slug]`, `/events`, `/events/[slug]`, `/partner`, `/about`, `/privacy`, `/terms`, `/booking-confirmation`, `/verify/[code]`

### Existing Database Schemas (relevant)

```
cafes:        id, name, slug (unique), area, description, cover_image, phone, instagram_handle, google_maps_url, address, opening_hours, status (active|inactive), created_at, updated_at
cafe_images:  id, cafe_id (fk, cascade), image_url, alt_text, sort_order, created_at
menu_items:   id, cafe_id (fk, cascade), category, name, price (int, ₹ paise? — verify), description, is_available, sort_order, created_at
events:       id, cafe_id (fk, cascade), title, slug (unique), description, event_type (enum), start_time (tz), end_time (tz), ticket_price (int), max_tickets (int), cover_image, status (upcoming|cancelled|completed), created_at, updated_at
cafe_leads:   id, owner_name, cafe_name, phone, area, status (new|contacted|converted|closed), notes, created_at
tickets:      id, event_id (fk, cascade), customer_name, customer_email, customer_phone, quantity, amount_paid (int), razorpay_order_id (unique), razorpay_payment_id, razorpay_signature, ticket_code (unique), status (pending|paid|failed|refunded), created_at
```

> **⚠️ Verify `ticket_price` and `amount_paid` units.** Check `apps/web/app/actions/booking.ts` (or wherever Razorpay order creation lives) to see if these are stored as **rupees** or **paise**. The dashboard must display them consistently (as ₹ rupees in all UI). The Razorpay integration task (011) is the source of truth — read it before building event price input.

### Existing Server-Side Patterns
- **Mutations:** `apps/web/app/actions/[feature].ts` files with `"use server"`. Examples: `app/actions/leads.ts`, `app/actions/booking.ts`.
- **Queries:** `apps/web/lib/queries/[feature].ts` (e.g., `lib/queries/events.ts`, `lib/queries/tickets.ts`). Direct Drizzle in components only for trivial single-table reads.
- **Supabase clients:** `lib/supabase/server.ts`, `lib/supabase/admin.ts` (service-role for admin ops like Storage uploads).
- **Drizzle DB instance:** `lib/drizzle/db.ts` — import `db` from here.

### Existing Middleware (do NOT break)

Read `apps/web/middleware.ts` carefully. It currently:
- Refreshes Supabase auth sessions
- Has a public-routes allowlist

**Your changes:** Add a localhost check that runs **before** any other logic when the path starts with `/admin`. Bail out with 404 (not 403 — we don't want to advertise the route exists) if the request host isn't localhost. Skip Supabase session refresh entirely for `/admin/*` (admin doesn't use Supabase auth).

---

## 4. Context & Problem Definition

### Problem Statement
1. **Immediate:** First paying client (Srea Natural) needs an event live by Apr 22 latest. Manual Supabase row insertion takes ~30 min and is error-prone (UUID copy-paste, timezone math, slug uniqueness checks, image URL typing).
2. **Recurring:** Every future event/cafe will hit the same friction. Wilson is bringing more clients soon.
3. **Visibility:** Real Razorpay payments are flowing in. Daniel currently has no good way to see who has booked which event without writing SQL. Wilson needs to share attendee lists with venue partners.
4. **Operational:** Partner form leads (`cafe_leads`) are coming in. There's no UI to see them. They're only visible via Supabase dashboard.

### Success Criteria
- [ ] After this task ships, **Daniel can create the entire Srea Natural workshop (1 venue + 2 event time slots) end-to-end through the dashboard in under 5 minutes**, and it appears correctly on `/events` and `/events/[slug]`.
- [ ] Visiting `https://goouthyd.com/admin` (or any `/admin/*` path) from any non-localhost host returns 404.
- [ ] Visiting `http://localhost:3000/admin` from the developer's laptop loads the dashboard with no auth challenge.
- [ ] All cafe and event create/edit/delete operations work, including image upload to Supabase Storage.
- [ ] Cancellation marks an event `cancelled` and the public event page reflects this.
- [ ] Refund buttons render but are disabled with a clear "Coming soon" tooltip.
- [ ] CSV export downloads a valid `.csv` file with the agreed columns.
- [ ] All linting and type-checking pass.

---

## 5. Development Mode Context
- 🚨 **Phase 1 MVP, real paying users now (low volume).** Be careful with `tickets` table — never delete or mutate ticket records destructively. Read-only display only (and the disabled refund button stub).
- Aggressive refactoring of admin-only code is fine.
- Schema migrations are fine; follow the `drizzle_down_migration.md` template.
- Existing public site must keep working — verify the `events` schema changes don't break `/events/[slug]`.

---

## 6. Technical Requirements

### Functional Requirements

**Auth / Access**
- All `/admin/*` routes blocked at middleware unless `request.headers.get("host")` matches `localhost(:port)?` or `127.0.0.1(:port)?`.
- No login screen. No password. Simply 404 on non-localhost.

**Dashboard layout**
- Persistent sidebar (or top nav, designer's call) with links to: Overview, Cafes, Events, Tickets, Leads.
- Distinct visual identity from public site — neutral gray/white palette, no espresso/caramel branding. Make it obvious this is the admin panel at a glance.
- Mobile-responsive (Daniel might check on phone, even though primarily desktop).

**Overview page (`/admin`)**
- Counts: total cafes (active), total upcoming events, tickets sold this week, tickets sold today, new leads (status=new).
- Recent activity (last 5 each): leads, ticket bookings, events created.

**Cafes (`/admin/cafes`)**
- List: name, area, status, # of events, # of menu items, edit/delete buttons.
- Create (`/admin/cafes/new`): form with all cafe fields, auto-slug from name (editable), image upload for `cover_image`.
- Edit (`/admin/cafes/[id]`): same form, plus inline sections for **menu items** and **image gallery**.
  - Menu items: list grouped by category, inline create/edit/delete, toggle availability.
  - Image gallery: thumbnail grid, upload, alt-text edit, sort_order via up/down arrows, delete.
- Delete: AlertDialog confirm. Cascades to cafe_images, menu_items, events (PG cascade).

**Events (`/admin/events`)**
- List: title, venue (cafe.name OR venue_name), event type, start time (IST), status, tickets sold / max, edit/delete buttons.
- Create (`/admin/events/new`): form with all fields. **Cafe selector** (autocomplete from existing cafes), with an explicit "Use custom venue (no cafe)" toggle that reveals `venue_name` / `venue_address` / `venue_maps_url` text fields and sets `cafe_id = null`.
- Edit (`/admin/events/[id]`): same form + tabs/sections for: Details, Bookings (tickets list), Cancel/Refund actions.
- Datetime pickers: must accept input in IST and store as UTC. Show IST in all display.
- Early-bird fields: `early_bird_price` (₹) + `early_bird_ends_at` (IST datetime). Both optional; either both null or both set (validate).
- Cover image upload to Supabase Storage `event-images` bucket.
- Cancel button: AlertDialog → sets `status = 'cancelled'`. Shows banner on event page: "This event has been cancelled."
- Disabled "Refund all tickets" button with tooltip: "Refunds coming soon — please refund manually via Razorpay dashboard for now."

**Tickets**
- Global list `/admin/tickets`: filters by event (dropdown), status, date range. Shows: event title, customer name, email, phone, quantity, amount, status, ticket code (link to `/verify/[code]`), booking date.
- "Export CSV" button → downloads filtered results.
- Per-event view at `/admin/events/[id]` "Bookings" tab: same list scoped to that event.
- Per-row "Refund" button: disabled, with tooltip "Refunds coming soon (Phase 2)".

**Leads (`/admin/leads`)**
- Read-only list (for now). Show all fields. Sort by `created_at desc`. Filter by status.
- Status update dropdown per row (new → contacted → converted → closed). Optional notes textarea editable inline.

### Non-Functional Requirements
- **Responsive:** Mobile-friendly enough for spot-checks on phone, optimized for desktop.
- **Performance:** No need for virtualization at MVP scale (dozens of records).
- **Security:** Localhost-only middleware is the only line of defense. Adequate because dashboard never deployed.
- **Theme:** Light mode only; **distinct neutral palette**, not espresso/caramel.

### Technical Constraints
- Must NOT add any password / authentication code.
- Must NOT call Razorpay refund API (stub buttons only).
- Must NOT touch existing public routes' behavior except where schema changes require it.
- Must use existing Drizzle patterns (Server Actions for mutations, lib/queries for reads).
- Must use Supabase Storage via `@supabase/supabase-js` admin client (`lib/supabase/admin.ts`) for uploads.

---

## 7. Data & Database Changes

### Schema changes to `events`
```ts
// apps/web/lib/drizzle/schema/events.ts
// CHANGES:
// 1. cafeId → make NULLABLE (remove .notNull(), keep FK with onDelete: "set null")
// 2. Add venue_name (text, nullable)
// 3. Add venue_address (text, nullable)
// 4. Add venue_maps_url (text, nullable)
// 5. Add early_bird_price (integer, nullable)
// 6. Add early_bird_ends_at (timestamp with tz, nullable)
```

Add a CHECK constraint (or app-level validation) that ensures either `cafeId IS NOT NULL` OR `venue_name IS NOT NULL`. App-level validation is simpler — enforce in Zod schema in the create/update Server Action.

### Migration (Drizzle)

```bash
npm run db:generate
# Then follow drizzle_down_migration.md template
# Then npm run db:migrate
```

### Down migration
Required. See `ai_docs/dev_templates/drizzle_down_migration.md`. Use `IF EXISTS` everywhere. Restore `NOT NULL` on `cafe_id` will need to default existing nulls to *something* — for safety, the down migration should warn/abort if there are any rows with `cafe_id IS NULL`.

### Supabase Storage buckets

Create two **public-read, authenticated-write** buckets:
- `cafe-images`
- `event-images`

These can be created via the Supabase dashboard manually, OR (preferred) via a one-shot script in `apps/web/scripts/setup-storage-buckets.ts` using `supabaseAdmin.storage.createBucket()`. Document the script in the README block of the file.

### Public assets domain
Add Supabase Storage domain to `next.config.js` `images.remotePatterns` so `<Image src={supabaseStorageUrl}>` works. Pattern:
```js
{
  protocol: 'https',
  hostname: '<project-ref>.supabase.co',
  pathname: '/storage/v1/object/public/**',
}
```

---

## 8. API & Backend Changes

### New Server Actions (mutations) — `apps/web/app/actions/admin/`

Group all admin actions in a subfolder for clarity:

- `app/actions/admin/cafes.ts`
  - `createCafe(input)`
  - `updateCafe(id, input)`
  - `deleteCafe(id)`
- `app/actions/admin/cafe-images.ts`
  - `addCafeImage(cafeId, input)`
  - `updateCafeImage(id, input)`
  - `deleteCafeImage(id)`
  - `reorderCafeImage(id, direction: "up" | "down")`
- `app/actions/admin/menu-items.ts`
  - `createMenuItem(cafeId, input)`
  - `updateMenuItem(id, input)`
  - `deleteMenuItem(id)`
  - `toggleMenuItemAvailability(id)`
- `app/actions/admin/events.ts`
  - `createEvent(input)` — validates cafeId XOR venue_name
  - `updateEvent(id, input)`
  - `deleteEvent(id)`
  - `cancelEvent(id)` — sets status='cancelled'
- `app/actions/admin/leads.ts`
  - `updateLeadStatus(id, status)`
  - `updateLeadNotes(id, notes)`
- `app/actions/admin/upload.ts`
  - `uploadImage(formData, bucket: "cafe-images" | "event-images")` — uploads to Supabase Storage, returns public URL
  - **NOTE:** All these use `supabaseAdmin` (service role). All include `revalidatePath()` for the relevant admin and public routes.

### New query functions — `apps/web/lib/queries/admin/`

- `lib/queries/admin/cafes.ts` — `listCafesWithCounts()`, `getCafeWithRelations(id)`
- `lib/queries/admin/events.ts` — `listEventsForAdmin()`, `getEventForAdmin(id)`, `getEventTicketStats(id)`
- `lib/queries/admin/tickets.ts` — `listTicketsForAdmin(filters)`, `getTicketsCsvRows(filters)`
- `lib/queries/admin/leads.ts` — `listLeads(filters)`
- `lib/queries/admin/overview.ts` — `getOverviewCounts()`, `getRecentActivity()`

### CSV export — API route required

CSV download is one of the explicit "API routes are OK" cases (file download). Create:
- `app/api/admin/tickets/export/route.ts` — GET handler, accepts query params (event_id, status, date range), returns `text/csv` with `Content-Disposition: attachment`.
- **Important:** This route must also enforce the localhost check (middleware will already do it, but defense in depth — verify in route handler that `request.headers.get('host')` is localhost; return 404 otherwise).

### External integrations
- **Supabase Storage** — new usage. Buckets must exist before upload code runs.
- **Razorpay refund API** — **NOT USED** in this task (stub only).

---

## 9. Frontend Changes

### New route group — `apps/web/app/(admin)/`

Use a route group `(admin)` so it has its own layout separate from `(public)`.

```
apps/web/app/(admin)/
├── layout.tsx                          # admin layout with sidebar nav
├── admin/
│   ├── page.tsx                        # overview
│   ├── loading.tsx
│   ├── cafes/
│   │   ├── page.tsx                    # list
│   │   ├── new/page.tsx                # create form
│   │   └── [id]/
│   │       ├── page.tsx                # edit form + menu + images
│   │       └── loading.tsx
│   ├── events/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx                # edit + bookings tab + cancel/refund actions
│   │       └── loading.tsx
│   ├── tickets/
│   │   └── page.tsx                    # global list with filters + CSV export
│   └── leads/
│       └── page.tsx
```

### New components — `apps/web/components/admin/`

```
components/admin/
├── AdminSidebar.tsx
├── AdminHeader.tsx
├── ImageUpload.tsx                     # reusable, uploads to Supabase Storage, returns URL
├── DateTimePickerIST.tsx               # reusable, IST input → UTC value
├── CafeForm.tsx
├── EventForm.tsx
├── MenuItemsManager.tsx                # inline section on cafe edit
├── CafeImagesManager.tsx               # inline section on cafe edit
├── TicketsTable.tsx                    # used by both /admin/tickets and event Bookings tab
├── TicketsFilters.tsx
├── LeadsTable.tsx
├── ConfirmDialog.tsx                   # wraps shadcn AlertDialog for reuse
├── DisabledRefundButton.tsx            # the stub button with tooltip
└── overview/
    ├── CountsGrid.tsx
    └── RecentActivity.tsx
```

### Pages to modify (public site)

- `apps/web/app/(public)/events/[slug]/page.tsx` — handle `cafe === null` case (use `venue_name`/`venue_address`/`venue_maps_url` for the `VenueSection`). Show "CANCELLED" banner if `event.status === 'cancelled'`. Hide BookButton when cancelled.
- `apps/web/components/events/VenueSection.tsx` — accept either a `cafe` object OR a `venue` object. Refactor accordingly.
- `apps/web/lib/queries/events.ts` — `getEventBySlug` likely already left-joins cafe; verify it handles null cafe gracefully.
- `apps/web/app/(public)/events/page.tsx` — same: handle null cafe in event cards.
- `apps/web/middleware.ts` — add localhost check for `/admin/*` (must be **first** check, bails with 404).
- `apps/web/next.config.js` — add Supabase Storage to `images.remotePatterns`.

### shadcn components to install

If not already present, install:
```bash
npx shadcn@latest add alert-dialog
npx shadcn@latest add dialog
npx shadcn@latest add tooltip
npx shadcn@latest add tabs
npx shadcn@latest add table
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add textarea
npx shadcn@latest add badge
npx shadcn@latest add popover
```
(Check what's already in `components/ui/` first — don't reinstall.)

### State management
- All forms = Server Components rendering forms that submit to Server Actions. Use `useActionState` (React 19) for client-side submission state.
- Image upload component is `"use client"` — uploads via Server Action that returns a URL, then writes URL to a hidden field in the parent form.
- No global state context needed for admin.

---

## 10. Code Changes Overview

### 📂 Schema (events.ts) — Before
```ts
cafeId: uuid("cafe_id").notNull().references(() => cafes.id, { onDelete: "cascade" }),
// ... no venue fields, no early-bird fields
```

### 📂 Schema (events.ts) — After
```ts
cafeId: uuid("cafe_id").references(() => cafes.id, { onDelete: "set null" }),
venueName: text("venue_name"),
venueAddress: text("venue_address"),
venueMapsUrl: text("venue_maps_url"),
earlyBirdPrice: integer("early_bird_price"),
earlyBirdEndsAt: timestamp("early_bird_ends_at", { withTimezone: true }),
```

### 📂 Middleware — Before
```ts
export async function middleware(request: NextRequest) {
  // existing supabase session refresh + public route allowlist
}
```

### 📂 Middleware — After
```ts
const ADMIN_PATH_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";

function isLocalhost(host: string | null): boolean {
  if (!host) return false;
  const hostOnly = host.split(":")[0];
  return hostOnly === "localhost" || hostOnly === "127.0.0.1";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(ADMIN_PATH_PREFIX) || pathname.startsWith(ADMIN_API_PREFIX)) {
    if (!isLocalhost(request.headers.get("host"))) {
      return new NextResponse(null, { status: 404 });
    }
    // skip supabase session refresh for admin routes
    return NextResponse.next();
  }

  // ... existing logic
}
```

### 📂 ImageUpload component (new, sketch)
```tsx
"use client";
import { useState } from "react";
import { uploadImage } from "@/app/actions/admin/upload";

export function ImageUpload({
  bucket,
  value,
  onChange,
}: {
  bucket: "cafe-images" | "event-images";
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const { url, error } = await uploadImage(fd, bucket);
    setUploading(false);
    if (error) {
      // toast error
      return;
    }
    onChange(url);
  }

  return (
    <div>
      {value && <img src={value} alt="" className="mb-2 h-32 w-auto rounded" />}
      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {uploading && <p>Uploading…</p>}
    </div>
  );
}
```

### 📂 CSV export route (new, sketch)
```ts
// app/api/admin/tickets/export/route.ts
import { NextRequest } from "next/server";
import { getTicketsCsvRows } from "@/lib/queries/admin/tickets";

function isLocalhost(host: string | null) {
  const h = host?.split(":")[0];
  return h === "localhost" || h === "127.0.0.1";
}

export async function GET(req: NextRequest) {
  if (!isLocalhost(req.headers.get("host"))) {
    return new Response(null, { status: 404 });
  }
  const url = new URL(req.url);
  const rows = await getTicketsCsvRows({
    eventId: url.searchParams.get("event_id") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  const header = ["Booking Date","Customer Name","Email","Phone","Quantity","Amount Paid (INR)","Ticket Code","Status","Event Title","Event Date (IST)"];
  const csv = [header, ...rows.map(r => [r.bookingDate, r.customerName, r.customerEmail, r.customerPhone, r.quantity, r.amountPaid, r.ticketCode, r.status, r.eventTitle, r.eventDate])]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tickets-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
}
```

### 🎯 Key Changes Summary
- **Schema:** `events` gains 5 columns, `cafe_id` becomes nullable.
- **Middleware:** localhost check added as first gate for `/admin/*` and `/api/admin/*`.
- **New routes:** ~10 admin pages, 1 CSV export API route.
- **New components:** ~14 admin-specific components.
- **New buckets:** Supabase Storage `cafe-images`, `event-images`.
- **Public site touched:** event detail/list pages handle null cafe + cancelled state.
- **Files modified:** `events.ts` schema, `middleware.ts`, `next.config.js`, event pages/components.
- **Files created:** ~30+ new files.

---

## 11. Implementation Plan

> **🚨 The implementing agent should execute phases in order, present a recap after each phase, and wait for "proceed" before moving on.** Each phase is sized to be executable in one focused pass.

### Phase 1: Schema migration
**Goal:** Add new columns to `events`, make `cafe_id` nullable, generate + apply migration with safe down.
- [ ] **Task 1.1:** Update `apps/web/lib/drizzle/schema/events.ts` (see section 10).
- [ ] **Task 1.2:** Run `npm run db:generate`.
- [ ] **Task 1.3:** Create `drizzle/migrations/[timestamp_xxx]/down.sql` per `drizzle_down_migration.md` template.
- [ ] **Task 1.4:** Run `npm run db:migrate`.
- [ ] **Task 1.5:** Verify with `npm run db:status`.

### Phase 2: Public site compatibility
**Goal:** Ensure existing public site keeps rendering with the new schema (null cafe + cancelled state).
- [ ] **Task 2.1:** Update `lib/queries/events.ts` to handle null cafe in `getEventBySlug` and any list queries.
- [ ] **Task 2.2:** Update `components/events/VenueSection.tsx` to accept a venue (cafe OR custom).
- [ ] **Task 2.3:** Update `app/(public)/events/[slug]/page.tsx` to render cancelled banner + venue fallback.
- [ ] **Task 2.4:** Update `app/(public)/events/page.tsx` and any event-card components.
- [ ] **Task 2.5:** `npm run lint` + `npm run type-check`.

### Phase 3: Supabase Storage setup
**Goal:** Buckets exist; Next.js can render uploaded images.
- [ ] **Task 3.1:** Create `apps/web/scripts/setup-storage-buckets.ts` (uses `supabaseAdmin`).
- [ ] **Task 3.2:** Run the script once (manual command in README; user invokes).
- [ ] **Task 3.3:** Add Supabase domain to `next.config.js` `images.remotePatterns`.

### Phase 4: Admin middleware + layout shell
**Goal:** `/admin` route exists, blocks non-localhost, renders empty layout with nav.
- [ ] **Task 4.1:** Modify `middleware.ts` (localhost check first, skip Supabase refresh for admin).
- [ ] **Task 4.2:** Verify middleware `matcher` covers `/admin/*` and `/api/admin/*`.
- [ ] **Task 4.3:** Create `app/(admin)/layout.tsx` with sidebar/header.
- [ ] **Task 4.4:** Create `components/admin/AdminSidebar.tsx`, `AdminHeader.tsx`.
- [ ] **Task 4.5:** Create `app/(admin)/admin/page.tsx` (overview placeholder for now).
- [ ] **Task 4.6:** `npm run lint` + `npm run type-check`.

### Phase 5: Reusable building blocks
**Goal:** ImageUpload, DateTimePickerIST, ConfirmDialog, DisabledRefundButton ready.
- [ ] **Task 5.1:** Install missing shadcn components (see section 9).
- [ ] **Task 5.2:** Create `app/actions/admin/upload.ts` (`uploadImage` server action).
- [ ] **Task 5.3:** Create `components/admin/ImageUpload.tsx`.
- [ ] **Task 5.4:** Create `components/admin/DateTimePickerIST.tsx` (input type=datetime-local interpreted as IST, value stored UTC).
- [ ] **Task 5.5:** Create `components/admin/ConfirmDialog.tsx`.
- [ ] **Task 5.6:** Create `components/admin/DisabledRefundButton.tsx`.

### Phase 6: Cafes management
**Goal:** Full CRUD for cafes, including inline menu items + image gallery.
- [ ] **Task 6.1:** `lib/queries/admin/cafes.ts`.
- [ ] **Task 6.2:** `app/actions/admin/cafes.ts`, `cafe-images.ts`, `menu-items.ts`.
- [ ] **Task 6.3:** `components/admin/CafeForm.tsx`.
- [ ] **Task 6.4:** `components/admin/MenuItemsManager.tsx`.
- [ ] **Task 6.5:** `components/admin/CafeImagesManager.tsx`.
- [ ] **Task 6.6:** Pages: `/admin/cafes`, `/admin/cafes/new`, `/admin/cafes/[id]`.
- [ ] **Task 6.7:** Lint + type-check.

### Phase 7: Events management
**Goal:** Full CRUD for events with cafe-OR-venue, IST datetimes, early-bird, cancellation.
- [x] **Task 7.1:** `lib/queries/admin/events.ts`.
- [x] **Task 7.2:** `app/actions/admin/events.ts` (incl. `cancelEvent`).
- [x] **Task 7.3:** `components/admin/EventForm.tsx` (cafe selector + custom venue toggle, IST pickers, early-bird fields).
- [x] **Task 7.4:** Pages: `/admin/events`, `/admin/events/new`, `/admin/events/[id]` (with Details + Bookings tabs + Cancel button).
- [x] **Task 7.5:** Wire `DisabledRefundButton` into the cancel flow + tickets list.
- [x] **Task 7.6:** Lint + type-check.

### Phase 8: Tickets viewer + CSV export
**Goal:** Global tickets list, per-event Bookings tab, CSV download.
- [x] **Task 8.1:** `lib/queries/admin/tickets.ts` (list + csv rows).
- [x] **Task 8.2:** `components/admin/TicketsTable.tsx`, `TicketsFilters.tsx`.
- [x] **Task 8.3:** `app/(admin)/admin/tickets/page.tsx`.
- [x] **Task 8.4:** `app/api/admin/tickets/export/route.ts`.
- [x] **Task 8.5:** Embed `TicketsTable` in event edit page Bookings tab.
- [x] **Task 8.6:** Lint + type-check.

### Phase 9: Leads viewer
**Goal:** Read-only leads list with status update + notes edit.
- [x] **Task 9.1:** `lib/queries/admin/leads.ts`, `app/actions/admin/leads.ts`.
- [x] **Task 9.2:** `components/admin/LeadsTable.tsx`.
- [x] **Task 9.3:** `app/(admin)/admin/leads/page.tsx`.
- [x] **Task 9.4:** Lint + type-check.

### Phase 10: Overview page
**Goal:** Counts + recent activity widgets on `/admin`.
- [x] **Task 10.1:** `lib/queries/admin/overview.ts`.
- [x] **Task 10.2:** `components/admin/overview/CountsGrid.tsx`, `RecentActivity.tsx`.
- [x] **Task 10.3:** Replace placeholder in `/admin/page.tsx`.
- [x] **Task 10.4:** Lint + type-check.

### Phase 11: Final code validation
- [ ] **Task 11.1:** `npm run lint` across whole project.
- [ ] **Task 11.2:** `npm run type-check`.
- [ ] **Task 11.3:** Manual file-read pass over admin server actions to verify Zod validation present.

### Phase 12: Implementation Complete → Code Review
Present "Implementation Complete!" message per template section 16, step 7. Wait for user approval, then comprehensive review.

### Phase 13: User testing (👤 USER TESTING)
- [ ] User starts dev server.
- [ ] Visit `http://localhost:3000/admin` — confirm dashboard loads.
- [ ] (If accessible) Visit `http://192.168.x.x:3000/admin` from phone — confirm 404.
- [ ] Visit production URL `/admin` — confirm 404.
- [ ] Create Srea Natural cafe (use custom venue toggle since it's not really a cafe… actually, **decide:** create as cafe with name "Srea Natural" and area "Kondapur" since cafe model is more featureful, OR leave cafe blank and use only venue fields on the event. Either works — Daniel's call at use time).
- [ ] Create the 2 Srea Natural workshop events (morning + afternoon slots).
- [ ] Verify they appear correctly on `/events` and `/events/[slug]`.
- [ ] Test cancel flow on a dummy event (DO NOT cancel real Srea events).
- [ ] Confirm refund buttons are visibly disabled with tooltip.
- [ ] Export tickets CSV → open in spreadsheet → verify columns/data.

---

## 12. Task Completion Tracking
(Implementing agent fills in with timestamps as it goes.)

---

## 13. File Structure & Organization

### New files (high-level)
```
apps/web/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx + loading.tsx
│   │       ├── cafes/{page.tsx, new/page.tsx, [id]/{page.tsx,loading.tsx}}
│   │       ├── events/{page.tsx, new/page.tsx, [id]/{page.tsx,loading.tsx}}
│   │       ├── tickets/page.tsx
│   │       └── leads/page.tsx
│   ├── actions/admin/{cafes,cafe-images,menu-items,events,leads,upload}.ts
│   └── api/admin/tickets/export/route.ts
├── components/admin/
│   ├── AdminSidebar.tsx, AdminHeader.tsx
│   ├── ImageUpload.tsx, DateTimePickerIST.tsx, ConfirmDialog.tsx, DisabledRefundButton.tsx
│   ├── CafeForm.tsx, EventForm.tsx
│   ├── MenuItemsManager.tsx, CafeImagesManager.tsx
│   ├── TicketsTable.tsx, TicketsFilters.tsx, LeadsTable.tsx
│   └── overview/{CountsGrid,RecentActivity}.tsx
├── lib/queries/admin/{cafes,events,tickets,leads,overview}.ts
└── scripts/setup-storage-buckets.ts
```

### Files to modify
- `apps/web/lib/drizzle/schema/events.ts`
- `apps/web/middleware.ts`
- `apps/web/next.config.js`
- `apps/web/lib/queries/events.ts`
- `apps/web/app/(public)/events/page.tsx`
- `apps/web/app/(public)/events/[slug]/page.tsx`
- `apps/web/components/events/VenueSection.tsx`

### Dependencies to add
None expected. shadcn primitives are added via `npx shadcn@latest add` (already in stack).

---

## 14. Potential Issues & Security Review

### Error scenarios
- [ ] **Image upload fails** (network, bucket missing, file too large) → catch error, show toast, leave form's existing image URL untouched.
- [ ] **Slug collision** on cafe/event create → Server Action returns `{success: false, error: "Slug already exists"}`; form displays.
- [ ] **DateTime picker timezone confusion** — IST input → UTC storage. Verify with explicit test: enter `23 Apr 2026 11:00`, save, re-open form, confirm picker shows `23 Apr 2026 11:00` (not 5:30 AM).
- [ ] **Cafe with paid tickets being deleted** — PG cascade deletes events → tickets too. **DANGEROUS.** Add app-level guard: `deleteCafe` checks if any related events have `paid` tickets; refuses with clear error if so. Same guard for `deleteEvent`.

### Edge cases
- [ ] Event with no cafe AND no venue_name → block at validation.
- [ ] Both `early_bird_price` and `early_bird_ends_at` must be set together — enforce in Zod refinement.
- [ ] Public event detail page when `cafe === null && venue_name === null` (legacy data) — render "Venue TBC" fallback.
- [ ] Up/down reorder on first/last image — buttons should be disabled or no-op.
- [ ] CSV with no rows — return CSV with just header row, not 404.

### Security review
- [ ] **Localhost middleware** is the only auth. If matcher misses any route, that route is publicly exposed. **Verify the middleware matcher includes `/admin/:path*` and `/api/admin/:path*`.**
- [ ] **Defense in depth on CSV route:** double-check localhost in route handler too.
- [ ] **Server Actions are inherently callable from anywhere if URL leaks.** Mitigation: every admin Server Action should also `headers().get('host')` check. Add a shared helper `assertLocalhost()` in `lib/admin/auth.ts` and call at the top of every admin Server Action.
- [ ] **Storage upload abuse:** If admin Server Action `uploadImage` lacks the localhost check, anyone could upload via Server Action endpoint. **MUST add `assertLocalhost()` at top of every admin action.**
- [ ] **PII in CSV:** Customer email/phone exported. Daniel must keep CSVs secure. Document this.
- [ ] **No SQL injection risk** — Drizzle parameterizes everything.

---

## 15. Deployment & Configuration

### Environment variables
None added.

### Storage bucket setup (one-time)
Run `apps/web/scripts/setup-storage-buckets.ts` once after deploying schema migration.

### Vercel config
- Admin routes are blocked by middleware in production (non-localhost), so they technically deploy but are inert. Acceptable.
- Verify `next.config.js` `images.remotePatterns` includes Supabase Storage domain.

---

## 16. Second-Order Consequences

### Schema migration impact
- `cafe_id` becoming nullable: any existing query using `event.cafe_id` as non-null must be revisited. Check `lib/queries/events.ts` and any TypeScript code using `Event.cafeId`.
- New event columns: TypeScript types regenerate automatically via `$inferSelect`/`$inferInsert`. Forms must include new optional fields.

### Middleware impact
- Adding the localhost short-circuit must NOT break the existing Supabase session refresh logic for non-admin routes. Test: visit `/` after change — confirm Supabase auth still works (login/signout, dormant in Phase 1 but should not break).
- Matcher config in `middleware.ts` must explicitly include both `/admin/:path*` and `/api/admin/:path*`. **If matcher excludes static assets but accidentally excludes /admin too, security fails.**

### Public site impact
- Event pages must gracefully render when cafe is null. Test the Srea event end-to-end.
- "Cancelled" banner is new UX — ensure no jarring layout shifts.

### Operational impact
- Daniel now has a single tool for managing data. Wilson's "manage via Supabase dashboard" workflow becomes obsolete for cafe/event/lead management. Wilson can keep using Supabase for raw SQL inspection, but day-to-day moves to admin dashboard.

### 🚨 Red flags
- **Accidentally exposing admin routes in production.** Mitigation: localhost middleware + per-action localhost assertion. Test from a non-localhost device after deploy.
- **Cascade delete of cafe wiping ticket revenue records.** Mitigation: app-level guard on delete actions.

### ⚠️ Yellow flags
- **Refund stub UX confusion.** Daniel might forget refunds aren't real and click the button expecting it to work. Mitigation: button is `disabled` AND tooltip + the cancel-event AlertDialog body explains "Refunds must be processed manually via Razorpay dashboard for now."
- **Image storage costs.** Free tier of Supabase Storage is generous but track usage. Document in README.

---

## 17. Notes & References

### Why no password
User explicitly opted out: dashboard runs locally on his own laptop, no risk of unauthorized access. Localhost middleware is the entire defense.

### Why refund is deferred
Refunds are operationally and technically complex (partial failures, 5–7 day settlement, Razorpay webhooks for confirmed refund, fee non-recoverability, idempotency, audit trail). Doing them right deserves its own task. Doing them wrong risks real-money mistakes. For Phase 1 with low ticket volume, manual refunds via the Razorpay dashboard are tolerable.

### First real-world use
Once shipped, Daniel will use the dashboard to create:
1. Srea Natural (as a "cafe" with area=Kondapur, OR null-cafe with venue_name=Srea Natural — TBD at use time)
2. "Little Soap Makers — Morning Slot" — 23 Apr 2026, 11:00–13:00 IST
3. "Little Soap Makers — Afternoon Slot" — 23 Apr 2026, 15:00–17:00 IST
4. Both with early-bird ₹799 till 20 Apr, regular ₹999 (translation: set `ticket_price=999`, `early_bird_price=799`, `early_bird_ends_at=2026-04-20T23:59:59+05:30`).
5. **Cover image:** awaiting landscape version from client. Until then, leave blank — public page falls back to gradient.

### Appendix — Phase 13 (user testing) + Srea “Little Soap Makers” copy-paste

Use **`http://localhost:3000/admin`** (not production). Production `/admin` should 404 by design.

**Phase 13 checklist (you tick these off when done)**

- [ ] Dev server running (`npm run dev` in `apps/web`).
- [ ] `http://localhost:3000/admin` loads (overview + nav).
- [ ] From another device, `http://<your-lan-ip>:3000/admin` → **404** (middleware).
- [ ] Production site `https://goouthyd.com/admin` → **404**.
- [ ] Srea cafe and **two** workshop events created (or updated) per rows below.
- [ ] `/events` and `/events/[slug]` look correct for both slugs.
- [ ] Cancel flow tested on a **dummy** event only (never cancel live Srea rows).
- [ ] Refund buttons disabled + tooltip on tickets UI.
- [ ] CSV export opened in Excel/Sheets — columns look right.

**Recommended setup (cafe + two events)** — Instagram and Maps live on the **cafe**; events link to that cafe.

1. **Cafe** (`/admin/cafes/new` or edit existing): **Srea Natural**, area **Kondapur**, slug e.g. `srea-natural`.
   - **Google Maps URL:** `https://maps.app.goo.gl/4TtJeNGxhd29qZmn9?g_st=ac`
   - **Instagram handle:** `srea_handcraftedsoaps` (or `@srea_handcraftedsoaps` — the form accepts either style).
   - Address line (optional, for public cafe page): `Flat 206, Kadiris Apurupa Urban, Botanical Garden Road, Kondapur 500084`
   - Upload **cover image** from your flyer file if you want it on `/cafes/srea-natural` (optional).

2. **Create two events** (`/admin/events/new`) — same cafe, **custom venue OFF**, pick **Srea Natural**. Repeat twice for the two time slots.

Shared fields for **both** events (except title, slug, start/end):

| Field | Value |
|------|--------|
| Event type | `workshop` |
| Status | `upcoming` |
| Regular price (₹) | `999` |
| Early-bird price (₹) | `799` |
| Early-bird ends at (IST) | **20 Apr 2026, 11:59 PM** (end of 20th; picker is IST) |
| Max tickets | *(your real capacity; flyer says limited — set a number or leave blank)* |

**Event A — morning slot**

| Field | Value |
|------|--------|
| Title | `Little Soap Makers — Morning (23 Apr 2026)` |
| Slug | `little-soap-makers-kondapur-2026-04-23-morning` *(change if “already in use”)* |
| Start (IST) | **23 Apr 2026, 11:00 AM** |
| End (IST) | **23 Apr 2026, 1:00 PM** |

**Event B — afternoon slot**

| Field | Value |
|------|--------|
| Title | `Little Soap Makers — Afternoon (23 Apr 2026)` |
| Slug | `little-soap-makers-kondapur-2026-04-23-afternoon` |
| Start (IST) | **23 Apr 2026, 3:00 PM** |
| End (IST) | **23 Apr 2026, 5:00 PM** |

**Description** (paste into **Description** on each event; `events` has no Instagram column — links belong here or on the cafe):

```
Something fun for kids this summer

Introducing Little Soap Makers – Mini Workshop
A hands-on session where kids create their own soaps while exploring colours, scents, and creativity.

Ages: 6–12 years

What they'll do:
• Make their own handmade soaps
• Explore colours and fragrances
• Take home a booklet
• Receive a Junior Soap Maker e-certificate

Pricing:
Early Bird: ₹799 (valid till 20th April)
Regular: ₹999

Limited spots to keep the experience small and personal.

Instagram: https://www.instagram.com/srea_handcraftedsoaps?igsh=MTd0YmdqYjkyaXBpeA==
Maps: https://maps.app.goo.gl/4TtJeNGxhd29qZmn9?g_st=ac
```

**If you already created one flyer-only event (single 3–5 slot):** open **`/admin/events/<id>`** → **Details** → change title/slug/times to **afternoon** row above, then **create** a second event for the **morning** slot (do not reuse the same slug).

**Updating an existing event:** only edit in admin; no git commit required for DB content. Commit code when you are ready to version the app itself.

---

*Ready for approval. On go-ahead the implementing agent (in a fresh context) should read this entire document, then execute Phase 1 and report back.*
