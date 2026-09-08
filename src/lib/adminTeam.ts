import { supabase } from "@/integrations/supabase/client";
import type { AdminArea } from "@/lib/adminAccess";

export type AdminMember = {
  user_id: string;
  tier: "super_admin" | "manager";
  email: string | null;
  full_name: string | null;
  created_at: string;
  areas: AdminArea[];
};

export async function fetchAdminTeam(): Promise<AdminMember[]> {
  const [{ data: accounts, error }, { data: permissions }] = await Promise.all([
    supabase
      .from("admin_accounts")
      .select("user_id, tier, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("admin_permissions").select("user_id, area"),
  ]);
  if (error) throw error;

  const ids = (accounts ?? []).map((a) => a.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, email, full_name").in("id", ids)
    : { data: [] as { id: string; email: string | null; full_name: string | null }[] };

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (accounts ?? []).map((account) => ({
    user_id: account.user_id,
    tier: account.tier as AdminMember["tier"],
    created_at: account.created_at,
    email: byId.get(account.user_id)?.email ?? null,
    full_name: byId.get(account.user_id)?.full_name ?? null,
    areas: (permissions ?? [])
      .filter((p) => p.user_id === account.user_id)
      .map((p) => p.area as AdminArea),
  }));
}

/** Grants admin access to an existing account, looked up by email. */
export async function grantAdminAccess(
  email: string,
  tier: "super_admin" | "manager",
  areas: AdminArea[],
) {
  const clean = email.trim().toLowerCase();
  const { data: profile, error: lookupError } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", clean)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!profile) throw new Error("No account found with that email address.");

  const { data: auth } = await supabase.auth.getUser();

  const { error: accountError } = await supabase
    .from("admin_accounts")
    .upsert({ user_id: profile.id, tier, granted_by: auth?.user?.id ?? null }, { onConflict: "user_id" });
  if (accountError) throw accountError;

  await supabase.from("admin_permissions").delete().eq("user_id", profile.id);

  if (tier === "manager" && areas.length) {
    const { error: permError } = await supabase.from("admin_permissions").insert(
      areas.map((area) => ({
        user_id: profile.id,
        area,
        granted_by: auth?.user?.id ?? null,
      })),
    );
    if (permError) throw permError;
  }

  return profile.id;
}

export async function updateMemberAreas(userId: string, areas: AdminArea[]) {
  const { data: auth } = await supabase.auth.getUser();
  await supabase.from("admin_permissions").delete().eq("user_id", userId);
  if (!areas.length) return;
  const { error } = await supabase
    .from("admin_permissions")
    .insert(areas.map((area) => ({ user_id: userId, area, granted_by: auth?.user?.id ?? null })));
  if (error) throw error;
}

export async function revokeAdminAccess(userId: string) {
  await supabase.from("admin_permissions").delete().eq("user_id", userId);
  const { error } = await supabase.from("admin_accounts").delete().eq("user_id", userId);
  if (error) throw error;
}
