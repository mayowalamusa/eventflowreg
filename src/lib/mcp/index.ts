import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listEventsTool from "./tools/list-events";
import getEventTool from "./tools/get-event";
import listRegistrationsTool from "./tools/list-registrations";
import eventStatsTool from "./tools/event-stats";

// The OAuth issuer must be the direct Supabase host: SUPABASE_URL is rewritten
// to a proxy on publish, which fails the RFC 8414 issuer check. The project ref
// is inlined at build time by Vite.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "event-flow-dashboard",
  title: "Event Flow Dashboard",
  version: "0.1.0",
  instructions:
    "Tools for EventFlow, an event registration platform. Use `list_events` to find the signed-in host's events, `get_event` for full details of one event, `list_registrations` to read attendees for an event, and `event_stats` for a dashboard summary. All tools act as the signed-in host and only return their own data.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listEventsTool, getEventTool, listRegistrationsTool, eventStatsTool],
});
