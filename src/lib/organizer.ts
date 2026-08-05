import { supabase } from "@/integrations/supabase/client";

export type OrganizerSocials = {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
};

export const SOCIAL_KEYS: { key: keyof OrganizerSocials; label: string; placeholder: string }[] = [
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/yourhandle" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourorg" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourorg" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourorg" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourorg" },
];

export const LOGO_BUCKET = "organizer-logos";

export function slugifyHandle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Resolves a stored logo value (bucket path or absolute URL) to a displayable URL. */
export async function resolveLogoUrl(logo: string | null): Promise<string | null> {
  if (!logo) return null;
  if (logo.startsWith("http")) return logo;
  const { data } = await supabase.storage.from(LOGO_BUCKET).createSignedUrl(logo, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export function parseSocials(value: unknown): OrganizerSocials {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: OrganizerSocials = {};
  for (const { key } of SOCIAL_KEYS) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim();
  }
  return out;
}
