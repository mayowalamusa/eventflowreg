import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://eventflowreg.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/discover", changefreq: "daily", priority: "0.9" },
        ];

        const { createClient } = await import("@supabase/supabase-js");
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]!;
        const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"]!;
        const supabase = createClient(url, key, {
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

        const pageSize = 1000;
        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .from("events")
            .select("id, slug, updated_at")
            .eq("is_published", true)
            .eq("visibility", "public")
            .order("id")
            .range(offset, offset + pageSize - 1);
          if (error) break;
          entries.push(
            ...(data ?? []).map((event) => ({
              path: `/events/${encodeURIComponent(event.slug ?? event.id)}`,
              lastmod: event.updated_at ?? undefined,
              changefreq: "weekly" as const,
            })),
          );
          if (!data || data.length < pageSize) break;
        }

        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .from("organizer_profiles")
            .select("id, handle, updated_at")
            .eq("is_published", true)
            .order("id")
            .range(offset, offset + pageSize - 1);
          if (error) break;
          entries.push(
            ...(data ?? []).map((profile) => ({
              path: `/organizers/${encodeURIComponent(profile.handle ?? profile.id)}`,
              lastmod: profile.updated_at ?? undefined,
              changefreq: "monthly" as const,
            })),
          );
          if (!data || data.length < pageSize) break;
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
