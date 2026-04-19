import Link from "next/link";
import { Coffee, CalendarDays, Ticket, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CountsGrid } from "@/components/admin/overview/CountsGrid";
import { RecentActivity } from "@/components/admin/overview/RecentActivity";
import {
  getOverviewCounts,
  getRecentActivity,
} from "@/lib/queries/admin/overview";

export const dynamic = "force-dynamic";

interface QuickLink {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const QUICK_LINKS: QuickLink[] = [
  {
    href: "/admin/cafes",
    label: "Cafes",
    description: "Manage cafe profiles, menu items, and image galleries.",
    icon: Coffee,
  },
  {
    href: "/admin/events",
    label: "Events",
    description: "Create and edit events, manage cancellations.",
    icon: CalendarDays,
  },
  {
    href: "/admin/tickets",
    label: "Tickets",
    description: "View bookings and export attendee CSVs.",
    icon: Ticket,
  },
  {
    href: "/admin/leads",
    label: "Leads",
    description: "Partner form submissions from cafe owners.",
    icon: Inbox,
  },
];

export default async function AdminOverviewPage() {
  const [counts, activity] = await Promise.all([
    getOverviewCounts(),
    getRecentActivity(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">Overview</h2>
        <p className="mt-1 text-sm text-neutral-600">
          At-a-glance counts and the latest leads, bookings, and events.
        </p>
      </div>

      <CountsGrid counts={counts} />

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Recent activity
        </h3>
        <RecentActivity activity={activity} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Quick links
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex gap-4 rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {link.label}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    {link.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
