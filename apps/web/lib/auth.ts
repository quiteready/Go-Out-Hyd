import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Phase 2: Expand with role-based access control when the users table is added

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
  } catch {
    return null;
  }
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  return userId;
}
