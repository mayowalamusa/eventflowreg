import { createFileRoute } from "@tanstack/react-router";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { events, formatDate } from "@/data/mockData";

function AdminEvents() {
  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">All Events</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Review and moderate platform events</p>
      </div>

      <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {["Event", "Host", "Date", "Registrations", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={event.banner} alt="" className="size-10 rounded-[8px] object-cover bg-[#EEF2FF] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-[#0F172A] truncate max-w-[180px]">{event.title}</p>
                        <p className="text-xs text-[#94A3B8]">{event.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <img src={event.organizerAvatar} alt="" className="size-6 rounded-full object-cover" />
                      <span className="text-[#475569] truncate max-w-[120px]">{event.organizer}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">{formatDate(event.date)}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-[#0F172A]">{event.attendees.toLocaleString()}</span>
                    <span className="text-[#94A3B8]"> / {event.capacity.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button className="text-xs text-[#4F46E5] font-medium hover:underline">View</button>
                      <button className="text-xs text-[#EF4444] font-medium hover:underline">Remove</button>
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

export const Route = createFileRoute("/admin/events")({
  head: () => ({
    meta: [
      { title: "Events — EventFlow Admin" },
      { name: "description", content: "Review and remove events across the EventFlow platform." },
      { property: "og:title", content: "Events — EventFlow Admin" },
      { property: "og:description", content: "Review and remove events across the EventFlow platform." },
    ],
  }),
  component: AdminEvents,
});
