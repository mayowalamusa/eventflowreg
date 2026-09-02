import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Badge from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { fetchAdminUsers, setUserSuspended, type AdminUserRow } from "@/lib/adminUsers";

const roleBadge = (role: AdminUserRow["role"]) =>
  role === "admin" ? "error" : role === "host" ? "primary" : "muted";

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function AdminUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState<{ type: "ok" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    user: AdminUserRow;
    suspend: boolean;
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => fetchAdminUsers(search),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ userId, suspend }: { userId: string; suspend: boolean }) =>
      setUserSuspended(currentUser!.id, userId, suspend),
    onSuccess: (_data, variables) => {
      setBanner({
        type: "ok",
        message: variables.suspend ? "User suspended." : "User reinstated.",
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setPendingAction(null);
    },
    onError: (err: unknown) => {
      setBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Could not update this user.",
      });
      setPendingAction(null);
    },
  });

  const users = usersQuery.data ?? [];

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Users</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {usersQuery.isLoading
              ? "Loading…"
              : `${users.length} registered user${users.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {banner && (
        <div
          className={[
            "rounded-[10px] px-4 py-3 text-sm border flex items-start justify-between gap-3",
            banner.type === "ok"
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
              : "bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]",
          ].join(" ")}
        >
          <span>{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            aria-label="Dismiss"
            className="shrink-0 opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      <div className="w-full sm:w-72">
        <Input
          placeholder="Search users..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          leftIcon={
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
          }
        />
      </div>

      {usersQuery.isError && (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-[10px] px-4 py-3 text-sm text-[#B91C1C]">
          Couldn't load users.
        </div>
      )}

      <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {["User", "Role", "Status", "Joined", "Events", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            {usersQuery.isLoading ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-[#94A3B8]">
                    Loading…
                  </td>
                </tr>
              </tbody>
            ) : users.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-[#94A3B8]">
                    {search ? "No users match your search." : "No users yet."}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-[#F1F5F9]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xs font-bold text-[#4F46E5] shrink-0">
                          {initials(u.full_name || u.email || "?")}
                        </div>
                        <div>
                          <p className="font-medium text-[#0F172A]">{u.full_name || "—"}</p>
                          <p className="text-xs text-[#94A3B8]">{u.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={roleBadge(u.role)}>{u.role}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={u.isSuspended ? "error" : "success"}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-[#475569]">{u.eventCount || "—"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-3">
                        {u.id === currentUser?.id ? (
                          <span className="text-xs text-[#94A3B8]">You</span>
                        ) : (
                          <button
                            className={[
                              "text-xs font-medium hover:underline",
                              u.isSuspended ? "text-[#16A34A]" : "text-[#EF4444]",
                            ].join(" ")}
                            onClick={() => setPendingAction({ user: u, suspend: !u.isSuspended })}
                          >
                            {u.isSuspended ? "Reinstate" : "Suspend"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.suspend ? "Suspend this user?" : "Reinstate this user?"}
        description={
          pendingAction?.suspend
            ? `${pendingAction.user.full_name || pendingAction.user.email} will no longer be able to create or edit events. Their existing events and registration history are kept.`
            : `${pendingAction?.user.full_name || pendingAction?.user.email} will regain the ability to create and edit events.`
        }
        confirmLabel={pendingAction?.suspend ? "Suspend" : "Reinstate"}
        destructive={pendingAction?.suspend}
        loading={suspendMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction)
            suspendMutation.mutate({
              userId: pendingAction.user.id,
              suspend: pendingAction.suspend,
            });
        }}
      />
    </div>
  );
}

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — EventFlow Admin" },
      { name: "description", content: "Review and suspend EventFlow user accounts." },
      { property: "og:title", content: "Users — EventFlow Admin" },
      { property: "og:description", content: "Review and suspend EventFlow user accounts." },
    ],
  }),
  component: AdminUsers,
});
