import { supabase } from "@/integrations/supabase/client";
import { BANNER_BUCKET, type EventRow } from "@/lib/events";
import type { Database } from "@/integrations/supabase/types";

export type PublicEvent = EventRow & { bannerUrl: string | null };
export type EventFieldRow = Database["public"]["Tables"]["event_fields"]["Row"];

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop&auto=format";

/** Resolves a batch of banner values (storage paths or absolute URLs) to displayable URLs. */
export async function resolveBanners(rows: EventRow[]): Promise<PublicEvent[]> {
  const paths = Array.from(
    new Set(
      rows
        .map((r) => r.banner_url)
        .filter((b): b is string => Boolean(b) && !b!.startsWith("http") && !b!.startsWith("data:")),
    ),
  );

  const signed: Record<string, string> = {};
  if (paths.length) {
    const { data } = await supabase.storage.from(BANNER_BUCKET).createSignedUrls(paths, 60 * 60);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) signed[item.path] = item.signedUrl;
    }
  }

  return rows.map((r) => ({
    ...r,
    bannerUrl: !r.banner_url
      ? null
      : r.banner_url.startsWith("http") || r.banner_url.startsWith("data:")
        ? r.banner_url
        : (signed[r.banner_url] ?? null),
  }));
}

export function bannerOrFallback(event: { bannerUrl?: string | null }): string {
  return event.bannerUrl || FALLBACK_BANNER;
}

/** Published, publicly listed events (used by the homepage and discovery). */
export async function fetchPublicEvents(limit = 60): Promise<PublicEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .eq("visibility", "public")
    .order("event_date", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return resolveBanners((data ?? []) as EventRow[]);
}

/** A single published event by slug (falls back to id). Public + unlisted are viewable by link. */
export async function fetchPublicEvent(slugOrId: string): Promise<PublicEvent | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const query = supabase.from("events").select("*").eq("is_published", true);
  const { data, error } = isUuid
    ? await query.eq("id", slugOrId).maybeSingle()
    : await query.eq("slug", slugOrId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [resolved] = await resolveBanners([data as EventRow]);
  return resolved ?? null;
}

/** Custom registration fields for an event, in display order. */
export async function fetchEventFields(eventId: string): Promise<EventFieldRow[]> {
  const { data, error } = await supabase
    .from("event_fields")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function eventStartsAt(event: Pick<EventRow, "event_date" | "event_time">): Date {
  return new Date(`${event.event_date}T${(event.event_time || "00:00:00").slice(0, 8)}`);
}

export function isUpcoming(event: Pick<EventRow, "event_date" | "event_time">): boolean {
  return eventStartsAt(event).getTime() > Date.now();
}

export function eventPrice(event: Pick<EventRow, "is_paid" | "base_price_cents" | "currency">): string {
  if (!event.is_paid || event.base_price_cents <= 0) return "Free";
  const amount = event.base_price_cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: event.currency || "USD",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${event.currency} ${amount.toFixed(2)}`;
  }
}

export function isFree(event: Pick<EventRow, "is_paid" | "base_price_cents">): boolean {
  return !event.is_paid || event.base_price_cents <= 0;
}

export const CATEGORY_ICONS: Record<string, string> = {
  Business: "💼",
  Technology: "💻",
  Church: "⛪",
  Education: "🎓",
  Health: "🏃",
  Career: "🚀",
  Finance: "📈",
  Networking: "🤝",
  Community: "🌍",
  Other: "✨",
};

export function categoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? "✨";
}
