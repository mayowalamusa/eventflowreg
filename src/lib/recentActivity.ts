import { supabase } from "@/integrations/supabase/client";

export type RecentActivityItem = {
  id: string;
  fullName: string;
  eventTitle: string;
  createdAt: string;
};

/** Last N registrations across the current host's own events. Relies on
 * registrations_host_read RLS to scope results — no explicit host filter
 * needed here, same pattern as the rest of the dashboard. */
export async function fetchRecentActivity(limit = 5): Promise<RecentActivityItem[]> {
  const { data, error } = await supabase
    .from("registrations")
    .select("id, full_name, created_at, events(title)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    fullName: r.full_name,
    eventTitle: (r.events as { title: string } | null)?.title ?? "Untitled event",
    createdAt: r.created_at,
  }));
}
