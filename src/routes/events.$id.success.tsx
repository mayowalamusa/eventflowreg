import { createFileRoute } from "@tanstack/react-router";
import { useParams, useNavigate, useSearchParams } from "@/lib/nav";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import EventCard from "@/components/events/EventCard";
import { bannerOrFallback, fetchPublicEvent, fetchPublicEvents } from "@/lib/publicEvents";
import { destinationLabel, safeDestinationUrl } from "@/lib/registration";

function RegistrationSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registrationId = searchParams.get("rid");


  const { data: event, isLoading } = useQuery({
    queryKey: ["public-event", id],
    queryFn: () => fetchPublicEvent(id!),
    enabled: Boolean(id),
  });
  const { data: allEvents = [] } = useQuery({
    queryKey: ["public-events"],
    queryFn: () => fetchPublicEvents(20),
  });

  const recommended = allEvents.filter((e) => e.id !== event?.id).slice(0, 3);

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-sm text-[#64748B]">
          {isLoading ? "Loading…" : "Registration confirmed."}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <div className="flex-1 px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          {/* Success icon */}
          <div className="size-24 rounded-full bg-[#F0FDF4] border-4 border-[#22C55E] flex items-center justify-center mx-auto mb-6 text-4xl">
            🎉
          </div>

          <h1 className="text-3xl font-bold text-[#0F172A] mb-3">You're registered!</h1>
          <p className="text-[#475569] text-lg mb-8 leading-relaxed">
            Your spot at <span className="font-semibold text-[#0F172A]">{event.title}</span> is confirmed. A confirmation has been sent to your email.
          </p>

          {/* Event summary card */}
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden mb-8 text-left">
            <img src={bannerOrFallback(event)} alt={event.title} className="w-full h-36 object-cover" />
            <div className="p-5 flex flex-col gap-2">
              <p className="font-semibold text-[#0F172A]">{event.title}</p>
              <p className="text-sm text-[#64748B]">
                📅 {new Date(`${event.event_date}T00:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })} · {(event.event_time || "").slice(0, 5)}
              </p>
              <p className="text-sm text-[#64748B]">
                📍 {event.event_type === "online" ? "Online event" : event.location || "To be announced"}
              </p>
            </div>
          </div>

          {registrationId && (
            <div className="mb-6 bg-white border border-[#E2E8F0] rounded-[12px] p-4">
              <p className="text-xs text-[#94A3B8] mb-1">Your registration ID</p>
              <p className="font-mono font-semibold text-[#0F172A] tracking-wide">{registrationId}</p>
            </div>
          )}

          {safeDestinationUrl(event.destination_url) && (
            <div className="mb-6">
              <Button
                fullWidth
                size="lg"
                onClick={() =>
                  window.open(safeDestinationUrl(event.destination_url)!, "_blank", "noopener")
                }
              >
                {destinationLabel(event.destination_type)}
              </Button>
            </div>
          )}


          {/* Calendar + share */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button variant="outline" size="lg">📅 Add to Calendar</Button>
            <Button variant="secondary" size="lg">📤 Share Event</Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="ghost" onClick={() => navigate("/discover")}>Discover more events</Button>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </div>
        </div>

        {/* Recommended events */}
        <div className="max-w-5xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-[#0F172A] mb-6 text-center">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommended.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export const Route = createFileRoute("/events/$id/success")({
  head: () => ({
    meta: [
      { title: "You are registered — EventFlow" },
      { name: "description", content: "Your registration is confirmed. Check your inbox for joining details." },
      { property: "og:title", content: "You are registered — EventFlow" },
      { property: "og:description", content: "Your registration is confirmed. Check your inbox for joining details." },
    ],
  }),
  component: RegistrationSuccessPage,
});
