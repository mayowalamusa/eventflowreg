import { useNavigate } from "@/lib/nav";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { type Event, formatPrice, formatDate } from "../../data/mockData";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const pct = Math.round((event.attendees / event.capacity) * 100);

  return (
    <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col">
      {/* Banner */}
      <div className="relative h-44 overflow-hidden bg-[#EEF2FF]">
        <img
          src={event.banner}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {/* Top-left: category */}
        <div className="absolute top-3 left-3">
          <Badge variant="primary">{event.category}</Badge>
        </div>
        {/* Top-right: price + location type */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <Badge variant={event.price === 0 ? "success" : "warning"}>
            {formatPrice(event.price)}
          </Badge>
          <Badge variant={event.locationType === "online" ? "primary" : "default"}>
            {event.locationType === "online" ? "Online" : "In-Person"}
          </Badge>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Date + time */}
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatDate(event.date)} · {event.time}
        </div>

        {/* Title + description */}
        <div className="flex-1">
          <h3 className="font-semibold text-[#0F172A] text-base leading-snug line-clamp-2 group-hover:text-[#4F46E5] transition-colors">
            {event.title}
          </h3>
          <p className="text-sm text-[#64748B] mt-1.5 line-clamp-2 leading-relaxed">{event.description}</p>
        </div>

        {/* Organizer row */}
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <img
            src={event.organizerAvatar}
            alt={event.organizer}
            className="size-5 rounded-full object-cover"
          />
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/organizers/${event.id}`); }}
            className="hover:text-[#4F46E5] transition-colors truncate max-w-[120px]"
          >
            {event.organizer}
          </button>
        </div>

        {/* Capacity mini-bar */}
        <div>
          <div className="flex justify-between text-xs text-[#94A3B8] mb-1">
            <span>{event.attendees.toLocaleString()} registered</span>
            <span>{pct}% full</span>
          </div>
          <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4F46E5] rounded-full"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => navigate(`/events/${event.id}`)}
          className="mt-1"
        >
          Register →
        </Button>
      </div>
    </div>
  );
}
