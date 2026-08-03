import { createFileRoute } from "@tanstack/react-router";
import { useParams, useNavigate } from "@/lib/nav";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EventCard from "@/components/events/EventCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { events, users } from "@/data/mockData";

// Build a richer organizer profile from mock data
const organizerProfiles: Record<string, {
  name: string;
  logo: string;
  banner: string;
  tagline: string;
  description: string;
  mission: string;
  expertise: string[];
  website: string;
  twitter: string;
  linkedin: string;
  totalEvents: number;
  totalRegistrations: number;
  followers: number;
  yearsActive: number;
  verified: boolean;
}> = {
  "1": {
    name: "TechHub Lagos",
    logo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&auto=format",
    banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=320&fit=crop&auto=format",
    tagline: "Building Africa's Tech Ecosystem",
    description: "TechHub Lagos is West Africa's premier technology community, connecting developers, founders, and investors across the continent. Since 2017, we've hosted over 200 events and trained 50,000+ professionals.",
    mission: "To accelerate Africa's digital transformation by creating world-class spaces for learning, collaboration, and innovation.",
    expertise: ["Technology", "Startups", "Innovation", "Networking"],
    website: "https://techhublagos.com",
    twitter: "@TechHubLagos",
    linkedin: "techhub-lagos",
    totalEvents: 218,
    totalRegistrations: 54200,
    followers: 12400,
    yearsActive: 8,
    verified: true,
  },
  "2": {
    name: "Founders Africa",
    logo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&auto=format",
    banner: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=320&fit=crop&auto=format",
    tagline: "Where Africa's Best Founders Learn and Grow",
    description: "Founders Africa is a founder-first community that delivers world-class bootcamps, masterclasses, and networking experiences for early-stage and growth-stage entrepreneurs across Africa.",
    mission: "To build the next generation of African unicorns by providing access to capital, knowledge, and networks.",
    expertise: ["Business", "Fundraising", "Startups", "Leadership"],
    website: "https://foundersafrica.io",
    twitter: "@FoundersAfrica",
    linkedin: "founders-africa",
    totalEvents: 94,
    totalRegistrations: 28600,
    followers: 8300,
    yearsActive: 5,
    verified: true,
  },
};

const defaultOrganizer = organizerProfiles["1"];

const testimonials = [
  { quote: "The Lagos Tech Summit changed my career trajectory. The connections I made are priceless.", name: "Chidi Okeke", role: "Software Engineer", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&auto=format" },
  { quote: "Best event organiser in Lagos by far. Professional, well-organised, and always top-notch speakers.", name: "Adaeze Nwachukwu", role: "Product Manager", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=64&h=64&fit=crop&auto=format" },
];

function OrganizerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const profile = organizerProfiles[id ?? "1"] ?? defaultOrganizer;

  // Events by this organizer
  const orgName = profile.name;
  const orgEvents = events.filter((e) => e.organizer === orgName);
  const upcomingEvents = orgEvents.filter((e) => new Date(e.date) > new Date());
  const pastEvents = orgEvents.filter((e) => new Date(e.date) <= new Date());
  const allEvents = events.slice(0, 4); // fallback to show some events

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      {/* Banner */}
      <div className="relative h-52 overflow-hidden bg-[#EEF2FF]">
        <img src={profile.banner} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Profile header */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-14 pb-6">
            <div className="size-24 rounded-[16px] border-4 border-white shadow-lg overflow-hidden bg-white shrink-0">
              <img src={profile.logo} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 mt-14 sm:mt-0 sm:mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-[#0F172A]">{profile.name}</h1>
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-[#64748B] text-sm mt-0.5">{profile.tagline}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-[#94A3B8]">
                <a href={profile.website} className="hover:text-[#4F46E5] transition-colors">🌐 {profile.website.replace("https://", "")}</a>
                <span>{profile.twitter}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm">Contact</Button>
              <Button size="sm">Follow · {(profile.followers / 1000).toFixed(1)}K</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left sidebar */}
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5 grid grid-cols-2 gap-4">
              {[
                { label: "Events Hosted", value: profile.totalEvents.toLocaleString() },
                { label: "Registrations", value: `${(profile.totalRegistrations / 1000).toFixed(0)}K+` },
                { label: "Followers", value: `${(profile.followers / 1000).toFixed(1)}K` },
                { label: "Years Active", value: profile.yearsActive },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 bg-[#F8FAFC] rounded-[10px]">
                  <p className="text-xl font-bold text-[#4F46E5]">{s.value}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* About */}
            <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5 flex flex-col gap-3">
              <h3 className="font-semibold text-[#0F172A]">About</h3>
              <p className="text-sm text-[#475569] leading-relaxed">{profile.description}</p>
              <div>
                <p className="text-xs font-semibold text-[#0F172A] mb-1.5">Mission</p>
                <p className="text-sm text-[#64748B] italic leading-relaxed">"{profile.mission}"</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0F172A] mb-2">Areas of expertise</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.expertise.map((e) => (
                    <Badge key={e} variant="primary">{e}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5 flex flex-col gap-4">
              <h3 className="font-semibold text-[#0F172A]">Attendee Reviews</h3>
              {testimonials.map((t) => (
                <div key={t.name} className="pb-4 border-b border-[#F1F5F9] last:border-0 last:pb-0">
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-[#F59E0B] text-xs">★</span>
                    ))}
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed mb-2">"{t.quote}"</p>
                  <div className="flex items-center gap-2">
                    <img src={t.avatar} alt={t.name} className="size-7 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-semibold text-[#0F172A]">{t.name}</p>
                      <p className="text-xs text-[#94A3B8]">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-center text-[#94A3B8]">
                Reviews from verified attendees · More coming soon
              </p>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#0F172A]">Upcoming Events</h2>
              </div>
              {(upcomingEvents.length > 0 ? upcomingEvents : allEvents.slice(0, 2)).length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {(upcomingEvents.length > 0 ? upcomingEvents : allEvents.slice(0, 2)).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-10 text-center">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-[#64748B] text-sm">No upcoming events scheduled yet.</p>
                </div>
              )}
            </div>

            {/* Past Events */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#0F172A]">Past Events</h2>
              </div>
              <div className="bg-white rounded-[14px] border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
                {(pastEvents.length > 0 ? pastEvents : allEvents.slice(2)).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <img src={event.banner} alt="" className="size-12 rounded-[10px] object-cover bg-[#EEF2FF] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#0F172A] truncate">{event.title}</p>
                      <p className="text-xs text-[#94A3B8]">
                        {new Date(event.date).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })} · {event.attendees.toLocaleString()} attended
                      </p>
                    </div>
                    <Badge variant="muted">Past</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export const Route = createFileRoute("/organizers/$id")({
  head: () => ({
    meta: [
      { title: "Organizer profile — EventFlow" },
      { name: "description", content: "See upcoming and past events from this EventFlow organizer." },
      { property: "og:title", content: "Organizer profile — EventFlow" },
      { property: "og:description", content: "See upcoming and past events from this EventFlow organizer." },
    ],
  }),
  component: OrganizerProfilePage,
});
