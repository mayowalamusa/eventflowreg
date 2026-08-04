import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link, useNavigate } from "@/lib/nav";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { resolveHomeRoute } from "@/hooks/useAuth";
import { toast } from "sonner";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Please verify your email before signing in.");
        navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}`);
        return;
      }
      toast.error(error.message);
      return;
    }
    const dest = await resolveHomeRoute(data.user.id);
    setLoading(false);
    navigate(dest);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getUser();
    setGoogleLoading(false);
    navigate(data.user ? await resolveHomeRoute(data.user.id) : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0F172A] flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 50% at 30% 40%, #4F46E530 0%, transparent 70%)" }}
        />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="size-8 rounded-[8px] bg-[#4F46E5] flex items-center justify-center">
            <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg">EventFlow</span>
        </Link>
        <div className="relative">
          <p className="text-4xl font-bold text-white leading-tight mb-4">
            Welcome back to
            <br />
            <span className="text-[#818CF8]">EventFlow.</span>
          </p>
          <p className="text-[#94A3B8] text-lg leading-relaxed">
            Your events, registrations, and analytics — all in one place.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { val: "50K+", label: "Events" },
              { val: "1.2M", label: "Registrations" },
              { val: "99.9%", label: "Uptime" },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 rounded-[12px] p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{s.val}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-[#475569]">© 2025 EventFlow Technologies Ltd.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="size-8 rounded-[8px] bg-[#4F46E5] flex items-center justify-center">
              <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-[#0F172A] text-lg">EventFlow</span>
          </Link>

          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Sign in</h1>
          <p className="text-[#64748B] text-sm mb-7">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#4F46E5] font-medium hover:underline">
              Sign up
            </Link>
          </p>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-[#E2E8F0] rounded-[8px] py-2.5 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] transition-colors mb-5 disabled:opacity-60"
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? "Connecting…" : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span className="text-xs text-[#94A3B8]">or</span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
            />
            <div>
              <Input
                label="Password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
              />
              <div className="text-right mt-1.5">
                <Link to="/forgot-password" className="text-xs text-[#4F46E5] hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button type="submit" fullWidth size="lg" loading={loading} className="mt-1">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — EventFlow" },
      { name: "description", content: "Log in to your EventFlow host dashboard." },
      { property: "og:title", content: "Log in — EventFlow" },
      { property: "og:description", content: "Log in to your EventFlow host dashboard." },
    ],
  }),
  component: LoginPage,
});
