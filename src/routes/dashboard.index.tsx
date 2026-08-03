import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@/lib/nav";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import { events, registrations, formatDate, formatPrice } from "@/data/mockData";

const statusVariant = (s: string) =>
  s === "confirmed" ? "success" : s === "pending" ? "warning" : "error";

const quickActions = [
  { label: "Create Event", icon: "✨", to: "/dashboard/events/new", accent: "#4F46E5", bg: "#EEF2FF" },
  { label: "View Registrations", icon: "👥", to: "/dashboard/registrations", accent: "#10B981", bg: "#F0FDF4" },
  { label: "Sync to Sheets", icon: "📊", to: "/dashboard/sheets", accent: "#F59E0B", bg: "#FFFBEB" },
  { label: "Account Settings", icon: "⚙️", to: "/dashboard/settings", accent: "#64748B", bg: "#F8FAFC" },
];

const recentActivity = [
  { type: "register", msg: "Fatima Aliyu registered for Women in Finance Forum", time: "2 min ago" },
  { type: "register", msg: "Chibuike Eze registered for Lagos Founders Mixer", time: "8 min ago" },
  { type: "event", msg: "Lagos Tech Summit 2025 is trending — 147 new signups today", time: "1 hr ago" },
  { type: "sync", msg: "Google Sheets synced — 89 rows updated", time: "2 hr ago" },
  { type: "register", msg: "Tunde Bakare registered for AI & Machine Learning Conference", time: "3 hr ago" },
];

const activityIcon: Record<string, string> = {
  register: "👤",
  event: "📅",
  sync: "📊",
};

function DashboardHome() {
  const navigate = useNavigate();
  const upcomingEvents = events.filter((e) => new Date(e.date) > new Date()).slice(0, 3);
  const recentRegs = registrations.slice(0, 6);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Good morning, Amara 👋</h2>
          <p className="text-[#64748B] text-sm mt-0.5">Here's what's happening with your events today.</p>
        </div>
        <Link to="/dashboard/events/new">
          <Badge variant="primary" size="md" className="cursor-pointer hover:bg-[#E0E7FF] transition-colors">
            + New Event
          </Badge>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active Events" value="8" trend="2 new this month" trendUp={true} icon={<span>📅</span>} accent="#4F46E5" />
        <StatCard label="Total Registrations" value="8,432" trend="18% this month" trendUp={true} icon={<span>👥</span>} accent="#10B981" />
        <StatCard label="Upcoming Events" value="5" trend="Next in 3 days" trendUp={true} icon={<span>⏰</span>} accent="#F59E0B" />
        <StatCard label="New Today" value="147" trend="↑ 12 vs yesterday" trendUp={true} icon={<span>✨</span>} accent="#EF4444" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="flex flex-col items-center gap-2.5 p-4 bg-white rounded-[14px] border border-[#E2E8F0] hover:border-[#4F46E5] hover:shadow-md transition-all group"
          >
            <span
              className="size-10 rounded-[10px] flex items-center justify-center text-xl"
              style={{ backgroundColor: a.bg }}
            >
              {a.icon}
            </span>
            <span className="text-xs font-semibold text-[#475569] group-hover:text-[#4F46E5] transition-colors text-center">
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent events */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-[14px] border border-[#E2E8F0]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#0F172A]">Recent Events</h3>
              <Link to="/dashboard/events" className="text-xs text-[#4F46E5] font-medium hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors">
                  <img src={event.banner} alt="" className="size-10 rounded-[8px] object-cover shrink-0 bg-[#EEF2FF]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{event.title}</p>
                    <p className="text-xs text-[#94A3B8]">{formatDate(event.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#0F172A]">{event.attendees.toLocaleString()}</p>
                    <p className="text-xs text-[#94A3B8]">registered</p>
                  </div>
                  <Badge variant={event.attendees < event.capacity ? "success" : "warning"}>
                    {event.attendees < event.capacity ? "Active" : "Full"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-[14px] border border-[#E2E8F0]">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#0F172A]">Recent Activity</h3>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="size-8 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-sm shrink-0">
                    {activityIcon[item.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0F172A] leading-snug">{item.msg}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Upcoming Events widget */}
          <div className="bg-white rounded-[14px] border border-[#E2E8F0]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#0F172A]">Upcoming</h3>
              <Link to="/dashboard/events" className="text-xs text-[#4F46E5] font-medium hover:underline">All →</Link>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                  <div className="size-9 rounded-[8px] bg-[#EEF2FF] flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#4F46E5] leading-none">
                      {new Date(event.date).toLocaleDateString("en", { day: "2-digit" })}
                    </span>
                    <span className="text-xs text-[#6366F1] leading-none">
                      {new Date(event.date).toLocaleDateString("en", { month: "short" })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{event.title}</p>
                    <p className="text-xs text-[#94A3B8]">{event.attendees.toLocaleString()} registered</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-white rounded-[14px] border border-[#E2E8F0]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#0F172A]">Registrations</h3>
              <Link to="/dashboard/registrations" className="text-xs text-[#4F46E5] font-medium hover:underline">All →</Link>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {recentRegs.map((reg) => (
                <div key={reg.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                  <div className="size-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xs font-bold text-[#4F46E5] shrink-0">
                    {reg.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{reg.name}</p>
                    <p className="text-xs text-[#94A3B8] truncate">{reg.eventTitle}</p>
                  </div>
                  <Badge variant={statusVariant(reg.status) as any} size="sm">
                    {reg.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — EventFlow" },
      { name: "description", content: "Track total events, registrations and active events at a glance." },
      { property: "og:title", content: "Dashboard — EventFlow" },
      { property: "og:description", content: "Track total events, registrations and active events at a glance." },
    ],
  }),
  component: DashboardHome,
});
