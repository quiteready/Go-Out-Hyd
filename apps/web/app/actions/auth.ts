"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Base auth result type for consistent responses
export type AuthResult = {
  success: boolean;
  error?: string;
};

/**
 * Server-side login action
 * Authenticates user with email and password, then redirects to appropriate page
 */
export async function loginAction(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Server-side signup action
 * Creates new user account with email verification
 */
export async function signUpAction(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResult> {
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/chat`,
      data: {
        full_name: fullName,
      },
    },
  });

  console.log("Signup data:", data);

  if (error) {
    console.error("Signup error:", error);
    // Provide helpful error messages for common signup issues
    if (error.message.includes("already registered")) {
      return {
        success: false,
        error:
          "An account with this email already exists. Try logging in instead.",
      };
    }

    return { success: false, error: error.message };
  }

  // If we get user data back, it means the user already exists
  if (data.user) {
    console.log("User already exists for this email");
    return {
      success: false,
      error:
        "An account with this email already exists. Try logging in or reset your password if you forgot it.",
    };
  }

  return { success: true };
}

/**
 * Server-side logout action
 * Terminates user session
 */
export async function logoutAction(): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Server-side password reset action
 * Sends password reset email to user
 */
export async function resetPasswordAction(email: string): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/confirm?next=/auth/update-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Server-side password update action
 * Updates user's password when authenticated
 */
export async function updatePasswordAction(
  password: string
): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
