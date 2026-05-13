import { pgTable, pgEnum, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const eventLeadStatusEnum = pgEnum("event_lead_status", [
  "new",
  "contacted",
  "converted",
  "closed",
]);

export const eventLeadTicketingTypeEnum = pgEnum("event_lead_ticketing_type", [
  "free",
  "paid",
  "undecided",
]);

export const eventLeads = pgTable(
  "event_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    contactInstagramHandle: text("contact_instagram_handle"),
    eventTitle: text("event_title").notNull(),
    eventType: text("event_type"),
    expectedDateNote: text("expected_date_note"),
    venueName: text("venue_name"),
    area: text("area"),
    ticketingType: eventLeadTicketingTypeEnum("ticketing_type")
      .notNull()
      .default("undecided"),
    expectedTicketPrice: integer("expected_ticket_price"),
    details: text("details"),
    status: eventLeadStatusEnum("status").notNull().default("new"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("event_leads_status_idx").on(t.status),
    index("event_leads_created_at_idx").on(t.createdAt),
  ],
);

export type EventLead = typeof eventLeads.$inferSelect;
export type NewEventLead = typeof eventLeads.$inferInsert;
