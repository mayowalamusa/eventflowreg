import { useState } from "react";
import { Link, useLocation, useNavigate } from "@/lib/nav";
import Button from "../ui/Button";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/");
  };


  const links = [
    { to: "/discover", label: "Discover" },
    { to: "/#features", label: "Features" },
    { to: "/#pricing", label: "Pricing" },
    { to: "/#about", label: "About" },
  ];

  const isActive = (to: string) => location.pathname === to;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="size-8 rounded-[8px] bg-[#4F46E5] flex items-center justify-center">
            <svg aria-hidden="true" className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-[#0F172A] text-lg tracking-tight">EventFlow</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={[
                "px-4 py-2 rounded-[8px] text-sm font-medium transition-colors",
                isActive(l.to)
                  ? "bg-[#EEF2FF] text-[#4F46E5]"
                  : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]",
              ].join(" ")}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link to={isAdmin ? "/admin" : "/dashboard"}>
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Button size="sm" variant="outline" onClick={handleSignOut}>Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>


        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-[8px] text-[#475569] hover:bg-[#F8FAFC]"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-[8px] text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            >
              {l.label}
            </Link>
          ))}
          <div className="flex gap-2 mt-2 pt-3 border-t border-[#E2E8F0]">
            {user ? (
              <>
                <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="outline" fullWidth size="sm">Dashboard</Button>
                </Link>
                <div className="flex-1">
                  <Button fullWidth size="sm" onClick={handleSignOut}>Sign out</Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="flex-1">
                  <Button variant="outline" fullWidth size="sm">Log in</Button>
                </Link>
                <Link to="/signup" className="flex-1">
                  <Button fullWidth size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

        </div>
      )}
    </nav>
  );
}
