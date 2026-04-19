import { and, count, desc, eq, gt, gte, lt } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { cafes, events, tickets, cafeLeads } from "@/lib/drizzle/schema";

const IST_OFFSET_MINUTES = 5 * 60 + 30;

/** `YYYY-MM-DD` in Asia/Kolkata for instant `d`. */
function formatDateKolkata(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** IST calendar midnight for `YYYY-MM-DD` → stored UTC `Date` (same offset trick as `DateTimePickerIST`). */
function kolkataDateStartUtc(ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return new Date(NaN);
  const [, ys, mos, ds] = m;
  const istEpoch = Date.UTC(Number(ys), Number(mos) - 1, Number(ds), 0, 0, 0, 0);
  return new Date(istEpoch - IST_OFFSET_MINUTES * 60 * 1000);
}

function startOfTodayIst(now: Date): Date {
  return kolkataDateStartUtc(formatDateKolkata(now));
}

function startOfTomorrowIst(now: Date): Date {
  return new Date(startOfTodayIst(now).getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Monday 00:00 IST of the week that contains `now` (ISO week: Monday–Sunday).
 */
function startOfWeekMondayIst(now: Date): Date {
  const todayStart = startOfTodayIst(now);
  const w = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(todayStart.getTime() + 12 * 60 * 60 * 1000));
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  const idx = order.indexOf(w as (typeof order)[number]);
  const daysFromMonday = idx === -1 ? 0 : idx;
  return new Date(todayStart.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
}

export interface OverviewCounts {
  activeCafes: number;
  upcomingEvents: number;
  ticketsSoldThisWeek: number;
  ticketsSoldToday: number;
  newLeads: number;
}

export async function getOverviewCounts(): Promise<OverviewCounts> {
  const now = new Date();
  const weekStart = startOfWeekMondayIst(now);
  const dayStart = startOfTodayIst(now);
  const dayEnd = startOfTomorrowIst(now);

  const [
    activeCafesRow,
    upcomingEventsRow,
    weekTicketsRow,
    todayTicketsRow,
    newLeadsRow,
  ] = await Promise.all([
    db
      .select({ c: count() })
      .from(cafes)
      .where(eq(cafes.status, "active")),
    db
      .select({ c: count() })
      .from(events)
      .where(
        and(eq(events.status, "upcoming"), gt(events.startTime, now)),
      ),
    db
      .select({ c: count() })
      .from(tickets)
      .where(
        and(
          eq(tickets.status, "paid"),
          gte(tickets.createdAt, weekStart),
        ),
      ),
    db
      .select({ c: count() })
      .from(tickets)
      .where(
        and(
          eq(tickets.status, "paid"),
          gte(tickets.createdAt, dayStart),
          lt(tickets.createdAt, dayEnd),
        ),
      ),
    db
      .select({ c: count() })
      .from(cafeLeads)
      .where(eq(cafeLeads.status, "new")),
  ]);

  return {
    activeCafes: Number(activeCafesRow[0]?.c ?? 0),
    upcomingEvents: Number(upcomingEventsRow[0]?.c ?? 0),
    ticketsSoldThisWeek: Number(weekTicketsRow[0]?.c ?? 0),
    ticketsSoldToday: Number(todayTicketsRow[0]?.c ?? 0),
    newLeads: Number(newLeadsRow[0]?.c ?? 0),
  };
}

export type RecentLeadRow = {
  id: string;
  ownerName: string;
  cafeName: string;
  status: typeof cafeLeads.$inferSelect.status;
  createdAt: Date;
};

export type RecentTicketRow = {
  id: string;
  customerName: string;
  eventId: string;
  eventTitle: string;
  amountPaid: number;
  status: typeof tickets.$inferSelect.status;
  ticketCode: string;
  createdAt: Date;
};

export type RecentEventRow = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
};

export interface RecentActivity {
  leads: RecentLeadRow[];
  tickets: RecentTicketRow[];
  eventsCreated: RecentEventRow[];
}

export async function getRecentActivity(): Promise<RecentActivity> {
  const [leads, ticketRows, eventRows] = await Promise.all([
    db
      .select({
        id: cafeLeads.id,
        ownerName: cafeLeads.ownerName,
        cafeName: cafeLeads.cafeName,
        status: cafeLeads.status,
        createdAt: cafeLeads.createdAt,
      })
      .from(cafeLeads)
      .orderBy(desc(cafeLeads.createdAt))
      .limit(5),
    db
      .select({
        id: tickets.id,
        customerName: tickets.customerName,
        eventId: events.id,
        eventTitle: events.title,
        amountPaid: tickets.amountPaid,
        status: tickets.status,
        ticketCode: tickets.ticketCode,
        createdAt: tickets.createdAt,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .orderBy(desc(tickets.createdAt))
      .limit(5),
    db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        createdAt: events.createdAt,
      })
      .from(events)
      .orderBy(desc(events.createdAt))
      .limit(5),
  ]);

  return {
    leads,
    tickets: ticketRows,
    eventsCreated: eventRows,
  };
}
