import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { UserProvider } from "@/contexts/UserContext";
import { UsageProvider } from "@/contexts/UsageContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import { MobileHeaderContent } from "@/components/layout/MobileHeaderContent";
import { Suspense } from "react";
import { UpgradeSuccessToast } from "@/components/billing/UpgradeSuccessToast";
import { getCurrentUserWithRole } from "@/lib/auth";

// Force dynamic rendering to prevent static generation issues with authentication
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user with role information from database
  const userWithRole = await getCurrentUserWithRole();

  if (!userWithRole) {
    redirect("/auth/login");
  }

  // Read sidebar state from cookie server-side
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state");
  const defaultOpen = sidebarState?.value === "false" ? false : true;

  return (
    <UserProvider value={userWithRole.user}>
      <UsageProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <MobileHeaderContent />
              <main className="flex-1 pt-14 lg:pt-0">{children}</main>
            </div>
          </div>

          {/* Success Toast with Suspense boundary */}
          <Suspense fallback={null}>
            <UpgradeSuccessToast />
          </Suspense>
        </SidebarProvider>
      </UsageProvider>
    </UserProvider>
  );
}
