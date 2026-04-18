import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { events } from "./events";

export const ticketStatusEnum = pgEnum("ticket_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    quantity: integer("quantity").notNull().default(1),
    amountPaid: integer("amount_paid").notNull(),
    razorpayOrderId: text("razorpay_order_id").notNull().unique(),
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpaySignature: text("razorpay_signature"),
    ticketCode: text("ticket_code").notNull().unique(),
    status: ticketStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("tickets_razorpay_order_id_idx").on(t.razorpayOrderId),
    uniqueIndex("tickets_ticket_code_idx").on(t.ticketCode),
    index("tickets_event_id_idx").on(t.eventId),
    index("tickets_status_idx").on(t.status),
    index("tickets_customer_email_idx").on(t.customerEmail),
  ],
);

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
