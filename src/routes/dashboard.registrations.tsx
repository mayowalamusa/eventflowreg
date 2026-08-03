import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registrations } from "@/data/mockData";

const statusVariant = (s: string) =>
  s === "confirmed" ? "success" : s === "pending" ? "warning" : "error";

function RegistrationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = registrations.filter((r) => {
    const matchSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.eventTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || r.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Registrations</h2>
          <p className="text-sm text-[#64748B] mt-0.5">{registrations.length} total registrations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Export CSV</Button>
          <Button size="sm">Sync to Google Sheets</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or event..."
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
        <div className="flex gap-2">
          {["All", "Confirmed", "Pending", "Cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={[
                "px-3 py-2 rounded-[8px] text-sm font-medium border transition-all",
                statusFilter === s ? "bg-[#4F46E5] text-white border-[#4F46E5]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                {["Attendee", "Event", "Ticket", "Date", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((reg) => (
                <tr key={reg.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xs font-bold text-[#4F46E5] shrink-0">
                        {reg.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-[#0F172A]">{reg.name}</p>
                        <p className="text-xs text-[#94A3B8]">{reg.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#475569] max-w-[200px]">
                    <p className="truncate">{reg.eventTitle}</p>
                  </td>
                  <td className="px-5 py-3.5 text-[#475569]">{reg.ticketType}</td>
                  <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">{reg.date}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusVariant(reg.status) as any}>
                      {reg.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#64748B] text-sm">No registrations found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/registrations")({
  head: () => ({
    meta: [
      { title: "Registrations — EventFlow" },
      { name: "description", content: "Search and review every attendee who registered for your events." },
      { property: "og:title", content: "Registrations — EventFlow" },
      { property: "og:description", content: "Search and review every attendee who registered for your events." },
    ],
  }),
  component: RegistrationsPage,
});
