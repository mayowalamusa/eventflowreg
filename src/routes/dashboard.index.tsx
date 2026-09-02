import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/lib/nav";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import { formatDate, timeAgo } from "@/lib/format";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";

const statusVariant = (s: string) =>
  s === "confirmed" ? "success" : s === "pending" ? "warning" : "error";

const quickActions = [
  { label: "Create Event", icon: "✨", to: "/dashboard/events/new", accent: "#4F46E5", bg: "#EEF2FF" },
  { label: "View Registrations", icon: "👥", to: "/dashboard/registrations", accent: "#10B981", bg: "#F0FDF4" },
  { label: "Sync to Sheets", icon: "📊", to: "/dashboard/sheets", accent: "#F59E0B", bg: "#FFFBEB" },
  { label: "Account Settings", icon: "⚙️", to: "/dashboard/settings", accent: "#64748B", bg: "#F8FAFC" },
];

function EmptyRow({ label }: { label: string }) {
  return <div className="px-5 py-6 text-sm text-[#94A3B8] text-center">{label}</div>;
}

function DashboardHome() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardData();

  const firstName =
    (user?.user_metadata?.["full_name"] as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const now = new Date();
  const upcomingEvents = data.events
    .filter((e) => new Date(`${e.event_date}T${e.event_time}`) > now)
    .sort((a, b) => (a.event_date < b.event_date ? -1 : 1))
    .slice(0, 3);
  const recentEvents = data.events.slice(0, 5);
  const recentRegs = data.registrations.slice(0, 6);
  const activity = data.registrations.slice(0, 5);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 ef-fade-in">
      {/* Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Welcome back, {firstName} 👋</h2>
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
        <StatCard
          label="Active Events"
          value={isLoading ? "—" : String(data.stats.activeEvents)}
          trend="Published events"
          trendUp={true}
          icon={<span>📅</span>}
          accent="#4F46E5"
        />
        <StatCard
          label="Total Registrations"
          value={isLoading ? "—" : data.stats.totalRegistrations.toLocaleString()}
          trend="Across all events"
          trendUp={true}
          icon={<span>👥</span>}
          accent="#10B981"
        />
        <StatCard
          label="Upcoming Events"
          value={isLoading ? "—" : String(data.stats.upcomingEvents)}
          trend={upcomingEvents[0] ? `Next: ${formatDate(upcomingEvents[0].event_date)}` : "None scheduled"}
          trendUp={true}
          icon={<span>⏰</span>}
          accent="#F59E0B"
        />
        <StatCard
          label="New Today"
          value={isLoading ? "—" : String(data.stats.newToday)}
          trend="Registrations today"
          trendUp={true}
          icon={<span>✨</span>}
          accent="#EF4444"
        />
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
              {isLoading ? (
                <SkeletonRows rows={4} />
              ) : recentEvents.length === 0 ? (
                <EmptyRow label="No events yet — create your first event." />
              ) : (
                recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors">
                    {event.banner_url ? (
                      <img loading="lazy" decoding="async" src={event.banner_url} alt="" className="size-10 rounded-[8px] object-cover shrink-0 bg-[#EEF2FF]" />
                    ) : (
                      <div className="size-10 rounded-[8px] bg-[#EEF2FF] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{event.title}</p>
                      <p className="text-xs text-[#94A3B8]">{formatDate(event.event_date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#0F172A]">{event.registrations.toLocaleString()}</p>
                      <p className="text-xs text-[#94A3B8]">registered</p>
                    </div>
                    <Badge variant={event.is_published ? "success" : "default"}>
                      {event.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-[14px] border border-[#E2E8F0]">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#0F172A]">Recent Activity</h3>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {isLoading ? (
                <SkeletonRows rows={3} />
              ) : activity.length === 0 ? (
                <EmptyRow label="No activity yet." />
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="size-8 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-sm shrink-0">
                      👤
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#0F172A] leading-snug">
                        {item.full_name} registered for {item.eventTitle}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{timeAgo(item.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
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
              {isLoading ? (
                <SkeletonRows rows={3} />
              ) : upcomingEvents.length === 0 ? (
                <EmptyRow label="No upcoming events." />
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                    <div className="size-9 rounded-[8px] bg-[#EEF2FF] flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#4F46E5] leading-none">
                        {new Date(event.event_date).toLocaleDateString("en", { day: "2-digit" })}
                      </span>
                      <span className="text-xs text-[#6366F1] leading-none">
                        {new Date(event.event_date).toLocaleDateString("en", { month: "short" })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{event.title}</p>
                      <p className="text-xs text-[#94A3B8]">{event.registrations.toLocaleString()} registered</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-white rounded-[14px] border border-[#E2E8F0]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#0F172A]">Registrations</h3>
              <Link to="/dashboard/registrations" className="text-xs text-[#4F46E5] font-medium hover:underline">All →</Link>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {isLoading ? (
                <SkeletonRows rows={3} />
              ) : recentRegs.length === 0 ? (
                <EmptyRow label="No registrations yet." />
              ) : (
                recentRegs.map((reg) => (
                  <div key={reg.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                    <div className="size-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xs font-bold text-[#4F46E5] shrink-0">
                      {reg.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{reg.full_name}</p>
                      <p className="text-xs text-[#94A3B8] truncate">{reg.eventTitle}</p>
                    </div>
                    <Badge variant={statusVariant(reg.status) as any} size="sm">
                      {reg.status}
                    </Badge>
                  </div>
                ))
              )}
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
