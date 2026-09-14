// purge-deleted-accounts
//
// Meant to be invoked on a schedule (daily is plenty), NOT by any user —
// see the deployment note at the bottom of this file for how to actually
// wire that up, since it can't be done from application code.
//
// DESIGN DECISION (confirmed, not assumed):
// events.host_id and registrations.event_id both cascade through
// ON DELETE CASCADE chains rooted at auth.users, so hard-deleting a host's
// auth user destroys their events and every attendee's registration
// record for those events too. That's fine here specifically because
// EventFlow attendees have no independent account of their own —
// registering for an event is an anonymous insert (see
// registrations_public_insert / submitRegistration()), never linked to an
// auth.users row for the attendee. There is no attendee identity that
// outlives the host's account, so there's nothing independent left behind
// to protect. If EventFlow ever grows attendee-side login accounts, this
// decision needs revisiting before that ships — at that point deleting a
// host should almost certainly detach/reassign their registrations rather
// than cascade-destroy another person's account data.

import { createClient } from "npm:@supabase/supabase-js@2.111.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const GRACE_DAYS = 90;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Not JWT-gated (a scheduler has no user session), so this is the only
  // thing standing between this function and the public internet — never
  // deploy this without CRON_SECRET set.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    console.error("[purge-deleted-accounts] CRON_SECRET is not configured — refusing to run.");
    return json({ error: "Not configured" }, 503);
  }
  if (req.headers.get("x-cron-secret") !== cronSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" }, 500);
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: overdue, error } = await admin
    .from("profiles")
    .select("id")
    .not("deletion_requested_at", "is", null)
    .lt("deletion_requested_at", cutoff);

  if (error) {
    console.error("[purge-deleted-accounts] lookup failed", error);
    return json({ error: "Lookup failed" }, 500);
  }
  if (!overdue || overdue.length === 0) {
    return json({ processed: 0 });
  }

  let succeeded = 0;
  const failures: { id: string; error: string }[] = [];

  for (const { id } of overdue) {
    try {
      // Hard delete: cascades to events (host_id) and, through those,
      // registrations (event_id) — intentional, see the header above.
      const { error: deleteErr } = await admin.auth.admin.deleteUser(id);
      if (deleteErr) throw deleteErr;
      succeeded++;
    } catch (err) {
      failures.push({ id, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  if (failures.length > 0) {
    console.error("[purge-deleted-accounts] some accounts failed to process", failures);
  }

  return json({ processed: succeeded, failed: failures.length });
});

// ── Deployment note ──
// This function needs to run on a schedule — nothing in application code
// can do that. Set it up via Lovable's "Jobs" panel (Cloud → Jobs) if
// available, or directly via pg_cron + pg_net in Supabase:
//
//   select cron.schedule(
//     'purge-deleted-accounts-daily',
//     '0 3 * * *', -- daily at 03:00
//     $$
//     select net.http_post(
//       url := '<SUPABASE_URL>/functions/v1/purge-deleted-accounts',
//       headers := jsonb_build_object('x-cron-secret', '<CRON_SECRET>', 'Content-Type', 'application/json'),
//       body := '{}'::jsonb
//     );
//     $$
//   );
//
// Requires the pg_cron and pg_net extensions enabled. I can't enable or
// verify these from here — please confirm this is actually scheduled
// before relying on the 90-day window meaning anything in practice.
