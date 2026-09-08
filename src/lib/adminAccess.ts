import { supabase } from "@/integrations/supabase/client";

export type AdminArea =
  | "overview"
  | "users"
  | "events"
  | "registrations"
  | "payments"
  | "errors"
  | "analytics"
  | "settings";

export const ADMIN_AREAS: { value: AdminArea; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "users", label: "Users" },
  { value: "events", label: "Events" },
  { value: "registrations", label: "Registrations" },
  { value: "payments", label: "Payments" },
  { value: "errors", label: "Errors & activity" },
  { value: "analytics", label: "Analytics" },
  { value: "settings", label: "Site settings" },
];

export type AdminAccess = {
  isMember: boolean;
  isSuperAdmin: boolean;
  areas: AdminArea[];
};

const NO_ACCESS: AdminAccess = { isMember: false, isSuperAdmin: false, areas: [] };

/** Admin membership + granted areas for the signed-in user. */
export async function fetchAdminAccess(): Promise<AdminAccess> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NO_ACCESS;

  const [{ data: account }, { data: permissions }] = await Promise.all([
    supabase.from("admin_accounts").select("tier").eq("user_id", user.id).maybeSingle(),
    supabase.from("admin_permissions").select("area").eq("user_id", user.id),
  ]);

  if (!account) return NO_ACCESS;

  const isSuperAdmin = account.tier === "super_admin";
  return {
    isMember: true,
    isSuperAdmin,
    areas: isSuperAdmin
      ? ADMIN_AREAS.map((a) => a.value)
      : ((permissions ?? []).map((p) => p.area) as AdminArea[]),
  };
}

export function canAccess(access: AdminAccess | undefined, area: AdminArea): boolean {
  if (!access?.isMember) return false;
  return access.isSuperAdmin || access.areas.includes(area);
}
