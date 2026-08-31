import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "@/lib/nav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";


const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/dashboard/events",
    label: "My Events",
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: "/dashboard/registrations",
    label: "Registrations",
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    to: "/dashboard/sheets",
    label: "Google Sheets",
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: "/dashboard/organizer",
    label: "Organizer Profile",
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" />
      </svg>
    ),
  },
  {
    to: "/dashboard/settings",
    label: "Settings",
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { profile } = useProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // profiles.full_name is the editable application identity (set via
  // Account Settings); user_metadata is only the signup-time snapshot from
  // Supabase Auth, used as a fallback until the user saves a profile.
  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.["full_name"] as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Host";
  const avatarUrl =
    profile?.avatar_url || (user?.user_metadata?.["avatar_url"] as string | undefined);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };


  const isActive = (to: string) => {
    if (to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(to);
  };

  const breadcrumb = navItems.find((n) => isActive(n.to))?.label ?? "Dashboard";

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed md:sticky top-0 left-0 h-screen w-60 bg-white border-r border-[#E2E8F0] flex flex-col z-40 transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#E2E8F0] shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-7 rounded-[7px] bg-[#4F46E5] flex items-center justify-center">
              <svg className="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-[#0F172A] text-base tracking-tight">EventFlow</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-all duration-150",
                isActive(item.to)
                  ? "bg-[#EEF2FF] text-[#4F46E5]"
                  : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
              ].join(" ")}
            >
              <span className={isActive(item.to) ? "text-[#4F46E5]" : "text-[#94A3B8]"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}

          {isAdmin && (
          <div className="mt-4 pt-4 border-t border-[#E2E8F0]">

            <p className="px-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Admin</p>
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-all duration-150",
                location.pathname.startsWith("/admin")
                  ? "bg-[#EEF2FF] text-[#4F46E5]"
                  : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
              ].join(" ")}
            >
              <svg className="size-4.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin Panel
            </Link>
          </div>
          )}

        </nav>

        {/* User area */}
        <div className="p-4 border-t border-[#E2E8F0] shrink-0">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="size-8 rounded-full object-cover" />
            ) : (
              <div className="size-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-bold flex items-center justify-center shrink-0">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0F172A] truncate">{displayName}</p>
              <p className="text-xs text-[#94A3B8] truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="p-1.5 rounded-[8px] text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            >
              <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 8H5a2 2 0 01-2-2V6a2 2 0 012-2h8" />
              </svg>
            </button>
          </div>
        </div>

      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-[8px] text-[#475569] hover:bg-[#F8FAFC]"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <p className="text-xs text-[#94A3B8]">EventFlow</p>
              <p className="text-sm font-semibold text-[#0F172A]">{breadcrumb}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/events/new"
              className="inline-flex items-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium px-3 py-2 rounded-[8px] transition-colors"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Event
            </Link>
            <button className="relative p-2 rounded-[8px] text-[#475569] hover:bg-[#F8FAFC]">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#EF4444]" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
