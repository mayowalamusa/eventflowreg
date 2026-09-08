import { useQuery } from "@tanstack/react-query";
import { DEFAULT_SITE_SETTINGS, fetchSiteSettings } from "@/lib/siteSettings";

export function useSiteSettings() {
  const query = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60_000,
  });

  return { settings: query.data ?? DEFAULT_SITE_SETTINGS, isLoading: query.isLoading };
}
