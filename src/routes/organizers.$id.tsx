import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "@/lib/nav";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SOCIAL_KEYS, parseSocials, resolveLogoUrl } from "@/lib/organizer";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchOrganizer(idOrHandle: string) {
  const query = supabase
    .from("organizer_profiles")
    .select(
      "id, user_id, handle, display_name, bio, logo_url, website_url, socials, contact_email, phone, country, state, city, is_verified, is_published, created_at",
    )
    .eq("is_published", true);

  const { data: profile, error } = await (UUID_RE.test(idOrHandle)
    ? query.eq("id", idOrHandle)
    : query.ilike("handle", idOrHandle)
  ).maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const [{ data: eventRows }, { data: followers }] = await Promise.all([
    supabase
      .from("events")
      .select("id, slug, title, description, banner_url, event_date, event_time, event_type, location, category")
      .eq("host_id", profile.user_id)
      .eq("is_published", true)
      .eq("visibility", "public")
      .order("event_date", { ascending: true }),
    // Follower identities are private; the public page only gets an aggregate count.
    supabase.rpc("organizer_follower_count", { _profile_id: profile.id }),
  ]);

  return { profile, events: eventRows ?? [], followers: followers ?? 0 };

}

function OrganizerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [logo, setLogo] = useState<string | null>(null);

  const key = id ?? "";
  const { data, isLoading } = useQuery({
    queryKey: ["organizer", key],
    queryFn: () => fetchOrganizer(key),
    enabled: !!key,
  });

  const profile = data?.profile ?? null;

  const followQuery = useQuery({
    queryKey: ["organizer-following", profile?.id, user?.id],
    enabled: !!profile?.id && !!user?.id,
    queryFn: async () => {
      const { data: row } = await supabase
        .from("organizer_followers")
        .select("id")
        .eq("organizer_profile_id", profile!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!row;
    },
  });

  useEffect(() => {
    let active = true;
    void resolveLogoUrl(profile?.logo_url ?? null).then((url) => {
      if (active) setLogo(url);
    });
    return () => {
      active = false;
    };
  }, [profile?.logo_url]);

  const toggleFollow = async () => {
    if (!profile) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (followQuery.data) {
      await supabase
        .from("organizer_followers")
        .delete()
        .eq("organizer_profile_id", profile.id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("organizer_followers")
        .insert({ organizer_profile_id: profile.id, user_id: user.id });
    }
    void queryClient.invalidateQueries({ queryKey: ["organizer-following", profile.id, user.id] });
    void queryClient.invalidateQueries({ queryKey: ["organizer", key] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-[#64748B] text-sm">Loading profile…</div>
        <Footer />
      </div>
    );
  }

  if (!profile || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-4xl">🔍</p>
          <h1 className="text-xl font-bold text-[#0F172A]">Organizer not found</h1>
          <p className="text-sm text-[#64748B]">This profile doesn't exist or isn't public yet.</p>
          <Button size="sm" onClick={() => navigate("/discover")}>Browse events</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const socials = parseSocials(profile.socials);
  const now = new Date();
  const upcomingEvents = data.events.filter((e) => new Date(`${e.event_date}T${e.event_time}`) > now);
  const pastEvents = data.events.filter((e) => new Date(`${e.event_date}T${e.event_time}`) <= now);
  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      {/* Banner */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-r from-[#4F46E5] to-[#6366F1]" />

      {/* Profile header */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-14 pb-6">
            <div className="size-24 rounded-[16px] border-4 border-white shadow-lg overflow-hidden bg-[#EEF2FF] shrink-0 flex items-center justify-center">
              {logo ? (
                <img src={logo} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🏢</span>
              )}
            </div>
            <div className="flex-1 min-w-0 mt-14 sm:mt-0 sm:mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-[#0F172A]">{profile.display_name}</h1>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-[#64748B] text-sm mt-0.5">@{profile.handle}{location ? ` · ${location}` : ""}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-[#94A3B8]">
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noreferrer" className="hover:text-[#4F46E5] transition-colors">
                    🌐 {profile.website_url.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {SOCIAL_KEYS.filter((s) => socials[s.key]).map((s) => (
                  <a key={s.key} href={socials[s.key]} target="_blank" rel="noreferrer" className="hover:text-[#4F46E5] transition-colors">
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {profile.contact_email && (
                <a href={`mailto:${profile.contact_email}`}>
                  <Button variant="outline" size="sm">Contact</Button>
                </a>
              )}
              <Button size="sm" variant={followQuery.data ? "outline" : "primary"} onClick={() => void toggleFollow()}>
                {followQuery.data ? "Following" : "Follow"} · {data.followers.toLocaleString()}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left sidebar */}
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5 grid grid-cols-2 gap-4">
              {[
                { label: "Events Hosted", value: data.events.length.toLocaleString() },
                { label: "Upcoming", value: upcomingEvents.length.toLocaleString() },
                { label: "Followers", value: data.followers.toLocaleString() },
                {
                  label: "Since",
                  value: new Date(profile.created_at).getFullYear().toString(),
                },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 bg-[#F8FAFC] rounded-[10px]">
                  <p className="text-xl font-bold text-[#4F46E5]">{s.value}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {(profile.bio || profile.contact_email || profile.phone || location) && (
              <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5 flex flex-col gap-3">
                <h2 className="font-semibold text-[#0F172A]">About</h2>
                {profile.bio && <p className="text-sm text-[#475569] leading-relaxed">{profile.bio}</p>}
                <div className="flex flex-col gap-1.5 text-sm text-[#64748B]">
                  {profile.contact_email && <p>✉️ {profile.contact_email}</p>}
                  {profile.phone && <p>📞 {profile.phone}</p>}
                  {location && <p>📍 {location}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-4">Upcoming Events</h2>
              {upcomingEvents.length > 0 ? (
                <div className="bg-white rounded-[14px] border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      onClick={() => navigate(`/events/${event.slug}`)}
                    >
                      {event.banner_url ? (
                        <img src={event.banner_url} alt="" className="size-12 rounded-[10px] object-cover bg-[#EEF2FF] shrink-0" />
                      ) : (
                        <div className="size-12 rounded-[10px] bg-[#EEF2FF] shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#0F172A] truncate">{event.title}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {new Date(event.event_date).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                      <Badge variant="primary">{event.event_type === "online" ? "Online" : "In-Person"}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-10 text-center">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-[#64748B] text-sm">No upcoming events scheduled yet.</p>
                </div>
              )}
            </div>

            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#0F172A] mb-4">Past Events</h2>
                <div className="bg-white rounded-[14px] border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
                  {pastEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      onClick={() => navigate(`/events/${event.slug}`)}
                    >
                      {event.banner_url ? (
                        <img src={event.banner_url} alt="" className="size-12 rounded-[10px] object-cover bg-[#EEF2FF] shrink-0" />
                      ) : (
                        <div className="size-12 rounded-[10px] bg-[#EEF2FF] shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#0F172A] truncate">{event.title}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {new Date(event.event_date).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                      <Badge variant="muted">Past</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrganizerProfilePage,
});
