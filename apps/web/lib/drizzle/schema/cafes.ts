import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const cafeStatusEnum = pgEnum("cafe_status", ["active", "inactive"]);

export const cafes = pgTable(
  "cafes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    area: text("area").notNull(),
    description: text("description"),
    coverImage: text("cover_image"),
    phone: text("phone"),
    instagramHandle: text("instagram_handle"),
    googleMapsUrl: text("google_maps_url"),
    address: text("address"),
    openingHours: text("opening_hours"),
    status: cafeStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("cafes_slug_idx").on(t.slug),
    index("cafes_area_idx").on(t.area),
    index("cafes_status_idx").on(t.status),
  ],
);

export type Cafe = typeof cafes.$inferSelect;
export type NewCafe = typeof cafes.$inferInsert;
