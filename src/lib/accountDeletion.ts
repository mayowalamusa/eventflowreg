import { supabase } from "@/integrations/supabase/client";

export const ACCOUNT_DELETION_GRACE_DAYS = 90;

/** Requests account deletion. This does NOT sign the host out or touch
 * their events/registrations directly — RLS (is_pending_deletion, see the
 * account-deletion migration) live-gates public visibility and new
 * registrations for as long as deletion_requested_at is set. Nothing is
 * mutated that needs to be "remembered" and undone on restore. */
export async function requestAccountDeletion(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ deletion_requested_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function restoreAccount(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ deletion_requested_at: null })
    .eq("id", userId);
  if (error) throw error;
}

export function deletionRestoreDeadline(deletionRequestedAt: string): Date {
  const d = new Date(deletionRequestedAt);
  d.setDate(d.getDate() + ACCOUNT_DELETION_GRACE_DAYS);
  return d;
}
