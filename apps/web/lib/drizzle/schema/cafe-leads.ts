import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "converted",
  "closed",
]);

export const cafeLeads = pgTable(
  "cafe_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerName: text("owner_name").notNull(),
    cafeName: text("cafe_name").notNull(),
    phone: text("phone").notNull(),
    area: text("area").notNull(),
    status: leadStatusEnum("status").notNull().default("new"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("cafe_leads_status_idx").on(t.status),
    index("cafe_leads_created_at_idx").on(t.createdAt),
  ],
);

export type CafeLead = typeof cafeLeads.$inferSelect;
export type NewCafeLead = typeof cafeLeads.$inferInsert;
