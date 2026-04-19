import { type NextRequest } from "next/server";
import {
  getTicketsCsvRows,
  type TicketFilters,
  type TicketStatus,
} from "@/lib/queries/admin/tickets";

const VALID_STATUSES: TicketStatus[] = ["pending", "paid", "failed", "refunded"];

const CSV_HEADER = [
  "Booking Date",
  "Customer Name",
  "Email",
  "Phone",
  "Quantity",
  "Amount Paid (INR)",
  "Ticket Code",
  "Status",
  "Event Title",
  "Event Date (IST)",
] as const;

/**
 * Defense in depth: middleware already 404s non-localhost requests to
 * /api/admin/*, but we re-check here in case the matcher ever drifts.
 */
function isLocalhost(host: string | null): boolean {
  if (!host) return false;
  const hostOnly = host.split(":")[0];
  return hostOnly === "localhost" || hostOnly === "127.0.0.1";
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  // Quote if it contains comma, quote, or newline. Always quote for safety —
  // simpler and Excel-friendly. Inner quotes are doubled per RFC 4180.
  return `"${str.replace(/"/g, '""')}"`;
}

function todayIstSlug(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(request: NextRequest): Promise<Response> {
  if (!isLocalhost(request.headers.get("host"))) {
    return new Response(null, { status: 404 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const filters: TicketFilters = {
    eventId: url.searchParams.get("event_id") ?? undefined,
    status:
      statusParam && VALID_STATUSES.includes(statusParam as TicketStatus)
        ? (statusParam as TicketStatus)
        : undefined,
    fromDate: url.searchParams.get("from") ?? undefined,
    toDate: url.searchParams.get("to") ?? undefined,
  };

  const rows = await getTicketsCsvRows(filters);

  const lines: string[] = [CSV_HEADER.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.bookingDate,
        row.customerName,
        row.customerEmail,
        row.customerPhone,
        row.quantity,
        row.amountPaid,
        row.ticketCode,
        row.status,
        row.eventTitle,
        row.eventDate,
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  // Excel respects the BOM and renders UTF-8 (₹, accented names) correctly.
  const csv = `\uFEFF${lines.join("\r\n")}\r\n`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tickets-${todayIstSlug()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
