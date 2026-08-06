import { createFileRoute } from "@tanstack/react-router";
import { useParams, useNavigate } from "@/lib/nav";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EventCard from "@/components/events/EventCard";
import {
  bannerOrFallback,
  eventPrice,
  eventStartsAt,
  fetchPublicEvent,
  fetchPublicEvents,
  isFree,
} from "@/lib/publicEvents";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function useCountdown(target: Date | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const ts = target ? target.getTime() : 0;
  useEffect(() => {
    if (!ts) return;
    const update = () => {
      const diff = ts - Date.now();
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [ts]);
  return timeLeft;
}

function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ["public-event", id],
    queryFn: () => fetchPublicEvent(id!),
    enabled: Boolean(id),
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ["public-events"],
    queryFn: () => fetchPublicEvents(60),
  });

  const countdown = useCountdown(event ? eventStartsAt(event) : null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-sm text-[#64748B]">Loading event…</div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24">
          <div className="text-5xl">🔍</div>
          <h1 className="text-xl font-bold text-[#0F172A]">Event not found</h1>
          <p className="text-sm text-[#64748B]">This event may have been unpublished or removed.</p>
          <Button onClick={() => navigate("/discover")}>Browse events</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const capacity = event.capacity ?? 0;
  const pct = capacity > 0 ? Math.min(100, Math.round((0 / capacity) * 100)) : 0;
  const similar = allEvents
    .filter((e) => e.id !== event.id && (e.category || "Other") === (event.category || "Other"))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      {/* Banner */}
      <div className="relative h-72 sm:h-96 overflow-hidden bg-[#EEF2FF]">
        <img src={bannerOrFallback(event)} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <div className="flex gap-2 mb-3 flex-wrap">
            <Badge variant="primary">{event.category || "Other"}</Badge>
            <Badge variant={event.event_type === "online" ? "primary" : "default"}>
              {event.event_type === "online" ? "Online" : "In-Person"}
            </Badge>
            <Badge variant={isFree(event) ? "success" : "warning"}>{eventPrice(event)}</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{event.title}</h1>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left: Details ────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Organizer */}
            <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5 flex items-center gap-4">
              <img src={event.organizerAvatar} alt={event.organizer} className="size-12 rounded-full object-cover" />
              <div className="flex-1">
                <p className="text-xs text-[#94A3B8] mb-0.5">Organised by</p>
                <p className="font-semibold text-[#0F172A]">{event.organizer}</p>
              </div>
              <button
                onClick={() => navigate(`/organizers/${event.id}`)}
                className="text-sm text-[#4F46E5] font-medium hover:underline shrink-0"
              >
                View profile
              </button>
            </div>

            {/* Info grid */}
            <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5 grid grid-cols-2 gap-5">
              {[
                { label: "Date", value: formatDate(event.date), icon: "📅" },
                { label: "Time", value: event.time, icon: "🕐" },
                { label: "Location", value: event.location, icon: "📍" },
                { label: "Capacity", value: `${event.attendees.toLocaleString()} / ${event.capacity.toLocaleString()} registered`, icon: "👥" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-[#0F172A]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* About */}
            <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5">
              <h2 className="font-semibold text-[#0F172A] mb-3">About this event</h2>
              <p className="text-sm text-[#475569] leading-relaxed">{event.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {event.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Registration card (sticky) ─────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-lg p-6 lg:sticky lg:top-24">
              <div className="text-center mb-5">
                <p className="text-3xl font-bold text-[#4F46E5]">{formatPrice(event.price)}</p>
                {event.price > 0 && <p className="text-xs text-[#94A3B8] mt-0.5">per attendee</p>}
              </div>

              {/* Countdown */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[
                  { label: "Days", val: countdown.days },
                  { label: "Hrs", val: countdown.hours },
                  { label: "Min", val: countdown.minutes },
                  { label: "Sec", val: countdown.seconds },
                ].map((t) => (
                  <div key={t.label} className="text-center bg-[#F8FAFC] rounded-[10px] py-2.5">
                    <p className="text-xl font-bold text-[#0F172A] tabular-nums">
                      {String(t.val).padStart(2, "0")}
                    </p>
                    <p className="text-xs text-[#94A3B8]">{t.label}</p>
                  </div>
                ))}
              </div>

              {capacity > 0 && (
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-[#64748B] mb-1.5">
                    <span>Capacity</span>
                    <span>{capacity.toLocaleString()} spots</span>
                  </div>
                  <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}


              <Button fullWidth size="lg" onClick={() => navigate(`/events/${event.id}/register`)}>
                Register Now
              </Button>
              <p className="text-xs text-center text-[#94A3B8] mt-3">
                Free cancellation up to 24 hours before the event
              </p>
            </div>
          </div>
        </div>

        {/* ── Similar Events ───────────────────────────────────────── */}
        {similar.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#0F172A]">Similar Events</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/discover?category=${event.category}`)}>
                See all in {event.category} →
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similar.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export const Route = createFileRoute("/events/$id")({
  head: () => ({
    meta: [
      { title: "Event details — EventFlow" },
      { name: "description", content: "Full event details, schedule and organizer information on EventFlow." },
      { property: "og:title", content: "Event details — EventFlow" },
      { property: "og:description", content: "Full event details, schedule and organizer information on EventFlow." },
    ],
  }),
  component: EventDetailPage,
});
