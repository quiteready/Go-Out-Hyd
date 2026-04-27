import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import {
  COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/admin/session-token";
import { safeAdminRedirectPath } from "@/lib/admin/safe-redirect";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token && (await verifyAdminSessionToken(token))) {
    redirect(safeAdminRedirectPath(from));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-neutral-900">GoOut Hyd</h1>
          <p className="mt-1 text-sm text-neutral-500">Admin access</p>
        </div>
        <LoginForm defaultFrom={from} />
      </div>
    </div>
  );
}
