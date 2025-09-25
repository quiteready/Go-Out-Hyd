"use server";

import { db } from "@/lib/drizzle/db";
import {
  documents,
  USAGE_EVENT_TYPES,
  userUsageEvents,
} from "@/lib/drizzle/schema";
import { sql, eq, and, gte } from "drizzle-orm";
import { requireAdminAccess } from "@/lib/auth";

type ServerActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

/**
 * Gets RAG statistics for admin dashboard.
 * ADMIN ONLY - Should only be callable by admin users.
 */
export async function getRAGStatsForAdmin(): Promise<
  ServerActionResponse<{
    totalDocuments: number;
    totalStorageUsed: number;
    totalRequests: number;
    requests7Days: number;
    requests30Days: number;
  }>
> {
  try {
    // Verify user has admin role (handles authentication internally)
    await requireAdminAccess();

    // Get document statistics
    const documentStats = await db
      .select({
        total: sql<number>`count(*)`.as("total"),
        totalStorage: sql<number>`sum(${documents.file_size})`.as(
          "totalStorage",
        ),
      })
      .from(documents);

    // Get AI request count from usage events (total)
    const totalRequestStats = await db
      .select({
        total: sql<number>`count(*)`.as("total"),
      })
      .from(userUsageEvents)
      .where(eq(userUsageEvents.eventType, USAGE_EVENT_TYPES.MESSAGE));

    // Calculate date boundaries for time windows
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get AI request count from usage events (7 days)
    const requests7DaysStats = await db
      .select({
        total: sql<number>`count(*)`.as("total"),
      })
      .from(userUsageEvents)
      .where(
        and(
          eq(userUsageEvents.eventType, USAGE_EVENT_TYPES.MESSAGE),
          gte(userUsageEvents.createdAt, sevenDaysAgo),
        ),
      );

    // Get AI request count from usage events (30 days)
    const requests30DaysStats = await db
      .select({
        total: sql<number>`count(*)`.as("total"),
      })
      .from(userUsageEvents)
      .where(
        and(
          eq(userUsageEvents.eventType, USAGE_EVENT_TYPES.MESSAGE),
          gte(userUsageEvents.createdAt, thirtyDaysAgo),
        ),
      );

    const docStat = documentStats[0];
    const totalRequestStat = totalRequestStats[0];
    const requests7DaysStat = requests7DaysStats[0];
    const requests30DaysStat = requests30DaysStats[0];

    const stats = {
      totalDocuments: Number(docStat?.total) || 0,
      totalStorageUsed: Number(docStat?.totalStorage) || 0,
      totalRequests: Number(totalRequestStat?.total) || 0,
      requests7Days: Number(requests7DaysStat?.total) || 0,
      requests30Days: Number(requests30DaysStat?.total) || 0,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching RAG stats for admin:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch RAG statistics",
    };
  }
}
