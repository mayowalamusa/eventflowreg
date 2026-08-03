import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useParams, useNavigate } from "@/lib/nav";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { events, formatPrice, formatDate } from "@/data/mockData";

type Step = 1 | 2 | 3;

const ticketOptions = [
  { id: "general", label: "General Admission", price: 0, desc: "Access to all sessions" },
  { id: "vip", label: "VIP", price: 10000, desc: "Reserved seating + networking dinner" },
  { id: "earlybird", label: "Early Bird", price: 5000, desc: "Limited — 50 remaining" },
];

const trustIndicators = [
  { icon: "🔒", label: "Secure Registration", desc: "256-bit SSL encrypted" },
  { icon: "⚡", label: "Instant Confirmation", desc: "Email sent immediately" },
  { icon: "📅", label: "Calendar Reminder", desc: "Auto-added to your calendar" },
];

const attendingBenefits = [
  "Network with industry leaders and peers",
  "Access to exclusive session recordings",
  "Certificate of attendance",
  "Join a thriving community after the event",
  "Early access to future events",
];

function RegistrationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = events.find((e) => e.id === id) ?? events[0];

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", org: "" });
  const [ticket, setTicket] = useState("general");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedTicket = ticketOptions.find((t) => t.id === ticket)!;

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const stepLabels = ["Personal Info", "Ticket", "Review"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Left: Event summary + benefits ──────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden sticky top-24">
              <img src={event.banner} alt={event.title} className="w-full h-40 object-cover" />
              <div className="p-5">
                <Badge variant="primary" className="mb-3">{event.category}</Badge>
                <h2 className="font-bold text-[#0F172A] text-lg leading-snug mb-3">{event.title}</h2>
                <div className="flex flex-col gap-2 text-sm text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <span>📅</span> {formatDate(event.date)} · {event.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span> {event.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={event.organizerAvatar} alt="" className="size-5 rounded-full object-cover" />
                    {event.organizer}
                  </div>
                </div>

                {/* Countdown mini */}
                <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                  <p className="text-xs text-[#94A3B8] mb-2">Selected ticket</p>
                  <p className="font-semibold text-[#0F172A]">{selectedTicket.label}</p>
                  <p className="text-2xl font-bold text-[#4F46E5] mt-1">{formatPrice(selectedTicket.price)}</p>
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
                    <Input label="First name" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} error={errors.firstName} />
                    <Input label="Last name" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} error={errors.lastName} />
                  </div>
                  <Input label="Email address" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors.email} />
                  <Input label="Phone number" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} hint="Optional — used for WhatsApp community invite" />
                  <Input label="Organisation / Company" value={form.org} onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))} hint="Optional" />
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
                    {ticketOptions.map((t) => (
                      <label
                        key={t.id}
                        className={[
                          "flex items-start gap-4 p-4 rounded-[12px] border-2 cursor-pointer transition-all",
                          ticket === t.id ? "border-[#4F46E5] bg-[#EEF2FF]" : "border-[#E2E8F0] hover:border-[#CBD5E1]",
                        ].join(" ")}
                      >
                        <input type="radio" name="ticket" value={t.id} checked={ticket === t.id} onChange={() => setTicket(t.id)} className="mt-0.5 accent-[#4F46E5]" />
                        <div className="flex-1">
                          <p className="font-semibold text-[#0F172A]">{t.label}</p>
                          <p className="text-sm text-[#64748B]">{t.desc}</p>
                        </div>
                        <p className="font-bold text-[#4F46E5] text-lg shrink-0">{formatPrice(t.price)}</p>
                      </label>
                    ))}
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
                    {form.org && (
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Organisation</span>
                        <span className="font-medium text-[#0F172A]">{form.org}</span>
                      </div>
                    )}
                    <div className="border-t border-[#E2E8F0] pt-3 flex justify-between">
                      <span className="text-[#64748B]">Ticket</span>
                      <span className="font-medium text-[#0F172A]">{selectedTicket.label}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-[#4F46E5]">{formatPrice(selectedTicket.price)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="lg" onClick={() => setStep(2)}>← Back</Button>
                    <Button fullWidth size="lg" onClick={() => navigate(`/events/${event.id}/success`)}>
                      Confirm Registration 🎉
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
