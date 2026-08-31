import { supabase } from "@/integrations/supabase/client";

/**
 * Host-facing registration queries for the /dashboard/registrations page.
 *
 * Security note: every query here goes through the `registrations` table's
 * RLS policy (`registrations_host_read`), which restricts rows to
 * `event.host_id = auth.uid()` (or an admin). Filters below (event, status,
 * search, pagination) only narrow an already-authorized result set — they
 * are not what makes this safe. A host cannot see another host's
 * registrations by changing `eventId`, editing the request, or removing a
 * filter; Postgres enforces that regardless of what the client sends.
 */

export const REGISTRATIONS_PAGE_SIZE = 20;

export type RegistrationStatusFilter = "all" | "confirmed" | "pending" | "cancelled";

export type HostRegistrationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  event_id: string;
  created_at: string;
  status: string;
  ticket_code: string | null;
  amount_paid_cents: number;
  eventTitle: string;
  eventCurrency: string;
  ticketName: string | null;
};

export type HostEventOption = {
  id: string;
  title: string;
};

export type FetchHostRegistrationsArgs = {
  userId: string;
  page: number; // 0-indexed
  pageSize?: number;
  search?: string;
  eventId?: string; // "all" or a specific event id
  status?: RegistrationStatusFilter;
};

export type HostRegistrationsResult = {
  rows: HostRegistrationRow[];
  totalCount: number;
};

/** Escapes characters that would otherwise break a PostgREST `ilike`/`or` filter string. */
function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[%,()]/g, "");
}

/** Paginated, filtered registrations for the current host. RLS scopes results server-side. */
export async function fetchHostRegistrations({
  userId,
  page,
  pageSize = REGISTRATIONS_PAGE_SIZE,
  search,
  eventId = "all",
  status = "all",
}: FetchHostRegistrationsArgs): Promise<HostRegistrationsResult> {
  if (!userId) return { rows: [], totalCount: 0 };

  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("registrations")
    .select(
      "id, full_name, email, phone, event_id, created_at, status, ticket_code, amount_paid_cents, events(title, currency), event_tickets(name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (eventId !== "all") {
    query = query.eq("event_id", eventId);
  }
  if (status !== "all") {
    query = query.eq("status", status);
  }
  const term = search ? sanitizeSearchTerm(search) : "";
  if (term) {
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,ticket_code.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows: HostRegistrationRow[] = (data ?? []).map((r) => {
    const event = r.events as { title: string; currency: string } | null;
    const ticket = r.event_tickets as { name: string } | null;
    return {
      id: r.id,
      full_name: r.full_name,
      email: r.email,
      phone: r.phone,
      event_id: r.event_id,
      created_at: r.created_at,
      status: r.status,
      ticket_code: r.ticket_code,
      amount_paid_cents: r.amount_paid_cents,
      eventTitle: event?.title ?? "Untitled event",
      eventCurrency: event?.currency ?? "USD",
      ticketName: ticket?.name ?? null,
    };
  });

  return { rows, totalCount: count ?? 0 };
}

/** The host's own events, for the registrations page filter dropdown. */
export async function fetchHostEventOptions(userId: string): Promise<HostEventOption[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("events")
    .select("id, title")
    .eq("host_id", userId)
    .order("title", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function formatRegistrationAmount(cents: number, currency: string): string {
  if (cents <= 0) return "Free";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function formatRegistrationDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
