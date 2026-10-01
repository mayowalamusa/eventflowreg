import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const MEDIA_BUCKETS = ["event-banners", "organizer-logos"] as const;
export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

const inputSchema = z.object({
  bucket: z.enum(["event-banners", "organizer-logos"]),
  paths: z.array(z.string().min(1).max(512)).max(200),
});

function publishableClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/**
 * Mints short-lived URLs for stored media after verifying that each path
 * belongs to published content. Anonymous visitors never read the storage
 * object index directly; owners keep owner-scoped access via RLS.
 */
export const resolveMediaUrls = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<Record<string, string>> => {
    const { bucket, paths } = data;
    const unique = Array.from(new Set(paths));
    if (!unique.length) return {};

    const db = publishableClient();
    const allowed = new Set<string>();

    if (bucket === "event-banners") {
      // RLS (events_public_read) already limits this to published, listed,
      // non-archived events of hosts without a pending deletion request.
      const { data: rows } = await db
        .from("events")
        .select("banner_url")
        .in("banner_url", unique)
        .eq("is_published", true)
        .in("visibility", ["public", "unlisted"]);
      for (const row of rows ?? []) {
        if (row.banner_url) allowed.add(row.banner_url);
      }
    } else {
      const { data: rows } = await db
        .from("organizer_profiles")
        .select("logo_url")
        .in("logo_url", unique)
        .eq("is_published", true);
      for (const row of rows ?? []) {
        if (row.logo_url) allowed.add(row.logo_url);
      }
    }

    if (!allowed.size) return {};

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrls(Array.from(allowed), 60 * 60);
    if (error) return {};

    const out: Record<string, string> = {};
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
    }
    return out;
  });
