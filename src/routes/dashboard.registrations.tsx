import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/nav";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { exportHostRegistrationsCsv } from "@/lib/csvExport";
import {
  fetchHostEventOptions,
  fetchHostRegistrations,
  formatRegistrationAmount,
  formatRegistrationDate,
  REGISTRATIONS_PAGE_SIZE,
  type RegistrationStatusFilter,
} from "@/lib/hostRegistrations";

const statusTabs: { label: string; value: RegistrationStatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
  { label: "Cancelled", value: "cancelled" },
];

type BadgeVariant = "default" | "success" | "warning" | "error" | "primary" | "muted";

function statusVariant(s: string): BadgeVariant {
  if (s === "confirmed") return "success";
  if (s === "pending") return "warning";
  if (s === "cancelled") return "error";
  return "default";
}

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

function RegistrationsPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<RegistrationStatusFilter>("all");
  const [page, setPage] = useState(0);

  // Debounce the search box so we're not firing a query on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Any filter change should reset back to page 1.
  useEffect(() => {
    setPage(0);
  }, [search, eventFilter, statusFilter]);

  const eventsQuery = useQuery({
    queryKey: ["registrations", "event-options", userId],
    queryFn: () => fetchHostEventOptions(userId!),
    enabled: Boolean(userId),
  });

  const registrationsQuery = useQuery({
    queryKey: ["registrations", "list", userId, page, search, eventFilter, statusFilter],
    queryFn: () =>
      fetchHostRegistrations({
        userId: userId!,
        page,
        search,
        eventId: eventFilter,
        status: statusFilter,
      }),
    enabled: Boolean(userId),
    placeholderData: (previous) => previous,
  });

  // Live updates: when a registration is inserted/changed anywhere the host
  // can see, refetch the current page. We don't trust the realtime payload
  // itself for anything — the actual data still comes back through the
  // RLS-protected query above.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`host-registrations-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, () => {
        void registrationsQuery.refetch();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const rows = registrationsQuery.data?.rows ?? [];
  const totalCount = registrationsQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / REGISTRATIONS_PAGE_SIZE));
  const hasFilters = Boolean(search) || eventFilter !== "all" || statusFilter !== "all";
  const isInitialLoad = registrationsQuery.isLoading;
  const isRefetching = registrationsQuery.isFetching && !isInitialLoad;

  const [exportError, setExportError] = useState<string | null>(null);
  const exportMutation = useMutation({
    mutationFn: () =>
      exportHostRegistrationsCsv({ search, eventId: eventFilter, status: statusFilter }),
    onError: (err: unknown) =>
      setExportError(err instanceof Error ? err.message : "Could not export registrations."),
    onSuccess: () => setExportError(null),
  });

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Registrations</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {registrationsQuery.isLoading
              ? "Loading…"
              : `${totalCount} total registration${totalCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportMutation.mutate()}
            loading={exportMutation.isPending}
            disabled={totalCount === 0}
          >
            {exportMutation.isPending ? "Exporting…" : "Export CSV"}
          </Button>
          <Link to="/dashboard/sheets">
            <Button size="sm">Export &amp; Sync Options</Button>
          </Link>
        </div>
      </div>

      {exportError && (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-[10px] px-4 py-2.5 text-sm text-[#B91C1C]">
          {exportError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or registration code..."
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
        <div className="w-full sm:w-64">
          <Select
            value={eventFilter}
            onChange={setEventFilter}
            options={[
              { value: "all", label: "All events" },
              ...(eventsQuery.data ?? []).map((e) => ({ value: e.id, label: e.title })),
            ]}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusTabs.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={[
                "px-3 py-2 rounded-[8px] text-sm font-medium border transition-all",
                statusFilter === s.value
                  ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                  : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]",
              ].join(" ")}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {registrationsQuery.isError && (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-[12px] px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-[#B91C1C]">
            We couldn't load your registrations. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => void registrationsQuery.refetch()}>
            Retry
          </Button>
        </div>
      )}

      <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                {["Attendee", "Event", "Phone", "Reg. Code", "Amount", "Date", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            {!isInitialLoad && !registrationsQuery.isError && (
              <tbody className="divide-y divide-[#F1F5F9]">
                {rows.map((reg) => (
                  <tr key={reg.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xs font-bold text-[#4F46E5] shrink-0">
                          {initials(reg.full_name)}
                        </div>
                        <div>
                          <p className="font-medium text-[#0F172A]">{reg.full_name}</p>
                          <p className="text-xs text-[#94A3B8]">{reg.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] max-w-[200px]">
                      <p className="truncate">{reg.eventTitle}</p>
                      {reg.ticketName && (
                        <p className="text-xs text-[#94A3B8] truncate">{reg.ticketName}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">
                      {reg.phone || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap font-mono text-xs">
                      {reg.ticket_code || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">
                      {formatRegistrationAmount(reg.amount_paid_cents, reg.eventCurrency)}
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">
                      {formatRegistrationDate(reg.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant(reg.status)}>{reg.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {isInitialLoad && (
          <div className="text-center py-16 text-sm text-[#64748B]">Loading registrations…</div>
        )}

        {!isInitialLoad && !registrationsQuery.isError && rows.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            {hasFilters ? (
              <>
                <p className="text-[#0F172A] font-medium text-sm">
                  No registrations match your filters
                </p>
                <p className="text-[#64748B] text-sm mt-1">
                  Try a different search term or clear your filters.
                </p>
              </>
            ) : (
              <>
                <p className="text-[#0F172A] font-medium text-sm">No registrations yet</p>
                <p className="text-[#64748B] text-sm mt-1">
                  Once people register for your events, they'll show up here.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {!isInitialLoad && totalCount > REGISTRATIONS_PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#94A3B8]">
            Page {page + 1} of {totalPages}
            {isRefetching && " · Updating…"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/dashboard/registrations")({
  head: () => ({
    meta: [
      { title: "Registrations — EventFlow" },
      {
        name: "description",
        content: "Search and review every attendee who registered for your events.",
      },
      { property: "og:title", content: "Registrations — EventFlow" },
      {
        property: "og:description",
        content: "Search and review every attendee who registered for your events.",
      },
    ],
  }),
  component: RegistrationsPage,
});
