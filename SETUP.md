# GoOut Hyd — Developer Setup Guide

> **GoOut Hyd** (goouthyd.in) is a venue discovery and experience platform for Hyderabad, India. This guide covers everything needed to run the project locally and deploy it to production.

---

## Prerequisites

Install these tools before starting:

| Tool | Version | Download |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/en/download) |
| npm | 10+ | Included with Node.js |

You also need accounts on:

- [Supabase](https://supabase.com) — PostgreSQL database and auth
- [Resend](https://resend.com) — Transactional email (partner lead notifications)
- [Vercel](https://vercel.com) — Deployment (optional for local dev)

---

## Repository Structure

```
rag-simple/               ← Monorepo root
└── apps/
    └── web/              ← Next.js 15 web application
        ├── app/          ← App Router pages and layouts
        ├── components/   ← React components
        ├── lib/          ← Query functions, schema, utilities
        ├── drizzle/      ← Migration files
        └── scripts/      ← DB migration/seed scripts
```

All commands below that use `npm run db:*` must be run from the **repo root** (`rag-simple/`), not from `apps/web/`.

All commands that use `npm run dev`, `npm run lint`, or `npm run type-check` must be run from **`apps/web/`**.

---

## 1. Clone and Install Dependencies

```bash
git clone <repo-url>
cd rag-simple/apps/web
npm install
```

---

## 2. Supabase Setup

### 2.1 Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in
2. Click **New Project**, fill in name, region, and generate a strong password
3. Wait for the project to provision (~1 minute)

### 2.2 Get Your Credentials

Navigate to **Project Settings → Data API** and copy:

- **Project URL** (e.g. `https://abcdefgh.supabase.co`)
- **anon public** key
- **service_role** key

Navigate to **Project Settings → Connect → ORMs → Drizzle** and copy the `DATABASE_URL` connection string. Replace the `[YOUR-PASSWORD]` placeholder with the password you generated.

---

## 3. Resend Setup

### 3.1 Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. From the dashboard, go to **API Keys** and create a new key with **Full Access**
3. Copy the key — it starts with `re_`

### 3.2 Domain Verification (Production Only)

For production email delivery from your own domain:

1. In Resend dashboard, go to **Domains → Add Domain**
2. Enter your domain (e.g. `goouthyd.in`)
3. Add the DNS records shown (TXT, MX, DKIM) to your domain registrar
4. Click **Verify** once DNS propagates (~24 hours)

For local development you can use the Resend sandbox — no domain setup needed. Emails are logged but not delivered.

---

## 4. Environment Variables

Create `apps/web/.env.local` with the following values:

```bash
# Database (Supabase Postgres via Drizzle)
DATABASE_URL=postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# Supabase project
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email notifications (partner lead alerts sent to Wilson)
# Leave blank to skip email sending — leads are still saved to the DB
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
LEAD_NOTIFICATION_EMAIL=wilson@example.com

# App URL — used for og:url metadata and sitemap generation
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Production note:** Set `NEXT_PUBLIC_APP_URL=https://goouthyd.in` in your Vercel environment variables.

---

## 5. Database Setup

Run migrations from the **repo root**:

```bash
# Apply all pending migrations
npm run db:migrate

# Seed with sample cafes and events (development only)
npm run db:seed
```

### What the seed script creates

- 5 sample cafes across different Hyderabad areas (Banjara Hills, Jubilee Hills, Kondapur, Gachibowli, Madhapur)
- Menu items and photo gallery entries for each cafe
- Several upcoming events of different types (live_music, open_mic, workshop, comedy_night, gaming)

---

## 6. Supabase Storage (for Cafe Images)

Cafe photos and event cover images are stored in a Supabase Storage bucket. Wilson uploads images manually via the Supabase dashboard and pastes the public URL into the DB.

### 6.1 Create the bucket

1. In your Supabase project, go to **Storage → New bucket**
2. Name it `cafe-images`
3. Toggle **Public bucket** to ON (images are served publicly without auth)
4. Click **Create bucket**

### 6.2 Upload images

1. Inside the `cafe-images` bucket, create folders by cafe slug (e.g. `/brew-theory/`)
2. Drag and drop images into the folder
3. Right-click any image → **Get URL** → copy the public URL
4. Paste the URL into the `image_url` column in the `cafe_images` table (via Table Editor or `npm run db:seed`)

---

## 7. Local Development

```bash
cd apps/web
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000) with Turbopack hot reload.

### Available pages

| URL | Description |
|---|---|
| `/` | Landing page — featured cafes and upcoming events |
| `/cafes` | Cafe listing, filterable by area |
| `/cafes/[slug]` | Individual cafe profile |
| `/events` | Events listing with category cards |
| `/events/[slug]` | Individual event detail |
| `/partner` | Cafe owner interest form |
| `/about` | Platform story and mission |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/sitemap.xml` | Auto-generated sitemap |
| `/robots.txt` | Robots config |

---

## 8. Code Quality

Run from `apps/web/`:

```bash
# ESLint
npm run lint

# TypeScript type checking (no compilation)
npm run type-check

# Prettier formatting
npm run format
```

---

## 9. Database Scripts

All DB scripts run from the **repo root** and load `.env.local` automatically via `dotenv-cli`.

| Command | Description |
|---|---|
| `npm run db:generate` | Generate a new migration from schema changes |
| `npm run db:generate:custom` | Generate a blank custom SQL migration |
| `npm run db:migrate` | Apply all pending migrations |
| `npm run db:rollback` | Roll back the last applied migration |
| `npm run db:status` | Show migration history and pending state |
| `npm run db:seed` | Seed sample data (dev only) |
| `npm run db:studio` | Open Drizzle Studio visual DB browser |

### Schema files

Drizzle schema lives in `apps/web/lib/drizzle/schema/`. After editing any schema file, generate and apply a migration:

```bash
npm run db:generate   # Creates a new .sql file in apps/web/drizzle/migrations/
npm run db:migrate    # Applies it to the database
```

Never create or alter tables directly in the Supabase dashboard — always go through Drizzle migrations.

---

## 10. Deployment (Vercel)

### 10.1 Connect to Vercel

1. Push the repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Set **Root Directory** to `apps/web`
4. Framework preset should auto-detect **Next.js**
5. Click **Deploy**

### 10.2 Set Environment Variables

In Vercel project settings → **Environment Variables**, add all values from your `.env.local` file. Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://goouthyd.in`).

### 10.3 Custom Domain

1. In Vercel project → **Settings → Domains**
2. Add `goouthyd.in` and `www.goouthyd.in`
3. Update your domain registrar's DNS to point to Vercel's nameservers (or add A/CNAME records as shown by Vercel)

### 10.4 Production Database Migrations

Use the prod scripts from repo root (requires `.env.prod` file with production credentials):

```bash
npm run db:migrate:prod
```

---

## 11. Phase 1 Constraints

The following features are **intentionally not built** in the current version:

- No user login or authentication (Supabase Auth is dormant until Phase 2)
- No payment processing
- No cafe owner dashboard or self-serve features
- No admin UI (Wilson manages all data via the Supabase dashboard)
- No WhatsApp integration
- No AI or RAG features
- No mobile app

---

## 12. Data Management (Wilson's Workflow)

All content is managed manually by Wilson via the Supabase dashboard:

1. **Add a cafe** — insert a row in the `cafes` table with `status = 'active'`
2. **Add cafe photos** — upload to Storage, insert rows in `cafe_images` with the public URL
3. **Add menu items** — insert rows in `menu_items` linked to the cafe
4. **Add events** — insert rows in `events` with `status = 'upcoming'` and a future `start_time`
5. **View partner leads** — check the `cafe_leads` table for form submissions

---

*Last updated: 2026-04-14*
