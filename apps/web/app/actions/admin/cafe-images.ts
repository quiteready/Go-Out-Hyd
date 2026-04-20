"use server";

import { revalidatePath } from "next/cache";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { cafeImages, cafes } from "@/lib/drizzle/schema";
import { assertLocalhost } from "@/lib/admin/auth";
import {
  cafeImageCreateSchema,
  cafeImageUpdateSchema,
  type CafeImageCreateValues,
  type CafeImageUpdateValues,
} from "@/lib/validations/admin/cafe-image";
import {
  publicPathsForCafeDetailOnly,
  requestProductionRevalidation,
  warnIfProductionRevalidateFailed,
} from "@/lib/revalidate-production";

export type CafeImageActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

export type SimpleResult =
  | { success: true }
  | { success: false; error: string };

async function revalidateForCafe(cafeId: string): Promise<void> {
  revalidatePath(`/admin/cafes/${cafeId}`);
  const [cafe] = await db
    .select({ slug: cafes.slug })
    .from(cafes)
    .where(eq(cafes.id, cafeId))
    .limit(1);
  if (cafe) {
    revalidatePath(`/cafes/${cafe.slug}`);
    warnIfProductionRevalidateFailed(
      await requestProductionRevalidation(
        publicPathsForCafeDetailOnly(cafe.slug),
      ),
    );
  }
}

export async function addCafeImage(
  cafeId: string,
  input: CafeImageCreateValues,
): Promise<CafeImageActionResult> {
  await assertLocalhost();

  const parsed = cafeImageCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid image data",
    };
  }

  try {
    // Append to end: new sort_order = current max + 1.
    const [maxRow] = await db
      .select({
        max: sql<number | null>`max(${cafeImages.sortOrder})`,
      })
      .from(cafeImages)
      .where(eq(cafeImages.cafeId, cafeId));

    const nextSortOrder = (maxRow?.max ?? -1) + 1;

    const [row] = await db
      .insert(cafeImages)
      .values({
        cafeId,
        imageUrl: parsed.data.imageUrl,
        altText: parsed.data.altText,
        sortOrder: nextSortOrder,
      })
      .returning({ id: cafeImages.id });

    if (!row) {
      return { success: false, error: "Failed to add image" };
    }

    await revalidateForCafe(cafeId);
    return { success: true, id: row.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add image",
    };
  }
}

export async function updateCafeImage(
  id: string,
  input: CafeImageUpdateValues,
): Promise<SimpleResult> {
  await assertLocalhost();

  const parsed = cafeImageUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid image data",
    };
  }

  try {
    const [row] = await db
      .update(cafeImages)
      .set({ altText: parsed.data.altText })
      .where(eq(cafeImages.id, id))
      .returning({ cafeId: cafeImages.cafeId });

    if (!row) {
      return { success: false, error: "Image not found" };
    }

    await revalidateForCafe(row.cafeId);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update image",
    };
  }
}

export async function deleteCafeImage(id: string): Promise<SimpleResult> {
  await assertLocalhost();

  try {
    const [row] = await db
      .delete(cafeImages)
      .where(eq(cafeImages.id, id))
      .returning({ cafeId: cafeImages.cafeId });

    if (!row) {
      return { success: false, error: "Image not found" };
    }

    await revalidateForCafe(row.cafeId);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete image",
    };
  }
}

/**
 * Swap sort_order with the previous (up) or next (down) neighbour.
 * No-op if already at the boundary.
 */
export async function reorderCafeImage(
  id: string,
  direction: "up" | "down",
): Promise<SimpleResult> {
  await assertLocalhost();

  try {
    const [target] = await db
      .select({
        id: cafeImages.id,
        cafeId: cafeImages.cafeId,
        sortOrder: cafeImages.sortOrder,
      })
      .from(cafeImages)
      .where(eq(cafeImages.id, id))
      .limit(1);

    if (!target) {
      return { success: false, error: "Image not found" };
    }

    const siblings = await db
      .select({
        id: cafeImages.id,
        sortOrder: cafeImages.sortOrder,
        createdAt: cafeImages.createdAt,
      })
      .from(cafeImages)
      .where(eq(cafeImages.cafeId, target.cafeId))
      .orderBy(asc(cafeImages.sortOrder), asc(cafeImages.createdAt));

    const idx = siblings.findIndex((s) => s.id === target.id);
    if (idx === -1) {
      return { success: false, error: "Image not found" };
    }
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) {
      return { success: true }; // already at boundary
    }

    const a = siblings[idx];
    const b = siblings[swapIdx];
    if (!a || !b) {
      return { success: true };
    }

    // Two-step swap to avoid unique-constraint collisions even though we
    // don't have a unique index on (cafeId, sortOrder) — defensive.
    await db.transaction(async (tx) => {
      await tx
        .update(cafeImages)
        .set({ sortOrder: -1 })
        .where(eq(cafeImages.id, a.id));
      await tx
        .update(cafeImages)
        .set({ sortOrder: a.sortOrder ?? 0 })
        .where(eq(cafeImages.id, b.id));
      await tx
        .update(cafeImages)
        .set({ sortOrder: b.sortOrder ?? 0 })
        .where(eq(cafeImages.id, a.id));
    });

    await revalidateForCafe(target.cafeId);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reorder image",
    };
  }
}
