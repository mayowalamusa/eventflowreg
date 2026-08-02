import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, LayoutDashboard, LogOut, Menu, Shield, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/registrations", label: "Registrations", icon: Users },
] as const;

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(item.to)
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
      {role === "admin" && (
        <Link
          to="/admin"
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/admin")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          <Shield className="size-4" />
          Admin
        </Link>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-1">
          <span className="flex size-8 items-center justify-center rounded-xl bg-hero-gradient text-sm font-bold text-primary-foreground">
            EF
          </span>
          <span className="text-lg font-semibold tracking-tight">EventFlow</span>
        </Link>
        {nav}
        <div className="mt-auto space-y-3 border-t border-sidebar-border pt-4">
          <p className="truncate px-1 text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground capitalize">
            {role ?? "host"} workspace
          </span>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={handleSignOut}>
            <LogOut className="size-4" />
          </Button>
        </header>

        {open && (
          <div className="border-b border-border bg-sidebar p-4 lg:hidden">
            {nav}
            <p className="mt-4 truncate px-1 text-xs text-muted-foreground">{user?.email}</p>
          </div>
        )}

        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
