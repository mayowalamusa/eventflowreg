import { createFileRoute } from "@tanstack/react-router";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { analyticsData } from "@/data/mockData";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#F97316"];

function AdminAnalytics() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">Analytics</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Platform performance and growth metrics</p>
      </div>

      {/* Registrations over time */}
      <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5">
        <h3 className="font-semibold text-[#0F172A] mb-5">Registrations Over Time</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={analyticsData.registrationsOverTime} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "13px" }} />
            <Line type="monotone" dataKey="registrations" stroke="#4F46E5" strokeWidth={3} dot={{ fill: "#4F46E5", r: 5 }} activeDot={{ r: 7 }} name="Registrations" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by month */}
        <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5">
          <h3 className="font-semibold text-[#0F172A] mb-5">Revenue (NGN)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analyticsData.registrationsOverTime} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "13px" }}
                formatter={(v) => [`₦${((Number(v) || 0) / 1000000).toFixed(1)}M`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Event types pie */}
        <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5">
          <h3 className="font-semibold text-[#0F172A] mb-5">Event Types</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={analyticsData.eventTypes} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                {analyticsData.eventTypes.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5">
        <h3 className="font-semibold text-[#0F172A] mb-5">Registrations by Category</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={analyticsData.byCategory} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "13px" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {analyticsData.byCategory.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — EventFlow Admin" },
      { name: "description", content: "Growth, registration and category analytics for EventFlow." },
      { property: "og:title", content: "Analytics — EventFlow Admin" },
      { property: "og:description", content: "Growth, registration and category analytics for EventFlow." },
    ],
  }),
  component: AdminAnalytics,
});
