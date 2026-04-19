import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { RecentActivity as RecentActivityData } from "@/lib/queries/admin/overview";

interface RecentActivityProps {
  activity: RecentActivityData;
}

const IST_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

function formatIst(d: Date): string {
  return IST_FORMATTER.format(d);
}

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ActivityColumn
        title="Latest leads"
        empty="No leads yet."
        footerHref="/admin/leads"
        footerLabel="View all leads"
        rowCount={activity.leads.length}
      >
        {activity.leads.map((l) => (
          <li key={l.id} className="border-b border-neutral-100 py-2 last:border-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {l.ownerName}
                </p>
                <p className="truncate text-xs text-neutral-600">{l.cafeName}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {formatIst(l.createdAt)} IST
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {l.status}
              </Badge>
            </div>
          </li>
        ))}
      </ActivityColumn>

      <ActivityColumn
        title="Latest ticket bookings"
        empty="No tickets yet."
        footerHref="/admin/tickets"
        footerLabel="View all tickets"
        rowCount={activity.tickets.length}
      >
        {activity.tickets.map((t) => (
          <li key={t.id} className="border-b border-neutral-100 py-2 last:border-0">
            <Link
              href={`/admin/events/${t.eventId}`}
              className="block rounded-sm transition-colors hover:bg-neutral-50"
            >
              <p className="truncate text-sm font-medium text-neutral-900">
                {t.customerName}
              </p>
              <p className="truncate text-xs text-neutral-600">{t.eventTitle}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                <span>{formatIst(t.createdAt)} IST</span>
                <span>·</span>
                <span>₹{t.amountPaid}</span>
                <Badge variant="outline" className="text-[10px]">
                  {t.status}
                </Badge>
              </div>
            </Link>
          </li>
        ))}
      </ActivityColumn>

      <ActivityColumn
        title="Recently created events"
        empty="No events yet."
        footerHref="/admin/events"
        footerLabel="View all events"
        rowCount={activity.eventsCreated.length}
      >
        {activity.eventsCreated.map((e) => (
          <li key={e.id} className="border-b border-neutral-100 py-2 last:border-0">
            <Link
              href={`/admin/events/${e.id}`}
              className="block rounded-sm transition-colors hover:bg-neutral-50"
            >
              <p className="truncate text-sm font-medium text-neutral-900">
                {e.title}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {formatIst(e.createdAt)} IST
              </p>
            </Link>
          </li>
        ))}
      </ActivityColumn>
    </div>
  );
}

function ActivityColumn({
  title,
  empty,
  footerHref,
  footerLabel,
  rowCount,
  children,
}: {
  title: string;
  empty: string;
  footerHref: string;
  footerLabel: string;
  rowCount: number;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      </div>
      <ul className="flex-1 list-none px-4 py-1">
        {rowCount === 0 ? (
          <li className="py-8 text-center text-sm text-neutral-500">{empty}</li>
        ) : (
          children
        )}
      </ul>
      <div className="border-t border-neutral-200 px-4 py-2">
        <Link
          href={footerHref}
          className="text-xs font-medium text-neutral-700 underline-offset-2 hover:underline"
        >
          {footerLabel} →
        </Link>
      </div>
    </section>
  );
}
