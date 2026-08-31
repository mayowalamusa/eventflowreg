import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useNavigate } from "@/lib/nav";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import {
  bannerOrFallback,
  eventPrice,
  fetchEventFields,
  fetchPublicEvent,
  type EventFieldRow,
} from "@/lib/publicEvents";
import {
  attendeeSchema,
  buildCustomAnswers,
  fetchEventTickets,
  fetchRegistrationForm,
  submitRegistration,
  validateCustomFields,
  type TicketRow,
} from "@/lib/registration";

type Step = 1 | 2 | 3;

const trustIndicators = [
  { icon: "🔒", label: "Secure Registration", desc: "256-bit SSL encrypted" },
  { icon: "⚡", label: "Instant Confirmation", desc: "Registration confirmed right away" },
  { icon: "📅", label: "Calendar Reminder", desc: "Auto-added to your calendar" },
];

const attendingBenefits = [
  "Network with industry leaders and peers",
  "Access to exclusive session recordings",
  "Certificate of attendance",
  "Join a thriving community after the event",
  "Early access to future events",
];

function formatMoney(cents: number, currency: string) {
  if (cents <= 0) return "Free";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CustomField({
  field,
  value,
  error,
  onChange,
}: {
  field: EventFieldRow;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}) {
  const options = Array.isArray(field.options) ? (field.options as unknown[]).map((o) => String(o)) : [];

  switch (field.field_type) {
    case "long_text":
      return (
        <Textarea
          label={field.label}
          required={field.is_required}
          placeholder={field.placeholder ?? undefined}
          hint={field.help_text ?? undefined}
          error={error}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "dropdown":
      return (
        <Select
          label={field.label}
          required={field.is_required}
          error={error}
          placeholder={field.placeholder || "Select an option"}
          options={options.map((o) => ({ value: o, label: o }))}
          value={String(value ?? "")}
          onChange={(v) => onChange(v)}
        />
      );
    case "radio":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#0F172A]">
            {field.label}
            {field.is_required && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
          <div className="flex flex-col gap-2">
            {options.map((o) => (
              <label key={o} className="flex items-center gap-2.5 text-sm text-[#475569]">
                <input
                  type="radio"
                  name={field.id}
                  value={o}
                  checked={value === o}
                  onChange={() => onChange(o)}
                  className="accent-[#4F46E5]"
                />
                {o}
              </label>
            ))}
          </div>
          {field.help_text && <p className="text-xs text-[#94A3B8]">{field.help_text}</p>}
          {error && <p className="text-xs text-[#EF4444]">{error}</p>}
        </div>
      );
    case "checkbox": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#0F172A]">
            {field.label}
            {field.is_required && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
          <div className="flex flex-col gap-2">
            {(options.length ? options : [field.label]).map((o) => (
              <label key={o} className="flex items-center gap-2.5 text-sm text-[#475569]">
                <input
                  type="checkbox"
                  checked={selected.includes(o)}
                  onChange={(e) =>
                    onChange(e.target.checked ? [...selected, o] : selected.filter((s) => s !== o))
                  }
                  className="accent-[#4F46E5]"
                />
                {o}
              </label>
            ))}
          </div>
          {field.help_text && <p className="text-xs text-[#94A3B8]">{field.help_text}</p>}
          {error && <p className="text-xs text-[#EF4444]">{error}</p>}
        </div>
      );
    }
    default:
      return (
        <Input
          label={field.label}
          required={field.is_required}
          placeholder={field.placeholder ?? undefined}
          hint={field.help_text ?? undefined}
          error={error}
          type={
            field.field_type === "email"
              ? "email"
              : field.field_type === "phone"
                ? "tel"
                : field.field_type === "date"
                  ? "date"
                  : "text"
          }
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function RegistrationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ["public-event", id],
    queryFn: () => fetchPublicEvent(id!),
    enabled: Boolean(id),
  });
  const { data: fields = [] } = useQuery({
    queryKey: ["event-fields", event?.id],
    queryFn: () => fetchEventFields(event!.id),
    enabled: Boolean(event?.id),
  });
  const { data: tickets = [] } = useQuery({
    queryKey: ["event-tickets", event?.id],
    queryFn: () => fetchEventTickets(event!.id),
    enabled: Boolean(event?.id),
  });
  const { data: registrationForm } = useQuery({
    queryKey: ["registration-form", event?.id],
    queryFn: () => fetchRegistrationForm(event!.id),
    enabled: Boolean(event?.id),
  });

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", org: "" });
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedTicket: TicketRow | null = useMemo(
    () => tickets.find((t) => t.id === ticketId) ?? tickets[0] ?? null,
    [tickets, ticketId],
  );

  const priceLabel = selectedTicket
    ? formatMoney(selectedTicket.price_cents, selectedTicket.currency)
    : event
      ? eventPrice(event)
      : "Free";

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event unavailable");
      return submitRegistration({
        eventId: event.id,
        formId: registrationForm?.id ?? null,
        attendee: form,
        ticket: selectedTicket,
        customAnswers: buildCustomAnswers(fields, answers),
      });
    },
    onSuccess: ({ id: newRegistrationId, registrationId }) => {
      navigate(
        `/events/${event?.slug ?? id}/success?rid=${encodeURIComponent(registrationId)}&regId=${encodeURIComponent(newRegistrationId)}`,
      );
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Could not complete your registration.");
    },
  });

  function validateStep1() {
    const next: Record<string, string> = {};
    const parsed = attendeeSchema.safeParse(form);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
    }
    Object.assign(next, validateCustomFields(fields, answers));
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const stepLabels = ["Personal Info", "Ticket", "Review"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-sm text-[#64748B]">Loading event…</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24">
          <div className="text-5xl">🔍</div>
          <h1 className="text-xl font-bold text-[#0F172A]">Registration unavailable</h1>
          <p className="text-sm text-[#64748B]">This event is no longer accepting registrations.</p>
          <Button onClick={() => navigate("/discover")}>Browse events</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Left: Event summary + benefits ──────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden sticky top-24">
              <img src={bannerOrFallback(event)} alt={event.title} className="w-full h-40 object-cover" />
              <div className="p-5">
                <Badge variant="primary" className="mb-3">{event.category || "Other"}</Badge>
                <h2 className="font-bold text-[#0F172A] text-lg leading-snug mb-3">{event.title}</h2>
                <div className="flex flex-col gap-2 text-sm text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <span>📅</span> {formatDate(event.event_date)} · {(event.event_time || "").slice(0, 5)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span> {event.event_type === "online" ? "Online event" : event.location || "To be announced"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center">
                      {(event.organizer_name || "E").charAt(0).toUpperCase()}
                    </span>
                    {event.organizer_name || "EventFlow host"}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                  <p className="text-xs text-[#94A3B8] mb-2">Selected ticket</p>
                  <p className="font-semibold text-[#0F172A]">{selectedTicket?.name ?? "General Admission"}</p>
                  <p className="text-2xl font-bold text-[#4F46E5] mt-1">{priceLabel}</p>
                </div>

                {/* Benefits of attending */}
                <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                  <p className="text-xs font-semibold text-[#0F172A] mb-2">Benefits of Attending</p>
                  <ul className="flex flex-col gap-1.5">
                    {attendingBenefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-[#475569]">
                        <span className="text-[#22C55E] mt-0.5 shrink-0">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Trust indicators */}
                <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-col gap-2">
                  {trustIndicators.map((t) => (
                    <div key={t.label} className="flex items-center gap-2.5">
                      <span className="text-base">{t.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-[#0F172A]">{t.label}</p>
                        <p className="text-xs text-[#94A3B8]">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Form ──────────────────────────────────────── */}
          <div className="lg:col-span-3">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-8">
              {stepLabels.map((label, i) => {
                const n = (i + 1) as Step;
                const active = step === n;
                const done = step > n;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={[
                        "size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                        active ? "bg-[#4F46E5] text-white" : done ? "bg-[#22C55E] text-white" : "bg-[#E2E8F0] text-[#94A3B8]",
                      ].join(" ")}
                    >
                      {done ? "✓" : n}
                    </div>
                    <span className={`text-sm font-medium ${active ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
                      {label}
                    </span>
                    {i < 2 && <div className="w-8 h-px bg-[#E2E8F0] ml-1" />}
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
              {/* Step 1: Personal info */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <h3 className="font-semibold text-[#0F172A] text-lg">Your Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="First name" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} error={errors["firstName"]} />
                    <Input label="Last name" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} error={errors["lastName"]} />
                  </div>
                  <Input label="Email address" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors["email"]} />
                  <Input label="Phone number" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} error={errors["phone"]} hint="Optional — used for WhatsApp community invite" />
                  <Input label="Organisation / Company" value={form.org} onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))} error={errors["org"]} hint="Optional" />

                  {fields.map((field) => (
                    <CustomField
                      key={field.id}
                      field={field}
                      value={answers[field.id]}
                      error={errors[field.id]}
                      onChange={(value) => setAnswers((a) => ({ ...a, [field.id]: value }))}
                    />
                  ))}

                  <Button fullWidth size="lg" onClick={() => { if (validateStep1()) setStep(2); }}>
                    Continue →
                  </Button>
                </div>
              )}

              {/* Step 2: Ticket selection */}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <h3 className="font-semibold text-[#0F172A] text-lg">Choose Ticket</h3>
                  <div className="flex flex-col gap-3">
                    {(tickets.length ? tickets : [null]).map((t, index) => {
                      const value = t?.id ?? "default";
                      const checked = t ? (selectedTicket?.id ?? null) === t.id : true;
                      return (
                        <label
                          key={value + index}
                          className={[
                            "flex items-start gap-4 p-4 rounded-[12px] border-2 cursor-pointer transition-all",
                            checked ? "border-[#4F46E5] bg-[#EEF2FF]" : "border-[#E2E8F0] hover:border-[#CBD5E1]",
                          ].join(" ")}
                        >
                          <input
                            type="radio"
                            name="ticket"
                            value={value}
                            checked={checked}
                            onChange={() => setTicketId(t?.id ?? null)}
                            className="mt-0.5 accent-[#4F46E5]"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-[#0F172A]">{t?.name ?? "General Admission"}</p>
                            <p className="text-sm text-[#64748B]">
                              {t?.description ?? "Standard access to this event"}
                            </p>
                          </div>
                          <p className="font-bold text-[#4F46E5] text-lg shrink-0">
                            {t ? formatMoney(t.price_cents, t.currency) : eventPrice(event)}
                          </p>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" size="lg" onClick={() => setStep(1)}>← Back</Button>
                    <Button fullWidth size="lg" onClick={() => setStep(3)}>Review Order →</Button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <h3 className="font-semibold text-[#0F172A] text-lg">Review &amp; Confirm</h3>
                  <div className="bg-[#F8FAFC] rounded-[12px] p-4 flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Name</span>
                      <span className="font-medium text-[#0F172A]">{form.firstName} {form.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Email</span>
                      <span className="font-medium text-[#0F172A]">{form.email}</span>
                    </div>
                    {form.phone && (
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Phone</span>
                        <span className="font-medium text-[#0F172A]">{form.phone}</span>
                      </div>
                    )}
                    {form.org && (
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Organisation</span>
                        <span className="font-medium text-[#0F172A]">{form.org}</span>
                      </div>
                    )}
                    {fields.map((field) => {
                      const value = answers[field.id];
                      if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) return null;
                      return (
                        <div key={field.id} className="flex justify-between gap-4">
                          <span className="text-[#64748B]">{field.label}</span>
                          <span className="font-medium text-[#0F172A] text-right">
                            {Array.isArray(value) ? value.join(", ") : String(value)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="border-t border-[#E2E8F0] pt-3 flex justify-between">
                      <span className="text-[#64748B]">Ticket</span>
                      <span className="font-medium text-[#0F172A]">{selectedTicket?.name ?? "General Admission"}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-[#4F46E5]">{priceLabel}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="lg" onClick={() => setStep(2)}>← Back</Button>
                    <Button
                      fullWidth
                      size="lg"
                      disabled={registerMutation.isPending}
                      onClick={() => registerMutation.mutate()}
                    >
                      {registerMutation.isPending ? "Confirming…" : "Confirm Registration 🎉"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/events/$id/register")({
  head: () => ({
    meta: [
      { title: "Register for this event — EventFlow" },
      { name: "description", content: "Reserve your spot in seconds with the EventFlow registration form." },
      { property: "og:title", content: "Register for this event — EventFlow" },
      { property: "og:description", content: "Reserve your spot in seconds with the EventFlow registration form." },
    ],
  }),
  component: RegistrationPage,
});
