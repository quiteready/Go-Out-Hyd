"use server";

import { db } from "@/lib/drizzle/db";
import { events } from "@/lib/drizzle/schema/events";
import { sendEventSubmissionNotification } from "@/lib/email";
import { getEventTypeLabel } from "@/lib/constants/events";
import { eventSubmissionSchema } from "@/lib/validations/event-submission";

export type SubmitEventFormResult =
  | { success: true }
  | { success: false; error: string };

function getString(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

/** Generates a URL-safe slug from a title with a short random suffix to avoid collisions. */
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export async function submitEventForm(
  _prevState: SubmitEventFormResult | null,
  formData: FormData,
): Promise<SubmitEventFormResult> {
  // Honeypot check — bots fill hidden fields; silent success to avoid feedback loop
  const honeypotRaw = getString(formData, "honeypot");
  if (honeypotRaw.length > 0) {
    return { success: true };
  }

  const raw = {
    title: getString(formData, "title"),
    eventType: getString(formData, "eventType"),
    startTime: getString(formData, "startTime"),
    organizerName: getString(formData, "organizerName"),
    organizerPhone: getString(formData, "organizerPhone"),
    organizerInstagram: getString(formData, "organizerInstagram") || undefined,
    venueName: getString(formData, "venueName") || undefined,
    venueTba: formData.get("venueTba"),
    description: getString(formData, "description") || undefined,
    ticketPrice: getString(formData, "ticketPrice") || undefined,
    coverImage: getString(formData, "coverImage") || undefined,
    honeypot: "",
  };

  const parsed = eventSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Please check your entries and try again.";
    return { success: false, error: message };
  }

  const data = parsed.data;

  try {
    const [row] = await db
      .insert(events)
      .values({
        title: data.title,
        slug: generateSlug(data.title),
        eventType: data.eventType,
        startTime: data.startTime,
        organizerDisplayName: data.organizerName,
        organizerPhone: data.organizerPhone,
        organizerInstagramHandle: data.organizerInstagram,
        venueName: data.venueTba ? null : (data.venueName ?? null),
        venueTba: data.venueTba,
        description: data.description,
        ticketPrice: data.ticketPrice ?? null,
        coverImage: data.coverImage || null,
        // Organizer submissions always start as pending — admin must approve before going public
        status: "pending",
        isGooutOfficial: false,
      })
      .returning({ id: events.id, createdAt: events.createdAt });

    if (!row) {
      return { success: false, error: "Could not save your submission. Please try again." };
    }

    try {
      await sendEventSubmissionNotification({
        title: data.title,
        eventType: getEventTypeLabel(data.eventType),
        organizerName: data.organizerName,
        organizerPhone: data.organizerPhone,
        organizerInstagram: data.organizerInstagram,
        startTime: data.startTime,
        venueName: data.venueTba ? undefined : data.venueName,
        venueTba: data.venueTba,
        description: data.description,
        submittedAt: row.createdAt,
      });
    } catch {
      // Submission is persisted; email failure must not block the success response
    }

    return { success: true };
  } catch {
    return { success: false, error: "Could not save your submission. Please try again." };
  }
}
