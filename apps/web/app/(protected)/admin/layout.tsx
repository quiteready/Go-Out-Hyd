// Force dynamic rendering to prevent static generation issues with authentication
export const dynamic = "force-dynamic";

import { requireAdminAccess } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure only admins can access anything under /admin
  await requireAdminAccess();
  return <>{children}</>;
}
