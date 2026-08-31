import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminAudit";

const LIST_CAP = 500; // soft cap for now — see Phase 5 report re: pagination at scale

export type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "host" | "—";
  createdAt: string;
  isSuspended: boolean;
  eventCount: number;
};

function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[%,()]/g, "");
}

/** All platform users (admin-only view). Relies on profiles_select_own's
 * admin bypass — an admin can read every profile, a non-admin's request for
 * anyone but themselves comes back empty regardless of what this queries. */
export async function fetchAdminUsers(search?: string): Promise<AdminUserRow[]> {
  let profileQuery = supabase
    .from("profiles")
    .select("id, full_name, email, is_suspended, created_at")
    .order("created_at", { ascending: false })
    .limit(LIST_CAP);

  const term = search ? sanitizeSearchTerm(search) : "";
  if (term) {
    profileQuery = profileQuery.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const [
    { data: profiles, error: profilesError },
    { data: roles, error: rolesError },
    { data: events, error: eventsError },
  ] = await Promise.all([
    profileQuery,
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("events").select("host_id"),
  ]);

  if (profilesError) throw profilesError;
  if (rolesError) throw rolesError;
  if (eventsError) throw eventsError;

  const roleByUser = new Map<string, "admin" | "host">();
  for (const r of roles ?? []) {
    const existing = roleByUser.get(r.user_id);
    // A user could hold both roles; admin takes display priority.
    if (!existing || r.role === "admin") roleByUser.set(r.user_id, r.role as "admin" | "host");
  }

  const eventCountByHost = new Map<string, number>();
  for (const e of events ?? []) {
    eventCountByHost.set(e.host_id, (eventCountByHost.get(e.host_id) ?? 0) + 1);
  }

  return (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    role: roleByUser.get(p.id) ?? "—",
    createdAt: p.created_at,
    isSuspended: p.is_suspended,
    eventCount: eventCountByHost.get(p.id) ?? 0,
  }));
}

export async function setUserSuspended(
  actorId: string,
  userId: string,
  suspended: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ is_suspended: suspended })
    .eq("id", userId);
  if (error) throw error;
  await logAdminAction(actorId, suspended ? "suspend_user" : "unsuspend_user", "profile", userId);
}
