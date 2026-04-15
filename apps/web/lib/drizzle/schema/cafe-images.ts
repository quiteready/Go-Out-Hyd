import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { cafes } from "./cafes";

export const cafeImages = pgTable(
  "cafe_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("cafe_images_cafe_id_idx").on(t.cafeId)],
);

export type CafeImage = typeof cafeImages.$inferSelect;
export type NewCafeImage = typeof cafeImages.$inferInsert;
