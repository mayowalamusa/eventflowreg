import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_registrations",
  title: "List registrations",
  description: "List attendee registrations for one of the signed-in host's events, newest first.",
  inputSchema: {
    event_id: z.string().trim().min(1).describe("The event id (UUID) to list registrations for."),
    search: z.string().trim().describe("Optional name or email substring to filter by.").optional(),
    limit: z.number().int().positive().describe("Maximum rows to return (default 50).").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ event_id, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("registrations")
      .select("id, full_name, email, phone, status, created_at, checked_in_at")
      .eq("event_id", event_id)
      .order("created_at", { ascending: false })
      .limit(Math.min(limit ?? 50, 200));
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { registrations: data ?? [], count: data?.length ?? 0 },
    };
  },
});
