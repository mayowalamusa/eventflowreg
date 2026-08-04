import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@/lib/nav";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    navigate("/dashboard");
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

        <h1 className="text-2xl font-bold text-[#0F172A] mb-1 text-center">Set a new password</h1>
        <p className="text-[#64748B] text-sm mb-7 text-center">
          {ready
            ? "Choose a strong password you haven't used before."
            : "Open this page from the reset link in your email."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="New password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          <Input
            label="Confirm password"
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
          />
          <Button type="submit" fullWidth size="lg" loading={loading} disabled={!ready}>
            Update password
          </Button>
        </form>

        <p className="text-center text-sm text-[#64748B] mt-6">
          <Link to="/login" className="text-[#4F46E5] font-medium hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — EventFlow" },
      { name: "description", content: "Choose a new password for your EventFlow account." },
      { property: "og:title", content: "Set a new password — EventFlow" },
      { property: "og:description", content: "Choose a new password for your EventFlow account." },
    ],
  }),
  component: ResetPasswordPage,
});
