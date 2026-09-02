import { Link, useLocation, Outlet } from "@/lib/nav";

const adminNav = [
  { to: "/admin", label: "Overview", icon: "📊" },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/events", label: "Events", icon: "📅" },
  { to: "/admin/analytics", label: "Analytics", icon: "📈" },
];

export default function AdminLayout() {
  const location = useLocation();
  const isActive = (to: string) => to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-[#0F172A] flex">
      {/* Admin sidebar */}
      <aside className="w-56 shrink-0 bg-[#0F172A] border-r border-white/10 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-7 rounded-[7px] bg-[#4F46E5] flex items-center justify-center">
              <svg aria-hidden="true" className="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-white text-sm">EventFlow</span>
              <span className="block text-xs text-[#EF4444] font-semibold -mt-0.5">Admin</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-0.5">
          {adminNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-all",
                isActive(item.to) ? "bg-white/10 text-white" : "text-[#94A3B8] hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <div className="mt-4 pt-4 border-t border-white/10">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-[#94A3B8] hover:bg-white/5 hover:text-white transition-all"
            >
              <span>←</span>
              Back to Dashboard
            </Link>
          </div>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-[#F8FAFC] overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
