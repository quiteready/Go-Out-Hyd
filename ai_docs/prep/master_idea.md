## Master Idea Document

### End Goal

CafeConnect helps independent cafe owners in Hyderabad fill tables and generate event revenue by giving them a managed digital presence, a curated event infrastructure powered by Wilson's band and event network, and direct discovery by thousands of experience-seeking customers -- all starting at ₹999/month.

### Specific Problem

Independent cafe owners in Hyderabad are stuck because they have no affordable marketing infrastructure and no way to organize events on their own, leading to unpredictable footfall, empty tables on weekdays, and missed event revenue worth ₹15,000 to ₹50,000 per month per cafe. Meanwhile, customers aged 20-35 in Hyderabad have no single place to discover what is happening across cafes this weekend, forcing them back to Instagram and word of mouth where independent cafes always lose to chains with bigger budgets.

The urgency is real. Urban cafes face an 18-month survival window where initial buzz fades. Without a footfall strategy and event revenue, most independent cafes shut down before they find their footing.

### All User Types

#### Cafe Owners -- Primary Business Users

- **Who:** Independent cafe owners in Banjara Hills, Jubilee Hills, Kondapur, Gachibowli, and Madhapur. Typically 1 to 3 locations, 30 to 150 seats, no dedicated marketing team. These are priority areas for launch but the platform supports adding more areas over time.
- **Frustrations:**
  - Relying entirely on walk-ins with no way to fill slow weekdays
  - Spending ₹15,000 to ₹40,000/month on agencies or influencers with unclear ROI
  - No band contacts, no ticketing, no event management knowledge
  - No proper digital presence beyond a basic Instagram page
- **Urgent Goals:**
  - Get listed and discoverable within days, not months
  - Have someone else handle the event logistics so they just show up and host
  - Generate a second revenue stream beyond food and coffee sales

#### Customers -- End Consumers

- **Who:** Hyderabad residents aged 20-35, college students, young professionals, couples, content creators looking for aesthetic spaces, and experience seekers who want more than just a meal out.
- **Frustrations:**
  - No single place to find what is happening across cafes this weekend
  - Discovering good independent cafes only through friends or random Instagram posts
  - Missing events simply because they did not know about them
- **Urgent Goals:**
  - Find a cafe that matches the vibe they are looking for right now
  - Discover live music nights, workshops, and open mics happening nearby this week
  - Get a direct way to contact or visit a cafe without navigating five different apps

#### Wilson -- Platform Operator and Event Manager

- **Who:** The founder. Existing event manager with live band contacts and cafe relationships in Hyderabad.
- **Frustrations:**
  - No platform to centralize his work
  - Manages bands and events manually with no infrastructure
  - Cannot scale beyond what he can personally coordinate
- **Urgent Goals:**
  - Sign 40 to 50 cafes in month one
  - Have a live platform to demo during cafe pitches
  - Build a recurring revenue stream through subscriptions and event commissions

#### Developer -- Solo Builder

- **Who:** Solo full-stack developer building and maintaining the platform.
- **Urgent Goals:**
  - Ship a working MVP in one week
  - Keep the architecture simple enough to maintain alone
  - Build in a way that allows Phase 2 features without rebuilding from scratch

### Business Model & Revenue Strategy

- **Model Type:** Tiered Subscription plus Event Commission

- **Pricing Structure:**
  - **Basic (₹999/month):** Digital presence only. Cafe listed on the platform with photos, menu, events, and contact info. Booking commission at 10% per ticket sold through the platform.
  - **Growth (₹4,999/month):** Everything in Basic plus active footfall push. Two reels and four posts per month created by the platform. One shared nano-influencer visit per month. Commission drops to 7% per ticket.
  - **Premium (₹9,999/month):** Full managed experience. Professional photoshoot, eight reels per month, one micro-influencer visit. Wilson actively brings events and manages them. Commission drops to 5% per ticket.

- **Revenue Rationale:** A typical Hyderabad marketing agency charges ₹15,000 to ₹40,000/month for social media management alone. CafeConnect's Premium tier at ₹9,999 delivers more value -- digital presence plus real event management plus influencer access -- at a fraction of the cost. Cafe owners can also claim 18% GST input tax credit on subscriptions, lowering their effective cost further. The ₹999 entry price is low enough that Wilson can close deals on the spot. The Premium tier at ₹9,999 is the long-term revenue engine. Event commissions are the bonus that scales with Wilson's existing work.

### Core Functionalities by Role (MVP -- Phase 1)

- **Customers can:**
  - Browse all listed cafes by area
  - View a full cafe profile with photos, menu highlights, and upcoming events
  - See contact info on every cafe page: phone number, Google Maps link (opens directions), Instagram handle, and address
  - View all events happening across Hyderabad on the events page
  - Filter events by category (live music, open mic, workshops, comedy nights, gaming) using category cards at the top of the events page
  - Click an event to see full details including ticket price (display only, no online processing)

- **Cafe Owners can:**
  - Submit an interest form on the /partner page (fields: owner name, cafe name, phone number, area/location)
  - Receive a call from Wilson within 24 hours
  - Get their cafe manually onboarded and live on the platform

- **Wilson can:**
  - View all submitted cafe leads in Supabase (email notification on new submission)
  - Manually add and manage cafe profiles through Supabase dashboard
  - Add events tied to specific cafes with: event name, date/time, description, cover image, ticket price, event type
  - Share individual cafe profile URLs with owners as proof of work during pitches

- **Developer can:**
  - Manage all data directly through Supabase dashboard
  - Seed new cafes and events without a CMS

### Key User Stories

#### Customer Stories

1. **Browse Cafes by Area**
   _As a customer,_
   _I want to browse cafes by area in Hyderabad,_
   _So that I can find somewhere nearby that matches my mood tonight._

2. **View Cafe Details**
   _As a customer,_
   _I want to see a cafe's menu highlights and photos before visiting,_
   _So that I know what to expect and am not disappointed._

3. **Discover Events**
   _As a customer,_
   _I want to see all events happening this weekend across cafes,_
   _So that I do not miss live music or a workshop I would have enjoyed._

4. **Filter Events by Category**
   _As a customer,_
   _I want to click a category card like "Live Music" on the events page,_
   _So that I only see the type of event I am interested in._

5. **Contact a Cafe**
   _As a customer,_
   _I want to see a cafe's phone number, Google Maps directions, and Instagram on their profile,_
   _So that I can contact them or navigate there immediately._

#### Cafe Owner Stories

1. **Express Interest**
   _As a cafe owner,_
   _I want to fill in a simple interest form with my name, cafe name, phone, and area,_
   _So that Wilson contacts me quickly without a long back-and-forth._

2. **See My Cafe Listed**
   _As a cafe owner,_
   _I want to see my cafe listed with photos and menu on a professional platform,_
   _So that I have something credible to share with my own customers._

3. **Events on My Page**
   _As a cafe owner,_
   _I want upcoming events displayed on my cafe page,_
   _So that customers know what is happening and plan visits accordingly._

#### Wilson Stories

1. **View Leads**
   _As Wilson,_
   _I want to receive an email when a cafe owner submits the partner form,_
   _So that I can follow up within 24 hours._

2. **Demo the Platform**
   _As Wilson,_
   _I want to share a live cafe profile URL with an owner during a pitch,_
   _So that I have real proof the platform works._

3. **Manage Events**
   _As Wilson,_
   _I want to add and update events tied to cafes through Supabase,_
   _So that the platform stays current without depending on the developer for every change._

#### System / Background

1. When a cafe owner submits the partner form, their data is saved to the cafe_leads table in Supabase and Wilson receives an email notification.

### Value-Adding Features (Phase 2 and Beyond)

- **Wilson's Weekly Curated List:** A manually curated "what to do this weekend" section on the homepage. Drives repeat visits from customers and positions CafeConnect as a Hyderabad experience authority, not just a listing site.

- **WhatsApp Integration:** WhatsApp CTA button on every cafe page for instant customer contact. WhatsApp notification to Wilson on new lead submissions.

- **Compliance Shield Pitch:** Display FSSAI, IPRS, PPL, and Police NOC guidance within the platform for cafe owners. Wilson frames this as a service that protects them from legal risk during live events, a powerful differentiator during cafe pitches.

- **Event Ticketing with QR Codes:** Once Wilson has real events running, add Razorpay payment flow and QR code ticket generation. Commission revenue starts flowing automatically without manual coordination.

- **Cafe Owner Self-Serve Dashboard:** After 20 plus cafes are live, give owners the ability to update their own menu, photos, and events without depending on Wilson or the developer.

- **Customer Accounts and Auth:** User registration, saved favorites, event history, and personalized recommendations.

- **Cafe Tags and Advanced Filtering:** Tag cafes with attributes like rooftop, pet-friendly, aesthetic, coworking-friendly. Let customers filter and search by tags.

- **Content Engine:** Reels, posts, and influencer coordination managed through the platform for Growth and Premium tier subscribers.

- **3D Animated Landing Page:** Premium animated landing experience to elevate brand perception.

- **Admin UI for Wilson:** Dedicated dashboard for Wilson to manage cafes, events, and leads without using Supabase directly.

- **Venue Expansion:** Expand beyond cafes to include bars, clubs, and rooftops. The platform name and structure should be built wide enough that this does not require a rebrand.

### Technical Decisions

- **Codebase:** Repurpose existing repo. Keep Next.js 15 App Router, Supabase connection, Drizzle ORM, Tailwind CSS, and Vercel deployment. Strip all RAG-specific code: document upload, embeddings, vector search, AI chat, OpenAI/LangChain dependencies.
- **Database:** Fresh schema built for CafeConnect. All RAG tables replaced.
- **Auth:** Supabase email/password auth remains in the codebase but is dormant. Phase 1 has no user-facing authentication. The entire consumer experience is public.
- **SEO:** Important for organic discovery. Needs research on local business SEO for Hyderabad cafes and events.
- **Maps:** Google Maps as clickable external links (opens directions). No embedded maps.
- **Payments:** No online payment processing in Phase 1. Ticket prices displayed for information only. Wilson handles all transactions manually.
- **Scalability:** Architecture must support expanding to bars, clubs, and rooftops without a platform rebrand.

### Brand

- **Name:** GoOut Hyd
- **Domain:** goouthyd.com
- **Target Feel:** Warm, premium, modern. Light-first design with espresso/caramel/cream palette.
- **Typography:** DM Serif Display (headings) + DM Sans (body)
- **Social Handles:** TBD (check @goouthyd on Instagram, Twitter)

### Alignment Check

Every feature in the MVP directly serves one of three goals: giving Wilson a platform to sign cafes, giving cafe owners a credible digital presence, or giving customers a reason to discover and visit cafes. Nothing in Phase 1 exists for its own sake.
