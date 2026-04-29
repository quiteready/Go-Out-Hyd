import QRCode from "qrcode";
import { Resend } from "resend";

import { env } from "@/lib/env";
import type { TicketWithEventAndCafe } from "@/lib/queries/tickets";
import { buildVerifyUrl } from "@/lib/tickets-qr";

export type LeadNotificationPayload = {
  owner_name: string;
  cafe_name: string;
  phone: string;
  area: string;
  description?: string;
  instagram_handle?: string;
  created_at: Date;
};

export type SendLeadNotificationResult =
  | { ok: true }
  | { ok: false; error: string };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Supabase hosted projects use `{ref}.supabase.co`. The dashboard opens the project editor for that ref.
 */
function getSupabaseDashboardEditorUrl(supabaseUrl: string): string {
  try {
    const host = new URL(supabaseUrl).hostname;
    const match = /^([^.]+)\.supabase\.co$/.exec(host);
    if (!match) {
      return "https://supabase.com/dashboard";
    }
    const projectRef = match[1];
    return `https://supabase.com/dashboard/project/${projectRef}/editor`;
  } catch {
    return "https://supabase.com/dashboard";
  }
}

function buildLeadEmailHtml(lead: LeadNotificationPayload, dashboardUrl: string): string {
  const rows: [string, string][] = [
    ["Owner name", lead.owner_name],
    ["Cafe name", lead.cafe_name],
    ["Phone", lead.phone],
    ["Area", lead.area],
    ...(lead.instagram_handle
      ? ([["Instagram", lead.instagram_handle]] as [string, string][])
      : []),
    ...(lead.description
      ? ([["About the cafe", lead.description]] as [string, string][])
      : []),
    [
      "Submitted at",
      lead.created_at.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    ],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">${escapeHtml(label)}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8" /></head>
  <body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111827;">
    <h1 style="font-size:1.25rem;">New cafe partner lead</h1>
    <table style="border-collapse:collapse;margin:16px 0;">${tableRows}</table>
    <p style="margin-top:16px;">
      Open the Supabase dashboard and review the <strong>cafe_leads</strong> table:
      <a href="${escapeHtml(dashboardUrl)}">${escapeHtml(dashboardUrl)}</a>
    </p>
  </body>
</html>`;
}

/**
 * Sends Wilson a notification for a new row in `cafe_leads`.
 * When Resend is not configured, returns `{ ok: true }` after logging — lead persistence stays independent.
 */
export async function sendLeadNotification(
  lead: LeadNotificationPayload,
): Promise<SendLeadNotificationResult> {
  const apiKey = env.RESEND_API_KEY;
  const rawTo = env.LEAD_NOTIFICATION_EMAIL;

  if (!apiKey || !rawTo) {
    console.warn(
      "[sendLeadNotification] Skipping email: set RESEND_API_KEY and LEAD_NOTIFICATION_EMAIL to enable notifications.",
    );
    return { ok: true };
  }

  // LEAD_NOTIFICATION_EMAIL may be a single address or a comma-separated list
  // (e.g. business Gmail + personal Gmail). Trim whitespace and drop empty entries.
  const toList = rawTo
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);

  if (toList.length === 0) {
    console.warn(
      "[sendLeadNotification] Skipping email: LEAD_NOTIFICATION_EMAIL parsed to empty recipient list.",
    );
    return { ok: true };
  }

  const dashboardUrl = getSupabaseDashboardEditorUrl(env.SUPABASE_URL);
  const html = buildLeadEmailHtml(lead, dashboardUrl);
  const subject = `New Cafe Lead: ${lead.cafe_name}`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "GoOut Hyd <leads@goouthyd.com>",
    to: toList,
    subject,
    html,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

// ─── Event submission notification ────────────────────────────────────────────

export type EventSubmissionNotificationPayload = {
  title: string;
  eventType: string;
  organizerName: string;
  organizerPhone: string;
  organizerInstagram?: string;
  startTime: Date;
  venueName?: string;
  venueTba: boolean;
  description?: string;
  submittedAt: Date;
};

export type SendEventSubmissionNotificationResult =
  | { ok: true }
  | { ok: false; error: string };

function buildEventSubmissionEmailHtml(
  event: EventSubmissionNotificationPayload,
  dashboardUrl: string,
): string {
  const venueDisplay = event.venueTba
    ? "To Be Announced"
    : (event.venueName ?? "Not specified");

  const startTimeDisplay = event.startTime.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rows: [string, string][] = [
    ["Event title", event.title],
    ["Event type", event.eventType],
    ["Organizer name", event.organizerName],
    ["Organizer phone", event.organizerPhone],
    ...(event.organizerInstagram
      ? ([["Instagram", event.organizerInstagram]] as [string, string][])
      : []),
    ["Start time (IST)", startTimeDisplay],
    ["Venue", venueDisplay],
    ...(event.description
      ? ([["Description", event.description]] as [string, string][])
      : []),
    [
      "Submitted at",
      event.submittedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    ],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">${escapeHtml(label)}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8" /></head>
  <body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111827;">
    <h1 style="font-size:1.25rem;">New event submission — approval required</h1>
    <p style="color:#6b7280;margin:0 0 16px;">An organizer has submitted an event via the public form. Review it in the admin dashboard and approve or reject.</p>
    <table style="border-collapse:collapse;margin:16px 0;">${tableRows}</table>
    <p style="margin-top:16px;">
      Review pending events in the admin dashboard:
      <a href="${escapeHtml(dashboardUrl)}">${escapeHtml(dashboardUrl)}</a>
    </p>
  </body>
</html>`;
}

/**
 * Notifies Wilson when an organizer submits an event via the public /submit-event form.
 * The event is saved with status 'pending' — this email is the trigger to review it.
 * If Resend is not configured, returns { ok: true } after logging — submission is already saved.
 */
export async function sendEventSubmissionNotification(
  event: EventSubmissionNotificationPayload,
): Promise<SendEventSubmissionNotificationResult> {
  const apiKey = env.RESEND_API_KEY;
  const rawTo = env.LEAD_NOTIFICATION_EMAIL;

  if (!apiKey || !rawTo) {
    console.warn(
      "[sendEventSubmissionNotification] Skipping email: set RESEND_API_KEY and LEAD_NOTIFICATION_EMAIL to enable notifications.",
    );
    return { ok: true };
  }

  const toList = rawTo
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);

  if (toList.length === 0) {
    console.warn(
      "[sendEventSubmissionNotification] Skipping email: LEAD_NOTIFICATION_EMAIL parsed to empty recipient list.",
    );
    return { ok: true };
  }

  const dashboardUrl = getSupabaseDashboardEditorUrl(env.SUPABASE_URL);
  const html = buildEventSubmissionEmailHtml(event, dashboardUrl);
  const subject = `New Event Submission: ${event.title}`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "GoOut Hyd <leads@goouthyd.com>",
    to: toList,
    subject,
    html,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

// ─── Ticket email ─────────────────────────────────────────────────────────────

export type SendTicketEmailResult = { ok: true } | { ok: false; error: string };

function formatEventDate(date: Date): string {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildTicketEmailHtml(
  ticket: TicketWithEventAndCafe,
  qrCidSrc: string,
): string {
  const venueLine = ticket.event.cafe
    ? `${escapeHtml(ticket.event.cafe.name)}, ${escapeHtml(ticket.event.cafe.area)}`
    : "Venue TBC";

  const rows: [string, string][] = [
    ["Event", ticket.event.title],
    ["Date", formatEventDate(ticket.event.startTime)],
    ["Venue", venueLine],
    ["Name", ticket.customerName],
    ["Tickets", String(ticket.quantity)],
    ["Amount Paid", `₹${ticket.amountPaid}`],
    ["Ticket Code", ticket.ticketCode],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5d5c0;font-weight:600;background:#fdf6ee;">${escapeHtml(label)}</td><td style="padding:8px 12px;border:1px solid #e5d5c0;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8" /></head>
  <body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1C1008;max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#C4813A;padding:20px 24px;border-radius:8px 8px 0 0;">
      <h1 style="margin:0;color:#FFFCF7;font-size:1.4rem;">Your ticket is confirmed!</h1>
      <p style="margin:4px 0 0;color:#fde8cc;font-size:0.9rem;">GoOut Hyd</p>
    </div>
    <div style="border:1px solid #e5d5c0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
      <p style="margin:0 0 16px;">Hi ${escapeHtml(ticket.customerName)}, your booking is confirmed. Show this QR code at the venue entrance.</p>
      <div style="text-align:center;margin:24px 0;">
        <img src="${qrCidSrc}" alt="Ticket QR Code" width="220" height="220" style="display:block;margin:0 auto;border:4px solid #C4813A;border-radius:8px;" />
        <p style="margin:8px 0 0;font-size:0.75rem;color:#7a6a5a;font-family:monospace;">${escapeHtml(ticket.ticketCode)}</p>
      </div>
      <table style="border-collapse:collapse;width:100%;margin:16px 0;">${tableRows}</table>
      <p style="margin-top:20px;font-size:0.85rem;color:#7a6a5a;">
        Questions? Contact the venue directly. See you there!
      </p>
    </div>
  </body>
</html>`;
}

/**
 * Sends a ticket confirmation email with an inline QR code to the customer.
 * If Resend is not configured, logs a warning and returns ok — ticket is already saved.
 */
export async function sendTicketEmail(
  ticket: TicketWithEventAndCafe,
): Promise<SendTicketEmailResult> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[sendTicketEmail] Skipping email: RESEND_API_KEY not set.");
    return { ok: true };
  }

  const verifyUrl = buildVerifyUrl(ticket.ticketCode);
  let qrPngBuffer: Buffer;
  let qrDataUrlFallback: string;
  try {
    qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#1C1008",
        light: "#FFFCF7",
      },
    });
    qrDataUrlFallback = await QRCode.toDataURL(verifyUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#1C1008",
        light: "#FFFCF7",
      },
    });
  } catch (err) {
    console.error("[sendTicketEmail] QR generation failed:", err);
    return { ok: false, error: "QR code generation failed." };
  }

  const qrContentId = "goouthyd-ticket-qr";
  // CID reference renders inline in Gmail, Outlook, Apple Mail.
  // The data-URL fallback is kept only for preview clients that strip CID.
  const html = buildTicketEmailHtml(ticket, `cid:${qrContentId}`);
  const htmlWithFallback = html.replace(
    `src="cid:${qrContentId}"`,
    `src="cid:${qrContentId}" data-fallback-src="${qrDataUrlFallback}"`,
  );
  const subject = `Your ticket for ${ticket.event.title} — GoOut Hyd`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "GoOut Hyd <tickets@goouthyd.com>",
    to: [ticket.customerEmail],
    subject,
    html: htmlWithFallback,
    attachments: [
      {
        filename: "ticket-qr.png",
        content: qrPngBuffer.toString("base64"),
        contentId: qrContentId,
      },
    ],
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
