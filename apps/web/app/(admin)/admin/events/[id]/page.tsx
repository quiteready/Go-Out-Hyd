import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EventForm } from "@/components/admin/EventForm";
import { CancelEventButton } from "@/components/admin/CancelEventButton";
import { DeleteEventButton } from "@/components/admin/DeleteEventButton";
import { TicketsTable } from "@/components/admin/TicketsTable";
import {
  getEventForAdmin,
  listCafesForPicker,
} from "@/lib/queries/admin/events";
import { listTicketsForAdmin } from "@/lib/queries/admin/tickets";
import { getEventTypeLabel } from "@/lib/constants/events";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

function statusVariant(
  status: "upcoming" | "cancelled" | "completed",
): "default" | "secondary" | "destructive" {
  if (status === "cancelled") return "destructive";
  if (status === "completed") return "secondary";
  return "default";
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const [event, cafes] = await Promise.all([
    getEventForAdmin(id),
    listCafesForPicker(),
  ]);
  if (!event) notFound();

  const eventTickets = await listTicketsForAdmin({ eventId: event.id });

  const venueLabel = event.cafe?.name ?? event.venueName ?? "—";
  const isCancelled = event.status === "cancelled";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>
          <h2 className="mt-3 text-2xl font-semibold text-neutral-900">
            {event.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
            <span>·</span>
            <span>{getEventTypeLabel(event.eventType)}</span>
            <span>·</span>
            <span>{venueLabel}</span>
            <span>·</span>
            <span>{IST_DATE_FORMATTER.format(event.startTime)} IST</span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">/events/{event.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/events/${event.slug}`} target="_blank">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              View public page
            </Link>
          </Button>
          <CancelEventButton
            eventId={event.id}
            eventTitle={event.title}
            ticketsSold={event.ticketsSold}
            alreadyCancelled={isCancelled}
          />
          <DeleteEventButton eventId={event.id} eventTitle={event.title} />
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings ({event.ticketsSold})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <EventForm event={event} cafes={cafes} />
        </TabsContent>

        <TabsContent value="bookings" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4">
            <div>
              <p className="text-sm text-neutral-700">
                <span className="font-medium text-neutral-900">
                  {event.ticketsSold}
                </span>{" "}
                paid · {eventTickets.length} total record
                {eventTickets.length === 1 ? "" : "s"} (incl. pending/failed).
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                For filters across all events, visit the global Tickets page.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a
                href={`/api/admin/tickets/export?event_id=${event.id}`}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Export CSV
              </a>
            </Button>
          </div>

          <TicketsTable
            tickets={eventTickets}
            hideEventColumn
            emptyMessage="No bookings yet for this event."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
