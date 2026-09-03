import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "event_stats",
  title: "Event statistics",
  description: "Summarise the signed-in host's events: totals, published/active counts and registration totals.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId()!;

    const { data: events, error } = await supabase
      .from("events")
      .select("id, title, event_date, is_published")
      .eq("host_id", userId)
      .is("archived_at", null);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const ids = (events ?? []).map((e) => e.id);
    let totalRegistrations = 0;
    if (ids.length > 0) {
      const { count, error: countError } = await supabase
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .in("event_id", ids);
      if (countError) return { content: [{ type: "text", text: countError.message }], isError: true };
      totalRegistrations = count ?? 0;
    }

    const today = new Date().toISOString().slice(0, 10);
    const stats = {
      total_events: events?.length ?? 0,
      published_events: (events ?? []).filter((e) => e.is_published).length,
      upcoming_events: (events ?? []).filter((e) => e.event_date >= today).length,
      total_registrations: totalRegistrations,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(stats) }],
      structuredContent: stats,
    };
  },
});
