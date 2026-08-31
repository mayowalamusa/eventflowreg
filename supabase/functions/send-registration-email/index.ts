// send-registration-email
//
// Sends the attendee's registration confirmation email via Resend.
//
// Security model: this function is invoked by anonymous browser clients
// (event registration doesn't require login), so it takes no auth beyond a
// `registrationId` (the registration row's UUID primary key). That UUID is
// effectively an unguessable capability token — it's returned to the
// browser only once, immediately after that same browser created the row.
// Everything else (attendee name/email, event details, organizer info) is
// looked up server-side with the service-role key; nothing from the
// request body beyond the id is ever trusted or put in the email.
//
// This function is idempotent: if `email_status` is already `sent` for a
// registration, it's a no-op. It never throws back to the caller for
// provider/config failures — those are recorded on the row and returned as
// a normal `{ status: "failed" }` response, because a failed *email* must
// never look like a failed *registration* to the caller.

import { createClient } from "npm:@supabase/supabase-js@2.111.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return SAFE_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

type EmailContent = {
  attendeeName: string;
  eventTitle: string;
  dateLabel: string;
  timeLabel: string;
  timezone: string | null;
  locationLine: string;
  destination: string | null;
  destinationLabel: string;
  ticketCode: string | null;
  organizerName: string | null;
  organizerEmail: string | null;
};

function renderEmailHtml(c: EmailContent): string {
  const e = escapeHtml;
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <p style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#4F46E5;font-weight:700;margin:0 0 24px;">EventFlow</p>
      <div style="background:#ffffff;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
        <div style="padding:28px 28px 8px;">
          <h1 style="font-size:20px;color:#0F172A;margin:0 0 8px;">You're registered!</h1>
          <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px;">
            Hi ${e(c.attendeeName)}, your spot at <strong>${e(c.eventTitle)}</strong> is confirmed.
          </p>
        </div>
        <div style="padding:0 28px 24px;">
          <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#94A3B8;width:110px;">Date</td><td style="padding:6px 0;">${e(c.dateLabel)}${c.timeLabel ? ` · ${e(c.timeLabel)}` : ""}${c.timezone ? ` (${e(c.timezone)})` : ""}</td></tr>
            <tr><td style="padding:6px 0;color:#94A3B8;">Location</td><td style="padding:6px 0;">${e(c.locationLine)}</td></tr>
            ${c.ticketCode ? `<tr><td style="padding:6px 0;color:#94A3B8;">Reg. code</td><td style="padding:6px 0;font-family:monospace;">${e(c.ticketCode)}</td></tr>` : ""}
            ${c.organizerName ? `<tr><td style="padding:6px 0;color:#94A3B8;">Hosted by</td><td style="padding:6px 0;">${e(c.organizerName)}${c.organizerEmail ? ` (${e(c.organizerEmail)})` : ""}</td></tr>` : ""}
          </table>
        </div>
        ${
          c.destination
            ? `<div style="padding:0 28px 28px;">
          <a href="${c.destination}" style="display:inline-block;background:#4F46E5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">${e(c.destinationLabel)}</a>
        </div>`
            : ""
        }
      </div>
      <p style="font-size:12px;color:#94A3B8;margin:20px 4px 0;line-height:1.6;">
        Keep this email as your confirmation. If anything about this event changes, the organizer will contact you at the address you registered with.
      </p>
      <p style="font-size:12px;color:#CBD5E1;margin:16px 4px 0;">
        This is an automated message from EventFlow.
      </p>
    </div>
  </body>
</html>`;
}

function renderEmailText(c: EmailContent): string {
  const lines = [
    `You're registered for ${c.eventTitle}`,
    "",
    `Hi ${c.attendeeName}, your spot is confirmed.`,
    "",
    `Date: ${c.dateLabel}${c.timeLabel ? ` · ${c.timeLabel}` : ""}${c.timezone ? ` (${c.timezone})` : ""}`,
    `Location: ${c.locationLine}`,
  ];
  if (c.ticketCode) lines.push(`Registration code: ${c.ticketCode}`);
  if (c.organizerName) lines.push(`Hosted by: ${c.organizerName}${c.organizerEmail ? ` (${c.organizerEmail})` : ""}`);
  if (c.destination) lines.push("", `${c.destinationLabel}: ${c.destination}`);
  lines.push("", "This is an automated message from EventFlow.");
  return lines.join("\n");
}

const DESTINATION_LABELS: Record<string, string> = {
  whatsapp: "Join the WhatsApp group",
  telegram: "Join the Telegram channel",
  zoom: "Join the Zoom meeting",
  google_meet: "Join on Google Meet",
  microsoft_teams: "Join on Microsoft Teams",
  custom: "Continue to the event",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { registrationId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const registrationId = typeof body.registrationId === "string" ? body.registrationId : "";
  if (!UUID_RE.test(registrationId)) {
    return json({ error: "A valid registrationId is required" }, 400);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("[send-registration-email] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return json({ status: "failed", message: "Email service is not configured." });
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Authoritative lookup: only the id came from the client. Everything used
  // in the email is re-fetched here, never trusted from the request body.
  const { data: reg, error: regError } = await admin
    .from("registrations")
    .select(
      "id, full_name, email, ticket_code, email_status, event_id, " +
        "events(title, event_date, event_time, timezone, location, event_type, destination_type, destination_url, organizer_name, organizer_profile_id)",
    )
    .eq("id", registrationId)
    .maybeSingle();

  if (regError) {
    console.error("[send-registration-email] lookup failed", regError);
    return json({ status: "failed", message: "Could not look up this registration." });
  }
  if (!reg || !reg.events) {
    return json({ error: "Registration not found" }, 404);
  }

  // Idempotent — never send twice for the same registration, whether this
  // is a page refresh, a duplicate invocation, or a retried request.
  if (reg.email_status === "sent") {
    return json({ status: "already_sent" });
  }

  const event = reg.events as Record<string, unknown>;

  let organizerName = (event.organizer_name as string | null) ?? null;
  let organizerEmail: string | null = null;
  if (event.organizer_profile_id) {
    const { data: org } = await admin
      .from("organizer_profiles")
      .select("display_name, contact_email")
      .eq("id", event.organizer_profile_id as string)
      .maybeSingle();
    if (org) {
      organizerName = org.display_name || organizerName;
      organizerEmail = org.contact_email ?? null;
    }
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    const message = "Email provider is not configured (missing RESEND_API_KEY / RESEND_FROM_EMAIL).";
    console.error(`[send-registration-email] ${message}`);
    await admin.from("registrations").update({ email_status: "failed", email_error: message }).eq("id", registrationId);
    return json({ status: "failed", message: "Email service is not configured." });
  }

  const dateLabel = (() => {
    try {
      return new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return String(event.event_date ?? "");
    }
  })();
  const timeLabel = typeof event.event_time === "string" ? event.event_time.slice(0, 5) : "";
  const destination = safeUrl(event.destination_url as string | null | undefined);
  const destType = (event.destination_type as string | null) ?? "custom";
  const locationLine =
    event.event_type === "online"
      ? destination
        ? "Online — join link below"
        : "Online event"
      : (event.location as string | null) || "Location to be announced";

  const content: EmailContent = {
    attendeeName: reg.full_name,
    eventTitle: event.title as string,
    dateLabel,
    timeLabel,
    timezone: (event.timezone as string | null) ?? null,
    locationLine,
    destination,
    destinationLabel: DESTINATION_LABELS[destType] ?? DESTINATION_LABELS.custom,
    ticketCode: reg.ticket_code,
    organizerName,
    organizerEmail,
  };

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [reg.email],
        subject: `You're registered: ${content.eventTitle}`,
        html: renderEmailHtml(content),
        text: renderEmailText(content),
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text().catch(() => "");
      throw new Error(`Resend responded ${resendResponse.status}: ${errText.slice(0, 300)}`);
    }

    await admin
      .from("registrations")
      .update({ email_status: "sent", email_sent_at: new Date().toISOString(), email_error: null })
      .eq("id", registrationId);

    return json({ status: "sent" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email delivery error";
    console.error("[send-registration-email] delivery failed:", message);
    await admin
      .from("registrations")
      .update({ email_status: "failed", email_error: message.slice(0, 500) })
      .eq("id", registrationId);
    // 200, not 500: the function did its job (attempted delivery). The
    // caller should treat this as a known, handled outcome, not a crash.
    return json({ status: "failed", message: "We couldn't send the confirmation email." });
  }
});
