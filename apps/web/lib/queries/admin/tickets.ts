import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { tickets, events, cafes } from "@/lib/drizzle/schema";

export type TicketStatus = (typeof tickets.$inferSelect)["status"];

export interface TicketFilters {
  eventId?: string;
  status?: TicketStatus;
  /** Inclusive lower bound on `tickets.created_at` (UTC ISO). */
  fromDate?: string;
  /** Inclusive upper bound on `tickets.created_at` (UTC ISO). */
  toDate?: string;
}

export type AdminTicketRow = typeof tickets.$inferSelect & {
  event: {
    id: string;
    title: string;
    slug: string;
    startTime: Date;
  };
  /** Display label: cafe.name OR event.venue_name OR "—". */
  venueLabel: string;
};

/**
 * Build the WHERE expression shared by both the table and CSV queries.
 * Returns `undefined` when no filters are set so callers can omit `where(...)`.
 */
function buildTicketWhere(filters: TicketFilters): SQL | undefined {
  const conditions: SQL[] = [];
  if (filters.eventId) {
    conditions.push(eq(tickets.eventId, filters.eventId));
  }
  if (filters.status) {
    conditions.push(eq(tickets.status, filters.status));
  }
  if (filters.fromDate) {
    const from = new Date(filters.fromDate);
    if (!Number.isNaN(from.getTime())) {
      conditions.push(gte(tickets.createdAt, from));
    }
  }
  if (filters.toDate) {
    const to = new Date(filters.toDate);
    if (!Number.isNaN(to.getTime())) {
      conditions.push(lte(tickets.createdAt, to));
    }
  }
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export async function listTicketsForAdmin(
  filters: TicketFilters = {},
): Promise<AdminTicketRow[]> {
  const where = buildTicketWhere(filters);

  const baseQuery = db
    .select({
      ticket: tickets,
      event: {
        id: events.id,
        title: events.title,
        slug: events.slug,
        startTime: events.startTime,
        venueName: events.venueName,
      },
      cafeName: cafes.name,
    })
    .from(tickets)
    .innerJoin(events, eq(tickets.eventId, events.id))
    .leftJoin(cafes, eq(events.cafeId, cafes.id));

  const rows = await (where ? baseQuery.where(where) : baseQuery).orderBy(
    desc(tickets.createdAt),
  );

  return rows.map((row) => ({
    ...row.ticket,
    event: {
      id: row.event.id,
      title: row.event.title,
      slug: row.event.slug,
      startTime: row.event.startTime,
    },
    venueLabel: row.cafeName ?? row.event.venueName ?? "—",
  }));
}

export interface TicketsCsvRow {
  bookingDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  amountPaid: number;
  ticketCode: string;
  status: TicketStatus;
  eventTitle: string;
  eventDate: string;
}

const IST_DATETIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

export async function getTicketsCsvRows(
  filters: TicketFilters = {},
): Promise<TicketsCsvRow[]> {
  const rows = await listTicketsForAdmin(filters);
  return rows.map((row) => ({
    bookingDate: IST_DATETIME_FORMATTER.format(row.createdAt),
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    quantity: row.quantity,
    amountPaid: row.amountPaid,
    ticketCode: row.ticketCode,
    status: row.status,
    eventTitle: row.event.title,
    eventDate: IST_DATETIME_FORMATTER.format(row.event.startTime),
  }));
}

export interface AdminTicketEventOption {
  id: string;
  title: string;
}

/**
 * Distinct list of events that have at least one ticket record. Used to
 * populate the event-filter dropdown on `/admin/tickets`.
 */
export async function listEventsWithTickets(): Promise<AdminTicketEventOption[]> {
  const rows = await db
    .selectDistinct({ id: events.id, title: events.title })
    .from(events)
    .innerJoin(tickets, eq(tickets.eventId, events.id))
    .orderBy(events.title);
  return rows;
}
