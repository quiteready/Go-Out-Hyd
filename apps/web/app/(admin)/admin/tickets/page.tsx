import { TicketsFilters } from "@/components/admin/TicketsFilters";
import { TicketsTable } from "@/components/admin/TicketsTable";
import {
  listEventsWithTickets,
  listTicketsForAdmin,
  type TicketFilters,
  type TicketStatus,
} from "@/lib/queries/admin/tickets";

export const dynamic = "force-dynamic";

const VALID_STATUSES: TicketStatus[] = ["pending", "paid", "failed", "refunded"];

interface PageProps {
  searchParams: Promise<{
    event_id?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}

function parseFilters(
  raw: Awaited<PageProps["searchParams"]>,
): TicketFilters {
  const status =
    raw.status && VALID_STATUSES.includes(raw.status as TicketStatus)
      ? (raw.status as TicketStatus)
      : undefined;
  return {
    eventId: raw.event_id || undefined,
    status,
    fromDate: raw.from || undefined,
    toDate: raw.to || undefined,
  };
}

export default async function AdminTicketsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const filters = parseFilters(raw);

  const [tickets, eventOptions] = await Promise.all([
    listTicketsForAdmin(filters),
    listEventsWithTickets(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">Tickets</h2>
        <p className="mt-1 text-sm text-neutral-600">
          All bookings across all events. Filter and export to CSV.
        </p>
      </div>

      <TicketsFilters events={eventOptions} resultCount={tickets.length} />

      <TicketsTable
        tickets={tickets}
        emptyMessage={
          eventOptions.length === 0
            ? "No tickets have been booked yet."
            : "No bookings match the current filters."
        }
      />
    </div>
  );
}
