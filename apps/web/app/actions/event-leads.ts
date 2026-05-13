"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/drizzle/db";
import { eventLeads } from "@/lib/drizzle/schema/event-leads";
import { sendEventLeadNotification } from "@/lib/email";
import { eventLeadFormSchema } from "@/lib/validations/event-lead";

export type SubmitEventLeadFormResult =
  | { success: true }
  | { success: false; error: string };

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitEventLeadForm(
  _prevState: SubmitEventLeadFormResult | null,
  formData: FormData,
): Promise<SubmitEventLeadFormResult> {
  const honeypotRaw = getString(formData, "honeypot");
  if (honeypotRaw.length > 0) {
    return { success: true };
  }

  const raw = {
    contactName: getString(formData, "contactName"),
    contactPhone: getString(formData, "contactPhone"),
    contactInstagramHandle: getString(formData, "contactInstagramHandle") || undefined,
    eventTitle: getString(formData, "eventTitle"),
    eventType: getString(formData, "eventType") || undefined,
    expectedDateNote: getString(formData, "expectedDateNote") || undefined,
    venueName: getString(formData, "venueName") || undefined,
    area: getString(formData, "area") || undefined,
    ticketingType: getString(formData, "ticketingType"),
    expectedTicketPrice: getString(formData, "expectedTicketPrice") || undefined,
    details: getString(formData, "details") || undefined,
    honeypot: "",
  };

  const parsed = eventLeadFormSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check your entries.";
    return { success: false, error: message };
  }

  const data = parsed.data;

  try {
    const [row] = await db
      .insert(eventLeads)
      .values({
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactInstagramHandle: data.contactInstagramHandle,
        eventTitle: data.eventTitle,
        eventType: data.eventType,
        expectedDateNote: data.expectedDateNote,
        venueName: data.venueName,
        area: data.area,
        ticketingType: data.ticketingType,
        expectedTicketPrice: data.expectedTicketPrice ?? null,
        details: data.details,
      })
      .returning({ createdAt: eventLeads.createdAt });

    if (!row) {
      return { success: false, error: "Could not save your request. Please try again." };
    }

    try {
      await sendEventLeadNotification({
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactInstagramHandle: data.contactInstagramHandle,
        eventTitle: data.eventTitle,
        eventType: data.eventType,
        expectedDateNote: data.expectedDateNote,
        venueName: data.venueName,
        area: data.area,
        ticketingType: data.ticketingType,
        expectedTicketPrice: data.expectedTicketPrice,
        details: data.details,
        createdAt: row.createdAt,
      });
    } catch {
      // Lead is already persisted. Email failures should not block successful form response.
    }

    revalidatePath("/partner");
    return { success: true };
  } catch {
    return { success: false, error: "Could not save your request. Please try again." };
  }
}
