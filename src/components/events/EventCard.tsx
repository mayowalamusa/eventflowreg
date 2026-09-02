import { useNavigate } from "@/lib/nav";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatEventDate, formatEventTime } from "@/lib/events";
import { bannerOrFallback, eventPrice, isFree, type PublicEvent } from "@/lib/publicEvents";

interface EventCardProps {
  event: PublicEvent;
}

export default function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const online = event.event_type === "online";

  return (
    <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col">
      {/* Banner */}
      <div className="relative h-44 overflow-hidden bg-[#EEF2FF]">
        <img
          src={bannerOrFallback(event)}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge variant="primary">{event.category || "General"}</Badge>
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          <Badge variant={isFree(event) ? "success" : "warning"}>{eventPrice(event)}</Badge>
          <Badge variant={online ? "primary" : "default"}>{online ? "Online" : "In-Person"}</Badge>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Date + time */}
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <svg aria-hidden="true" className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatEventDate(event.event_date)} · {formatEventTime(event.event_time)}
        </div>

        {/* Title + description */}
        <div className="flex-1">
          <h3 className="font-semibold text-[#0F172A] text-base leading-snug line-clamp-2 group-hover:text-[#4F46E5] transition-colors">
            {event.title}
          </h3>
          <p className="text-sm text-[#64748B] mt-1.5 line-clamp-2 leading-relaxed">
            {event.description || "No description provided."}
          </p>
        </div>

        {/* Organizer + location row */}
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <span className="size-5 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center text-[10px] font-bold">
            {(event.organizer_name || "E").charAt(0).toUpperCase()}
          </span>
          <span className="truncate max-w-[140px]">{event.organizer_name || "EventFlow host"}</span>
          <span className="truncate">· {online ? "Online" : event.location || "Venue TBA"}</span>
        </div>

        {event.capacity ? (
          <p className="text-xs text-[#94A3B8]">Capacity: {event.capacity.toLocaleString()} attendees</p>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => navigate(`/events/${event.slug}`)}
          className="mt-1"
        >
          Register →
        </Button>
      </div>
    </div>
  );
}
