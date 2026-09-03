import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link, useNavigate } from "@/lib/nav";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Role = "attendee" | "host";

function SignUpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [role, setRole] = useState<Role>("attendee");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    const email = form.email.trim();
    const { error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: form.name.trim(), signup_intent: role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="size-8 rounded-[8px] bg-[#4F46E5] flex items-center justify-center">
            <svg aria-hidden="true" className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-[#0F172A] text-lg">EventFlow</span>
        </Link>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={[
                  "size-7 rounded-full flex items-center justify-center text-xs font-bold",
                  step === n ? "bg-[#4F46E5] text-white" : step > n ? "bg-[#22C55E] text-white" : "bg-[#E2E8F0] text-[#94A3B8]",
                ].join(" ")}
              >
                {step > n ? "✓" : n}
              </div>
              {n < 2 && <div className="w-12 h-px bg-[#E2E8F0]" />}
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-[#0F172A] mb-1 text-center">
          {step === 1 ? "Create your account" : "What brings you here?"}
        </h1>
        <p className="text-[#64748B] text-sm mb-7 text-center">
          {step === 1 ? (
            <>Already have an account?{" "}
              <Link to="/login" className="text-[#4F46E5] font-medium hover:underline">Sign in</Link>
            </>
          ) : "This helps us personalise your experience."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <Input
                label="Full name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Amara Okafor"
              />
              <Input
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="At least 8 characters"
                hint="Use 8+ characters with a mix of letters and numbers"
              />
              <Button type="submit" fullWidth size="lg" className="mt-1">
                Continue →
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col gap-3">
                {[
                  { id: "attendee" as Role, label: "Attendee", desc: "Discover and register for events", icon: "🎟️" },
                  { id: "host" as Role, label: "Event Host", desc: "Create and manage your own events", icon: "🎤" },
                ].map((r) => (
                  <label
                    key={r.id}
                    className={[
                      "flex items-center gap-4 p-4 rounded-[12px] border-2 cursor-pointer transition-all",
                      role === r.id ? "border-[#4F46E5] bg-[#EEF2FF]" : "border-[#E2E8F0] hover:border-[#CBD5E1]",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.id}
                      checked={role === r.id}
                      onChange={() => setRole(r.id)}
                      className="accent-[#4F46E5]"
                    />
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <p className="font-semibold text-[#0F172A]">{r.label}</p>
                      <p className="text-sm text-[#64748B]">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
                Create Account 🚀
              </Button>
            </>
          )}
        </form>

        <p className="text-center text-xs text-[#94A3B8] mt-5">
          By continuing, you agree to EventFlow's{" "}
          <a href="#" className="text-[#4F46E5] hover:underline">Terms</a> and{" "}
          <a href="#" className="text-[#4F46E5] hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — EventFlow" },
      { name: "description", content: "Start publishing event registration pages with a free EventFlow account." },
      { property: "og:title", content: "Create your account — EventFlow" },
      { property: "og:description", content: "Start publishing event registration pages with a free EventFlow account." },
    ],
  }),
  component: SignUpPage,
});
