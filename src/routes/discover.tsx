import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "@/lib/nav";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EventCard from "@/components/events/EventCard";
import { Input } from "@/components/ui/Input";
import { fetchPublicEvents, isFree } from "@/lib/publicEvents";

const locationTypes = ["All", "In-Person", "Online"];
const priceTypes = ["All", "Free", "Paid"];

function DiscoveryPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get("category") ?? "All");
  const [locationType, setLocationType] = useState("All");
  const [priceType, setPriceType] = useState("All");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: () => fetchPublicEvents(200),
  });

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      const name = e.category || "Other";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q) ||
        (e.location ?? "").toLowerCase().includes(q) ||
        (e.organizer_name ?? "").toLowerCase().includes(q);
      const matchCat = activeCategory === "All" || (e.category || "Other") === activeCategory;
      const matchLoc =
        locationType === "All" ||
        (locationType === "Online" && e.event_type === "online") ||
        (locationType === "In-Person" && e.event_type === "physical");
      const matchPrice =
        priceType === "All" ||
        (priceType === "Free" && isFree(e)) ||
        (priceType === "Paid" && !isFree(e));
      return matchSearch && matchCat && matchLoc && matchPrice;
    });
  }, [events, search, activeCategory, locationType, priceType]);


  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      {/* Search header */}
      <div className="bg-white border-b border-[#E2E8F0] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-6">Discover Events</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search events, organisers, locations..."
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
            <div className="flex gap-2">
              {locationTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setLocationType(t)}
                  className={[
                    "px-3 py-2 rounded-[8px] text-sm font-medium border transition-all",
                    locationType === t
                      ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                      : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {priceTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setPriceType(t)}
                  className={[
                    "px-3 py-2 rounded-[8px] text-sm font-medium border transition-all",
                    priceType === t
                      ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                      : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="flex gap-8">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-4 sticky top-24">
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Category</p>
              <div className="flex flex-col gap-0.5">
                {["All", ...categories.map((c) => c.name)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={[
                      "flex items-center justify-between px-3 py-2 rounded-[8px] text-sm font-medium text-left transition-all",
                      activeCategory === cat
                        ? "bg-[#EEF2FF] text-[#4F46E5]"
                        : "text-[#475569] hover:bg-[#F8FAFC]",
                    ].join(" ")}
                  >
                    {cat}
                    {cat !== "All" && (
                      <span className="text-xs text-[#94A3B8]">
                        {categories.find((c) => c.name === cat)?.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main results */}
          <div className="flex-1 min-w-0">
            {/* Mobile category pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 lg:hidden mb-4">
              {["All", ...categories.map((c) => c.name)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={[
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all shrink-0",
                    activeCategory === cat
                      ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                      : "bg-white text-[#475569] border-[#E2E8F0]",
                  ].join(" ")}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-[#64748B]">
                <span className="font-semibold text-[#0F172A]">{filtered.length}</span> events found
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-24 text-sm text-[#64748B]">Loading events…</div>
            ) : filtered.length === 0 ? (

              <div className="text-center py-24">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No events found</h3>
                <p className="text-[#64748B] text-sm">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover events — EventFlow" },
      { name: "description", content: "Browse webinars, workshops, conferences and community meetups happening on EventFlow." },
      { property: "og:title", content: "Discover events — EventFlow" },
      { property: "og:description", content: "Browse webinars, workshops, conferences and community meetups happening on EventFlow." },
    ],
  }),
  component: DiscoveryPage,
});
