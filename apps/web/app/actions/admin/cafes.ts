"use server";

import { revalidatePath } from "next/cache";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { cafes } from "@/lib/drizzle/schema";
import { assertLocalhost } from "@/lib/admin/auth";
import {
  cafeFormSchema,
  type CafeFormValues,
} from "@/lib/validations/admin/cafe";
import { countPaidTicketsForCafe } from "@/lib/queries/admin/cafes";
import {
  publicPathsForCafeMutation,
  requestProductionRevalidation,
  warnIfProductionRevalidateFailed,
} from "@/lib/revalidate-production";

export type CafeActionResult =
  | { success: true; id: string; slug: string }
  | { success: false; error: string };

export type DeleteResult =
  | { success: true }
  | { success: false; error: string };

async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const conditions = excludeId
    ? and(eq(cafes.slug, slug), ne(cafes.id, excludeId))
    : eq(cafes.slug, slug);
  const [existing] = await db
    .select({ id: cafes.id })
    .from(cafes)
    .where(conditions)
    .limit(1);
  return Boolean(existing);
}

function revalidateCafePaths(slug?: string | null): void {
  revalidatePath("/admin/cafes");
  revalidatePath("/cafes");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/cafes/${slug}`);
  }
}

export async function createCafe(
  input: CafeFormValues,
): Promise<CafeActionResult> {
  await assertLocalhost();

  const parsed = cafeFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid cafe data",
    };
  }
  const data = parsed.data;

  if (await isSlugTaken(data.slug)) {
    return { success: false, error: `Slug "${data.slug}" is already in use` };
  }

  try {
    const [row] = await db
      .insert(cafes)
      .values({
        name: data.name,
        slug: data.slug,
        area: data.area,
        description: data.description,
        coverImage: data.coverImage,
        phone: data.phone,
        instagramHandle: data.instagramHandle,
        googleMapsUrl: data.googleMapsUrl,
        address: data.address,
        openingHours: data.openingHours,
        status: data.status,
      })
      .returning({ id: cafes.id, slug: cafes.slug });

    if (!row) {
      return { success: false, error: "Failed to create cafe" };
    }

    revalidateCafePaths(row.slug);
    warnIfProductionRevalidateFailed(
      await requestProductionRevalidation(
        publicPathsForCafeMutation(row.slug),
      ),
    );
    return { success: true, id: row.id, slug: row.slug };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create cafe",
    };
  }
}

export async function updateCafe(
  id: string,
  input: CafeFormValues,
): Promise<CafeActionResult> {
  await assertLocalhost();

  const parsed = cafeFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid cafe data",
    };
  }
  const data = parsed.data;

  if (await isSlugTaken(data.slug, id)) {
    return { success: false, error: `Slug "${data.slug}" is already in use` };
  }

  try {
    const [row] = await db
      .update(cafes)
      .set({
        name: data.name,
        slug: data.slug,
        area: data.area,
        description: data.description,
        coverImage: data.coverImage,
        phone: data.phone,
        instagramHandle: data.instagramHandle,
        googleMapsUrl: data.googleMapsUrl,
        address: data.address,
        openingHours: data.openingHours,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(cafes.id, id))
      .returning({ id: cafes.id, slug: cafes.slug });

    if (!row) {
      return { success: false, error: "Cafe not found" };
    }

    revalidatePath(`/admin/cafes/${id}`);
    revalidateCafePaths(row.slug);
    warnIfProductionRevalidateFailed(
      await requestProductionRevalidation(
        publicPathsForCafeMutation(row.slug),
      ),
    );
    return { success: true, id: row.id, slug: row.slug };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update cafe",
    };
  }
}

export async function deleteCafe(id: string): Promise<DeleteResult> {
  await assertLocalhost();

  // Guard: refuse delete if any related event has paid tickets (cascade would wipe revenue records).
  const paidCount = await countPaidTicketsForCafe(id);
  if (paidCount > 0) {
    return {
      success: false,
      error: `Cannot delete: ${paidCount} paid ticket${paidCount === 1 ? "" : "s"} would be lost via cascade. Cancel or delete the events with bookings first.`,
    };
  }

  try {
    const [row] = await db
      .delete(cafes)
      .where(eq(cafes.id, id))
      .returning({ slug: cafes.slug });

    if (!row) {
      return { success: false, error: "Cafe not found" };
    }

    revalidateCafePaths(row.slug);
    warnIfProductionRevalidateFailed(
      await requestProductionRevalidation(
        publicPathsForCafeMutation(row.slug),
      ),
    );
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete cafe",
    };
  }
}
