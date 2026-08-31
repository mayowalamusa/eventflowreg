import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/** Records an admin action. RLS (admin_audit_log_admin_insert) only allows
 * an admin to insert a row attributed to themselves, so this can't be used
 * to forge an entry for someone else. Best-effort: a logging failure
 * should never block the admin action it's describing, so callers should
 * fire this after the real mutation succeeds and not fail the whole
 * operation if this itself errors. */
export async function logAdminAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase.from("admin_audit_log").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details as Json,
  });
  if (error) {
    // Don't throw — losing an audit entry shouldn't undo or mask a
    // successful suspend/archive action.
    console.error("Failed to write admin audit log entry", error);
  }
}
