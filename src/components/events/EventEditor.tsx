import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/lib/nav";
import { Input, Textarea, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SAFE_DESTINATION_PROTOCOLS } from "@/lib/registration";
import {
  BANNER_BUCKET,
  CATEGORY_OPTIONS,
  DESTINATION_OPTIONS,
  RECURRENCE_OPTIONS,
  TIMEZONE_OPTIONS,
  VISIBILITY_OPTIONS,
  buildUniqueSlug,
  eventPublicUrl,
  parseTags,
  resolveBannerUrl,
  slugifyTitle,
  uploadBanner,
  type DestinationType,
  type EventType,
  type EventVisibility,
} from "@/lib/events";

type Step = 1 | 2 | 3;

const stepLabels = ["Event Details", "Destination & Visibility", "Publish"];
const stepDescs = [
  "Basic info about your event",
  "Where attendees go next",
  "Review, save and publish",
];

type FormState = {
  title: string;
  description: string;
  category: string;
  tags: string;
  organizerName: string;
  eventDate: string;
  eventTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  eventType: EventType;
  location: string;
  capacity: string;
  visibility: EventVisibility;
  recurrenceRule: string;
  destinationType: DestinationType;
  destinationUrl: string;
  slug: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  category: "",
  tags: "",
  organizerName: "",
  eventDate: "",
  eventTime: "",
  endDate: "",
  endTime: "",
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : "UTC",
  eventType: "online",
  location: "",
  capacity: "",
  visibility: "public",
  recurrenceRule: "",
  destinationType: "whatsapp",
  destinationUrl: "",
  slug: "",
};

export default function EventEditor({ eventId }: { eventId?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = Boolean(eventId);

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [bannerPath, setBannerPath] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const existing = useQuery({
    queryKey: ["event", eventId, user?.id],
    enabled: isEdit && Boolean(user),
    queryFn: async () => {
      // Scoped to the current host explicitly, not just left to RLS: RLS's
      // events_public_read policy would also happily return someone else's
      // *published* event here (it's public data), which would otherwise
      // load a foreign host's event into this "edit" form. Nothing could
      // actually be saved (events_host_update still blocks that), but
      // there's no reason to load it into an editable-looking form at all.
      const { data, error: err } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId!)
        .eq("host_id", user!.id)
        .maybeSingle();
      if (err) throw err;
      return data;
    },
  });

  useEffect(() => {
    const row = existing.data;
    if (!row) return;
    setForm({
      title: row.title,
      description: row.description ?? "",
      category: row.category ?? "",
      tags: (row.tags ?? []).join(", "),
      organizerName: row.organizer_name ?? "",
      eventDate: row.event_date,
      eventTime: (row.event_time ?? "").slice(0, 5),
      endDate: row.end_date ?? "",
      endTime: (row.end_time ?? "").slice(0, 5),
      timezone: row.timezone,
      eventType: row.event_type,
      location: row.location ?? "",
      capacity: row.capacity ? String(row.capacity) : "",
      visibility: row.visibility,
      recurrenceRule: row.recurrence_rule ?? "",
      destinationType: row.destination_type,
      destinationUrl: row.destination_url ?? "",
      slug: row.slug,
    });
    setSlugTouched(true);
    setBannerPath(row.banner_url);
    void resolveBannerUrl(row.banner_url).then(setBannerPreview);
  }, [existing.data]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const previewSlug = useMemo(
    () => (slugTouched ? form.slug : slugifyTitle(form.title)),
    [slugTouched, form.slug, form.title],
  );

  const destination = DESTINATION_OPTIONS.find((d) => d.value === form.destinationType)!;

  async function handleBannerFile(file: File) {
    if (!user) return;
    setError(null);
    setUploading(true);
    try {
      const path = await uploadBanner(file, user.id);
      setBannerPath(path);
      setBannerPreview(await resolveBannerUrl(path));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload the banner.");
    } finally {
      setUploading(false);
    }
  }

  function validate(): string | null {
    if (!form.title.trim()) return "Event title is required.";
    if (!form.eventDate) return "Event date is required.";
    if (!form.eventTime) return "Event time is required.";
    if (form.eventType === "physical" && !form.location.trim()) return "Venue address is required for physical events.";
    if (!form.destinationUrl.trim()) return "A redirect URL is required so attendees know where to go.";
    try {
      const parsed = new URL(form.destinationUrl.trim());
      if (!SAFE_DESTINATION_PROTOCOLS.includes(parsed.protocol)) {
        return "Redirect URL must start with https://, http://, mailto:, or tel:.";
      }
    } catch {
      return "Redirect URL must be a full URL starting with https://";
    }
    return null;
  }

  const save = useMutation({
    mutationFn: async (publish: boolean | null) => {
      if (!user) throw new Error("You need to be signed in.");
      const problem = validate();
      if (problem) throw new Error(problem);

      const slugSource = slugTouched && form.slug.trim() ? form.slug : form.title;
      const slug = await buildUniqueSlug(slugSource, eventId);

      const payload = {
        host_id: user.id,
        slug,
        title: form.title.trim(),
        description: form.description.trim() || null,
        banner_url: bannerPath,
        organizer_name: form.organizerName.trim() || null,
        category: form.category || null,
        tags: parseTags(form.tags),
        event_type: form.eventType,
        event_date: form.eventDate,
        event_time: form.eventTime,
        end_date: form.endDate || null,
        end_time: form.endTime || null,
        timezone: form.timezone,
        location: form.location.trim() || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        visibility: form.visibility,
        recurrence_rule: form.recurrenceRule || null,
        destination_type: form.destinationType,
        destination_url: form.destinationUrl.trim(),
        ...(publish === null ? {} : { is_published: publish }),
      };

      if (isEdit) {
        const { data, error: err } = await supabase
          .from("events")
          .update(payload)
          .eq("id", eventId!)
          .select()
          .single();
        if (err) throw err;
        return data;
      }
      const { data, error: err } = await supabase
        .from("events")
        .insert({ ...payload, is_published: publish ?? false })
        .select()
        .single();
      if (err) throw err;
      return data;
    },
    onSuccess: (row, publish) => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (publish) {
        navigate("/dashboard/events");
      } else if (!isEdit) {
        navigate(`/dashboard/events/${row.id}/edit`);
      } else {
        setForm((f) => ({ ...f, slug: row.slug }));
        setNotice("Changes saved.");
      }
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Something went wrong."),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (bannerPath && !bannerPath.startsWith("http")) {
        await supabase.storage.from(BANNER_BUCKET).remove([bannerPath]);
      }
      const { error: err } = await supabase.from("events").delete().eq("id", eventId!);
      if (err) throw err;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/dashboard/events");
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not delete this event."),
  });

  const busy = save.isPending || remove.isPending || uploading;

  if (isEdit && existing.isLoading) {
    return <div className="p-6 text-sm text-[#64748B]">Loading event…</div>;
  }
  if (isEdit && !existing.isLoading && !existing.data) {
    return (
      <div className="p-6">
        <p className="text-sm text-[#64748B]">This event could not be found.</p>
        <Button className="mt-4" onClick={() => navigate("/dashboard/events")}>Back to events</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">{isEdit ? "Edit Event" : "Create Event"}</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {isEdit ? "Update your event and republish anytime" : "Fill in the details to publish your event"}
          </p>
        </div>
        {isEdit && existing.data?.is_published && (
          <a
            href={`/events/${form.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#4F46E5] font-medium hover:underline shrink-0"
          >
            View public page ↗
          </a>
        )}
      </div>

      {/* Step indicator */}
      <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5 mb-6">
        <div className="flex items-start gap-0 relative">
          <div className="absolute top-[13px] left-[13px] right-[13px] h-0.5 bg-[#E2E8F0] z-0" />
          <div
            className="absolute top-[13px] left-[13px] h-0.5 bg-[#4F46E5] z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / (stepLabels.length - 1)) * 100}%` }}
          />
          {stepLabels.map((label, i) => {
            const n = (i + 1) as Step;
            const active = step === n;
            const done = step > n;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(n)}
                className="flex-1 flex flex-col items-center gap-2 relative z-10"
              >
                <div
                  className={[
                    "size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    active
                      ? "bg-[#4F46E5] text-white ring-4 ring-[#EEF2FF]"
                      : done
                        ? "bg-[#22C55E] text-white"
                        : "bg-white border-2 border-[#E2E8F0] text-[#94A3B8]",
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
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h3 className="font-semibold text-[#0F172A] text-lg">Event Details</h3>

            <Input
              label="Event title"
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Lagos Tech Summit 2025"
            />

            {/* Banner */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#0F172A]">Banner image</p>
              <div className="flex items-center gap-4">
                <div className="w-40 h-24 rounded-[10px] bg-[#EEF2FF] border border-[#E2E8F0] overflow-hidden flex items-center justify-center shrink-0">
                  {bannerPreview ? (
                    <img loading="lazy" decoding="async" src={bannerPreview} alt="Event banner preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🖼️</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleBannerFile(file);
                      }}
                    />
                    <span className="px-4 py-2 rounded-[8px] border border-[#E2E8F0] text-sm font-medium text-[#475569] cursor-pointer hover:bg-[#F8FAFC]">
                      {uploading ? "Uploading…" : bannerPreview ? "Replace image" : "Upload image"}
                    </span>
                  </label>
                  <p className="text-xs text-[#94A3B8]">JPG or PNG, 1200×630 recommended</p>
                </div>
              </div>
            </div>

            <Textarea
              label="Event description"
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Tell attendees what to expect..."
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Organizer name"
                value={form.organizerName}
                onChange={(e) => set("organizerName", e.target.value)}
                placeholder="e.g. EventFlow Community"
              />
              <Select
                label="Category"
                value={form.category}
                onChange={(v) => set("category", v)}
                placeholder="Select a category"
                options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))}
              />
            </div>

            <Input
              label="Tags"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="ai, startups, lagos"
              hint="Comma separated — used for discovery and SEO"
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Start date" type="date" required value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
              <Input label="Start time" type="time" required value={form.eventTime} onChange={(e) => set("eventTime", e.target.value)} />
              <Input label="End date" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              <Input label="End time" type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Time zone"
                value={form.timezone}
                onChange={(v) => set("timezone", v)}
                options={Array.from(new Set([form.timezone, ...TIMEZONE_OPTIONS])).map((t) => ({ value: t, label: t }))}
              />
              <Select
                label="Recurring event"
                value={form.recurrenceRule}
                onChange={(v) => set("recurrenceRule", v)}
                options={RECURRENCE_OPTIONS}
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#0F172A]">Event type</p>
              <div className="flex gap-3">
                {(["physical", "online"] as EventType[]).map((t) => (
                  <label
                    key={t}
                    className={[
                      "flex items-center gap-2 px-4 py-2.5 rounded-[8px] border cursor-pointer transition-all text-sm",
                      form.eventType === t ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]" : "border-[#E2E8F0] text-[#475569]",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="eventType"
                      checked={form.eventType === t}
                      onChange={() => set("eventType", t)}
                      className="accent-[#4F46E5]"
                    />
                    {t === "physical" ? "📍 In-Person" : "💻 Online"}
                  </label>
                ))}
              </div>
            </div>

            <Input
              label={form.eventType === "online" ? "Online venue / platform" : "Venue address"}
              required={form.eventType === "physical"}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder={form.eventType === "online" ? "Zoom, Google Meet, YouTube Live…" : "123 Main St, Lagos"}
            />

            <Input
              label="Capacity"
              type="number"
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              placeholder="e.g. 500"
              hint="Leave empty for unlimited"
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h3 className="font-semibold text-[#0F172A] text-lg">Destination &amp; Visibility</h3>
            <p className="text-sm text-[#64748B]">
              After registering, attendees are redirected to the platform you choose below.
            </p>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#0F172A]">Redirect platform</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DESTINATION_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => set("destinationType", d.value)}
                    className={[
                      "flex items-center gap-2 px-3 py-2.5 rounded-[10px] border text-sm transition-all",
                      form.destinationType === d.value
                        ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] font-medium"
                        : "border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]",
                    ].join(" ")}
                  >
                    <span>{d.icon}</span>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Redirect URL"
              required
              value={form.destinationUrl}
              onChange={(e) => set("destinationUrl", e.target.value)}
              placeholder={destination.placeholder}
              hint={`Attendees land here right after registering for ${destination.label}`}
              leftIcon={<span className="text-sm">{destination.icon}</span>}
            />

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#0F172A]">Visibility</p>
              <div className="flex flex-col gap-2">
                {VISIBILITY_OPTIONS.map((v) => (
                  <label
                    key={v.value}
                    className={[
                      "flex items-start gap-3 p-3 rounded-[10px] border cursor-pointer transition-all",
                      form.visibility === v.value ? "border-[#4F46E5] bg-[#EEF2FF]" : "border-[#E2E8F0] hover:bg-[#F8FAFC]",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      checked={form.visibility === v.value}
                      onChange={() => set("visibility", v.value)}
                      className="accent-[#4F46E5] mt-0.5"
                    />
                    <span>
                      <span className={`block text-sm font-medium ${form.visibility === v.value ? "text-[#4F46E5]" : "text-[#0F172A]"}`}>
                        {v.label}
                      </span>
                      <span className="block text-xs text-[#94A3B8]">{v.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h3 className="font-semibold text-[#0F172A] text-lg">Review &amp; Publish</h3>

            <div className="flex flex-col gap-1.5">
              <Input
                label="Event URL"
                value={previewSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugifyTitle(e.target.value));
                }}
                hint={eventPublicUrl(previewSlug || "your-event")}
                leftIcon={<span className="text-xs">/events/</span>}
                className="pl-16"
              />
            </div>

            <div className="bg-[#EEF2FF] rounded-[12px] p-5 flex flex-col gap-3 text-sm">
              <p className="font-semibold text-[#4F46E5] mb-1">Event Summary</p>
              {[
                { label: "Title", val: form.title || "—" },
                { label: "Category", val: form.category || "—" },
                { label: "Date & Time", val: form.eventDate && form.eventTime ? `${form.eventDate} · ${form.eventTime} (${form.timezone})` : "—" },
                { label: "Type", val: form.eventType === "online" ? "Online" : "In-Person" },
                { label: "Venue", val: form.location || "—" },
                { label: "Recurring", val: RECURRENCE_OPTIONS.find((r) => r.value === form.recurrenceRule)?.label ?? "Does not repeat" },
                { label: "Visibility", val: VISIBILITY_OPTIONS.find((v) => v.value === form.visibility)!.label },
                { label: "Redirect", val: `${destination.label}${form.destinationUrl ? " · set" : " · missing"}` },
                { label: "Tags", val: parseTags(form.tags).join(", ") || "—" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between gap-4">
                  <span className="text-[#6366F1]">{r.label}</span>
                  <span className="font-medium text-[#0F172A] text-right line-clamp-1">{r.val}</span>
                </div>
              ))}
            </div>

            {isEdit && (
              <div className="flex items-center justify-between p-4 rounded-[12px] border border-[#FEE2E2] bg-[#FEF2F2]">
                <div>
                  <p className="text-sm font-medium text-[#B91C1C]">Delete this event</p>
                  <p className="text-xs text-[#EF4444]">This also removes all of its registrations.</p>
                </div>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Delete this event permanently?")) remove.mutate();
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-[#EF4444]">{error}</p>}
        {notice && !error && <p className="mt-4 text-sm text-[#16A34A]">{notice}</p>}

        <div className="flex flex-wrap gap-3 mt-6">
          {step > 1 && (
            <Button variant="outline" size="lg" onClick={() => setStep((s) => (s - 1) as Step)}>
              ← Back
            </Button>
          )}
          {step < 3 ? (
            <Button fullWidth size="lg" onClick={() => setStep((s) => (s + 1) as Step)}>
              Continue →
            </Button>
          ) : (
            <>
              <Button variant="outline" size="lg" disabled={busy} onClick={() => save.mutate(null)}>
                {save.isPending ? "Saving…" : "Save draft"}
              </Button>
              <Button fullWidth size="lg" disabled={busy} onClick={() => save.mutate(true)}>
                {existing.data?.is_published ? "Save & Update 🚀" : "Publish Event 🚀"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
