// google-sheets
//
// Single JWT-authenticated dispatcher for every authenticated Google Sheets
// operation this integration needs. Consolidated into one function (rather
// than one per action) to keep the deploy surface small; each action is
// handled by its own function below for readability.
//
// Every action re-derives the caller's identity from their Supabase Auth
// JWT and only ever operates on *their own* google_connections row — there
// is no client-facing table access at all for this integration (see the
// Phase 4 migration), so this function is the sole read/write path.

import {
  adminClient,
  CORS_HEADERS,
  DEFAULT_FIELD_MAPPING,
  EVENTFLOW_FIELDS,
  getValidAccessToken,
  type GoogleConnectionRow,
  HttpError,
  json,
  loadConnection,
  requireUser,
} from "../_shared/google.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.111.0";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const SYNC_BATCH_LIMIT = 500;

function sheetsHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function a1Range(worksheet: string, colCount: number, row = 1) {
  const lastCol = String.fromCharCode("A".charCodeAt(0) + Math.max(0, colCount - 1));
  return `'${worksheet.replace(/'/g, "''")}'!A${row}:${lastCol}${row}`;
}

function activeColumns(mapping: Record<string, string>) {
  return EVENTFLOW_FIELDS.filter((f) => (mapping[f.key] ?? "").trim().length > 0);
}

async function writeHeaderRow(token: string, spreadsheetId: string, worksheet: string, mapping: Record<string, string>) {
  const cols = activeColumns(mapping);
  const range = a1Range(worksheet, cols.length);
  const res = await fetch(`${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
    method: "PUT",
    headers: sheetsHeaders(token),
    body: JSON.stringify({ values: [cols.map((c) => mapping[c.key])] }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Could not write header row (${res.status}): ${body.slice(0, 300)}`);
  }
}

// ---------- action: status ----------
async function actionStatus(admin: SupabaseClient, userId: string) {
  const connection = await loadConnection(admin, userId);
  const { data: runs } = await admin
    .from("sheet_sync_runs")
    .select("id, started_at, finished_at, status, processed_count, added_count, updated_count, failed_count, error")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(10);

  if (!connection) {
    return json({ connected: false, fields: EVENTFLOW_FIELDS, syncRuns: runs ?? [] });
  }

  return json({
    connected: connection.is_active && Boolean(connection.access_token || connection.refresh_token),
    googleEmail: connection.google_email,
    spreadsheet:
      connection.spreadsheet_id && connection.spreadsheet_url
        ? { id: connection.spreadsheet_id, name: connection.spreadsheet_name, url: connection.spreadsheet_url, worksheet: connection.worksheet_name }
        : null,
    fieldMapping: connection.field_mapping && Object.keys(connection.field_mapping).length ? connection.field_mapping : DEFAULT_FIELD_MAPPING,
    fields: EVENTFLOW_FIELDS,
    lastSyncedAt: connection.last_synced_at,
    lastSyncError: connection.last_sync_error,
    syncRuns: runs ?? [],
  });
}

// ---------- action: create-spreadsheet ----------
async function actionCreateSpreadsheet(admin: SupabaseClient, userId: string) {
  const connection = await loadConnection(admin, userId);
  if (!connection || !connection.is_active) {
    throw new HttpError(409, "Connect your Google account before creating a spreadsheet.");
  }
  if (connection.spreadsheet_id) {
    return json({
      status: "exists",
      spreadsheet: { id: connection.spreadsheet_id, name: connection.spreadsheet_name, url: connection.spreadsheet_url, worksheet: connection.worksheet_name },
    });
  }

  const token = await getValidAccessToken(admin, connection);
  const mapping = Object.keys(connection.field_mapping ?? {}).length ? connection.field_mapping : DEFAULT_FIELD_MAPPING;
  const worksheetName = connection.worksheet_name || "Registrations";
  const title = "EventFlow Registrations";

  const createRes = await fetch(SHEETS_API, {
    method: "POST",
    headers: sheetsHeaders(token),
    body: JSON.stringify({ properties: { title }, sheets: [{ properties: { title: worksheetName } }] }),
  });
  if (!createRes.ok) {
    const body = await createRes.text().catch(() => "");
    throw new HttpError(502, `Google Sheets couldn't create the spreadsheet (${createRes.status}): ${body.slice(0, 200)}`);
  }
  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId as string;
  const spreadsheetUrl = created.spreadsheetUrl as string;

  try {
    await writeHeaderRow(token, spreadsheetId, worksheetName, mapping);
  } catch (err) {
    // The spreadsheet exists even if the header write failed — don't lose
    // track of it, just surface the warning; the host can save mapping
    // again later to retry the header write.
    console.error("[google-sheets] header write failed after create", err);
  }

  await admin
    .from("google_connections")
    .update({
      spreadsheet_id: spreadsheetId,
      spreadsheet_name: title,
      spreadsheet_url: spreadsheetUrl,
      worksheet_name: worksheetName,
      field_mapping: mapping,
    })
    .eq("id", connection.id);

  return json({ status: "created", spreadsheet: { id: spreadsheetId, name: title, url: spreadsheetUrl, worksheet: worksheetName } });
}

// ---------- action: save-mapping ----------
async function actionSaveMapping(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const connection = await loadConnection(admin, userId);
  if (!connection) throw new HttpError(409, "Connect your Google account first.");

  const input = body.mapping;
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new HttpError(400, "mapping must be an object of field -> column header.");
  }
  const validKeys = new Set(EVENTFLOW_FIELDS.map((f) => f.key));
  const mapping: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!validKeys.has(key)) throw new HttpError(400, `Unknown field: ${key}`);
    if (typeof value !== "string") continue;
    const trimmed = value.trim().slice(0, 100);
    if (trimmed) mapping[key] = trimmed;
  }
  if (Object.keys(mapping).length === 0) {
    throw new HttpError(400, "At least one field must be mapped.");
  }

  await admin.from("google_connections").update({ field_mapping: mapping }).eq("id", connection.id);

  let headerSyncWarning: string | null = null;
  if (connection.spreadsheet_id && connection.is_active) {
    try {
      const token = await getValidAccessToken(admin, { ...connection, field_mapping: mapping });
      await writeHeaderRow(token, connection.spreadsheet_id, connection.worksheet_name, mapping);
    } catch (err) {
      headerSyncWarning = err instanceof Error ? err.message : "Could not update the spreadsheet header row.";
    }
  }

  return json({ status: "ok", mapping, headerSyncWarning });
}

// ---------- action: sync ----------
async function actionSync(admin: SupabaseClient, userId: string) {
  const connection = await loadConnection(admin, userId);
  if (!connection || !connection.is_active) {
    throw new HttpError(409, "Connect your Google account before syncing.");
  }
  if (!connection.spreadsheet_id) {
    throw new HttpError(409, "Create a spreadsheet before syncing.");
  }

  const { data: run } = await admin
    .from("sheet_sync_runs")
    .insert({ user_id: userId, connection_id: connection.id, status: "running" })
    .select("id")
    .single();
  const runId = run?.id as string | undefined;

  const finishRun = async (fields: Record<string, unknown>) => {
    if (!runId) return;
    await admin.from("sheet_sync_runs").update({ finished_at: new Date().toISOString(), ...fields }).eq("id", runId);
  };

  try {
    const { data: hostEvents, error: eventsErr } = await admin.from("events").select("id").eq("host_id", userId);
    if (eventsErr) throw eventsErr;
    const eventIds = (hostEvents ?? []).map((e) => e.id as string);

    if (eventIds.length === 0) {
      await finishRun({ status: "success", processed_count: 0, added_count: 0, failed_count: 0 });
      return json({ status: "success", processed: 0, added: 0, failed: 0 });
    }

    const { data: pending, error: regErr } = await admin
      .from("registrations")
      .select("id, full_name, email, phone, ticket_code, status, created_at, amount_paid_cents, events(title)")
      .in("event_id", eventIds)
      .eq("synced_to_sheet", false)
      .order("created_at", { ascending: true })
      .limit(SYNC_BATCH_LIMIT);
    if (regErr) throw regErr;

    if (!pending || pending.length === 0) {
      await finishRun({ status: "success", processed_count: 0, added_count: 0, failed_count: 0 });
      await admin.from("google_connections").update({ last_synced_at: new Date().toISOString(), last_sync_error: null }).eq("id", connection.id);
      return json({ status: "success", processed: 0, added: 0, failed: 0 });
    }

    const token = await getValidAccessToken(admin, connection);
    const mapping = Object.keys(connection.field_mapping ?? {}).length ? connection.field_mapping : DEFAULT_FIELD_MAPPING;
    const cols = activeColumns(mapping);

    const valueFor = (reg: Record<string, unknown>, key: string): string => {
      switch (key) {
        case "full_name":
          return String(reg.full_name ?? "");
        case "email":
          return String(reg.email ?? "");
        case "phone":
          return String(reg.phone ?? "");
        case "event_title":
          return String((reg.events as { title?: string } | null)?.title ?? "");
        case "ticket_code":
          return String(reg.ticket_code ?? "");
        case "status":
          return String(reg.status ?? "");
        case "created_at":
          return reg.created_at ? new Date(reg.created_at as string).toISOString() : "";
        case "amount_paid_cents":
          return String(reg.amount_paid_cents ?? 0);
        default:
          return "";
      }
    };

    const rows = pending.map((reg) => cols.map((c) => valueFor(reg as Record<string, unknown>, c.key)));
    const range = a1Range(connection.worksheet_name, cols.length);

    const appendRes = await fetch(
      `${SHEETS_API}/${connection.spreadsheet_id}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: "POST", headers: sheetsHeaders(token), body: JSON.stringify({ values: rows }) },
    );

    if (!appendRes.ok) {
      const bodyText = await appendRes.text().catch(() => "");
      const isMissing = appendRes.status === 404;
      const isRateLimited = appendRes.status === 429;
      const message = isMissing
        ? "The connected spreadsheet or worksheet couldn't be found. It may have been deleted or renamed — try reconnecting."
        : isRateLimited
          ? "Google Sheets rate limit reached. Try syncing again in a minute."
          : `Google Sheets error (${appendRes.status}): ${bodyText.slice(0, 200)}`;
      await admin.from("google_connections").update({ last_sync_error: message }).eq("id", connection.id);
      await finishRun({ status: "failed", processed_count: pending.length, added_count: 0, failed_count: pending.length, error: message });
      return json({ status: "failed", message });
    }

    const ids = pending.map((r) => r.id as string);
    await admin.from("registrations").update({ synced_to_sheet: true }).in("id", ids);
    await admin.from("google_connections").update({ last_synced_at: new Date().toISOString(), last_sync_error: null }).eq("id", connection.id);
    await finishRun({ status: "success", processed_count: ids.length, added_count: ids.length, failed_count: 0 });

    return json({ status: "success", processed: ids.length, added: ids.length, failed: 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sync error";
    await finishRun({ status: "failed", error: message });
    await admin.from("google_connections").update({ last_sync_error: message }).eq("id", connection.id);
    // Every outcome of `sync` — including precondition failures like a
    // revoked token — comes back as {status:"failed", message} with 200,
    // the same shape as a Sheets API failure. The action ran and produced
    // a definitive, recordable outcome; it didn't crash. Keeping one
    // response contract for this action (rather than sometimes a thrown
    // HTTP error, sometimes this shape) keeps the frontend simple.
    return json({ status: "failed", message });
  }
}

// ---------- action: disconnect ----------
async function actionDisconnect(admin: SupabaseClient, userId: string) {
  const connection = await loadConnection(admin, userId);
  if (!connection) return json({ status: "disconnected" });

  if (connection.refresh_token) {
    try {
      await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: connection.refresh_token }),
      });
    } catch (err) {
      // Best-effort: even if Google's revoke call fails, we still forget
      // our copy of the credential below, which is what actually matters.
      console.error("[google-sheets] revoke call failed", err);
    }
  }

  await admin
    .from("google_connections")
    .update({ access_token: null, refresh_token: null, token_expires_at: null, scopes: [], is_active: false })
    .eq("id", connection.id);

  return json({ status: "disconnected" });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = adminClient();

  try {
    const user = await requireUser(req, admin);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";

    switch (action) {
      case "status":
        return await actionStatus(admin, user.id);
      case "create-spreadsheet":
        return await actionCreateSpreadsheet(admin, user.id);
      case "save-mapping":
        return await actionSaveMapping(admin, user.id, body);
      case "sync":
        return await actionSync(admin, user.id);
      case "disconnect":
        return await actionDisconnect(admin, user.id);
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error("[google-sheets] unhandled error", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
