import { supabase } from "@/integrations/supabase/client";
import { fetchAdminEvents, type AdminEventRow } from "@/lib/adminEvents";

export type PlatformStats = {
  totalUsers: number;
  totalHosts: number;
  totalEvents: number; // excludes archived
  totalRegistrations: number;
  activeEvents: number; // published, not archived, not yet past
  recentRegistrations: { id: string; fullName: string; eventTitle: string; createdAt: string }[];
};

async function count(table: "profiles" | "events" | "registrations"): Promise<number> {
  const { count: c, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return c ?? 0;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const today = new Date().toISOString().slice(0, 10);

  const [
    totalUsers,
    totalHosts,
    totalEventsResult,
    totalRegistrations,
    activeEventsResult,
    recent,
  ] = await Promise.all([
    count("profiles"),
    supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "host")
      .then(({ count: c, error }) => {
        if (error) throw error;
        return c ?? 0;
      }),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .is("archived_at", null)
      .then(({ count: c, error }) => {
        if (error) throw error;
        return c ?? 0;
      }),
    count("registrations"),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .is("archived_at", null)
      .gte("event_date", today)
      .then(({ count: c, error }) => {
        if (error) throw error;
        return c ?? 0;
      }),
    supabase
      .from("registrations")
      .select("id, full_name, created_at, events(title)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (recent.error) throw recent.error;
  const recentRegistrations = (recent.data ?? []).map((r) => ({
    id: r.id,
    fullName: r.full_name,
    eventTitle: (r.events as { title: string } | null)?.title ?? "Untitled event",
    createdAt: r.created_at,
  }));

  return {
    totalUsers,
    totalHosts,
    totalEvents: totalEventsResult,
    totalRegistrations,
    activeEvents: activeEventsResult,
    recentRegistrations,
  };
}

export type DayCount = { label: string; count: number };

/** Real daily registration counts for the last `days` days (including
 * today), zero-filled so the chart doesn't silently skip quiet days. */
export async function fetchRegistrationsOverTime(days = 14): Promise<DayCount[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("registrations")
    .select("created_at")
    .gte("created_at", since.toISOString());
  if (error) throw error;

  const buckets = new Map<string, number>();
  const labels: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
    labels.push(key);
  }
  for (const r of data ?? []) {
    const key = (r.created_at as string).slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return labels.map((key) => ({
    label: new Date(`${key}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    count: buckets.get(key) ?? 0,
  }));
}

export type CategoryCount = { category: string; count: number };

/** Real event counts grouped by category (host-entered free text), for
 * non-archived events. Not aggregated server-side — event volume on this
 * platform is small enough that pulling one column per event and counting
 * in JS is simpler than adding a dedicated RPC; worth revisiting if event
 * volume grows substantially (see Phase 5 report). */
export async function fetchEventsByCategory(limit = 6): Promise<CategoryCount[]> {
  const { data, error } = await supabase.from("events").select("category").is("archived_at", null);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const e of data ?? []) {
    const key = e.category?.trim() || "Uncategorized";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, c]) => ({ category, count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export type EventTypeCount = { type: "online" | "physical"; count: number };

export async function fetchEventTypeSplit(): Promise<EventTypeCount[]> {
  const { data, error } = await supabase
    .from("events")
    .select("event_type")
    .is("archived_at", null);
  if (error) throw error;
  const counts = { online: 0, physical: 0 };
  for (const e of data ?? []) {
    if (e.event_type === "online" || e.event_type === "physical") counts[e.event_type]++;
  }
  return (["online", "physical"] as const).map((type) => ({ type, count: counts[type] }));
}

export async function fetchTopEvents(limit = 6): Promise<AdminEventRow[]> {
  const events = await fetchAdminEvents();
  return [...events].sort((a, b) => b.registrationCount - a.registrationCount).slice(0, limit);
}
