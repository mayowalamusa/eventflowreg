import { supabase } from "@/integrations/supabase/client";
import type { RegistrationStatusFilter } from "@/lib/hostRegistrations";

const FETCH_BATCH_SIZE = 1000;
const MAX_EXPORT_ROWS = 20000; // generous safety cap for a browser-side export

export type ExportFilters = {
  search?: string;
  eventId?: string;
  status?: RegistrationStatusFilter;
};

function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[%,()]/g, "");
}

/** All registrations matching the given filters, across every page — not
 * just what's currently rendered. Loops in batches since a single Supabase
 * request is capped well below what a full export might need.
 *
 * No userId parameter: like fetchHostRegistrations, this relies entirely on
 * RLS (registrations_host_read) to scope results to the caller's own
 * events — there's nothing here to add on top of that. */
export async function fetchAllHostRegistrationsForExport({
  search,
  eventId = "all",
  status = "all",
}: ExportFilters) {
  const rows: {
    full_name: string;
    email: string;
    phone: string | null;
    ticket_code: string | null;
    status: string;
    created_at: string;
    amount_paid_cents: number;
    eventTitle: string;
  }[] = [];

  let from = 0;
  while (rows.length < MAX_EXPORT_ROWS) {
    let query = supabase
      .from("registrations")
      .select(
        "full_name, email, phone, ticket_code, status, created_at, amount_paid_cents, events(title)",
      )
      .order("created_at", { ascending: false })
      .range(from, from + FETCH_BATCH_SIZE - 1);

    if (eventId !== "all") query = query.eq("event_id", eventId);
    if (status !== "all") query = query.eq("status", status);
    const term = search ? sanitizeSearchTerm(search) : "";
    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,ticket_code.ilike.%${term}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const r of data) {
      const event = r.events as { title: string } | null;
      rows.push({
        full_name: r.full_name,
        email: r.email,
        phone: r.phone,
        ticket_code: r.ticket_code,
        status: r.status,
        created_at: r.created_at,
        amount_paid_cents: r.amount_paid_cents,
        eventTitle: event?.title ?? "Untitled event",
      });
    }

    if (data.length < FETCH_BATCH_SIZE) break; // last page
    from += FETCH_BATCH_SIZE;
  }

  return rows;
}

/** RFC 4180-ish escaping: quote any field containing a comma, quote, or newline. */
function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function registrationsToCsv(
  rows: Awaited<ReturnType<typeof fetchAllHostRegistrationsForExport>>,
): string {
  const header = [
    "Name",
    "Email",
    "Phone",
    "Event",
    "Registration Code",
    "Status",
    "Amount Paid (cents)",
    "Registered At",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.full_name,
        r.email,
        r.phone ?? "",
        r.eventTitle,
        r.ticket_code ?? "",
        r.status,
        String(r.amount_paid_cents ?? 0),
        r.created_at,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  // \r\n line endings for maximum spreadsheet-app compatibility (Excel in particular).
  return lines.join("\r\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // BOM helps Excel detect UTF-8
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportHostRegistrationsCsv(
  filters: ExportFilters,
): Promise<{ count: number }> {
  const rows = await fetchAllHostRegistrationsForExport(filters);
  const csv = registrationsToCsv(rows);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`eventflow-registrations-${date}.csv`, csv);
  return { count: rows.length };
}
