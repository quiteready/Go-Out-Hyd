## App Pages & Functionality Blueprint

### App Summary

**App Name:** GoOut Hyd
**Domain:** goouthyd.in
**End Goal:** Help independent cafe owners in Hyderabad fill tables and generate event revenue by giving them a managed digital presence, while giving customers aged 20-35 a single place to discover cafes and live experiences across the city.
**Core Value Proposition:** The only platform that combines cafe discovery WITH managed event infrastructure for Hyderabad's independent cafe scene.
**Target Users:** Customers (20-35, experience seekers), Cafe Owners (indie cafes, no marketing team), Wilson (platform operator/event manager)
**Phase 1 Scope:** Public-only. No authentication, no payments, no admin UI. Wilson manages all data via Supabase.

---

## Pages & Functionality

### Landing Page -- `/`

**Purpose:** First impression. Sell the vibe, show what's happening, and funnel both customers and cafe owners deeper into the platform.

**Sections (top to bottom):**

- **Hero Section** (dark espresso background, full-width)
  - Headline in DM Serif Display (e.g., "Your Weekend Starts Here")
  - Subtitle: "Discover Hyderabad's best independent cafes, live music nights, open mics, and more"
  - Two CTAs: "Explore Cafes" (primary, caramel) + "Browse Events" (secondary, outlined)
  - Atmospheric background image or subtle gradient

- **Browse by Area** (cream background)
  - Section heading: "Find Your Spot"
  - Clickable area pills/cards: Banjara Hills, Jubilee Hills, Kondapur, Gachibowli, Madhapur
  - Each pill links to `/cafes?area=banjara-hills` (filtered view)
  - Expandable as Wilson adds more areas

- **Featured Cafes** (milk background)
  - Section heading: "Cafes Worth the Drive"
  - Grid of 4-6 cafe cards (cover image, cafe name, area tag, one-line description)
  - Each card links to `/cafes/[slug]`
  - "See All Cafes" link at bottom

- **Upcoming Events** (cream background)
  - Section heading: "What's Happening This Week"
  - Row of 4 event cards (cover image, event name, date badge, cafe name, event type badge)
  - Each card links to `/events/[slug]`
  - "See All Events" link at bottom

- **Partner CTA Banner** (espresso background)
  - Headline: "Own a Cafe? Let Hyderabad Find You"
  - Subtitle: "Plans starting at ₹999/month"
  - CTA button: "List Your Cafe" linking to `/partner`

- **Footer**

**Functionality:**

- Fetch all active cafes from database, display as cards (Frontend)
- Fetch next 4 upcoming events sorted by date (Frontend)
- Area pills link to `/cafes` with area query parameter (Frontend)
- All content server-rendered for SEO (Backend)

---

### Cafe Listing -- `/cafes`

**Purpose:** Let customers browse all cafes, filterable by area. The main discovery page.

**Sections:**

- **Page Header**
  - Heading: "Cafes" (or "Cafes in Banjara Hills" when filtered)
  - Area filter pills at top (same areas as landing page). Active area highlighted in caramel. "All Areas" option to reset.

- **Cafe Grid**
  - Responsive card grid (2 cols on mobile, 3 on desktop)
  - Each card shows: cover image, cafe name (DM Serif Display), area tag, short description (2 lines max)
  - Cards link to `/cafes/[slug]`

- **Empty State**
  - If no cafes in selected area: "No cafes in [Area] yet -- check back soon!" with a CTA to browse all areas

**Functionality:**

- Fetch all active cafes, optionally filtered by area query param (Backend)
- Area filtering updates URL (`/cafes?area=kondapur`) for shareability (Frontend)
- Server-rendered for SEO with proper meta titles per area (Backend)

---

### Cafe Profile -- `/cafes/[slug]`

**Purpose:** The cafe's digital home. Everything a customer needs to decide to visit. Also the URL Wilson shares with cafe owners during pitches as proof of work.

**Sections (single scrollable page):**

- **Cover Photo** (full-width, hero-style with gradient overlay)
  - Cafe name overlaid in DM Serif Display
  - Area tag badge

- **Quick Contact Bar** (prominent, always visible)
  - Phone icon + number (tap to call on mobile)
  - Google Maps icon (opens directions in new tab)
  - Instagram icon + handle (opens profile in new tab)
  - Full address displayed below

- **About This Cafe**
  - Cafe description (2-3 paragraphs, written by Wilson)

- **Photo Gallery**
  - Grid of images (2x2 on mobile, 3-column on desktop)
  - Tap/click opens lightbox for full-screen viewing with swipe navigation

- **Menu Highlights**
  - Organized by category (Coffee, Food, Desserts, Drinks, etc.)
  - Each item: name, price (₹), optional short description
  - Unavailable items hidden via is_available flag
  - Not a full menu -- just highlights and signature items

- **Upcoming Events at This Cafe**
  - List of upcoming events tied to this cafe
  - Each event card shows: event name, date, event type badge, ticket price
  - Links to `/events/[slug]`
  - If no events: "No upcoming events -- follow us on Instagram for updates"

**Functionality:**

- Fetch cafe by slug with related images, menu items, and upcoming events (Backend)
- Phone number rendered as `tel:` link for mobile tap-to-call (Frontend)
- Google Maps URL opens in new tab (Frontend)
- Instagram handle rendered as external link (Frontend)
- Photo lightbox with keyboard/swipe navigation (Frontend -- client component)
- SEO meta tags with cafe name, area, description, and cover image as OG image (Backend)

---

### Events Listing -- `/events`

**Purpose:** Single destination for discovering all upcoming events across Hyderabad cafes.

**Sections:**

- **Page Header**
  - Heading: "Events" (or "Live Music Events" when filtered by category)

- **Category Filter Cards**
  - Horizontal scrollable row of category cards with icons
  - Categories: All, Live Music (guitar icon), Open Mic (mic icon), Workshop (palette icon), Comedy Night (laugh icon), Gaming (gamepad icon)
  - Active category highlighted in caramel. "All" resets filter.

- **Events Grid**
  - Event cards in a responsive grid
  - Each card: cover image, event name, date + time badge, cafe name + area, event type badge, ticket price (e.g., "₹299" or "Free Entry")
  - Cards link to `/events/[slug]`
  - Sorted chronologically (soonest first)
  - Only shows future events (past events hidden)

- **Empty State**
  - "No upcoming [category] events right now -- check back soon!" with CTA to browse all events

**Functionality:**

- Fetch all upcoming events, optionally filtered by category query param (Backend)
- Category filtering updates URL (`/events?category=live_music`) for shareability (Frontend)
- Past events excluded from query (Backend)
- Server-rendered for SEO (Backend)

---

### Event Detail -- `/events/[slug]`

**Purpose:** Full event details. Shareable URL that Wilson can send to customers or post on social media.

**Sections:**

- **Cover Image** (full-width with gradient overlay)
  - Event name in DM Serif Display
  - Event type badge

- **Event Info Card**
  - Date and time (formatted: "Saturday, March 28, 2026 at 7:00 PM")
  - Venue: cafe name (linked to `/cafes/[cafe-slug]`) + area
  - Ticket price: "₹299" or "Free Entry" (display only, no purchase flow)
  - Event type badge

- **Event Description**
  - Full description written by Wilson (supports longer text)

- **Venue Section**
  - Mini cafe card with cover image, name, area
  - Contact info: phone, Google Maps, Instagram
  - "View Full Cafe Profile" link to `/cafes/[cafe-slug]`

**Functionality:**

- Fetch event by slug with related cafe data (Backend)
- Cafe name links to cafe profile page (Frontend)
- Contact info for the venue displayed for quick access (Frontend)
- SEO meta tags with event name, date, cafe, and cover image as OG image (Backend)

---

### Partner Page -- `/partner`

**Purpose:** Pitch page for cafe owners + lead capture form. The URL Wilson sends to potential partners before or after a pitch meeting.

**Sections:**

- **Hero Section** (espresso background)
  - Headline: "Your Cafe Deserves to Be Discovered"
  - Subtitle: "Join Hyderabad's only platform built for independent cafes"

- **Value Proposition Section** (cream background)
  - 3-4 value cards with icons:
    - "Get Discovered" -- Your cafe listed with photos, menu, and contact info where customers are looking
    - "Fill Empty Tables" -- Reach thousands of experience-seeking customers in your area
    - "Host Events Effortlessly" -- We bring the bands, manage the logistics, you just host
    - "Plans Starting at ₹999/month" -- Affordable digital presence with no long-term contracts

- **How It Works** (milk background)
  - Step 1: "Fill the form below" (form icon)
  - Step 2: "We'll call you within 24 hours" (phone icon)
  - Step 3: "Your cafe goes live in days" (rocket icon)

- **Interest Form** (foam background card)
  - Heading: "Get Started"
  - Fields: Owner Name, Cafe Name, Phone Number, Area/Location (dropdown with known areas + "Other")
  - Submit button: "Request a Callback" (caramel)
  - Success state: toast "Thanks! Wilson will reach out within 24 hours" + form resets

- **Footer**

**Functionality:**

- Form validates all fields with Zod before submission (Frontend)
- Server Action saves lead to cafe_leads table in Supabase (Backend)
- Email notification sent to Wilson on new submission (Backend)
- Form resets and shows success toast on completion (Frontend)
- No auth required -- completely public form (Frontend)

---

### About Page -- `/about`

**Purpose:** Build credibility. Tell the story behind GoOut Hyd. Important for cafe owners evaluating whether to partner.

**Sections:**

- **Hero Section** (espresso background)
  - Headline: "Built in Hyderabad, for Hyderabad"

- **The Story** (cream background)
  - 2-3 paragraphs about Wilson's background as an event manager, his relationships with local bands and cafes, and why he built GoOut Hyd
  - The problem: independent cafes have no marketing infrastructure and no way to organize events
  - The solution: a platform that handles both discovery and event logistics

- **Mission Statement**
  - "We believe Hyderabad's best experiences happen at independent cafes, not chains. GoOut Hyd exists to make sure you never miss them."

- **Contact / CTA**
  - "Want to partner with us?" CTA linking to `/partner`
  - Social links (Instagram placeholder)

**Functionality:**

- Static content page, server-rendered (Backend)
- SEO meta tags (Backend)

---

### Privacy Policy -- `/privacy`

- Standard privacy policy covering data collection (partner form submissions, no user accounts in Phase 1)
- Static page, server-rendered

### Terms of Service -- `/terms`

- Standard terms of service for platform usage
- Static page, server-rendered

---

## Navigation Structure

### Top Navigation Bar (all pages)

- **Left:** GoOut Hyd wordmark (DM Serif Display, links to `/`)
- **Right (desktop):** Cafes | Events | About | List Your Cafe (caramel CTA button linking to `/partner`)
- **Right (mobile):** Hamburger menu icon, opens slide-out menu with same links
- **Background:** Espresso on all pages
- **Text:** Cream, with caramel on hover/active

### Footer (all pages)

- **Left column:** GoOut Hyd wordmark + "Discover Hyderabad's best independent cafes and events"
- **Center column:** Quick Links -- Cafes, Events, List Your Cafe, About, Privacy, Terms
- **Right column:** Social links (Instagram icon placeholder) + "Made with love in Hyderabad"
- **Background:** Espresso. Text: Cream/Foam.

---

## Next.js App Router Structure

### Layout Groups

```
app/
├── (public)/              # All pages (no auth in Phase 1)
│   ├── layout.tsx         # Shared layout: nav + footer
│   ├── page.tsx           # Landing page (/)
│   ├── cafes/
│   │   ├── page.tsx       # Cafe listing (/cafes)
│   │   └── [slug]/
│   │       └── page.tsx   # Cafe profile (/cafes/[slug])
│   ├── events/
│   │   ├── page.tsx       # Events listing (/events)
│   │   └── [slug]/
│   │       └── page.tsx   # Event detail (/events/[slug])
│   ├── partner/
│   │   └── page.tsx       # Partner pitch + form (/partner)
│   ├── about/
│   │   └── page.tsx       # About page (/about)
│   ├── privacy/
│   │   └── page.tsx       # Privacy policy (/privacy)
│   └── terms/
│       └── page.tsx       # Terms of service (/terms)
└── layout.tsx             # Root layout: fonts, metadata, Toaster
```

### Server Actions

```
app/actions/
└── leads.ts               # submitPartnerForm() -- validate, save to DB, send email to Wilson
```

### Lib Queries (Database Access)

```
lib/queries/
├── cafes.ts               # getAllCafes(), getCafeBySlug(), getCafesByArea()
├── events.ts              # getUpcomingEvents(), getEventBySlug(), getEventsByCategory(), getEventsByCafe()
└── areas.ts               # getActiveAreas() -- areas that have at least one listed cafe
```

### Architecture Flow

- **Page renders:** Server Component -> Lib Query -> Database -> Rendered HTML (SSR)
- **Partner form:** Client Component -> Server Action (leads.ts) -> Lib Query -> Database + Email Service
- **No API routes needed in Phase 1:** All data fetched server-side, only user interaction is the partner form

---

## MVP Functionality Summary

This blueprint delivers the core value proposition: **Give customers a reason to discover cafes, and give cafe owners a reason to get listed.**

**Phase 1 (Launch Ready):**

- 8 public pages (Landing, Cafes, Cafe Profile, Events, Event Detail, Partner, About, Privacy/Terms)
- Cafe discovery by area with card-based browsing
- Individual cafe profiles with photos, menu highlights, contact info, and events
- Event discovery by category with chronological listing
- Individual event pages with venue info and shareable URLs
- Partner lead capture with email notification to Wilson
- Responsive top navigation (desktop + mobile hamburger)
- SEO-optimized with proper meta tags and OG images on every page
- Zero authentication, zero payments, zero admin UI

**Phase 2 (Growth Features):**

- WhatsApp CTA buttons on cafe profiles
- Event ticketing with Razorpay and QR codes
- Cafe owner self-serve dashboard
- Customer accounts and authentication
- Cafe tags and advanced filtering (rooftop, pet-friendly, aesthetic, coworking-friendly)
- Admin UI for Wilson
- Content engine (reels, posts, influencer management)
- Wilson's weekly curated list
- 3D animated landing page
- Venue expansion (bars, clubs, rooftops)
- Compliance shield (FSSAI, IPRS, PPL guidance)

> **Next Step:** Ready for wireframe design with this blueprint as the foundation
