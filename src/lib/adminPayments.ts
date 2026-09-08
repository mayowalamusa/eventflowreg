import { supabase } from "@/integrations/supabase/client";

export type PaymentRow = {
  id: string;
  full_name: string;
  email: string;
  amount_paid_cents: number;
  currency: string;
  status: string;
  created_at: string;
  eventTitle: string;
  ticketName: string | null;
};

export type PaymentsSummary = {
  grossCents: number;
  paidCount: number;
  averageCents: number;
  currency: string;
  rows: PaymentRow[];
};

/** Read-only payment activity derived from recorded registration amounts. */
export async function fetchPayments(search = ""): Promise<PaymentsSummary> {
  const { data, error } = await supabase
    .from("registrations")
    .select(
      "id, full_name, email, amount_paid_cents, status, created_at, event_id, ticket_id, events(title, currency), event_tickets(name)",
    )
    .gt("amount_paid_cents", 0)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;

  const term = search.trim().toLowerCase();
  const rows: PaymentRow[] = (data ?? [])
    .map((r) => {
      const event = r.events as { title?: string; currency?: string } | null;
      const ticket = r.event_tickets as { name?: string } | null;
      return {
        id: r.id,
        full_name: r.full_name,
        email: r.email,
        amount_paid_cents: r.amount_paid_cents ?? 0,
        currency: event?.currency ?? "NGN",
        status: r.status ?? "confirmed",
        created_at: r.created_at,
        eventTitle: event?.title ?? "Unknown event",
        ticketName: ticket?.name ?? null,
      };
    })
    .filter(
      (r) =>
        !term ||
        r.full_name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.eventTitle.toLowerCase().includes(term),
    );

  const grossCents = rows.reduce((sum, r) => sum + r.amount_paid_cents, 0);
  return {
    grossCents,
    paidCount: rows.length,
    averageCents: rows.length ? Math.round(grossCents / rows.length) : 0,
    currency: rows[0]?.currency ?? "NGN",
    rows,
  };
}

export function formatMoney(cents: number, currency = "NGN") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
