import { desc, eq, type SQL } from "drizzle-orm";

import { db } from "@/lib/drizzle/db";
import { eventLeads } from "@/lib/drizzle/schema";
import type { LeadStatusValue } from "@/lib/validations/admin/lead";

export type AdminEventLeadRow = typeof eventLeads.$inferSelect;

export interface EventLeadListFilters {
  status?: LeadStatusValue;
}

export async function listEventLeads(
  filters: EventLeadListFilters = {},
): Promise<AdminEventLeadRow[]> {
  const where: SQL | undefined = filters.status
    ? eq(eventLeads.status, filters.status)
    : undefined;

  const base = db.select().from(eventLeads).orderBy(desc(eventLeads.createdAt));
  return where ? base.where(where) : base;
}
