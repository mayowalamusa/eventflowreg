import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminAudit";

const LIST_CAP = 500; // soft cap for now — see Phase 5 report re: pagination at scale

export type AdminEventStatus = "draft" | "published" | "past" | "archived";

export type AdminEventRow = {
  id: string;
  title: string;
  category: string | null;
  bannerUrl: string | null;
  eventDate: string;
  hostId: string;
  hostName: string;
  registrationCount: number;
  status: AdminEventStatus;
  archivedAt: string | null;
};

export function computeStatus(event: {
  is_published: boolean;
  archived_at: string | null;
  event_date: string;
}): AdminEventStatus {
  if (event.archived_at) return "archived";
  if (!event.is_published) return "draft";
  const isPast = new Date(`${event.event_date}T23:59:59`).getTime() < Date.now();
  return isPast ? "past" : "published";
}

function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[%,()]/g, "");
}

/** All platform events (admin-only view). Relies on events_host_read's
 * admin bypass. There's no direct FK from events.host_id to profiles, so
 * host names and registration counts are joined in JS rather than via a
 * PostgREST embedded select. */
export async function fetchAdminEvents(search?: string): Promise<AdminEventRow[]> {
  let eventQuery = supabase
    .from("events")
    .select("id, title, category, banner_url, event_date, host_id, is_published, archived_at")
    .order("created_at", { ascending: false })
    .limit(LIST_CAP);

  const term = search ? sanitizeSearchTerm(search) : "";
  if (term) eventQuery = eventQuery.ilike("title", `%${term}%`);

  const { data: events, error: eventsError } = await eventQuery;
  if (eventsError) throw eventsError;
  if (!events || events.length === 0) return [];

  const hostIds = [...new Set(events.map((e) => e.host_id))];
  const eventIds = events.map((e) => e.id);

  const [{ data: hosts, error: hostsError }, { data: regs, error: regsError }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").in("id", hostIds),
    supabase.from("registrations").select("event_id").in("event_id", eventIds),
  ]);
  if (hostsError) throw hostsError;
  if (regsError) throw regsError;

  const hostNameById = new Map(
    (hosts ?? []).map((h) => [h.id, h.full_name || h.email || "Unknown host"]),
  );
  const regCountByEvent = new Map<string, number>();
  for (const r of regs ?? []) {
    regCountByEvent.set(r.event_id, (regCountByEvent.get(r.event_id) ?? 0) + 1);
  }

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    bannerUrl: e.banner_url,
    eventDate: e.event_date,
    hostId: e.host_id,
    hostName: hostNameById.get(e.host_id) ?? "Unknown host",
    registrationCount: regCountByEvent.get(e.id) ?? 0,
    status: computeStatus(e),
    archivedAt: e.archived_at,
  }));
}

/** Soft-deletes an event: removes it from public listings and blocks new
 * registrations (both already follow from is_published=false / archived_at
 * being set — see the Phase 5 migration), without touching a single
 * registration row. Deliberately not a hard DELETE: events.registrations
 * is ON DELETE CASCADE, so a hard delete here would silently destroy every
 * attendee's registration, email-delivery, and sync history for the event. */
export async function archiveEvent(actorId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({ archived_at: new Date().toISOString(), is_published: false })
    .eq("id", eventId);
  if (error) throw error;
  await logAdminAction(actorId, "archive_event", "event", eventId);
}
