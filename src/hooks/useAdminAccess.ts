import { useQuery } from "@tanstack/react-query";
import { fetchAdminAccess, canAccess, type AdminArea } from "@/lib/adminAccess";

export function useAdminAccess() {
  const query = useQuery({
    queryKey: ["admin", "access"],
    queryFn: fetchAdminAccess,
    staleTime: 60_000,
  });

  return {
    access: query.data,
    isLoading: query.isLoading,
    can: (area: AdminArea) => canAccess(query.data, area),
    isSuperAdmin: Boolean(query.data?.isSuperAdmin),
  };
}
