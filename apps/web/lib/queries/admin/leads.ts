import { desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { cafeLeads } from "@/lib/drizzle/schema";
import type { LeadStatusValue } from "@/lib/validations/admin/lead";

export type AdminLeadRow = typeof cafeLeads.$inferSelect;

export interface LeadListFilters {
  status?: LeadStatusValue;
}

export async function listLeads(
  filters: LeadListFilters = {},
): Promise<AdminLeadRow[]> {
  const where: SQL | undefined = filters.status
    ? eq(cafeLeads.status, filters.status)
    : undefined;

  const base = db.select().from(cafeLeads).orderBy(desc(cafeLeads.createdAt));
  return where ? base.where(where) : base;
}
