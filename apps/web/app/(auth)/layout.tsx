import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";

// Force dynamic rendering since we access cookies
export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();

  if (userId) {
    redirect("/chat");
  }

  return <>{children}</>;
}
