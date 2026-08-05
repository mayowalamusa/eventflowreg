import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type DashboardEvent = {
  id: string;
  title: string;
  banner_url: string | null;
  event_date: string;
  event_time: string;
  is_published: boolean;
  capacity: number | null;
  created_at: string;
  registrations: number;
};

export type DashboardRegistration = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  event_id: string;
  eventTitle: string;
};

export type DashboardData = {
  events: DashboardEvent[];
  registrations: DashboardRegistration[];
  stats: {
    activeEvents: number;
    totalRegistrations: number;
    upcomingEvents: number;
    newToday: number;
  };
};

const empty: DashboardData = {
  events: [],
  registrations: [],
  stats: { activeEvents: 0, totalRegistrations: 0, upcomingEvents: 0, newToday: 0 },
};

async function fetchDashboard(userId: string): Promise<DashboardData> {
  const { data: eventRows, error: eventsError } = await supabase
    .from("events")
    .select("id, title, banner_url, event_date, event_time, is_published, capacity, created_at")
    .eq("host_id", userId)
    .order("created_at", { ascending: false });
  if (eventsError) throw eventsError;

  const eventIds = (eventRows ?? []).map((e) => e.id);
  if (eventIds.length === 0) return empty;

  const { data: regRows, error: regsError } = await supabase
    .from("registrations")
    .select("id, full_name, email, status, created_at, event_id")
    .in("event_id", eventIds)
    .order("created_at", { ascending: false });
  if (regsError) throw regsError;

  const titleById = new Map((eventRows ?? []).map((e) => [e.id, e.title]));
  const countByEvent = new Map<string, number>();
  for (const r of regRows ?? []) {
    countByEvent.set(r.event_id, (countByEvent.get(r.event_id) ?? 0) + 1);
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const events: DashboardEvent[] = (eventRows ?? []).map((e) => ({
    ...e,
    registrations: countByEvent.get(e.id) ?? 0,
  }));

  const registrations: DashboardRegistration[] = (regRows ?? []).map((r) => ({
    ...r,
    eventTitle: titleById.get(r.event_id) ?? "Event",
  }));

  const upcoming = events.filter((e) => new Date(`${e.event_date}T${e.event_time}`) > now);

  return {
    events,
    registrations,
    stats: {
      activeEvents: events.filter((e) => e.is_published).length,
      totalRegistrations: registrations.length,
      upcomingEvents: upcoming.length,
      newToday: registrations.filter((r) => r.created_at >= startOfToday).length,
    },
  };
}

export function useDashboardData() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dashboard", userId],
    queryFn: () => fetchDashboard(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`dashboard-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return { data: query.data ?? empty, isLoading: query.isLoading, error: query.error };
}
