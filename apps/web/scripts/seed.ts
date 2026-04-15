import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { cafes, cafeImages, menuItems, events } from "../lib/drizzle/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL, { prepare: false });
const db = drizzle(client);

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing seed data (order matters — children first)
  await db.delete(events);
  await db.delete(menuItems);
  await db.delete(cafeImages);
  await db.delete(cafes);

  console.log("🗑️  Cleared existing data");

  // ── Cafes ──────────────────────────────────────────────────────────────────

  const [roast, blend, clay, filter] = await db
    .insert(cafes)
    .values([
      {
        name: "The Roast",
        slug: "the-roast",
        area: "Banjara Hills",
        description:
          "A specialty coffee haven in the heart of Banjara Hills. Single-origin beans, precision brews, and a relaxed ambience that makes every visit feel like a slow Saturday morning.",
        coverImage: "https://picsum.photos/800/600?random=1",
        phone: "+91 98765 43210",
        instagramHandle: "@theroasthyd",
        googleMapsUrl: "https://maps.google.com/?q=The+Roast+Banjara+Hills+Hyderabad",
        address: "Plot 42, Road No. 12, Banjara Hills, Hyderabad – 500034",
        openingHours: "Mon–Sat 8 AM – 10 PM · Sun 9 AM – 9 PM",
        status: "active",
      },
      {
        name: "Cafe Blend",
        slug: "cafe-blend",
        area: "Jubilee Hills",
        description:
          "Jubilee Hills' favourite neighbourhood cafe. Artisanal espresso, freshly baked goods, and a warm corner perfect for catching up with friends or working through the afternoon.",
        coverImage: "https://picsum.photos/800/600?random=2",
        phone: "+91 98765 43211",
        instagramHandle: "@cafeblend_hyd",
        googleMapsUrl: "https://maps.google.com/?q=Cafe+Blend+Jubilee+Hills+Hyderabad",
        address: "8-2-120, Road No. 2, Jubilee Hills, Hyderabad – 500033",
        openingHours: "Daily 8 AM – 11 PM",
        status: "active",
      },
      {
        name: "Clay & Coffee",
        slug: "clay-and-coffee",
        area: "Kondapur",
        description:
          "Where craft and caffeine meet. Clay & Coffee pairs specialty brews with hands-on pottery workshops — a unique creative retreat in Kondapur loved by artists and techies alike.",
        coverImage: "https://picsum.photos/800/600?random=3",
        phone: "+91 98765 43212",
        instagramHandle: "@clayandcoffee",
        googleMapsUrl: "https://maps.google.com/?q=Clay+and+Coffee+Kondapur+Hyderabad",
        address: "Survey No. 15, Kondapur Main Road, Kondapur, Hyderabad – 500084",
        openingHours: "Tue–Sun 10 AM – 9 PM · Closed Monday",
        status: "active",
      },
      {
        name: "Filter House",
        slug: "filter-house",
        area: "Gachibowli",
        description:
          "A love letter to South Indian filter coffee. Filter House serves traditional decoctions alongside modern cold brews, tucked in a breezy Gachibowli space popular with the tech crowd.",
        coverImage: "https://picsum.photos/800/600?random=4",
        phone: "+91 98765 43213",
        instagramHandle: "@filterhousehyd",
        googleMapsUrl: "https://maps.google.com/?q=Filter+House+Gachibowli+Hyderabad",
        address: "Plot 7, DLF Cyber City Road, Gachibowli, Hyderabad – 500032",
        openingHours: "Mon–Fri 7 AM – 10 PM · Sat–Sun 8 AM – 10 PM",
        status: "active",
      },
    ])
    .returning();

  console.log("☕  Inserted 4 cafes");

  // ── Cafe Images ───────────────────────────────────────────────────────────

  await db.insert(cafeImages).values([
    // The Roast
    { cafeId: roast.id, imageUrl: "https://picsum.photos/800/600?random=5",  altText: "The Roast interior", sortOrder: 0 },
    { cafeId: roast.id, imageUrl: "https://picsum.photos/800/600?random=6",  altText: "Espresso bar at The Roast", sortOrder: 1 },
    { cafeId: roast.id, imageUrl: "https://picsum.photos/800/600?random=7",  altText: "Seating area at The Roast", sortOrder: 2 },
    // Cafe Blend
    { cafeId: blend.id, imageUrl: "https://picsum.photos/800/600?random=8",  altText: "Cafe Blend entrance", sortOrder: 0 },
    { cafeId: blend.id, imageUrl: "https://picsum.photos/800/600?random=9",  altText: "Coffee at Cafe Blend", sortOrder: 1 },
    { cafeId: blend.id, imageUrl: "https://picsum.photos/800/600?random=10", altText: "Cafe Blend pastries", sortOrder: 2 },
    // Clay & Coffee
    { cafeId: clay.id,  imageUrl: "https://picsum.photos/800/600?random=11", altText: "Clay & Coffee pottery station", sortOrder: 0 },
    { cafeId: clay.id,  imageUrl: "https://picsum.photos/800/600?random=12", altText: "Clay & Coffee interior", sortOrder: 1 },
    { cafeId: clay.id,  imageUrl: "https://picsum.photos/800/600?random=13", altText: "Clay & Coffee brews", sortOrder: 2 },
    // Filter House
    { cafeId: filter.id, imageUrl: "https://picsum.photos/800/600?random=14", altText: "Filter House decoction bar", sortOrder: 0 },
    { cafeId: filter.id, imageUrl: "https://picsum.photos/800/600?random=15", altText: "Filter House seating", sortOrder: 1 },
    { cafeId: filter.id, imageUrl: "https://picsum.photos/800/600?random=16", altText: "South Indian filter coffee", sortOrder: 2 },
  ]);

  console.log("🖼️   Inserted cafe images");

  // ── Menu Items ────────────────────────────────────────────────────────────

  await db.insert(menuItems).values([
    // The Roast
    { cafeId: roast.id, category: "Coffee",    name: "Single Origin Pour Over",  price: 280, description: "Ethiopian Yirgacheffe, bright and floral",    isAvailable: true, sortOrder: 0 },
    { cafeId: roast.id, category: "Coffee",    name: "Flat White",               price: 220, description: "Double ristretto with velvety microfoam",     isAvailable: true, sortOrder: 1 },
    { cafeId: roast.id, category: "Cold",      name: "Cold Brew Tonic",          price: 260, description: "18-hour cold brew over tonic and ice",        isAvailable: true, sortOrder: 2 },
    { cafeId: roast.id, category: "Food",      name: "Avocado Toast",            price: 320, description: "Sourdough, smashed avocado, chilli flakes",   isAvailable: true, sortOrder: 3 },
    { cafeId: roast.id, category: "Food",      name: "Banana Walnut Muffin",     price: 160, description: "Freshly baked each morning",                  isAvailable: true, sortOrder: 4 },
    // Cafe Blend
    { cafeId: blend.id, category: "Coffee",    name: "Cappuccino",               price: 200, description: "House blend with silky steamed milk",         isAvailable: true, sortOrder: 0 },
    { cafeId: blend.id, category: "Coffee",    name: "Signature Caramel Latte",  price: 250, description: "Espresso, oat milk, house caramel syrup",     isAvailable: true, sortOrder: 1 },
    { cafeId: blend.id, category: "Cold",      name: "Iced Matcha Latte",        price: 280, description: "Ceremonial grade matcha over almond milk",    isAvailable: true, sortOrder: 2 },
    { cafeId: blend.id, category: "Food",      name: "Croissant",                price: 180, description: "Buttery, flaky, baked in-house daily",        isAvailable: true, sortOrder: 3 },
    { cafeId: blend.id, category: "Food",      name: "Club Sandwich",            price: 340, description: "Triple-decker with chicken, egg and cheese",  isAvailable: true, sortOrder: 4 },
    // Clay & Coffee
    { cafeId: clay.id,  category: "Coffee",    name: "V60 Drip",                 price: 260, description: "Clean and bright, highlights bean origin",    isAvailable: true, sortOrder: 0 },
    { cafeId: clay.id,  category: "Coffee",    name: "AeroPress",                price: 240, description: "Rich, full-bodied, low acidity",              isAvailable: true, sortOrder: 1 },
    { cafeId: clay.id,  category: "Cold",      name: "Nitro Cold Brew",          price: 300, description: "Nitrogen-infused, creamy and smooth",         isAvailable: true, sortOrder: 2 },
    { cafeId: clay.id,  category: "Food",      name: "Granola Bowl",             price: 260, description: "House granola, Greek yoghurt, seasonal fruit", isAvailable: true, sortOrder: 3 },
    { cafeId: clay.id,  category: "Workshop",  name: "Pottery Workshop (1.5 hr)", price: 800, description: "Wheel throwing session, all materials included", isAvailable: true, sortOrder: 4 },
    // Filter House
    { cafeId: filter.id, category: "Filter Coffee", name: "Traditional Filter Coffee", price: 120, description: "Strong decoction, full cream milk, served in steel tumbler", isAvailable: true, sortOrder: 0 },
    { cafeId: filter.id, category: "Filter Coffee", name: "Degree Coffee",             price: 140, description: "Classic Madras-style with chicory blend",             isAvailable: true, sortOrder: 1 },
    { cafeId: filter.id, category: "Cold",          name: "Cold Filter Coffee",        price: 200, description: "Decoction concentrate over ice and milk",            isAvailable: true, sortOrder: 2 },
    { cafeId: filter.id, category: "Food",          name: "Idli Sambar",               price: 150, description: "Soft rice idlis with aromatic sambar and chutneys",  isAvailable: true, sortOrder: 3 },
    { cafeId: filter.id, category: "Food",          name: "Masala Dosa",               price: 180, description: "Crispy dosa with spiced potato filling",             isAvailable: true, sortOrder: 4 },
  ]);

  console.log("🍽️   Inserted menu items");

  // ── Events ────────────────────────────────────────────────────────────────
  // Dates are set in April 2026 so they appear as "upcoming"

  await db.insert(events).values([
    {
      cafeId: roast.id,
      title: "Beans & Beats — Live Jazz Night",
      slug: "beans-and-beats-live-jazz-the-roast-apr2026",
      description:
        "An intimate evening of live jazz with a rotating trio of Hyderabad's finest musicians. Sip a special flight of single-origin brews while the music flows.",
      eventType: "live_music",
      startTime: new Date("2026-04-05T19:00:00+05:30"),
      endTime: new Date("2026-04-05T22:00:00+05:30"),
      ticketPrice: 399,
      coverImage: "https://picsum.photos/800/600?random=17",
      status: "upcoming",
    },
    {
      cafeId: blend.id,
      title: "Open Mic Sunday at Cafe Blend",
      slug: "open-mic-sunday-cafe-blend-apr2026",
      description:
        "Pull up a stool and take the mic. Poets, comedians, storytellers, and musicians welcome. Sign-up at the counter from 5 PM.",
      eventType: "open_mic",
      startTime: new Date("2026-04-12T17:30:00+05:30"),
      endTime: new Date("2026-04-12T21:00:00+05:30"),
      ticketPrice: 0,
      coverImage: "https://picsum.photos/800/600?random=18",
      status: "upcoming",
    },
    {
      cafeId: clay.id,
      title: "Wheel Throwing Workshop — Beginner Session",
      slug: "wheel-throwing-workshop-clay-coffee-apr2026",
      description:
        "Learn the basics of wheel-throwing pottery in a hands-on 2-hour session. Coffee included. All skill levels welcome — no experience needed.",
      eventType: "workshop",
      startTime: new Date("2026-04-19T11:00:00+05:30"),
      endTime: new Date("2026-04-19T13:00:00+05:30"),
      ticketPrice: 800,
      coverImage: "https://picsum.photos/800/600?random=19",
      status: "upcoming",
    },
    {
      cafeId: filter.id,
      title: "Stand-Up Night: Hyderabad Laughs",
      slug: "standup-night-hyderabad-laughs-filter-house-apr2026",
      description:
        "Three up-and-coming Hyderabad comedians take the stage at Filter House. A cup of filter coffee and a belly full of laughs guaranteed.",
      eventType: "comedy_night",
      startTime: new Date("2026-04-25T20:00:00+05:30"),
      endTime: new Date("2026-04-25T22:30:00+05:30"),
      ticketPrice: 299,
      coverImage: "https://picsum.photos/800/600?random=20",
      status: "upcoming",
    },
  ]);

  console.log("🎉  Inserted events");

  console.log("\n✅  Seed complete!");
  console.log("   4 cafes · 12 cafe images · 20 menu items · 4 events");

  await client.end();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
