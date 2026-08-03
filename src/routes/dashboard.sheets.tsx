import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const mappings = [
  { field: "Full Name", sheetColumn: "Column A" },
  { field: "Email Address", sheetColumn: "Column B" },
  { field: "Phone Number", sheetColumn: "Column C" },
  { field: "Event Title", sheetColumn: "Column D" },
  { field: "Ticket Type", sheetColumn: "Column E" },
  { field: "Registration Date", sheetColumn: "Column F" },
  { field: "Status", sheetColumn: "Column G" },
];

const syncLog = [
  { time: "Today, 2:45 PM", event: "Lagos Tech Summit 2025", records: 147, status: "success" },
  { time: "Today, 9:10 AM", event: "Startup Founders Bootcamp", records: 32, status: "success" },
  { time: "Yesterday, 6:00 PM", event: "Women in Finance Forum", records: 89, status: "success" },
  { time: "2 days ago, 3:22 PM", event: "Personal Finance Bootcamp", records: 14, status: "error" },
];

function GoogleSheetsPage() {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">Google Sheets Integration</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Automatically sync registrations to a Google Sheet</p>
      </div>

      {/* Connect card */}
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="size-12 rounded-[12px] bg-[#F0FDF4] flex items-center justify-center text-2xl">📊</div>
          <div>
            <p className="font-semibold text-[#0F172A]">Google Sheets</p>
            <p className="text-sm text-[#64748B]">
              {connected ? "Connected as amara@gmail.com" : "Not connected"}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant={connected ? "success" : "muted"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {!connected ? (
          <Button
            onClick={() => setConnected(true)}
            className="gap-2"
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Connect Google Sheets
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button onClick={handleSync} loading={syncing}>
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
            <Button variant="outline" onClick={() => setConnected(false)}>Disconnect</Button>
          </div>
        )}
      </div>

      {connected && (
        <>
          {/* Field mapping */}
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
            <h3 className="font-semibold text-[#0F172A] mb-4">Field Mapping</h3>
            <div className="divide-y divide-[#F1F5F9]">
              {mappings.map((m) => (
                <div key={m.field} className="flex items-center justify-between py-3">
                  <span className="text-sm text-[#475569]">{m.field}</span>
                  <div className="flex items-center gap-2">
                    <svg className="size-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="text-sm font-medium text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full">
                      {m.sheetColumn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sync log */}
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
            <h3 className="font-semibold text-[#0F172A] mb-4">Sync History</h3>
            <div className="flex flex-col gap-3">
              {syncLog.map((log, i) => (
                <div key={i} className="flex items-center gap-4 py-2.5 border-b border-[#F1F5F9] last:border-0">
                  <div className={["size-8 rounded-full flex items-center justify-center text-sm shrink-0", log.status === "success" ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"].join(" ")}>
                    {log.status === "success" ? "✓" : "✕"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{log.event}</p>
                    <p className="text-xs text-[#94A3B8]">{log.time}</p>
                  </div>
                  <Badge variant={log.status === "success" ? "success" : "error"}>
                    {log.status === "success" ? `${log.records} records` : "Failed"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/dashboard/sheets")({
  head: () => ({
    meta: [
      { title: "Google Sheets sync — EventFlow" },
      { name: "description", content: "Connect a spreadsheet and sync registrations in real time." },
      { property: "og:title", content: "Google Sheets sync — EventFlow" },
      { property: "og:description", content: "Connect a spreadsheet and sync registrations in real time." },
    ],
  }),
  component: GoogleSheetsPage,
});
