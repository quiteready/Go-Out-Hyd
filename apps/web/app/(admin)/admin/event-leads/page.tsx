import { EventLeadsFilters } from "@/components/admin/EventLeadsFilters";
import { EventLeadsTable } from "@/components/admin/EventLeadsTable";
import {
  listEventLeads,
  type EventLeadListFilters,
} from "@/lib/queries/admin/event-leads";
import type { LeadStatusValue } from "@/lib/validations/admin/lead";

export const dynamic = "force-dynamic";

const VALID_STATUSES: LeadStatusValue[] = [
  "new",
  "contacted",
  "converted",
  "closed",
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function parseFilters(raw: Awaited<PageProps["searchParams"]>): EventLeadListFilters {
  const status = raw.status;
  if (status && VALID_STATUSES.includes(status as LeadStatusValue)) {
    return { status: status as LeadStatusValue };
  }
  return {};
}

export default async function AdminEventLeadsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const filters = parseFilters(raw);
  const leads = await listEventLeads(filters);
  const emptyMessage = filters.status
    ? "No event leads match the current filter."
    : "No event leads yet.";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">Event Leads</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Event host requests submitted from the partner page.
        </p>
      </div>

      <EventLeadsFilters resultCount={leads.length} />

      <EventLeadsTable leads={leads} emptyMessage={emptyMessage} />
    </div>
  );
}
