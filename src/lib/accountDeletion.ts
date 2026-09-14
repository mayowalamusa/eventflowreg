import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const ACCOUNT_DELETION_GRACE_DAYS = 90;

/** Builds a message with whatever extra diagnostic detail Postgres/PostgREST
 * provides (hint/details/code), instead of just the bare message — the
 * bare message alone is often unhelpfully generic (e.g. "permission
 * denied for table profiles" with no indication of which policy/column). */
function describeError(error: PostgrestError): string {
  const parts = [error.message];
  if (error.hint) parts.push(`Hint: ${error.hint}`);
  if (error.details) parts.push(`Details: ${error.details}`);
  return parts.join(" — ");
}

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
  if (error) {
    // Always log the full raw error object — the thrown Error's message
    // alone can lose structured fields (code/hint/details) depending on
    // how a caller displays it, and this is the only place we have the
    // original PostgrestError shape.
    console.error("requestAccountDeletion failed", error);
    throw new Error(describeError(error));
  }
}

export async function restoreAccount(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ deletion_requested_at: null })
    .eq("id", userId);
  if (error) {
    console.error("restoreAccount failed", error);
    throw new Error(describeError(error));
  }
}

export function deletionRestoreDeadline(deletionRequestedAt: string): Date {
  const d = new Date(deletionRequestedAt);
  d.setDate(d.getDate() + ACCOUNT_DELETION_GRACE_DAYS);
  return d;
}
