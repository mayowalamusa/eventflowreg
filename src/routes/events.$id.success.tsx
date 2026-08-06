import { createFileRoute } from "@tanstack/react-router";
import { useParams, useNavigate } from "@/lib/nav";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import EventCard from "@/components/events/EventCard";
import { bannerOrFallback, fetchPublicEvent, fetchPublicEvents } from "@/lib/publicEvents";

function RegistrationSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();

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

          {event.destination_url && (
            <div className="mb-6">
              <Button fullWidth size="lg" onClick={() => window.open(event.destination_url!, "_blank", "noopener")}>
                Join the event
              </Button>
            </div>
          )}


          {/* Community join buttons */}
          <p className="text-sm font-semibold text-[#0F172A] mb-3">Join the attendee community</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button className="flex-1 flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-medium text-sm py-3 px-4 rounded-[10px] transition-colors">
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Join WhatsApp Group
            </button>
            <button className="flex-1 flex items-center justify-center gap-2.5 bg-[#2AABEE] hover:bg-[#1d98d6] text-white font-medium text-sm py-3 px-4 rounded-[10px] transition-colors">
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Join Telegram Channel
            </button>
          </div>

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
