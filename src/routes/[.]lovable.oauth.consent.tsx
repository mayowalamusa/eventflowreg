import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Button from "@/components/ui/Button";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // Browser-only: the Supabase client reads its session from localStorage.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s['authorization_id'] === "string" ? s['authorization_id'] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/login", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
      <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-8 max-w-md text-center">
        <h1 className="text-lg font-bold text-[#0F172A] mb-2">Authorization failed</h1>
        <p className="text-sm text-[#64748B]">
          Could not load this authorization request: {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "this app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: decisionError } = approve
      ? await supabase.auth.oauth.approveAuthorization(authorization_id)
      : await supabase.auth.oauth.denyAuthorization(authorization_id);
    if (decisionError) {
      setBusy(false);
      setError(decisionError.message);
      return;
    }
    const target = data?.redirect_url;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
      <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-8 max-w-md w-full">
        <div className="size-10 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center mb-4" aria-hidden="true">
          <span className="text-lg">🔗</span>
        </div>
        <h1 className="text-xl font-bold text-[#0F172A]">Connect {clientName} to EventFlow</h1>
        <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
          {clientName} is asking to use EventFlow as you. It will be able to read your events,
          registrations and dashboard statistics.
        </p>
        {error && (
          <p role="alert" className="text-sm text-[#DC2626] bg-[#FEF2F2] rounded-[10px] px-3 py-2 mt-4">
            {error}
          </p>
        )}
        <div className="flex gap-3 mt-6">
          <Button disabled={busy} onClick={() => void decide(true)} className="flex-1">
            Approve
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => void decide(false)} className="flex-1">
            Deny
          </Button>
        </div>
      </div>
    </main>
  );
}
