import ProfilePageClient from "@/components/profile/ProfilePageClient";
import { requireUserId } from "@/lib/auth";

export default async function ProfilePage() {
  // Only verify authentication, don't fetch user data (already in UserContext)
  await requireUserId();

  return <ProfilePageClient />;
}
