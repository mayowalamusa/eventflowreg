import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchEventsByCategory,
  fetchEventTypeSplit,
  fetchRegistrationsOverTime,
} from "@/lib/adminStats";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

function ChartCard({
  title,
  isLoading,
  isEmpty,
  children,
}: {
  title: string;
  isLoading: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5">
      <h3 className="font-semibold text-[#0F172A] mb-5">{title}</h3>
      {isLoading ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-[#94A3B8]">
          Loading…
        </div>
      ) : isEmpty ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-[#94A3B8]">
          No data yet
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function AdminAnalytics() {
  const seriesQuery = useQuery({
    queryKey: ["admin", "registrations-over-time", 30],
    queryFn: () => fetchRegistrationsOverTime(30),
  });
  const typeQuery = useQuery({
    queryKey: ["admin", "event-type-split"],
    queryFn: fetchEventTypeSplit,
  });
  const categoryQuery = useQuery({
    queryKey: ["admin", "events-by-category", "all"],
    queryFn: () => fetchEventsByCategory(10),
  });

  const typeData = (typeQuery.data ?? []).filter((t) => t.count > 0);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">Analytics</h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Real platform activity — nothing here is estimated
        </p>
      </div>

      <ChartCard
        title="Registrations Over Time (Last 30 Days)"
        isLoading={seriesQuery.isLoading}
        isEmpty={(seriesQuery.data ?? []).every((d) => d.count === 0)}
      >
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={seriesQuery.data ?? []}
            margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "13px" }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#4F46E5"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
              name="Registrations"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard
          title="Event Type Split"
          isLoading={typeQuery.isLoading}
          isEmpty={typeData.length === 0}
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                nameKey="type"
                label={({ type, count }) => `${type}: ${count}`}
                labelLine={false}
              >
                {typeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Events by Category"
          isLoading={categoryQuery.isLoading}
          isEmpty={(categoryQuery.data ?? []).length === 0}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={categoryQuery.data ?? []}
              margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="category"
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
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(categoryQuery.data ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — EventFlow Admin" },
      { name: "description", content: "Real registration and category analytics for EventFlow." },
      { property: "og:title", content: "Analytics — EventFlow Admin" },
      {
        property: "og:description",
        content: "Real registration and category analytics for EventFlow.",
      },
    ],
  }),
  component: AdminAnalytics,
});
