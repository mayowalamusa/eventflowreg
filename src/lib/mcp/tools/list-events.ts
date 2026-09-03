import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_events",
  title: "List my events",
  description: "List the signed-in host's events with their status, date and registration URL slug.",
  inputSchema: {
    limit: z.number().int().positive().describe("Maximum number of events to return (default 20).").optional(),
    published_only: z.boolean().describe("Only return published events.").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, published_only }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("events")
      .select("id, slug, title, event_date, event_time, timezone, event_type, location, visibility, is_published, capacity")
      .eq("host_id", ctx.getUserId()!)
      .is("archived_at", null)
      .order("event_date", { ascending: false })
      .limit(Math.min(limit ?? 20, 100));
    if (published_only) query = query.eq("is_published", true);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { events: data ?? [] },
    };
  },
});
