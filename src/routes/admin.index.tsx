import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "@/lib/nav";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import {
  fetchEventsByCategory,
  fetchPlatformStats,
  fetchRegistrationsOverTime,
  fetchTopEvents,
} from "@/lib/adminStats";
import type { AdminEventStatus } from "@/lib/adminEvents";

const statusBadge: Record<
  AdminEventStatus,
  { label: string; variant: "success" | "muted" | "warning" | "error" }
> = {
  published: { label: "Published", variant: "success" },
  draft: { label: "Draft", variant: "muted" },
  past: { label: "Past", variant: "warning" },
  archived: { label: "Archived", variant: "error" },
};

function AdminDashboard() {
  const statsQuery = useQuery({ queryKey: ["admin", "stats"], queryFn: fetchPlatformStats });
  const seriesQuery = useQuery({
    queryKey: ["admin", "registrations-over-time"],
    queryFn: () => fetchRegistrationsOverTime(14),
  });
  const categoryQuery = useQuery({
    queryKey: ["admin", "events-by-category"],
    queryFn: () => fetchEventsByCategory(5),
  });
  const topEventsQuery = useQuery({
    queryKey: ["admin", "top-events"],
    queryFn: () => fetchTopEvents(6),
  });

  const stats = statsQuery.data;
  const isLoading = statsQuery.isLoading;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">Admin Overview</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Platform-wide metrics and activity</p>
      </div>

      {statsQuery.isError && (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-[10px] px-4 py-3 text-sm text-[#B91C1C]">
          Couldn't load platform statistics.
        </div>
      )}

      {/* Stats — every number here is a real, current count from the database. */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={isLoading ? "…" : (stats?.totalUsers ?? 0).toLocaleString()}
          icon={<span>👥</span>}
          accent="#4F46E5"
        />
        <StatCard
          label="Total Events"
          value={isLoading ? "…" : (stats?.totalEvents ?? 0).toLocaleString()}
          icon={<span>📅</span>}
          accent="#10B981"
        />
        <StatCard
          label="Active Events"
          value={isLoading ? "…" : (stats?.activeEvents ?? 0).toLocaleString()}
          icon={<span>🟢</span>}
          accent="#F59E0B"
        />
        <StatCard
          label="Total Registrations"
          value={isLoading ? "…" : (stats?.totalRegistrations ?? 0).toLocaleString()}
          icon={<span>📝</span>}
          accent="#EF4444"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[14px] border border-[#E2E8F0] p-5">
          <h3 className="font-semibold text-[#0F172A] mb-4">Registrations — Last 14 Days</h3>
          {seriesQuery.isLoading ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-[#94A3B8]">
              Loading…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={seriesQuery.data ?? []}
                margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  dot={{ fill: "#4F46E5", r: 3 }}
                  activeDot={{ r: 6 }}
                  name="Registrations"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5">
          <h3 className="font-semibold text-[#0F172A] mb-4">Events by Category</h3>
          {categoryQuery.isLoading ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-[#94A3B8]">
              Loading…
            </div>
          ) : (categoryQuery.data ?? []).length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-[#94A3B8]">
              No events yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={categoryQuery.data}
                layout="vertical"
                margin={{ left: 10, right: 10, top: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="category"
                  type="category"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top events */}
      <div className="bg-white rounded-[14px] border border-[#E2E8F0]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h3 className="font-semibold text-[#0F172A]">Top Events by Registrations</h3>
          <Link to="/admin/events" className="text-xs text-[#4F46E5] hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {["Event", "Host", "Date", "Registrations", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            {topEventsQuery.isLoading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-[#94A3B8]">
                    Loading…
                  </td>
                </tr>
              </tbody>
            ) : (topEventsQuery.data ?? []).length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-[#94A3B8]">
                    No events yet.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-[#F1F5F9]">
                {topEventsQuery.data!.map((event) => (
                  <tr key={event.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {event.bannerUrl ? (
                          <img
                            src={event.bannerUrl}
                            alt=""
                            className="size-9 rounded-[8px] object-cover bg-[#EEF2FF]"
                          />
                        ) : (
                          <div className="size-9 rounded-[8px] bg-[#EEF2FF]" />
                        )}
                        <p className="font-medium text-[#0F172A] line-clamp-1 max-w-[200px]">
                          {event.title}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#475569]">{event.hostName}</td>
                    <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">
                      {new Date(`${event.eventDate}T00:00:00`).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#0F172A]">
                      {event.registrationCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusBadge[event.status].variant}>
                        {statusBadge[event.status].label}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview — EventFlow" },
      {
        name: "description",
        content: "Platform-wide overview of users, events and registrations.",
      },
      { property: "og:title", content: "Admin overview — EventFlow" },
      {
        property: "og:description",
        content: "Platform-wide overview of users, events and registrations.",
      },
    ],
  }),
  component: AdminDashboard,
});
