import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "@/lib/nav";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { exportHostRegistrationsCsv } from "@/lib/csvExport";
import {
  createSpreadsheet,
  disconnectGoogle,
  EVENTFLOW_FIELDS,
  fetchSheetsStatus,
  saveFieldMapping,
  startGoogleConnect,
  syncNow,
  type SyncRun,
} from "@/lib/googleSheets";

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function runStatusBadge(status: SyncRun["status"]) {
  if (status === "success") return <Badge variant="success">Success</Badge>;
  if (status === "failed") return <Badge variant="error">Failed</Badge>;
  if (status === "partial") return <Badge variant="warning">Partial</Badge>;
  return <Badge variant="muted">Running…</Badge>;
}

/** The Google Sheets Edge Functions may simply not be deployed/configured
 * yet on this project (e.g. Google Cloud setup hasn't been done). Detect
 * that case and show something calmer and more accurate than "please
 * retry" — retrying won't fix a missing configuration. */
function friendlyGoogleErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  // Narrowed on purpose: this used to also match a generic "Edge Function"
  // phrase, which meant a real, specific server error (now that the
  // functions are actually deployed and their messages are correctly
  // recovered — see lib/googleSheets.ts) could still get silently replaced
  // with this "not set up yet" copy. Only genuine unreachable-endpoint
  // signals should hit this fallback; anything else should show the real
  // message so it's actually actionable.
  const unreachable = /failed to (fetch|send a request)|network error|ERR_FAILED/i.test(raw);
  if (unreachable) {
    return "Couldn't reach Google Sheets. Check your connection and try again.";
  }
  return raw || "Something went wrong with Google Sheets.";
}

function GoogleSheetsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [banner, setBanner] = useState<{ type: "ok" | "error"; message: string } | null>(null);
  const [mappingDraft, setMappingDraft] = useState<Record<string, string> | null>(null);

  const statusQuery = useQuery({
    queryKey: ["google-sheets", "status"],
    queryFn: fetchSheetsStatus,
    retry: false,
  });

  // Land here after the OAuth callback redirect: read once, show a banner,
  // then strip the params so a refresh doesn't re-show it.
  useEffect(() => {
    const google = searchParams.get("google");
    if (!google) return;
    if (google === "connected") {
      setBanner({ type: "ok", message: "Google account connected." });
      void queryClient.invalidateQueries({ queryKey: ["google-sheets", "status"] });
    } else if (google === "error") {
      setBanner({
        type: "error",
        message: "Couldn't connect your Google account. Please try again.",
      });
    }
    navigate("/dashboard/sheets", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (statusQuery.data && !mappingDraft) {
      setMappingDraft(statusQuery.data.fieldMapping);
    }
  }, [statusQuery.data, mappingDraft]);

  const connectMutation = useMutation({
    mutationFn: startGoogleConnect,
    onError: (err: unknown) =>
      setBanner({ type: "error", message: friendlyGoogleErrorMessage(err) }),
  });

  const [exportError, setExportError] = useState<string | null>(null);
  const exportMutation = useMutation({
    mutationFn: () => exportHostRegistrationsCsv({}),
    onError: (err: unknown) =>
      setExportError(err instanceof Error ? err.message : "Could not export registrations."),
    onSuccess: () => setExportError(null),
  });

  const createSheetMutation = useMutation({
    mutationFn: createSpreadsheet,
    onSuccess: () => {
      setBanner({ type: "ok", message: "Spreadsheet created." });
      void queryClient.invalidateQueries({ queryKey: ["google-sheets", "status"] });
    },
    onError: (err: unknown) =>
      setBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Could not create the spreadsheet.",
      }),
  });

  const saveMappingMutation = useMutation({
    mutationFn: (mapping: Record<string, string>) => saveFieldMapping(mapping),
    onSuccess: (data) => {
      setBanner(
        data.headerSyncWarning
          ? {
              type: "error",
              message: `Mapping saved, but the sheet header couldn't be updated: ${data.headerSyncWarning}`,
            }
          : { type: "ok", message: "Field mapping saved." },
      );
      void queryClient.invalidateQueries({ queryKey: ["google-sheets", "status"] });
    },
    onError: (err: unknown) =>
      setBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Could not save the mapping.",
      }),
  });

  const syncMutation = useMutation({
    mutationFn: syncNow,
    onSuccess: (data) => {
      if (data.status === "success") {
        setBanner({
          type: "ok",
          message: data.added
            ? `Synced ${data.added} new registration${data.added === 1 ? "" : "s"}.`
            : "Already up to date.",
        });
      } else {
        setBanner({ type: "error", message: data.message || "Sync failed." });
      }
      void queryClient.invalidateQueries({ queryKey: ["google-sheets", "status"] });
    },
    onError: (err: unknown) =>
      setBanner({ type: "error", message: err instanceof Error ? err.message : "Sync failed." }),
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectGoogle,
    onSuccess: () => {
      setBanner({ type: "ok", message: "Google account disconnected." });
      void queryClient.invalidateQueries({ queryKey: ["google-sheets", "status"] });
    },
    onError: (err: unknown) =>
      setBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Could not disconnect.",
      }),
  });

  const status = statusQuery.data;
  const isConnected = Boolean(status?.connected);
  const hasSpreadsheet = Boolean(status?.spreadsheet);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">Export &amp; Sync</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Get your registrations out of EventFlow</p>
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

      {/* Google Sheets — the primary sync option now that it's configured. */}
      <>
        {/* Connect card */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="size-12 rounded-[12px] bg-[#F0FDF4] flex items-center justify-center text-2xl">
              📊
            </div>
            <div>
              <p className="font-semibold text-[#0F172A]">Google Sheets</p>
              <p className="text-sm text-[#64748B]">
                {statusQuery.isLoading
                  ? "Checking connection…"
                  : isConnected
                    ? `Connected as ${status?.googleEmail ?? "your Google account"}`
                    : "Not connected"}
              </p>
            </div>
            <div className="ml-auto">
              <Badge variant={isConnected ? "success" : "muted"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </div>

          {statusQuery.isError && (
            <p className="text-sm text-[#B45309] mb-4">
              {friendlyGoogleErrorMessage(statusQuery.error)}
            </p>
          )}

          {!statusQuery.isLoading && !isConnected && (
            <Button
              onClick={() => connectMutation.mutate()}
              loading={connectMutation.isPending}
              className="gap-2"
            >
              <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Connect Google Sheets
            </Button>
          )}

          {isConnected && !hasSpreadsheet && (
            <Button
              onClick={() => createSheetMutation.mutate()}
              loading={createSheetMutation.isPending}
            >
              Create Spreadsheet
            </Button>
          )}

          {isConnected && hasSpreadsheet && (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => syncMutation.mutate()} loading={syncMutation.isPending}>
                {syncMutation.isPending ? "Syncing…" : "Sync Now"}
              </Button>
              <a
                href={status!.spreadsheet!.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-[#4F46E5] hover:underline"
              >
                Open spreadsheet ↗
              </a>
              <Button
                variant="outline"
                onClick={() => disconnectMutation.mutate()}
                loading={disconnectMutation.isPending}
                className="ml-auto"
              >
                Disconnect
              </Button>
            </div>
          )}

          {status?.lastSyncError && (
            <p className="text-xs text-[#B45309] mt-3">Last sync issue: {status.lastSyncError}</p>
          )}
          {status?.lastSyncedAt && !status.lastSyncError && (
            <p className="text-xs text-[#94A3B8] mt-3">
              Last synced {timeAgo(status.lastSyncedAt)}
            </p>
          )}
        </div>

        {isConnected && hasSpreadsheet && mappingDraft && (
          <>
            {/* Field mapping */}
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-[#0F172A]">Field Mapping</h3>
              </div>
              <p className="text-xs text-[#94A3B8] mb-4">
                Choose which fields to include and what to call each column. Unchecked fields are
                left out of the sheet.
              </p>
              <div className="divide-y divide-[#F1F5F9]">
                {EVENTFLOW_FIELDS.map((f) => {
                  const enabled = f.key in mappingDraft;
                  return (
                    <div key={f.key} className="flex flex-wrap items-center gap-3 py-3">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => {
                          setMappingDraft((prev) => {
                            const next = { ...(prev ?? {}) };
                            if (e.target.checked) next[f.key] = f.label;
                            else delete next[f.key];
                            return next;
                          });
                        }}
                        className="size-4 accent-[#4F46E5] shrink-0"
                      />
                      <span className="text-sm text-[#475569] w-32 sm:w-40 shrink-0">
                        {f.label}
                      </span>
                      <svg
                        className="size-4 text-[#94A3B8] shrink-0 hidden sm:block"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                      <Input
                        value={mappingDraft[f.key] ?? ""}
                        disabled={!enabled}
                        onChange={(e) =>
                          setMappingDraft((prev) => ({
                            ...(prev ?? {}),
                            [f.key]: e.target.value,
                          }))
                        }
                        placeholder="Column header"
                        className="flex-1 min-w-[140px] sm:max-w-[220px]"
                      />
                    </div>
                  );
                })}
              </div>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => saveMappingMutation.mutate(mappingDraft)}
                loading={saveMappingMutation.isPending}
              >
                Save Mapping
              </Button>
            </div>

            {/* Sync log */}
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
              <h3 className="font-semibold text-[#0F172A] mb-4">Sync History</h3>
              {(status?.syncRuns.length ?? 0) === 0 ? (
                <p className="text-sm text-[#94A3B8]">
                  No syncs yet. Click "Sync Now" to send your first batch of registrations.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {status!.syncRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center gap-4 py-2.5 border-b border-[#F1F5F9] last:border-0"
                    >
                      <div
                        className={[
                          "size-8 rounded-full flex items-center justify-center text-sm shrink-0",
                          run.status === "success"
                            ? "bg-[#F0FDF4]"
                            : run.status === "failed"
                              ? "bg-[#FEF2F2]"
                              : "bg-[#F8FAFC]",
                        ].join(" ")}
                      >
                        {run.status === "success" ? "✓" : run.status === "failed" ? "✕" : "…"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">
                          {run.status === "failed" && run.error
                            ? run.error
                            : `${run.added_count} added`}
                        </p>
                        <p className="text-xs text-[#94A3B8]">{timeAgo(run.started_at)}</p>
                      </div>
                      {runStatusBadge(run.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </>

      {/* CSV export — secondary, always-available fallback */}
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="size-12 rounded-[12px] bg-[#EEF2FF] flex items-center justify-center text-2xl">
            📄
          </div>
          <div>
            <p className="font-semibold text-[#0F172A]">CSV Export</p>
            <p className="text-sm text-[#64748B]">
              Download all your registrations as a spreadsheet-ready file
            </p>
          </div>
        </div>
        {exportError && <p className="text-sm text-[#B91C1C] mb-3">{exportError}</p>}
        <Button onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
          {exportMutation.isPending ? "Exporting…" : "Download CSV"}
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/sheets")({
  head: () => ({
    meta: [
      { title: "Google Sheets sync — EventFlow" },
      {
        name: "description",
        content: "Connect a spreadsheet and sync registrations in real time.",
      },
      { property: "og:title", content: "Google Sheets sync — EventFlow" },
      {
        property: "og:description",
        content: "Connect a spreadsheet and sync registrations in real time.",
      },
    ],
  }),
  component: GoogleSheetsPage,
});
