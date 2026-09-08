import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import {
  fetchAppErrors,
  fetchAuditLog,
  setErrorResolved,
  type ErrorFilter,
} from "@/lib/adminErrors";

const FILTERS: { value: ErrorFilter; label: string }[] = [
  { value: "unresolved", label: "Unresolved" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ErrorsPage() {
  const { can, isLoading: accessLoading } = useAdminAccess();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ErrorFilter>("unresolved");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const errorsQuery = useQuery({
    queryKey: ["admin", "errors", filter, search],
    queryFn: () => fetchAppErrors(filter, search),
    enabled: can("errors"),
  });

  const auditQuery = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => fetchAuditLog(30),
    enabled: can("errors"),
  });

  const toggleResolved = useMutation({
    mutationFn: ({ id, resolved }: { id: string; resolved: boolean }) =>
      setErrorResolved(id, resolved),
    onSuccess: () => {
      toast.success("Updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "errors"] });
    },
    onError: () => toast.error("Could not update this error"),
  });

  if (accessLoading) return <div className="p-6 text-sm text-[#64748B]">Loading…</div>;

  if (!can("errors")) {
    return (
      <div className="p-6">
        <EmptyState
          icon="🔒"
          headingLevel="h2"
          title="No access to errors & activity"
          description="Ask a super admin to grant you this area."
        />
      </div>
    );
  }

  const errors = errorsQuery.data ?? [];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">Errors & activity</h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Problems visitors hit on the site, plus a trail of admin actions.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 max-w-sm">
          <Input
            aria-label="Search error messages"
            placeholder="Search error messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Filter errors">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={[
                "px-3 py-2 rounded-[8px] text-sm font-medium transition-colors border",
                filter === f.value
                  ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]"
                  : "bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <section className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
        {errorsQuery.isLoading ? (
          <div className="p-6 text-sm text-[#64748B]">Loading errors…</div>
        ) : errorsQuery.isError ? (
          <ErrorState
            message="We couldn't load the error log."
            onRetry={() => errorsQuery.refetch()}
          />
        ) : errors.length === 0 ? (
          <EmptyState
            icon="✅"
            headingLevel="h3"
            title="Nothing here"
            description="No errors match this filter."
          />
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {errors.map((row) => (
              <li key={row.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={row.resolved_at ? "success" : "error"}>
                        {row.resolved_at ? "Resolved" : row.severity}
                      </Badge>
                      <span className="text-xs text-[#64748B]">
                        {row.occurrences}× · last {formatWhen(row.last_seen_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#0F172A] mt-1.5 break-words">
                      {row.message}
                    </p>
                    {row.url && (
                      <p className="text-xs text-[#64748B] mt-0.5 break-all">{row.url}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {row.stack && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                      >
                        {expanded === row.id ? "Hide details" : "Details"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toggleResolved.mutate({ id: row.id, resolved: !row.resolved_at })
                      }
                    >
                      {row.resolved_at ? "Reopen" : "Mark resolved"}
                    </Button>
                  </div>
                </div>
                {expanded === row.id && row.stack && (
                  <pre className="mt-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3 overflow-x-auto text-[#475569]">
                    {row.stack}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
        <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Recent admin activity</h3>
        {auditQuery.isLoading ? (
          <p className="text-sm text-[#64748B]">Loading activity…</p>
        ) : (auditQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-[#64748B]">No admin actions recorded yet.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {(auditQuery.data ?? []).map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-[#0F172A]">
                  {row.action.replace(/_/g, " ")}{" "}
                  <span className="text-[#64748B]">· {row.target_type}</span>
                </span>
                <span className="text-xs text-[#64748B] shrink-0">
                  {formatWhen(row.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export const Route = createFileRoute("/admin/errors")({
  component: ErrorsPage,
});
