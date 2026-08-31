import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import {
  archiveEvent,
  fetchAdminEvents,
  type AdminEventRow,
  type AdminEventStatus,
} from "@/lib/adminEvents";

const statusBadge: Record<
  AdminEventStatus,
  { label: string; variant: "success" | "muted" | "warning" | "error" }
> = {
  published: { label: "Published", variant: "success" },
  draft: { label: "Draft", variant: "muted" },
  past: { label: "Past", variant: "warning" },
  archived: { label: "Archived", variant: "error" },
};

function AdminEvents() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState<{ type: "ok" | "error"; message: string } | null>(null);
  const [pendingArchive, setPendingArchive] = useState<AdminEventRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const eventsQuery = useQuery({
    queryKey: ["admin", "events", search],
    queryFn: () => fetchAdminEvents(search),
  });

  const archiveMutation = useMutation({
    mutationFn: (eventId: string) => archiveEvent(currentUser!.id, eventId),
    onSuccess: () => {
      setBanner({
        type: "ok",
        message: "Event archived. It's no longer public, and its registrations are untouched.",
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      setPendingArchive(null);
    },
    onError: (err: unknown) => {
      setBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Could not archive this event.",
      });
      setPendingArchive(null);
    },
  });

  const events = eventsQuery.data ?? [];

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">All Events</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Review and moderate platform events</p>
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
          <button onClick={() => setBanner(null)} className="shrink-0 opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      <div className="w-full sm:w-72">
        <Input
          placeholder="Search events..."
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

      {eventsQuery.isError && (
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-[10px] px-4 py-3 text-sm text-[#B91C1C]">
          Couldn't load events.
        </div>
      )}

      <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {["Event", "Host", "Date", "Registrations", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            {eventsQuery.isLoading ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-[#94A3B8]">
                    Loading…
                  </td>
                </tr>
              </tbody>
            ) : events.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-[#94A3B8]">
                    {search ? "No events match your search." : "No events yet."}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-[#F1F5F9]">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {event.bannerUrl ? (
                          <img
                            src={event.bannerUrl}
                            alt=""
                            className="size-10 rounded-[8px] object-cover bg-[#EEF2FF] shrink-0"
                          />
                        ) : (
                          <div className="size-10 rounded-[8px] bg-[#EEF2FF] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-[#0F172A] truncate max-w-[180px]">
                            {event.title}
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            {event.category || "Uncategorized"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] truncate max-w-[140px]">
                      {event.hostName}
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">
                      {new Date(`${event.eventDate}T00:00:00`).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#0F172A]">
                      {event.registrationCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusBadge[event.status].variant}>
                        {statusBadge[event.status].label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        {event.status === "archived" ? (
                          <span className="text-xs text-[#94A3B8]">Archived</span>
                        ) : (
                          <button
                            className="text-xs text-[#EF4444] font-medium hover:underline"
                            onClick={() => setPendingArchive(event)}
                          >
                            Archive
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
        open={pendingArchive !== null}
        title="Archive this event?"
        description={`"${pendingArchive?.title}" will be removed from public listings and can no longer accept new registrations. Existing registrations, email history, and sync history are kept — this is not permanent deletion.`}
        confirmLabel="Archive Event"
        destructive
        loading={archiveMutation.isPending}
        onCancel={() => setPendingArchive(null)}
        onConfirm={() => {
          if (pendingArchive) archiveMutation.mutate(pendingArchive.id);
        }}
      />
    </div>
  );
}

export const Route = createFileRoute("/admin/events")({
  head: () => ({
    meta: [
      { title: "Events — EventFlow Admin" },
      { name: "description", content: "Review and archive events across the EventFlow platform." },
      { property: "og:title", content: "Events — EventFlow Admin" },
      {
        property: "og:description",
        content: "Review and archive events across the EventFlow platform.",
      },
    ],
  }),
  component: AdminEvents,
});
