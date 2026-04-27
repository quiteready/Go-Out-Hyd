"use server";

import { revalidatePath } from "next/cache";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { events } from "@/lib/drizzle/schema";
import { assertAdminSession } from "@/lib/admin/auth";
import {
  eventFormSchema,
  type EventFormValues,
} from "@/lib/validations/admin/event";
import { countPaidTicketsForEvent } from "@/lib/queries/admin/events";
import {
  publicPathsForEventMutation,
  requestProductionRevalidation,
  warnIfProductionRevalidateFailed,
} from "@/lib/revalidate-production";

export type EventActionResult =
  | { success: true; id: string; slug: string }
  | { success: false; error: string };

export type DeleteEventResult =
  | { success: true }
  | { success: false; error: string };

async function isEventSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const conditions = excludeId
    ? and(eq(events.slug, slug), ne(events.id, excludeId))
    : eq(events.slug, slug);
  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(conditions)
    .limit(1);
  return Boolean(existing);
}

function revalidateEventPaths(slug?: string | null): void {
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/events/${slug}`);
  }
}

/**
 * Build the row payload from validated form values. Custom-venue fields are
 * cleared when a cafe is chosen, and vice versa, so the DB never carries stale
 * fields from an earlier choice.
 */
function toRowPayload(data: EventFormValues): {
  title: string;
  slug: string;
  description: string | null;
  eventType: EventFormValues["eventType"];
  cafeId: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueMapsUrl: string | null;
  startTime: Date;
  endTime: Date | null;
  ticketPrice: number | null;
  earlyBirdPrice: number | null;
  earlyBirdEndsAt: Date | null;
  maxTickets: number | null;
  coverImage: string | null;
  status: EventFormValues["status"];
  organizerDisplayName: string | null;
  organizerPhone: string | null;
  organizerInstagramHandle: string | null;
} {
  const usingCafe = Boolean(data.cafeId);
  return {
    title: data.title,
    slug: data.slug,
    description: data.description ?? null,
    eventType: data.eventType,
    cafeId: usingCafe ? (data.cafeId ?? null) : null,
    venueName: usingCafe ? null : (data.venueName ?? null),
    venueAddress: usingCafe ? null : (data.venueAddress ?? null),
    venueMapsUrl: usingCafe ? null : (data.venueMapsUrl ?? null),
    startTime: new Date(data.startTime),
    endTime: data.endTime ? new Date(data.endTime) : null,
    ticketPrice: data.ticketPrice ?? null,
    earlyBirdPrice: data.earlyBirdPrice ?? null,
    earlyBirdEndsAt: data.earlyBirdEndsAt
      ? new Date(data.earlyBirdEndsAt)
      : null,
    maxTickets: data.maxTickets ?? null,
    coverImage: data.coverImage ?? null,
    status: data.status,
    organizerDisplayName: data.organizerDisplayName ?? null,
    organizerPhone: data.organizerPhone ?? null,
    organizerInstagramHandle: data.organizerInstagramHandle ?? null,
  };
}

export async function createEvent(
  input: EventFormValues,
): Promise<EventActionResult> {
  await assertAdminSession();

  const parsed = eventFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid event data",
    };
  }
  const data = parsed.data;

  if (await isEventSlugTaken(data.slug)) {
    return { success: false, error: `Slug "${data.slug}" is already in use` };
  }

  try {
    const [row] = await db
      .insert(events)
      .values(toRowPayload(data))
      .returning({ id: events.id, slug: events.slug });

    if (!row) {
      return { success: false, error: "Failed to create event" };
    }

    revalidateEventPaths(row.slug);
    warnIfProductionRevalidateFailed(
      await requestProductionRevalidation(
        publicPathsForEventMutation(row.slug),
      ),
    );
    return { success: true, id: row.id, slug: row.slug };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create event",
    };
  }
}

export async function updateEvent(
  id: string,
  input: EventFormValues,
): Promise<EventActionResult> {
  await assertAdminSession();

  const parsed = eventFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid event data",
    };
  }
  const data = parsed.data;

  if (await isEventSlugTaken(data.slug, id)) {
    return { success: false, error: `Slug "${data.slug}" is already in use` };
  }

  try {
    const [row] = await db
      .update(events)
      .set({
        ...toRowPayload(data),
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning({ id: events.id, slug: events.slug });

    if (!row) {
      return { success: false, error: "Event not found" };
    }

    revalidatePath(`/admin/events/${id}`);
    revalidateEventPaths(row.slug);
    warnIfProductionRevalidateFailed(
      await requestProductionRevalidation(
        publicPathsForEventMutation(row.slug),
      ),
    );
    return { success: true, id: row.id, slug: row.slug };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update event",
    };
  }
}

export async function cancelEvent(
  id: string,
): Promise<EventActionResult> {
  await assertAdminSession();

  try {
    const [row] = await db
      .update(events)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning({ id: events.id, slug: events.slug });

    if (!row) {
      return { success: false, error: "Event not found" };
    }

    revalidatePath(`/admin/events/${id}`);
    revalidateEventPaths(row.slug);
    warnIfProductionRevalidateFailed(
      await requestProductionRevalidation(
        publicPathsForEventMutation(row.slug),
      ),
    );
    return { success: true, id: row.id, slug: row.slug };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel event",
    };
  }
}

export async function deleteEvent(id: string): Promise<DeleteEventResult> {
  await assertAdminSession();

  // Guard: refuse delete if the event has paid tickets (cascade would wipe revenue records).
  const paidCount = await countPaidTicketsForEvent(id);
  if (paidCount > 0) {
    return {
      success: false,
      error: `Cannot delete: ${paidCount} paid ticket${paidCount === 1 ? "" : "s"} would be lost. Cancel the event instead.`,
    };
  }

  try {
    const [row] = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning({ slug: events.slug });

    if (!row) {
      return { success: false, error: "Event not found" };
    }

    revalidateEventPaths(row.slug);
    warnIfProductionRevalidateFailed(
      await requestProductionRevalidation(
        publicPathsForEventMutation(row.slug),
      ),
    );
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete event",
    };
  }
}
