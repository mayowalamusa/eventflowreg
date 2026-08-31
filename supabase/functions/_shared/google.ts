// Shared helpers for the Google Sheets integration functions
// (google-oauth-start, google-oauth-callback, google-sheets).

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.111.0";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** The only EventFlow fields a host can map to spreadsheet columns. Scoped
 * to fixed, always-present registration fields — not arbitrary per-event
 * custom_answers, since one spreadsheet spans registrations across many of
 * the host's events, each of which may define a different set of custom
 * fields. Mapping a variable schema into fixed columns is a materially
 * different (and harder) feature than what the original mock UI covered;
 * out of scope here, same scope the mock itself had. */
export const EVENTFLOW_FIELDS: { key: string; label: string }[] = [
  { key: "full_name", label: "Full Name" },
  { key: "email", label: "Email Address" },
  { key: "phone", label: "Phone Number" },
  { key: "event_title", label: "Event Title" },
  { key: "ticket_code", label: "Ticket Code" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Registration Date" },
  { key: "amount_paid_cents", label: "Amount Paid (cents)" },
];

export const DEFAULT_FIELD_MAPPING: Record<string, string> = Object.fromEntries(
  EVENTFLOW_FIELDS.map((f) => [f.key, f.label]),
);

export function env(name: string): string | null {
  return Deno.env.get(name) ?? null;
}

export function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

/** Service-role client — bypasses RLS, used for every read/write this
 * integration performs. Never exposed to the browser. */
export function adminClient(): SupabaseClient {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}

/** Resolves the calling host's user id from their Supabase Auth JWT. Used
 * by every function in this integration except the OAuth callback (which
 * Google redirects to directly, with no app JWT attached — that one relies
 * on the `state` CSRF token instead, see google-oauth-callback).
 *
 * `auth.getUser(token)` validates the bearer token against Supabase Auth
 * regardless of which key the client itself was constructed with, so this
 * reuses the same service-role client as everything else in this
 * integration rather than needing a second, separately-configured key. */
export async function requireUser(req: Request, admin: SupabaseClient): Promise<{ id: string; email: string | null }> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Missing Authorization header");

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Invalid or expired session");
  return { id: data.user.id, email: data.user.email ?? null };
}

/** Every Edge Function's public invocation URL is
 * `https://<project-ref>.supabase.co/functions/v1/<name>`, derived from the
 * auto-injected SUPABASE_URL. Used to build the Google OAuth redirect_uri
 * without needing a separately-configured secret for it. */
export function functionUrl(name: string): string {
  const supabaseUrl = new URL(requireEnv("SUPABASE_URL"));
  const projectRef = supabaseUrl.hostname.split(".")[0];
  return `https://${projectRef}.supabase.co/functions/v1/${name}`;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type GoogleConnectionRow = {
  id: string;
  user_id: string;
  google_email: string | null;
  google_account_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[];
  spreadsheet_id: string | null;
  spreadsheet_name: string | null;
  spreadsheet_url: string | null;
  worksheet_name: string;
  is_active: boolean;
  last_synced_at: string | null;
  last_sync_error: string | null;
  field_mapping: Record<string, string>;
};

/** Returns a live access token for this connection, refreshing it first if
 * it's expired or about to be. Throws HttpError(409, ...) if Google has
 * revoked authorization (refresh fails with invalid_grant) — callers should
 * mark the connection inactive and tell the host to reconnect. */
export async function getValidAccessToken(admin: SupabaseClient, connection: GoogleConnectionRow): Promise<string> {
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  const isFresh = expiresAt - Date.now() > 60_000; // 60s safety margin
  if (connection.access_token && isFresh) return connection.access_token;

  if (!connection.refresh_token) {
    throw new HttpError(409, "This connection has no refresh token. Please reconnect Google Sheets.");
  }

  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const isRevoked = payload?.error === "invalid_grant";
    const message = isRevoked
      ? "Google access was revoked. Please reconnect your Google account."
      : `Google token refresh failed: ${payload?.error_description ?? res.status}`;
    if (isRevoked) {
      await admin
        .from("google_connections")
        .update({ is_active: false, last_sync_error: message })
        .eq("id", connection.id);
    }
    throw new HttpError(409, message);
  }

  const accessToken = payload.access_token as string;
  const expiresIn = Number(payload.expires_in ?? 3600);
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await admin
    .from("google_connections")
    .update({ access_token: accessToken, token_expires_at: tokenExpiresAt })
    .eq("id", connection.id);

  return accessToken;
}

/** Loads the calling host's connection row, or null if they've never connected. */
export async function loadConnection(admin: SupabaseClient, userId: string): Promise<GoogleConnectionRow | null> {
  const { data, error } = await admin.from("google_connections").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data as GoogleConnectionRow | null;
}
