import { Coffee, CalendarDays, Ticket, Inbox, CalendarClock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OverviewCounts } from "@/lib/queries/admin/overview";

interface CountsGridProps {
  counts: OverviewCounts;
}

interface StatCard {
  label: string;
  value: number;
  icon: LucideIcon;
  hint?: string;
}

export function CountsGrid({ counts }: CountsGridProps) {
  const items: StatCard[] = [
    {
      label: "Active cafes",
      value: counts.activeCafes,
      icon: Coffee,
      hint: 'Cafes with status "active".',
    },
    {
      label: "Upcoming events",
      value: counts.upcomingEvents,
      icon: CalendarDays,
      hint: 'Status "upcoming" with a future start time.',
    },
    {
      label: "Tickets sold (this week)",
      value: counts.ticketsSoldThisWeek,
      icon: CalendarClock,
      hint: "Paid tickets since Monday 00:00 IST.",
    },
    {
      label: "Tickets sold (today)",
      value: counts.ticketsSoldToday,
      icon: Ticket,
      hint: "Paid tickets booked today (IST calendar day).",
    },
    {
      label: "New leads",
      value: counts.newLeads,
      icon: Inbox,
      hint: 'Partner form submissions still marked "new".',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-900">
                  {item.value}
                </p>
                {item.hint && (
                  <p className="mt-2 text-xs text-neutral-500">{item.hint}</p>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
