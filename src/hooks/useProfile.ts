import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfile } from "@/lib/profile";

export function profileQueryKey(userId: string | undefined) {
  return ["profile", userId] as const;
}

/** The current user's `profiles` row (application identity, not Supabase Auth). */
export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
  });

  return { profile: query.data ?? null, isLoading: query.isLoading, error: query.error };
}

/** Call after a successful save so every consumer (sidebar, settings page) refreshes. */
export function useInvalidateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: profileQueryKey(user?.id) });
}
