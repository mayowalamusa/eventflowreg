import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * `profiles` holds application-level profile data keyed 1:1 to a Supabase
 * Auth user (`profiles.id = auth.users.id`). It is intentionally separate
 * from Supabase Auth's own identity fields (email, password) — auth email
 * changes go through `supabase.auth.updateUser()` and its own verification
 * flow, not this table. Only `full_name` and `avatar_url` are user-editable
 * here; `email` is a signup-time mirror maintained by the `handle_new_user`
 * trigger and `is_suspended` is admin-only (never sent from this module).
 */
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(120, "Too long"),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/** Fetches the current user's own profile row. Returns null if it doesn't exist yet. */
export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Saves editable profile fields for the current user.
 * RLS (`profiles_update_own` / `profiles_insert_own`) already restricts this
 * to the caller's own row, so no `eq("id", ...)` guard is load-bearing here
 * — it's enforced server-side regardless of what's sent.
 */
export async function saveProfile(userId: string, input: ProfileInput): Promise<void> {
  const parsed = profileSchema.parse(input);
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, full_name: parsed.full_name }, { onConflict: "id" });
  if (error) throw error;
}
