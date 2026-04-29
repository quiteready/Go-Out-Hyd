import Link from "next/link";
import { CheckCircle2, Plus, Pencil, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listEventsForAdmin } from "@/lib/queries/admin/events";
import { getEventTypeLabel } from "@/lib/constants/events";
import { approveEventVoid, completeEventVoid } from "@/app/actions/admin/events";

export const dynamic = "force-dynamic";

const IST_DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

function formatIst(date: Date): string {
  return IST_DATE_FORMATTER.format(date);
}

type EventStatus = "pending" | "upcoming" | "cancelled" | "completed";

function statusVariant(
  status: EventStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "cancelled") return "destructive";
  if (status === "completed") return "secondary";
  if (status === "pending") return "outline";
  return "default";
}

const STATUS_FILTERS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Pending", value: "pending" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const statusFilter = STATUS_FILTERS.some((f) => f.value === status)
    ? status
    : undefined;

  const events = await listEventsForAdmin(statusFilter);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">Events</h2>
          <p className="mt-1 text-sm text-neutral-600">{events.length} shown</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New event
          </Link>
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(({ label, value }) => {
          const href = value ? `/admin/events?status=${value}` : "/admin/events";
          const isActive = (statusFilter ?? null) === value;
          return (
            <Link
              key={label}
              href={href}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        {events.length === 0 ? (
          <p className="p-10 text-center text-sm text-neutral-500">
            No events{statusFilter ? ` with status "${statusFilter}"` : ""}.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>When (IST)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sold / Max</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const venueLabel = event.venueTba
                  ? "Venue TBA"
                  : (event.cafe?.name ?? event.venueName ?? "—");
                const maxLabel =
                  event.maxTickets !== null ? event.maxTickets : "∞";
                const isPending = event.status === "pending";
                const isUpcoming = event.status === "upcoming";

                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium text-neutral-900">
                      <span className="flex items-center gap-1.5">
                        {event.isGooutOfficial && (
                          <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="GoOut Official" />
                        )}
                        {event.title}
                      </span>
                      <p className="text-xs font-normal text-neutral-500">
                        /{event.slug}
                      </p>
                    </TableCell>
                    <TableCell className="text-neutral-700">
                      {venueLabel}
                      {event.cafe ? (
                        <span className="ml-1 text-xs text-neutral-500">
                          (cafe)
                        </span>
                      ) : event.venueName ? (
                        <span className="ml-1 text-xs text-neutral-500">
                          (custom)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-neutral-700">
                      {getEventTypeLabel(event.eventType)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-neutral-700">
                      {formatIst(event.startTime)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(event.status as EventStatus)}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-neutral-700">
                      {event.ticketsSold} / {maxLabel}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isPending && (
                          <form
                            action={approveEventVoid.bind(null, event.id)}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                              aria-label="Approve event"
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                          </form>
                        )}
                        {isUpcoming && (
                          <form
                            action={completeEventVoid.bind(null, event.id)}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                              aria-label="Mark event as completed"
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Complete
                            </Button>
                          </form>
                        )}
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label="View public page"
                        >
                          <Link
                            href={`/events/${event.slug}`}
                            target="_blank"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label="Edit"
                        >
                          <Link href={`/admin/events/${event.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
