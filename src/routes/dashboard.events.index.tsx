import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/lib/nav";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { eventPublicUrl, formatEventDate, formatEventTime, type EventRow } from "@/lib/events";

const tabs = ["All", "Active", "Draft", "Past"] as const;

function MyEventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", "mine", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("host_id", user!.id)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const togglePublish = useMutation({
    mutationFn: async (event: EventRow) => {
      const { error } = await supabase
        .from("events")
        .update({ is_published: !event.is_published })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const filtered = events.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    const isPast = new Date(`${e.event_date}T${e.event_time}`) <= new Date();
    if (!matchSearch) return false;
    if (tab === "Active") return e.is_published && !isPast;
    if (tab === "Draft") return !e.is_published;
    if (tab === "Past") return isPast;
    return true;
  });

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">My Events</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Manage all your events in one place</p>
        </div>
        <Button onClick={() => navigate("/dashboard/events/new")}>+ Create Event</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 bg-[#F1F5F9] rounded-[10px] p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "px-3 py-1.5 rounded-[8px] text-sm font-medium transition-all",
                tab === t ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto w-full sm:w-72">
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
            }
          />
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Event</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Visibility</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((event) => {
                const isPast = new Date(`${event.event_date}T${event.event_time}`) <= new Date();
                return (
                  <tr key={event.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#0F172A] line-clamp-1">{event.title}</p>
                      <p className="text-xs text-[#94A3B8]">
                        {(event.category || "Uncategorised")} · {event.event_type === "online" ? "Online" : "In-Person"} · /events/{event.slug}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">
                      {formatEventDate(event.event_date)}
                      <span className="text-[#94A3B8]"> · {formatEventTime(event.event_time)}</span>
                    </td>
                    <td className="px-5 py-3.5 capitalize text-[#475569]">{event.visibility}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={!event.is_published ? "warning" : isPast ? "muted" : "success"}>
                        {!event.is_published ? "Draft" : isPast ? "Past" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 justify-end whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/dashboard/events/${event.id}/edit`)}
                          className="text-xs text-[#4F46E5] font-medium hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => togglePublish.mutate(event)}
                          className="text-xs text-[#0F172A] hover:underline"
                        >
                          {event.is_published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => {
                            void navigator.clipboard.writeText(eventPublicUrl(event.slug));
                            setCopied(event.id);
                            setTimeout(() => setCopied(null), 1500);
                          }}
                          className="text-xs text-[#64748B] hover:text-[#0F172A]"
                        >
                          {copied === event.id ? "Copied!" : "Copy link"}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${event.title}"?`)) remove.mutate(event.id);
                          }}
                          className="text-xs text-[#EF4444] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-[#64748B] text-sm">No events found</p>
          </div>
        )}
        {isLoading && <div className="text-center py-16 text-sm text-[#64748B]">Loading events…</div>}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/events/")({
  head: () => ({
    meta: [
      { title: "My events — EventFlow" },
      { name: "description", content: "Create, edit, publish and delete every event you host on EventFlow." },
      { property: "og:title", content: "My events — EventFlow" },
      { property: "og:description", content: "Create, edit, publish and delete every event you host on EventFlow." },
    ],
  }),
  component: MyEventsPage,
});
