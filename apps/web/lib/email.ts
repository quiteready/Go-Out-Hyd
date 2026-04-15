import { Resend } from "resend";

import { env } from "@/lib/env";

export type LeadNotificationPayload = {
  owner_name: string;
  cafe_name: string;
  phone: string;
  area: string;
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
  const to = env.LEAD_NOTIFICATION_EMAIL;

  if (!apiKey || !to) {
    console.warn(
      "[sendLeadNotification] Skipping email: set RESEND_API_KEY and LEAD_NOTIFICATION_EMAIL to enable notifications.",
    );
    return { ok: true };
  }

  const dashboardUrl = getSupabaseDashboardEditorUrl(env.SUPABASE_URL);
  const html = buildLeadEmailHtml(lead, dashboardUrl);
  const subject = `New Cafe Lead: ${lead.cafe_name}`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "GoOut Hyd <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
