import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@/lib/nav";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };


  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="size-8 rounded-[8px] bg-[#4F46E5] flex items-center justify-center">
            <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-[#0F172A] text-lg">EventFlow</span>
        </Link>

        {!sent ? (
          <>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-1 text-center">Reset password</h1>
            <p className="text-[#64748B] text-sm mb-7 text-center">
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Send reset link
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="size-16 rounded-full bg-[#F0FDF4] border-4 border-[#22C55E] flex items-center justify-center mx-auto mb-5 text-2xl">
              ✉️
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Check your email</h1>
            <p className="text-[#64748B] text-sm mb-6">
              We've sent a password reset link to <span className="font-medium text-[#0F172A]">{email}</span>.
            </p>
            <Button variant="outline" fullWidth onClick={() => setSent(false)}>
              Try a different email
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-[#64748B] mt-6">
          <Link to="/login" className="text-[#4F46E5] font-medium hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — EventFlow" },
      { name: "description", content: "Request a password reset link for your EventFlow account." },
      { property: "og:title", content: "Reset your password — EventFlow" },
      { property: "og:description", content: "Request a password reset link for your EventFlow account." },
    ],
  }),
  component: ForgotPasswordPage,
});
