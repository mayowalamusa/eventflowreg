import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { users } from "@/data/mockData";

const roleBadge = (role: string) =>
  role === "admin" ? "error" : role === "host" ? "primary" : "default";

function AdminUsers() {
  const [search, setSearch] = useState("");
  const filtered = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Users</h2>
          <p className="text-sm text-[#64748B] mt-0.5">{users.length} registered users</p>
        </div>
      </div>

      <div className="w-full sm:w-72">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
          }
        />
      </div>

      <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {["User", "Role", "Joined", "Events", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="size-9 rounded-full object-cover" />
                      <div>
                        <p className="font-medium text-[#0F172A]">{user.name}</p>
                        <p className="text-xs text-[#94A3B8]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={roleBadge(user.role) as any}>{user.role}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-[#475569]">{user.joined}</td>
                  <td className="px-5 py-3.5 text-[#475569]">{user.events ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-3">
                      <button className="text-xs text-[#4F46E5] font-medium hover:underline">View</button>
                      <button className="text-xs text-[#EF4444] font-medium hover:underline">Suspend</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
