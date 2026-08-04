import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link, useSearchParams } from "@/lib/nav";
import Button from "@/components/ui/Button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function VerifyEmailPage() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success("Verification email sent.");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="size-8 rounded-[8px] bg-[#4F46E5] flex items-center justify-center">
            <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-[#0F172A] text-lg">EventFlow</span>
        </Link>

        <div className="size-16 rounded-full bg-[#EEF2FF] border-4 border-[#4F46E5] flex items-center justify-center mx-auto mb-5 text-2xl">
          ✉️
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Verify your email</h1>
        <p className="text-[#64748B] text-sm mb-6">
          We've sent a confirmation link
          {email ? <> to <span className="font-medium text-[#0F172A]">{email}</span></> : null}. Click it
          to activate your account, then sign in.
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/login">
            <Button fullWidth size="lg">Go to sign in</Button>
          </Link>
          {email && (
            <Button variant="outline" fullWidth loading={sending} onClick={resend}>
              Resend verification email
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify your email — EventFlow" },
      { name: "description", content: "Confirm your email address to activate your EventFlow account." },
      { property: "og:title", content: "Verify your email — EventFlow" },
      { property: "og:description", content: "Confirm your email address to activate your EventFlow account." },
    ],
  }),
  component: VerifyEmailPage,
});
