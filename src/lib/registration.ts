import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { EventFieldRow } from "@/lib/publicEvents";

export type TicketRow = Database["public"]["Tables"]["event_tickets"]["Row"];

export const attendeeSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(80, "Too long"),
  lastName: z.string().trim().min(1, "Required").max(80, "Too long"),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  org: z.string().trim().max(120).optional().or(z.literal("")),
});

export type AttendeeInput = z.infer<typeof attendeeSchema>;

/** Human-friendly, unique-enough registration ID shown to the attendee. */
export function generateRegistrationId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(8);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return `EVT-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}


export async function fetchEventTickets(eventId: string): Promise<TicketRow[]> {
  const { data, error } = await supabase
    .from("event_tickets")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Validates answers for the host's custom fields. Returns errors keyed by field id. */
export function validateCustomFields(
  fields: EventFieldRow[],
  answers: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = answers[field.id];
    const empty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0);
    if (field.is_required && empty) {
      errors[field.id] = "Required";
      continue;
    }
    if (empty) continue;
    if (field.field_type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
      errors[field.id] = "Valid email required";
    }
    if (typeof value === "string" && value.length > 2000) {
      errors[field.id] = "Too long";
    }
  }
  return errors;
}

/** Maps stored answers to readable label/value pairs for the database record. */
export function buildCustomAnswers(
  fields: EventFieldRow[],
  answers: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const value = answers[field.id];
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    out[field.label] = value;
  }
  return out;
}

export type SubmitRegistrationArgs = {
  eventId: string;
  formId: string | null;
  attendee: AttendeeInput;
  ticket: TicketRow | null;
  customAnswers: Record<string, unknown>;
};

export async function submitRegistration({
  eventId,
  formId,
  attendee,
  ticket,
  customAnswers,
}: SubmitRegistrationArgs): Promise<{ id: string; registrationId: string }> {
  const parsed = attendeeSchema.parse(attendee);
  const registrationId = generateRegistrationId();
  const answers = { ...customAnswers };
  if (parsed.org) answers["Organisation"] = parsed.org;

  const { data, error } = await supabase
    .from("registrations")
    .insert({
      event_id: eventId,
      form_id: formId,
      full_name: `${parsed.firstName} ${parsed.lastName}`.trim(),
      email: parsed.email.toLowerCase(),
      phone: parsed.phone || null,
      custom_answers: answers as never,
      ticket_id: ticket?.id ?? null,
      ticket_code: registrationId,
      amount_paid_cents: ticket?.price_cents ?? 0,
      status: "confirmed",
    })
    .select("id")
    .single();
  if (error) throw error;

  return { id: data.id, registrationId };
}

const SAFE_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

/** Returns the attendee redirect target for an event, or null when unsafe/absent. */
export function safeDestinationUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return SAFE_PROTOCOLS.includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export const DESTINATION_LABELS: Record<string, string> = {
  whatsapp: "Join the WhatsApp group",
  telegram: "Join the Telegram channel",
  zoom: "Join the Zoom meeting",
  google_meet: "Join on Google Meet",
  microsoft_teams: "Join on Microsoft Teams",
  custom: "Continue to the event",
};

export function destinationLabel(type: string | null | undefined): string {
  return DESTINATION_LABELS[type ?? "custom"] ?? DESTINATION_LABELS["custom"]!;
}

/** Active registration form for an event (used to link registrations to the form). */
export async function fetchRegistrationForm(eventId: string) {
  const { data, error } = await supabase
    .from("registration_forms")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
