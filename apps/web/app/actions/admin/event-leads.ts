"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { assertAdminSession } from "@/lib/admin/auth";
import { db } from "@/lib/drizzle/db";
import { eventLeads } from "@/lib/drizzle/schema";
import {
  leadNotesUpdateSchema,
  leadStatusUpdateSchema,
  type LeadStatusValue,
} from "@/lib/validations/admin/lead";

export type EventLeadMutationResult =
  | { success: true }
  | { success: false; error: string };

export async function updateEventLeadStatus(
  id: string,
  status: LeadStatusValue,
): Promise<EventLeadMutationResult> {
  await assertAdminSession();

  const parsed = leadStatusUpdateSchema.safeParse({ id, status });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid status",
    };
  }

  try {
    const [row] = await db
      .update(eventLeads)
      .set({ status: parsed.data.status })
      .where(eq(eventLeads.id, parsed.data.id))
      .returning({ id: eventLeads.id });

    if (!row) {
      return { success: false, error: "Event lead not found" };
    }

    revalidatePath("/admin/event-leads");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update status",
    };
  }
}

export async function updateEventLeadNotes(
  id: string,
  notes: string | undefined,
): Promise<EventLeadMutationResult> {
  await assertAdminSession();

  const parsed = leadNotesUpdateSchema.safeParse({ id, notes });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid notes",
    };
  }

  try {
    const [row] = await db
      .update(eventLeads)
      .set({ notes: parsed.data.notes })
      .where(eq(eventLeads.id, parsed.data.id))
      .returning({ id: eventLeads.id });

    if (!row) {
      return { success: false, error: "Event lead not found" };
    }

    revalidatePath("/admin/event-leads");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update notes",
    };
  }
}
