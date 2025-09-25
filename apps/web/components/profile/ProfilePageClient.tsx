"use client";

import { AccountInformationCard } from "./AccountInformationCard";

export default function ProfilePageClient() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <AccountInformationCard />
      </div>
    </div>
  );
}
