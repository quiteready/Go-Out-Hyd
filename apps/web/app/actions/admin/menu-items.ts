"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { menuItems, cafes } from "@/lib/drizzle/schema";
import { assertAdminSession } from "@/lib/admin/auth";
import {
  menuItemSchema,
  type MenuItemFormValues,
} from "@/lib/validations/admin/menu-item";
import {
  publicPathsForCafeDetailOnly,
  requestProductionRevalidation,
  warnIfProductionRevalidateFailed,
} from "@/lib/revalidate-production";

export type MenuItemActionResult =
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

export async function createMenuItem(
  cafeId: string,
  input: MenuItemFormValues,
): Promise<MenuItemActionResult> {
  await assertAdminSession();

  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid menu item data",
    };
  }

  try {
    const [row] = await db
      .insert(menuItems)
      .values({
        cafeId,
        category: parsed.data.category,
        name: parsed.data.name,
        price: parsed.data.price,
        description: parsed.data.description,
        isAvailable: parsed.data.isAvailable,
        sortOrder: parsed.data.sortOrder,
      })
      .returning({ id: menuItems.id });

    if (!row) {
      return { success: false, error: "Failed to create menu item" };
    }

    await revalidateForCafe(cafeId);
    return { success: true, id: row.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create menu item",
    };
  }
}

export async function updateMenuItem(
  id: string,
  input: MenuItemFormValues,
): Promise<SimpleResult> {
  await assertAdminSession();

  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid menu item data",
    };
  }

  try {
    const [row] = await db
      .update(menuItems)
      .set({
        category: parsed.data.category,
        name: parsed.data.name,
        price: parsed.data.price,
        description: parsed.data.description,
        isAvailable: parsed.data.isAvailable,
        sortOrder: parsed.data.sortOrder,
      })
      .where(eq(menuItems.id, id))
      .returning({ cafeId: menuItems.cafeId });

    if (!row) {
      return { success: false, error: "Menu item not found" };
    }

    await revalidateForCafe(row.cafeId);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update menu item",
    };
  }
}

export async function deleteMenuItem(id: string): Promise<SimpleResult> {
  await assertAdminSession();

  try {
    const [row] = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning({ cafeId: menuItems.cafeId });

    if (!row) {
      return { success: false, error: "Menu item not found" };
    }

    await revalidateForCafe(row.cafeId);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete menu item",
    };
  }
}

export async function toggleMenuItemAvailability(
  id: string,
): Promise<SimpleResult> {
  await assertAdminSession();

  try {
    const [current] = await db
      .select({
        isAvailable: menuItems.isAvailable,
        cafeId: menuItems.cafeId,
      })
      .from(menuItems)
      .where(eq(menuItems.id, id))
      .limit(1);

    if (!current) {
      return { success: false, error: "Menu item not found" };
    }

    await db
      .update(menuItems)
      .set({ isAvailable: !(current.isAvailable ?? true) })
      .where(eq(menuItems.id, id));

    await revalidateForCafe(current.cafeId);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle availability",
    };
  }
}
