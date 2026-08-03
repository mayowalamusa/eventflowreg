import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/lib/nav";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import { analyticsData, events, users, formatDate } from "@/data/mockData";

function AdminDashboard() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">Admin Overview</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Platform-wide metrics and activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Users" value="12,480" trend="24% this month" trendUp={true} icon={<span>👥</span>} accent="#4F46E5" />
        <StatCard label="Total Events" value="3,240" trend="18% this month" trendUp={true} icon={<span>📅</span>} accent="#10B981" />
        <StatCard label="Total Revenue" value="₦48.2M" trend="32% this month" trendUp={true} icon={<span>💰</span>} accent="#F59E0B" />
        <StatCard label="Monthly Growth" value="+24%" trend="vs last month" trendUp={true} icon={<span>📈</span>} accent="#EF4444" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[14px] border border-[#E2E8F0] p-5">
          <h3 className="font-semibold text-[#0F172A] mb-4">Registrations Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analyticsData.registrationsOverTime} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "12px" }} />
              <Line type="monotone" dataKey="registrations" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: "#4F46E5", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5">
          <h3 className="font-semibold text-[#0F172A] mb-4">Events by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analyticsData.byCategory.slice(0, 5)} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "12px" }} />
              <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top events */}
      <div className="bg-white rounded-[14px] border border-[#E2E8F0]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h3 className="font-semibold text-[#0F172A]">Top Events</h3>
          <Link to="/admin/events" className="text-xs text-[#4F46E5] hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {["Event", "Host", "Date", "Registrations", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {events.slice(0, 6).map((event) => (
                <tr key={event.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={event.banner} alt="" className="size-9 rounded-[8px] object-cover bg-[#EEF2FF]" />
                      <p className="font-medium text-[#0F172A] line-clamp-1 max-w-[200px]">{event.title}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#475569]">{event.organizer}</td>
                  <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">{formatDate(event.date)}</td>
                  <td className="px-5 py-3.5 font-medium text-[#0F172A]">{event.attendees.toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant="success">Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
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
      { name: "description", content: "Platform-wide overview of users, events and registrations." },
      { property: "og:title", content: "Admin overview — EventFlow" },
      { property: "og:description", content: "Platform-wide overview of users, events and registrations." },
    ],
  }),
  component: AdminDashboard,
});
