import Link from "next/link";
import { Plus, Pencil, ExternalLink } from "lucide-react";
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

function statusVariant(
  status: "upcoming" | "cancelled" | "completed",
): "default" | "secondary" | "destructive" {
  if (status === "cancelled") return "destructive";
  if (status === "completed") return "secondary";
  return "default";
}

export default async function AdminEventsPage() {
  const events = await listEventsForAdmin();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">Events</h2>
          <p className="mt-1 text-sm text-neutral-600">{events.length} total</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New event
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        {events.length === 0 ? (
          <p className="p-10 text-center text-sm text-neutral-500">
            No events yet. Create your first one to get started.
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
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const venueLabel =
                  event.cafe?.name ?? event.venueName ?? "—";
                const maxLabel =
                  event.maxTickets !== null ? event.maxTickets : "∞";
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium text-neutral-900">
                      {event.title}
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
                      <Badge variant={statusVariant(event.status)}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-neutral-700">
                      {event.ticketsSold} / {maxLabel}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label="View public page"
                        >
                          <Link href={`/events/${event.slug}`} target="_blank">
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
