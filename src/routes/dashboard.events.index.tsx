import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link, useNavigate } from "@/lib/nav";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { events, formatDate, formatPrice } from "@/data/mockData";

const tabs = ["All", "Active", "Draft", "Past"];

function MyEventsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = events.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    if (tab === "All") return matchSearch;
    if (tab === "Active") return matchSearch && new Date(e.date) > new Date();
    if (tab === "Past") return matchSearch && new Date(e.date) <= new Date();
    return matchSearch; // Draft
  });

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">My Events</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Manage all your events in one place</p>
        </div>
        <Button onClick={() => navigate("/dashboard/events/new")}>
          + Create Event
        </Button>
      </div>

      {/* Tabs + search */}
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

      {/* Table */}
      <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Event</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Registrations</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Revenue</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((event) => {
                const isPast = new Date(event.date) <= new Date();
                return (
                  <tr key={event.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={event.banner} alt="" className="size-9 rounded-[8px] object-cover shrink-0 bg-[#EEF2FF]" />
                        <div>
                          <p className="font-medium text-[#0F172A] line-clamp-1">{event.title}</p>
                          <p className="text-xs text-[#94A3B8]">{event.category} · {event.locationType === "online" ? "Online" : "In-Person"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">{formatDate(event.date)}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-[#0F172A]">{event.attendees.toLocaleString()}</span>
                      <span className="text-[#94A3B8]"> / {event.capacity.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#0F172A]">
                      {formatPrice(event.price * Math.floor(event.attendees * 0.6))}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={isPast ? "muted" : "success"}>
                        {isPast ? "Past" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          to={`/dashboard/events/${event.id}/edit`}
                          className="text-xs text-[#4F46E5] font-medium hover:underline"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/events/${event.id}`}
                          className="text-xs text-[#64748B] hover:text-[#0F172A]"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-[#64748B] text-sm">No events found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/events/")({
  head: () => ({
    meta: [
      { title: "My events — EventFlow" },
      { name: "description", content: "Manage every event you host on EventFlow." },
      { property: "og:title", content: "My events — EventFlow" },
      { property: "og:description", content: "Manage every event you host on EventFlow." },
    ],
  }),
  component: MyEventsPage,
});
