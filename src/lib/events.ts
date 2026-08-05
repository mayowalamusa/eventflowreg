import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type EventType = Database["public"]["Enums"]["event_type"];
export type EventVisibility = Database["public"]["Enums"]["event_visibility"];
export type DestinationType = Database["public"]["Enums"]["destination_type"];

export const BANNER_BUCKET = "event-banners";

export const CATEGORY_OPTIONS = [
  "Business",
  "Technology",
  "Church",
  "Education",
  "Health",
  "Career",
  "Finance",
  "Networking",
  "Community",
  "Other",
];

export const DESTINATION_OPTIONS: {
  value: DestinationType;
  label: string;
  icon: string;
  placeholder: string;
}[] = [
  { value: "whatsapp", label: "WhatsApp", icon: "💬", placeholder: "https://chat.whatsapp.com/..." },
  { value: "telegram", label: "Telegram", icon: "📢", placeholder: "https://t.me/..." },
  { value: "zoom", label: "Zoom", icon: "🎥", placeholder: "https://zoom.us/j/..." },
  { value: "google_meet", label: "Google Meet", icon: "📹", placeholder: "https://meet.google.com/..." },
  { value: "microsoft_teams", label: "Microsoft Teams", icon: "👥", placeholder: "https://teams.microsoft.com/l/..." },
  { value: "custom", label: "Custom URL", icon: "🔗", placeholder: "https://yourwebsite.com/thank-you" },
];

export const TIMEZONE_OPTIONS = [
  "UTC",
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export const RECURRENCE_OPTIONS = [
  { value: "", label: "Does not repeat" },
  { value: "FREQ=DAILY", label: "Daily" },
  { value: "FREQ=WEEKLY", label: "Weekly" },
  { value: "FREQ=WEEKLY;INTERVAL=2", label: "Every 2 weeks" },
  { value: "FREQ=MONTHLY", label: "Monthly" },
  { value: "FREQ=YEARLY", label: "Yearly" },
];

export const VISIBILITY_OPTIONS: { value: EventVisibility; label: string; desc: string }[] = [
  { value: "public", label: "Public", desc: "Listed in EventFlow discovery" },
  { value: "unlisted", label: "Unlisted", desc: "Only people with the link can view" },
  { value: "private", label: "Private", desc: "Hidden — invite manually" },
];

/** Turns a title into an SEO-friendly URL slug. */
export function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/** Builds a slug that is unique across events, ignoring the event being edited. */
export async function buildUniqueSlug(title: string, ignoreId?: string): Promise<string> {
  const base = slugifyTitle(title) || "event";
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data } = await supabase.from("events").select("id").eq("slug", candidate).maybeSingle();
    if (!data || data.id === ignoreId) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export function eventPublicPath(slug: string): string {
  return `/events/${slug}`;
}

export function eventPublicUrl(slug: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}${eventPublicPath(slug)}`;
}

/** Uploads a banner to private storage and returns the stored object path. */
export async function uploadBanner(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BANNER_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

/** Resolves a stored banner value (object path or absolute URL) to a displayable URL. */
export async function resolveBannerUrl(banner: string | null): Promise<string | null> {
  if (!banner) return null;
  if (banner.startsWith("http") || banner.startsWith("data:")) return banner;
  const { data } = await supabase.storage
    .from(BANNER_BUCKET)
    .createSignedUrl(banner, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export function parseTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  );
}

export function formatEventDate(date: string, time?: string | null): string {
  const d = new Date(`${date}T${(time || "00:00:00").slice(0, 8)}`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatEventTime(time?: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${m} ${suffix}`;
}
