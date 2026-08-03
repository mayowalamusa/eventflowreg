import { useState } from "react";
import { useNavigate } from "@/lib/nav";
import { Input, Textarea, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { categories } from "@/data/mockData";

type Step = 1 | 2 | 3 | 4;

const stepLabels = ["Event Details", "Registration Form", "Community & Redirect", "Publish"];
const stepDescs = [
  "Basic info about your event",
  "What to collect from registrants",
  "Where to send attendees after registration",
  "Review and publish",
];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    title: "",
    category: "",
    date: "",
    time: "",
    locationType: "in-person",
    location: "",
    description: "",
    capacity: "",
    ticketName: "General Admission",
    price: "0",
    // Registration form fields
    collectPhone: true,
    collectOrg: true,
    collectRole: false,
    // Community
    whatsappLink: "",
    telegramLink: "",
    redirectUrl: "",
    redirectLabel: "Visit our website",
    // Publish
    isPublic: true,
    sendConfirmation: true,
    sendReminder: true,
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: string) => setForm((f) => ({ ...f, [k]: !(f as any)[k] }));

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0F172A]">Create Event</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Fill in the details to publish your event</p>
      </div>

      {/* Step indicator */}
      <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5 mb-6">
        <div className="flex items-start gap-0 relative">
          {/* Progress bar background */}
          <div className="absolute top-[13px] left-[13px] right-[13px] h-0.5 bg-[#E2E8F0] z-0" />
          <div
            className="absolute top-[13px] left-[13px] h-0.5 bg-[#4F46E5] z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
          {stepLabels.map((label, i) => {
            const n = (i + 1) as Step;
            const active = step === n;
            const done = step > n;
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                <div
                  className={[
                    "size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    active ? "bg-[#4F46E5] text-white ring-4 ring-[#EEF2FF]" : done ? "bg-[#22C55E] text-white" : "bg-white border-2 border-[#E2E8F0] text-[#94A3B8]",
                  ].join(" ")}
                >
                  {done ? "✓" : n}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-semibold ${active ? "text-[#4F46E5]" : done ? "text-[#22C55E]" : "text-[#94A3B8]"}`}>
                    {label}
                  </p>
                  <p className="text-xs text-[#94A3B8] hidden sm:block">{stepDescs[i]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
        {/* Step 1: Event Details */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h3 className="font-semibold text-[#0F172A] text-lg">Event Details</h3>
            <Input label="Event title" required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Lagos Tech Summit 2025" />
            <Select
              label="Category"
              required
              value={form.category}
              onChange={(v) => set("category", v)}
              placeholder="Select a category"
              options={categories.map((c) => ({ value: c.name, label: `${c.icon} ${c.name}` }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date" type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} />
              <Input label="Time" type="time" required value={form.time} onChange={(e) => set("time", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#0F172A]">Location type</p>
              <div className="flex gap-3">
                {["in-person", "online"].map((t) => (
                  <label key={t} className={["flex items-center gap-2 px-4 py-2.5 rounded-[8px] border cursor-pointer transition-all text-sm", form.locationType === t ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]" : "border-[#E2E8F0] text-[#475569]"].join(" ")}>
                    <input type="radio" name="locType" value={t} checked={form.locationType === t} onChange={() => set("locationType", t)} className="accent-[#4F46E5]" />
                    {t === "in-person" ? "📍 In-Person" : "💻 Online"}
                  </label>
                ))}
              </div>
            </div>
            <Input label={form.locationType === "online" ? "Meeting link" : "Venue address"} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder={form.locationType === "online" ? "https://zoom.us/j/..." : "123 Main St, Lagos"} />
            <Textarea label="Event description" required rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Tell attendees what to expect..." />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="e.g. 500" />
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-[#0F172A]">Ticket price</p>
                <div className="flex gap-2">
                  {["free", "paid"].map((t) => (
                    <label key={t} className={["flex items-center gap-2 px-3 py-2.5 rounded-[8px] border text-sm cursor-pointer transition-all flex-1 justify-center", (t === "free" ? form.price === "0" : form.price !== "0") ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]" : "border-[#E2E8F0] text-[#475569]"].join(" ")}>
                      <input type="radio" name="pricetype" checked={t === "free" ? form.price === "0" : form.price !== "0"} onChange={() => set("price", t === "free" ? "0" : "5000")} className="accent-[#4F46E5]" />
                      {t === "free" ? "Free" : "Paid"}
                    </label>
                  ))}
                </div>
                {form.price !== "0" && (
                  <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Amount (NGN)" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Registration Form */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h3 className="font-semibold text-[#0F172A] text-lg">Registration Form Fields</h3>
            <p className="text-sm text-[#64748B]">Choose what information to collect from attendees. Name and email are always included.</p>

            {/* Always-on fields */}
            <div className="bg-[#F8FAFC] rounded-[12px] p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Always included</p>
              {["First Name", "Last Name", "Email Address"].map((f) => (
                <div key={f} className="flex items-center justify-between">
                  <span className="text-sm text-[#0F172A]">{f}</span>
                  <span className="text-xs bg-[#F0FDF4] text-[#16A34A] px-2 py-0.5 rounded-full font-medium">Required</span>
                </div>
              ))}
            </div>

            {/* Optional fields */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Optional fields</p>
              {[
                { key: "collectPhone", label: "Phone Number", desc: "Used for WhatsApp community invite" },
                { key: "collectOrg", label: "Organisation / Company", desc: "Useful for B2B events" },
                { key: "collectRole", label: "Job Role / Title", desc: "For networking matchmaking" },
              ].map((f) => (
                <div key={f.key} className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-[10px]">
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{f.label}</p>
                    <p className="text-xs text-[#94A3B8]">{f.desc}</p>
                  </div>
                  <button
                    onClick={() => toggle(f.key)}
                    className={["w-11 h-6 rounded-full transition-all relative shrink-0", (form as any)[f.key] ? "bg-[#4F46E5]" : "bg-[#E2E8F0]"].join(" ")}
                  >
                    <span className={["absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", (form as any)[f.key] ? "left-5" : "left-0.5"].join(" ")} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Community & Redirect */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h3 className="font-semibold text-[#0F172A] text-lg">Community &amp; Redirect</h3>
            <p className="text-sm text-[#64748B]">After registering, direct attendees to your community and show them a confirmation page.</p>

            <div className="flex flex-col gap-4">
              <Input
                label="WhatsApp Group Link"
                value={form.whatsappLink}
                onChange={(e) => set("whatsappLink", e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                hint="Attendees will see a 'Join WhatsApp Group' button after registering"
                leftIcon={<span className="text-sm">💬</span>}
              />
              <Input
                label="Telegram Channel Link"
                value={form.telegramLink}
                onChange={(e) => set("telegramLink", e.target.value)}
                placeholder="https://t.me/..."
                hint="Optional — add a Telegram channel for updates"
                leftIcon={<span className="text-sm">📢</span>}
              />
              <Input
                label="Post-registration redirect URL"
                value={form.redirectUrl}
                onChange={(e) => set("redirectUrl", e.target.value)}
                placeholder="https://yourwebsite.com/thank-you"
                hint="Optional — redirect attendees to your own thank-you page"
                leftIcon={<span className="text-sm">🔗</span>}
              />
            </div>

            {/* Automation */}
            <div className="flex flex-col gap-3 mt-2">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Automated messages</p>
              {[
                { key: "sendConfirmation", label: "Send confirmation email", desc: "Immediately after registration" },
                { key: "sendReminder", label: "Send event reminder", desc: "24 hours before the event" },
              ].map((f) => (
                <div key={f.key} className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-[10px]">
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{f.label}</p>
                    <p className="text-xs text-[#94A3B8]">{f.desc}</p>
                  </div>
                  <button
                    onClick={() => toggle(f.key)}
                    className={["w-11 h-6 rounded-full transition-all relative shrink-0", (form as any)[f.key] ? "bg-[#4F46E5]" : "bg-[#E2E8F0]"].join(" ")}
                  >
                    <span className={["absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", (form as any)[f.key] ? "left-5" : "left-0.5"].join(" ")} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Publish */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <h3 className="font-semibold text-[#0F172A] text-lg">Review &amp; Publish</h3>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-[12px] border border-[#E2E8F0]">
              <div>
                <p className="font-medium text-[#0F172A] text-sm">Public event</p>
                <p className="text-xs text-[#94A3B8]">Visible in EventFlow discovery</p>
              </div>
              <button
                onClick={() => toggle("isPublic")}
                className={["w-11 h-6 rounded-full transition-all relative", form.isPublic ? "bg-[#4F46E5]" : "bg-[#E2E8F0]"].join(" ")}
              >
                <span className={["absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", form.isPublic ? "left-5" : "left-0.5"].join(" ")} />
              </button>
            </div>

            {/* Review summary */}
            <div className="bg-[#EEF2FF] rounded-[12px] p-5 flex flex-col gap-3 text-sm">
              <p className="font-semibold text-[#4F46E5] mb-1">Event Summary</p>
              {[
                { label: "Title", val: form.title || "—" },
                { label: "Category", val: form.category || "—" },
                { label: "Date & Time", val: form.date && form.time ? `${form.date} · ${form.time}` : "—" },
                { label: "Location", val: form.location || "—" },
                { label: "Ticket", val: `${form.ticketName} · ${form.price === "0" ? "Free" : `₦${form.price}`}` },
                { label: "Community", val: form.whatsappLink ? "WhatsApp link set" : form.telegramLink ? "Telegram link set" : "No community link" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-[#6366F1]">{r.label}</span>
                  <span className="font-medium text-[#0F172A]">{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button variant="outline" size="lg" onClick={() => setStep((s) => (s - 1) as Step)}>
              ← Back
            </Button>
          )}
          {step < 4 ? (
            <Button fullWidth size="lg" onClick={() => setStep((s) => (s + 1) as Step)}>
              Continue →
            </Button>
          ) : (
            <Button fullWidth size="lg" onClick={() => navigate("/dashboard/events")}>
              Publish Event 🚀
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
