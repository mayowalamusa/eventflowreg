import { supabase } from "@/integrations/supabase/client";

export type SiteSocials = Record<string, string>;

export type SiteSettings = {
  site_name: string;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  support_email: string | null;
  support_phone: string | null;
  socials: SiteSocials;
  footer_text: string | null;
  maintenance_mode: boolean;
};

export const SOCIAL_KEYS = ["twitter", "linkedin", "instagram", "facebook", "youtube"] as const;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  site_name: "EventFlow",
  tagline: "Event registration pages that convert",
  logo_url: null,
  favicon_url: null,
  og_image_url: null,
  support_email: "support@eventflow.app",
  support_phone: null,
  socials: {},
  footer_text:
    "The modern platform for hosting, discovering, and growing events across Africa and beyond.",
  maintenance_mode: false,
};

function normaliseSocials(value: unknown): SiteSocials {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: SiteSocials = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (typeof val === "string" && val.trim()) out[key] = val.trim();
  }
  return out;
}

/** Public site branding. Falls back to sensible defaults when unavailable. */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "site_name, tagline, logo_url, favicon_url, og_image_url, support_email, support_phone, socials, footer_text, maintenance_mode",
    )
    .eq("id", true)
    .maybeSingle();

  if (error || !data) return DEFAULT_SITE_SETTINGS;

  return {
    site_name: data.site_name || DEFAULT_SITE_SETTINGS.site_name,
    tagline: data.tagline,
    logo_url: data.logo_url,
    favicon_url: data.favicon_url,
    og_image_url: data.og_image_url,
    support_email: data.support_email,
    support_phone: data.support_phone,
    socials: normaliseSocials(data.socials),
    footer_text: data.footer_text,
    maintenance_mode: Boolean(data.maintenance_mode),
  };
}

/** Super-admin only (enforced by row-level security). */
export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .update({ ...patch, socials: patch.socials ?? undefined })
    .eq("id", true);
  if (error) throw error;
}
