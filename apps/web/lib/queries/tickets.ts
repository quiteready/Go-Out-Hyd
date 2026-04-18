import { eq, and, count } from "drizzle-orm";

import { db } from "@/lib/drizzle/db";
import { tickets, events, cafes } from "@/lib/drizzle/schema";

export type TicketWithEventAndCafe = typeof tickets.$inferSelect & {
  event: typeof events.$inferSelect & {
    cafe: Pick<typeof cafes.$inferSelect, "name" | "area"> | null;
  };
};

export async function getTicketByCode(
  ticketCode: string,
): Promise<TicketWithEventAndCafe | null> {
  const rows = await db
    .select({
      ticket: tickets,
      event: events,
      cafe: {
        name: cafes.name,
        area: cafes.area,
      },
    })
    .from(tickets)
    .innerJoin(events, eq(tickets.eventId, events.id))
    .leftJoin(cafes, eq(events.cafeId, cafes.id))
    .where(eq(tickets.ticketCode, ticketCode))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    ...row.ticket,
    event: {
      ...row.event,
      cafe: row.cafe?.name ? row.cafe : null,
    },
  };
}

export async function countSoldTickets(eventId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(tickets)
    .where(and(eq(tickets.eventId, eventId), eq(tickets.status, "paid")));

  return result[0]?.count ?? 0;
}
