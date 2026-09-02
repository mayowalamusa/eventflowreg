import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@/lib/nav";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EventCard from "@/components/events/EventCard";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { categoryIcon, fetchPublicEvents, isUpcoming } from "@/lib/publicEvents";


const benefits = [
  {
    icon: "📋",
    title: "Event Registration",
    desc: "Launch a professional event page with smart registration forms in minutes. Collect exactly the information you need.",
    color: "#4F46E5",
    bg: "#EEF2FF",
  },
  {
    icon: "🏘️",
    title: "Community Building",
    desc: "Keep attendees connected before, during, and after every event. Build a lasting audience, not just a one-time crowd.",
    color: "#10B981",
    bg: "#F0FDF4",
  },
  {
    icon: "⚡",
    title: "Smart Automation",
    desc: "Automate confirmation emails, reminders, follow-ups, and communication so you can focus on delivering value.",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
  {
    icon: "📊",
    title: "Real-Time Google Sheets Sync",
    desc: "Every registration instantly syncs to your Google Sheet. No exports, no manual updates, zero data loss.",
    color: "#EF4444",
    bg: "#FEF2F2",
  },
];

const howItWorks = [
  { step: "01", title: "Create Your Event", desc: "Set up a beautiful event page with your branding in minutes." },
  { step: "02", title: "Share Registration Link", desc: "Distribute your link via social media, email, or WhatsApp." },
  { step: "03", title: "People Register", desc: "Attendees register with a smooth, mobile-friendly form." },
  { step: "04", title: "Registrations Sync Automatically", desc: "Every registration lands in your Google Sheet in real time." },
  { step: "05", title: "Attendees Join Community", desc: "Invite registrants to your WhatsApp or Telegram group automatically." },
  { step: "06", title: "Stay Connected Beyond Event Day", desc: "Keep engaging your audience with updates, follow-ups, and future events." },
];

const testimonials = [
  {
    quote:
      "Every registration lands straight in your Google Sheet — no exports, no copy-pasting, no missed signups.",
    title: "Real-time sync",
  },
  {
    quote:
      "Attendees get a confirmation the moment they register, with everything they need to know about the event.",
    title: "Automatic confirmations",
  },
  {
    quote:
      "Route registrants straight to your WhatsApp group, Zoom link, or wherever the event actually happens.",
    title: "Flexible destinations",
  },
];

function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: publicEvents = [], isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: () => fetchPublicEvents(60),
  });

  const upcoming = useMemo(() => publicEvents.filter(isUpcoming), [publicEvents]);
  const upcomingCount = upcoming.length;
  const featuredEvents = useMemo(
    () => (upcoming.length ? upcoming : publicEvents).slice(0, 4),
    [upcoming, publicEvents],
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of publicEvents) {
      const name = e.category || "Other";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count, icon: categoryIcon(name) }));
  }, [publicEvents]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/discover?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 60% -10%, #4F46E520 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 10% 80%, #10B98115 0%, transparent 60%)",
          }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=40 height=40 viewBox=0 0 40 40 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=%234F46E5 fill-opacity=0.03%3E%3Ccircle cx=20 cy=20 r=1.5/%3E%3C/g%3E%3C/svg%3E')]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="size-1.5 rounded-full bg-[#4F46E5] animate-pulse" />
                Africa's Event Growth Platform
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold text-[#0F172A] leading-[1.05] tracking-tight mb-6">
                Create Events.
                <br />
                Grow Communities.
                <br />
                <span className="text-[#4F46E5]">Keep Every Connection.</span>
              </h1>
              <p className="text-lg text-[#475569] leading-relaxed max-w-lg mb-8">
                Create beautiful event pages, collect registrations, sync attendees to Google Sheets in real time, automate reminders, and continue engaging your audience long after the event has ended.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search events by name, category, or city..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    leftIcon={
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="8" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                      </svg>
                    }
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button size="lg" onClick={() => navigate("/signup")}>
                  Create Your First Event
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/discover")}>
                  Explore Events →
                </Button>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-bold text-[#0F172A]">{publicEvents.length}</p>
                  <p className="text-xs text-[#64748B]">Live events</p>
                </div>
                <div className="w-px h-8 bg-[#E2E8F0]" />
                <div>
                  <p className="text-2xl font-bold text-[#0F172A]">{upcomingCount}</p>
                  <p className="text-xs text-[#64748B]">Upcoming</p>
                </div>
                <div className="w-px h-8 bg-[#E2E8F0]" />
                <div>
                  <p className="text-2xl font-bold text-[#0F172A]">{categories.length}</p>
                  <p className="text-xs text-[#64748B]">Categories</p>
                </div>
              </div>

            </div>

            {/* Hero visual */}
            <div className="relative lg:block hidden">
              <div className="relative rounded-[20px] overflow-hidden shadow-2xl">
                <img loading="lazy" decoding="async"
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&h=480&fit=crop&auto=format"
                  alt="EventFlow platform — organizer managing community"
                  className="w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              {/* Floating card: registration */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-[14px] border border-[#E2E8F0] shadow-lg p-4 flex items-center gap-3">
                <div className="size-10 rounded-[10px] bg-[#F0FDF4] flex items-center justify-center text-lg">🎉</div>
                <div>
                  <p className="text-xs text-[#64748B]">New registration</p>
                  <p className="text-sm font-semibold text-[#0F172A]">Lagos Tech Summit 2025</p>
                </div>
              </div>
              {/* Floating card: community */}
              <div className="absolute -top-4 -right-4 bg-white rounded-[14px] border border-[#E2E8F0] shadow-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#4F46E5]">2,847</p>
                <p className="text-xs text-[#64748B]">Community members</p>
              </div>
              {/* Floating: Google Sheets synced */}
              <div className="absolute top-1/2 -left-8 bg-white rounded-[14px] border border-[#E2E8F0] shadow-lg px-3 py-2 flex items-center gap-2">
                <span className="text-base">📊</span>
                <div>
                  <p className="text-xs font-semibold text-[#0F172A]">Synced to Sheets</p>
                  <p className="text-xs text-[#22C55E]">✓ 147 rows updated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────── */}
      <section id="features" className="bg-[#F8FAFC] py-16 border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-1">Browse by Type</p>
              <h2 className="text-2xl font-bold text-[#0F172A]">Popular Categories</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/discover")}>
              View all →
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => navigate(`/discover?category=${encodeURIComponent(cat.name)}`)}
                className="group flex flex-col items-center gap-2 p-4 bg-white rounded-[14px] border border-[#E2E8F0] hover:border-[#4F46E5] hover:shadow-md transition-all duration-200"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-semibold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors text-center leading-tight">
                  {cat.name}
                </span>
                <span className="text-xs text-[#94A3B8]">{cat.count}</span>
              </button>
            ))}
            {categories.length === 0 && (
              <p className="col-span-full text-sm text-[#64748B] text-center py-6">
                Categories appear here as hosts publish events.
              </p>
            )}
          </div>

        </div>
      </section>

      {/* ── Featured Events ──────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-1">Hand-picked</p>
              <h2 className="text-3xl font-bold text-[#0F172A]">Featured Events</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/discover")}>
              Browse all events
            </Button>
          </div>
          {isLoading ? (
            <div className="text-center py-16 text-sm text-[#64748B]">Loading events…</div>
          ) : featuredEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-sm text-[#64748B]">No public events yet — be the first to publish one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* ── Why EventFlow ────────────────────────────────────────────── */}
      <section className="bg-[#0F172A] py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#818CF8] uppercase tracking-wider mb-3">Why EventFlow</p>
            <h2 className="text-4xl font-bold leading-tight">
              More than registration.
              <br />
              <span className="text-[#818CF8]">A complete event growth platform.</span>
            </h2>
            <p className="text-[#94A3B8] text-lg mt-4 max-w-xl mx-auto">
              Build lasting relationships with your audience — before, during, and long after every event.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-[16px] p-6 transition-colors duration-200"
              >
                <div
                  className="size-12 rounded-[12px] flex items-center justify-center text-2xl mb-5"
                  style={{ backgroundColor: `${b.color}25` }}
                >
                  {b.icon}
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-2">The EventFlow Journey</p>
            <h2 className="text-3xl font-bold text-[#0F172A]">How It Works</h2>
            <p className="text-[#64748B] mt-3 max-w-lg mx-auto">
              From first click to lasting community — here's the full journey for you and your attendees.
            </p>
          </div>

          <div className="relative">
            {/* Vertical connector line on desktop */}
            <div className="hidden lg:block absolute left-[calc(50%-1px)] top-8 bottom-8 w-0.5 bg-[#E2E8F0]" />

            <div className="flex flex-col gap-6">
              {howItWorks.map((item, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <div
                    key={item.step}
                    className={`flex items-center gap-6 ${isLeft ? "lg:flex-row" : "lg:flex-row-reverse"} flex-row`}
                  >
                    {/* Content */}
                    <div className={`flex-1 ${isLeft ? "lg:text-right" : "lg:text-left"} text-left`}>
                      <div
                        className={`bg-white border border-[#E2E8F0] rounded-[14px] p-5 shadow-sm hover:shadow-md transition-shadow inline-block w-full max-w-sm ${isLeft ? "lg:ml-auto" : ""}`}
                      >
                        <span className="text-xs font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full mb-2 inline-block">
                          Step {item.step}
                        </span>
                        <h3 className="font-semibold text-[#0F172A] mt-2 mb-1">{item.title}</h3>
                        <p className="text-sm text-[#64748B] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>

                    {/* Center dot */}
                    <div className="hidden lg:flex size-10 rounded-full bg-[#4F46E5] text-white text-xs font-bold items-center justify-center shrink-0 z-10 shadow-md">
                      {item.step}
                    </div>

                    {/* Empty spacer for alternating layout */}
                    <div className="flex-1 hidden lg:block" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why EventFlow ────────────────────────────────────────────── */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-2">Built for real events</p>
            <h2 className="text-3xl font-bold text-[#0F172A]">What EventFlow actually does</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.title}
                className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 hover:shadow-md transition-shadow"
              >
                <p className="text-sm font-semibold text-[#4F46E5] mb-3">{t.title}</p>
                <p className="text-[#475569] text-sm leading-relaxed">{t.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-[#4F46E5]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to host smarter events?</h2>
          <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
            Create your first event and see registrations sync in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-white text-[#4F46E5] hover:bg-indigo-50"
              onClick={() => navigate("/signup")}
            >
              Start Free
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => navigate("/discover")}
            >
              Explore Events →
            </Button>
          </div>
          <p className="text-indigo-300 text-sm mt-5">No credit card required · Free for events up to 100 registrations</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EventFlow — Event registration pages that convert" },
      { name: "description", content: "Create beautiful event registration pages, collect attendees, and sync signups automatically with EventFlow." },
      { property: "og:title", content: "EventFlow — Event registration pages that convert" },
      { property: "og:description", content: "Create beautiful event registration pages, collect attendees, and sync signups automatically with EventFlow." },
    ],
  }),
  component: HomePage,
});
