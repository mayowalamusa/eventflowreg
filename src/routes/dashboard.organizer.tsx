import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { validateImageFile } from "@/lib/imageUpload";
import {
  LOGO_BUCKET,
  SOCIAL_KEYS,
  parseSocials,
  resolveLogoUrl,
  slugifyHandle,
  type OrganizerSocials,
} from "@/lib/organizer";

type FormState = {
  display_name: string;
  handle: string;
  bio: string;
  website_url: string;
  contact_email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  logo_url: string;
  is_published: boolean;
  socials: OrganizerSocials;
};

const emptyForm: FormState = {
  display_name: "",
  handle: "",
  bio: "",
  website_url: "",
  contact_email: "",
  phone: "",
  country: "",
  state: "",
  city: "",
  logo_url: "",
  is_published: true,
  socials: {},
};

function OrganizerProfileSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "ok" | "error"; msg: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["organizer-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizer_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profile = profileQuery.data;

  useEffect(() => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name ?? "",
      handle: profile.handle ?? "",
      bio: profile.bio ?? "",
      website_url: profile.website_url ?? "",
      contact_email: profile.contact_email ?? "",
      phone: profile.phone ?? "",
      country: profile.country ?? "",
      state: profile.state ?? "",
      city: profile.city ?? "",
      logo_url: profile.logo_url ?? "",
      is_published: profile.is_published,
      socials: parseSocials(profile.socials),
    });
  }, [profile]);

  useEffect(() => {
    let active = true;
    void resolveLogoUrl(form.logo_url || null).then((url) => {
      if (active) setLogoPreview(url);
    });
    return () => {
      active = false;
    };
  }, [form.logo_url]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const handle = slugifyHandle(payload.handle || payload.display_name);
      if (!payload.display_name.trim()) throw new Error("Organization name is required.");
      if (!handle) throw new Error("Profile URL is required.");
      const { error } = await supabase.from("organizer_profiles").upsert(
        {
          user_id: user!.id,
          display_name: payload.display_name.trim(),
          handle,
          bio: payload.bio.trim() || null,
          website_url: payload.website_url.trim() || null,
          contact_email: payload.contact_email.trim() || null,
          phone: payload.phone.trim() || null,
          country: payload.country.trim() || null,
          state: payload.state.trim() || null,
          city: payload.city.trim() || null,
          logo_url: payload.logo_url || null,
          is_published: payload.is_published,
          socials: payload.socials,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      return handle;
    },
    onSuccess: (handle) => {
      setStatus({ type: "ok", msg: "Profile saved." });
      set("handle", handle);
      void queryClient.invalidateQueries({ queryKey: ["organizer-profile", user?.id] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Could not save profile.";
      setStatus({
        type: "error",
        msg: message.includes("duplicate") ? "That profile URL is already taken." : message,
      });
    },
  });

  const handleLogoChange = async (file: File | undefined) => {
    if (!file || !user) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setStatus({ type: "error", msg: validationError });
      return;
    }
    setUploading(true);
    setStatus(null);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, { upsert: true });
    setUploading(false);
    if (error) {
      setStatus({ type: "error", msg: error.message });
      return;
    }
    set("logo_url", path);
  };

  const publicUrl = form.handle ? `/organizers/${slugifyHandle(form.handle)}` : null;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Organizer Profile</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            This is the public page attendees see for your organization.
          </p>
        </div>
        {publicUrl && profile && (
          <a href={publicUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">View public page →</Button>
          </a>
        )}
      </div>

      {status && (
        <div
          className={[
            "mb-5 rounded-[10px] px-4 py-3 text-sm border",
            status.type === "ok"
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
              : "bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]",
          ].join(" ")}
        >
          {status.msg}
        </div>
      )}

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 flex flex-col gap-5">
        {/* Logo */}
        <div className="flex items-center gap-5">
          <div className="size-20 rounded-[14px] overflow-hidden bg-[#EEF2FF] flex items-center justify-center shrink-0">
            {logoPreview ? (
              <img src={logoPreview} alt="Organization logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">🏢</span>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleLogoChange(e.target.files?.[0])}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload Logo"}
            </Button>
            <p className="text-xs text-[#94A3B8] mt-1.5">JPG, PNG up to 5MB</p>
          </div>
        </div>

        <Input
          label="Organization name"
          value={form.display_name}
          onChange={(e) => set("display_name", e.target.value)}
          required
        />
        <Input
          label="Public profile URL"
          value={form.handle}
          onChange={(e) => set("handle", e.target.value)}
          hint={`/organizers/${slugifyHandle(form.handle || form.display_name) || "your-org"}`}
        />
        <Textarea
          label="Description"
          rows={4}
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder="Tell attendees who you are and what kind of events you host."
        />
        <Input
          label="Website"
          value={form.website_url}
          onChange={(e) => set("website_url", e.target.value)}
          placeholder="https://yourorg.com"
        />

        <div className="grid sm:grid-cols-2 gap-5">
          <Input
            label="Contact email"
            type="email"
            value={form.contact_email}
            onChange={(e) => set("contact_email", e.target.value)}
          />
          <Input label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <Input label="Country" value={form.country} onChange={(e) => set("country", e.target.value)} />
          <Input label="State / Region" value={form.state} onChange={(e) => set("state", e.target.value)} />
          <Input label="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>

        <div>
          <p className="text-sm font-medium text-[#0F172A] mb-3">Social links</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {SOCIAL_KEYS.map((s) => (
              <Input
                key={s.key}
                label={s.label}
                value={form.socials[s.key] ?? ""}
                placeholder={s.placeholder}
                onChange={(e) => set("socials", { ...form.socials, [s.key]: e.target.value })}
              />
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => set("is_published", e.target.checked)}
            className="size-4 accent-[#4F46E5]"
          />
          <span className="text-sm text-[#475569]">
            Publish this profile publicly{" "}
            <Badge variant={form.is_published ? "success" : "default"}>
              {form.is_published ? "Public" : "Hidden"}
            </Badge>
          </span>
        </label>

        <Button
          className="self-start"
          onClick={() => {
            setStatus(null);
            saveMutation.mutate(form);
          }}
          disabled={saveMutation.isPending || profileQuery.isLoading}
        >
          {saveMutation.isPending ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/organizer")({
  head: () => ({
    meta: [
      { title: "Organizer Profile — EventFlow" },
      { name: "description", content: "Edit your public organizer profile: logo, description, contact details and social links." },
      { property: "og:title", content: "Organizer Profile — EventFlow" },
      { property: "og:description", content: "Edit your public organizer profile on EventFlow." },
    ],
  }),
  component: OrganizerProfileSettings,
});
