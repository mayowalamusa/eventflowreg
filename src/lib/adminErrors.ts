import { supabase } from "@/integrations/supabase/client";

export type AppErrorRow = {
  id: string;
  fingerprint: string;
  message: string;
  stack: string | null;
  url: string | null;
  user_id: string | null;
  user_agent: string | null;
  severity: string;
  source: string;
  occurrences: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
};

export type ErrorFilter = "unresolved" | "resolved" | "all";

export async function fetchAppErrors(filter: ErrorFilter = "unresolved", search = "") {
  let query = supabase
    .from("app_error_logs")
    .select(
      "id, fingerprint, message, stack, url, user_id, user_agent, severity, source, occurrences, first_seen_at, last_seen_at, resolved_at",
    )
    .order("last_seen_at", { ascending: false })
    .limit(200);

  if (filter === "unresolved") query = query.is("resolved_at", null);
  if (filter === "resolved") query = query.not("resolved_at", "is", null);

  const term = search.trim().replace(/[%,()]/g, "");
  if (term) query = query.ilike("message", `%${term}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AppErrorRow[];
}

export async function setErrorResolved(id: string, resolved: boolean) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("app_error_logs")
    .update({
      resolved_at: resolved ? new Date().toISOString() : null,
      resolved_by: resolved ? (auth?.user?.id ?? null) : null,
    })
    .eq("id", id);
  if (error) throw error;
}

export type AuditRow = {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
};

export async function fetchAuditLog(limit = 50): Promise<AuditRow[]> {
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, actor_id, action, target_type, target_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AuditRow[];
}

function fingerprintOf(message: string, url: string | null) {
  const base = `${message}::${url ?? ""}`.slice(0, 300);
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) | 0;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

/** Records a client-side error into the admin error log. Never throws. */
export async function recordAppError(input: {
  message: string;
  stack?: string | null;
  url?: string | null;
  severity?: "error" | "warning" | "info";
  source?: string;
}) {
  try {
    const url = input.url ?? (typeof window !== "undefined" ? window.location.href : null);
    const fingerprint = fingerprintOf(input.message, url);
    const { data: auth } = await supabase.auth.getUser();
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("app_error_logs")
      .select("id, occurrences")
      .eq("fingerprint", fingerprint)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("app_error_logs")
        .update({ occurrences: (existing.occurrences ?? 1) + 1, last_seen_at: now })
        .eq("id", existing.id);
      return;
    }

    await supabase.from("app_error_logs").insert({
      fingerprint,
      message: input.message.slice(0, 2000),
      stack: input.stack ? input.stack.slice(0, 8000) : null,
      url,
      user_id: auth?.user?.id ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      severity: input.severity ?? "error",
      source: input.source ?? "client",
      first_seen_at: now,
      last_seen_at: now,
    });
  } catch {
    // Logging must never break the app.
  }
}
