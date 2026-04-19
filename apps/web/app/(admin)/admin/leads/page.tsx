import { LeadsFilters } from "@/components/admin/LeadsFilters";
import { LeadsTable } from "@/components/admin/LeadsTable";
import {
  listLeads,
  type LeadListFilters,
} from "@/lib/queries/admin/leads";
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

function parseFilters(raw: Awaited<PageProps["searchParams"]>): LeadListFilters {
  const s = raw.status;
  if (s && VALID_STATUSES.includes(s as LeadStatusValue)) {
    return { status: s as LeadStatusValue };
  }
  return {};
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const filters = parseFilters(raw);
  const leads = await listLeads(filters);
  const emptyMessage = filters.status
    ? "No partner leads match the current filter."
    : "No partner leads yet.";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">Leads</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Partner interest form submissions. Update status and add internal
          notes.
        </p>
      </div>

      <LeadsFilters resultCount={leads.length} />

      <LeadsTable leads={leads} emptyMessage={emptyMessage} />
    </div>
  );
}
