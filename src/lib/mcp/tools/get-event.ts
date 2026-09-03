import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_event",
  title: "Get event details",
  description: "Get full details for one of the signed-in host's events, by event id or URL slug.",
  inputSchema: {
    event: z.string().trim().min(1).describe("The event id (UUID) or URL slug."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ event }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("host_id", ctx.getUserId()!)
      .eq(isUuid ? "id" : "slug", event)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No event found for "${event}".` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { event: data },
    };
  },
});
