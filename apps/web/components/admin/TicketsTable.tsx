import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DisabledRefundButton } from "@/components/admin/DisabledRefundButton";
import type {
  AdminTicketRow,
  TicketStatus,
} from "@/lib/queries/admin/tickets";

interface TicketsTableProps {
  tickets: AdminTicketRow[];
  /**
   * When true, hides the "Event" column. Use on per-event Bookings tab where
   * the event is already in context.
   */
  hideEventColumn?: boolean;
  emptyMessage?: string;
}

const IST_DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

function statusVariant(
  status: TicketStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "paid") return "default";
  if (status === "refunded") return "secondary";
  if (status === "failed") return "destructive";
  return "outline";
}

export function TicketsTable({
  tickets,
  hideEventColumn = false,
  emptyMessage = "No bookings match the current filters.",
}: TicketsTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white">
        <p className="p-10 text-center text-sm text-neutral-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booked (IST)</TableHead>
            {!hideEventColumn && <TableHead>Event</TableHead>}
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Amount (₹)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap text-neutral-700">
                {IST_DATE_FORMATTER.format(t.createdAt)}
              </TableCell>
              {!hideEventColumn && (
                <TableCell className="text-neutral-900">
                  <Link
                    href={`/admin/events/${t.event.id}`}
                    className="font-medium hover:underline"
                  >
                    {t.event.title}
                  </Link>
                  <p className="text-xs font-normal text-neutral-500">
                    {t.venueLabel} ·{" "}
                    {IST_DATE_FORMATTER.format(t.event.startTime)}
                  </p>
                </TableCell>
              )}
              <TableCell className="font-medium text-neutral-900">
                {t.customerName}
              </TableCell>
              <TableCell className="text-neutral-700">
                <div>{t.customerEmail}</div>
                <div className="text-xs text-neutral-500">
                  {t.customerPhone}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {t.quantity}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {t.amountPaid}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
              </TableCell>
              <TableCell>
                <Link
                  href={`/verify/${t.ticketCode}`}
                  target="_blank"
                  className="font-mono text-xs text-neutral-700 underline-offset-2 hover:underline"
                >
                  {t.ticketCode}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                <DisabledRefundButton />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
