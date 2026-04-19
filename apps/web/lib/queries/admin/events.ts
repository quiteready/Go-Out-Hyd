import { eq, sql, desc, and } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { events, cafes, tickets } from "@/lib/drizzle/schema";

export type AdminEventListRow = typeof events.$inferSelect & {
  cafe: { id: string; name: string; slug: string } | null;
  ticketsSold: number;
};

export async function listEventsForAdmin(): Promise<AdminEventListRow[]> {
  const ticketCounts = db.$with("ticket_counts").as(
    db
      .select({
        eventId: tickets.eventId,
        ticketsSold: sql<number>`count(*)::int`.as("tickets_sold"),
      })
      .from(tickets)
      .where(eq(tickets.status, "paid"))
      .groupBy(tickets.eventId),
  );

  const rows = await db
    .with(ticketCounts)
    .select({
      event: events,
      cafeId: cafes.id,
      cafeName: cafes.name,
      cafeSlug: cafes.slug,
      ticketsSold: sql<number>`coalesce(${ticketCounts.ticketsSold}, 0)::int`,
    })
    .from(events)
    .leftJoin(cafes, eq(events.cafeId, cafes.id))
    .leftJoin(ticketCounts, eq(ticketCounts.eventId, events.id))
    .orderBy(desc(events.startTime));

  return rows.map((row) => ({
    ...row.event,
    cafe:
      row.cafeId && row.cafeName && row.cafeSlug
        ? { id: row.cafeId, name: row.cafeName, slug: row.cafeSlug }
        : null,
    ticketsSold: row.ticketsSold,
  }));
}

export type AdminEventDetail = typeof events.$inferSelect & {
  cafe: typeof cafes.$inferSelect | null;
  ticketsSold: number;
};

export async function getEventForAdmin(
  id: string,
): Promise<AdminEventDetail | null> {
  const rows = await db
    .select({
      event: events,
      cafe: cafes,
    })
    .from(events)
    .leftJoin(cafes, eq(events.cafeId, cafes.id))
    .where(eq(events.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const ticketsSold = await countPaidTicketsForEvent(id);

  return {
    ...row.event,
    cafe: row.cafe ?? null,
    ticketsSold,
  };
}

export async function countPaidTicketsForEvent(
  eventId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(and(eq(tickets.eventId, eventId), eq(tickets.status, "paid")));
  return row?.count ?? 0;
}

export type CafePickerOption = {
  id: string;
  name: string;
  area: string;
  slug: string;
  status: typeof cafes.$inferSelect.status;
};

export async function listCafesForPicker(): Promise<CafePickerOption[]> {
  const rows = await db
    .select({
      id: cafes.id,
      name: cafes.name,
      area: cafes.area,
      slug: cafes.slug,
      status: cafes.status,
    })
    .from(cafes)
    .orderBy(cafes.name);
  return rows;
}
