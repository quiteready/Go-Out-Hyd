"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { cafeLeads } from "@/lib/drizzle/schema";
import { assertAdminSession } from "@/lib/admin/auth";
import {
  leadNotesUpdateSchema,
  leadStatusUpdateSchema,
  type LeadStatusValue,
} from "@/lib/validations/admin/lead";

export type LeadMutationResult =
  | { success: true }
  | { success: false; error: string };

export async function updateLeadStatus(
  id: string,
  status: LeadStatusValue,
): Promise<LeadMutationResult> {
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
      .update(cafeLeads)
      .set({ status: parsed.data.status })
      .where(eq(cafeLeads.id, parsed.data.id))
      .returning({ id: cafeLeads.id });

    if (!row) {
      return { success: false, error: "Lead not found" };
    }

    revalidatePath("/admin/leads");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update status",
    };
  }
}

export async function updateLeadNotes(
  id: string,
  notes: string | undefined,
): Promise<LeadMutationResult> {
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
      .update(cafeLeads)
      .set({ notes: parsed.data.notes })
      .where(eq(cafeLeads.id, parsed.data.id))
      .returning({ id: cafeLeads.id });

    if (!row) {
      return { success: false, error: "Lead not found" };
    }

    revalidatePath("/admin/leads");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update notes",
    };
  }
}
