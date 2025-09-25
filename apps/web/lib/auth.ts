import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/drizzle/db";
import { User, users } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user and their role
 * @returns Promise<{user: User, isAdmin: boolean} | null>
 */
export async function getCurrentUserWithRole(): Promise<{
  user: User;
  isAdmin: boolean;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    // Get user data with role from our database
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (userData.length === 0) {
      return null;
    }

    const user = userData[0];
    return {
      user,
      isAdmin: user.role === "admin",
    };
  } catch (error) {
    console.error("Error getting current user with role:", error);
    return null;
  }
}

/**
 * Get current user ID - optimized for performance
 * Use when you only need user identification
 * @returns Promise<string | null> - Returns the user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error("Error in getCurrentUserId:", error);
    return null;
  }
}

/**
 * Require user ID - optimized for most common use case
 * Use this for most common authentication use case - getting the user ID
 * @returns Promise<string> - Returns the user ID
 */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return userId;
}

/**
 * Require admin access - optimized version of requireAdmin
 * Checks admin status efficiently without redundant database calls
 * @returns Promise<void> - Throws or redirects if not authorized
 */
export async function requireAdminAccess(): Promise<void> {
  const userWithRole = await getCurrentUserWithRole();

  if (!userWithRole) {
    console.warn("Admin access attempted without authentication");
    redirect("/auth/login");
  }

  if (!userWithRole.isAdmin) {
    console.warn(
      `Non-admin user ${userWithRole.user.id} attempted admin access`,
    );
    redirect("/unauthorized");
  }
}
