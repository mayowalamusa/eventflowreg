import { supabase } from "@/integrations/supabase/client";

/** Mirrors supabase/functions/_shared/google.ts EVENTFLOW_FIELDS. Kept as a
 * small, stable, duplicated constant rather than shared across the
 * Node/Deno boundary — it's just display metadata (field key + label), and
 * the backend is the source of truth for which keys it actually accepts. */
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

export type SyncRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "partial" | "failed";
  processed_count: number;
  added_count: number;
  updated_count: number;
  failed_count: number;
  error: string | null;
};

export type SheetsStatus = {
  connected: boolean;
  googleEmail?: string | null;
  spreadsheet: { id: string; name: string | null; url: string; worksheet: string } | null;
  fieldMapping: Record<string, string>;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
  syncRuns: SyncRun[];
};

async function callGoogleSheets<T>(
  action: string,
  extra: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("google-sheets", {
    body: { action, ...extra },
  });
  if (error) {
    // supabase-js surfaces non-2xx responses as `error` with a generic
    // message; the server's real message lives in the response body. Parse
    // it OUTSIDE the try/catch that's just guarding "was this JSON at
    // all" — an earlier version threw the recovered message from inside
    // that same try, which meant it was immediately caught by its own
    // catch and silently discarded every time.
    let message = error.message || "Something went wrong.";
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const body = await context.clone().json();
        message = body?.error || body?.message || message;
      } catch {
        /* response wasn't JSON — keep the generic message */
      }
    }
    throw new Error(message);
  }
  return data as T;
}

export async function startGoogleConnect(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
    "google-oauth-start",
    { body: {} },
  );
  if (error || !data?.url) {
    let message = error?.message || data?.error || "Could not start the Google connection.";
    const context = (error as { context?: Response } | undefined)?.context;
    if (context) {
      try {
        const body = await context.clone().json();
        message = body?.error || body?.message || message;
      } catch {
        /* response wasn't JSON — keep whatever message we already have */
      }
    }
    throw new Error(message);
  }
  window.location.href = data.url;
}

export function fetchSheetsStatus() {
  return callGoogleSheets<SheetsStatus>("status");
}

export function createSpreadsheet() {
  return callGoogleSheets<{
    status: string;
    spreadsheet: { id: string; name: string; url: string; worksheet: string };
  }>("create-spreadsheet");
}

export function saveFieldMapping(mapping: Record<string, string>) {
  return callGoogleSheets<{
    status: string;
    mapping: Record<string, string>;
    headerSyncWarning: string | null;
  }>("save-mapping", { mapping });
}

export function syncNow() {
  return callGoogleSheets<{
    status: "success" | "failed";
    processed?: number;
    added?: number;
    failed?: number;
    message?: string;
  }>("sync");
}

export function disconnectGoogle() {
  return callGoogleSheets<{ status: string }>("disconnect");
}
