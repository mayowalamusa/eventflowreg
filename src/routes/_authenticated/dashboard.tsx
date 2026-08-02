import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CalendarPlus, Radio, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Host dashboard — EventFlow" },
      { name: "description", content: "Track your events, registrations and active pages." },
      { property: "og:title", content: "Host dashboard — EventFlow" },
      { property: "og:description", content: "Track your events and registrations on EventFlow." },
    ],
  }),
  component: Dashboard,
});

type EventRow = {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  event_time: string;
  visibility: string;
  is_published: boolean;
};

function Dashboard() {
  const { user } = useAuth();

  const eventsQuery = useQuery({
    queryKey: ["host-events", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,slug,event_date,event_time,visibility,is_published")
        .eq("host_id", user!.id)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const registrationsQuery = useQuery({
    queryKey: ["host-registration-count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("registrations")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const events = eventsQuery.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const activeEvents = events.filter((e) => e.is_published && e.event_date >= today).length;

  const stats = [
    { label: "Total events", value: events.length, icon: CalendarDays },
    { label: "Total registrations", value: registrationsQuery.data ?? 0, icon: Users },
    { label: "Active events", value: activeEvents, icon: Radio },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything happening across your events.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/events">
            <CalendarPlus className="size-4" /> Create event
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              {eventsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{s.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Your events</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="font-medium">No events yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first event to start collecting registrations.
              </p>
              <Button asChild className="mt-5">
                <Link to="/events">
                  <CalendarPlus className="size-4" /> Create event
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.event_date} · {event.event_time.slice(0, 5)}
                    </p>
                  </div>
                  <Badge variant={event.is_published ? "default" : "secondary"}>
                    {event.is_published ? "Published" : "Draft"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
