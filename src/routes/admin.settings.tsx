import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import {
  DEFAULT_SITE_SETTINGS,
  SOCIAL_KEYS,
  fetchSiteSettings,
  updateSiteSettings,
  type SiteSettings,
} from "@/lib/siteSettings";

function SiteSettingsPage() {
  const { isSuperAdmin, isLoading: accessLoading } = useAdminAccess();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["site-settings"], queryFn: fetchSiteSettings });
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateSiteSettings(form),
    onSuccess: () => {
      toast.success("Site settings saved");
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save settings"),
  });

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (accessLoading || isLoading) {
    return <div className="p-6 text-sm text-[#64748B]">Loading site settings…</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <EmptyState
          icon="🔒"
          headingLevel="h2"
          title="Super admin only"
          description="Only a super admin can change site branding and settings."
        />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">Site settings</h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Branding and contact details shown across the public website.
        </p>
      </div>

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <section className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-[#0F172A]">Brand</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Site name"
              value={form.site_name}
              onChange={(e) => set("site_name", e.target.value)}
              required
            />
            <Input
              label="Tagline"
              value={form.tagline ?? ""}
              onChange={(e) => set("tagline", e.target.value)}
            />
            <Input
              label="Logo image URL"
              placeholder="https://…/logo.png"
              value={form.logo_url ?? ""}
              onChange={(e) => set("logo_url", e.target.value)}
            />
            <Input
              label="Favicon URL"
              placeholder="https://…/favicon.ico"
              value={form.favicon_url ?? ""}
              onChange={(e) => set("favicon_url", e.target.value)}
            />
            <Input
              label="Social share image URL"
              placeholder="https://…/share.jpg (1200x630)"
              value={form.og_image_url ?? ""}
              onChange={(e) => set("og_image_url", e.target.value)}
            />
          </div>
          {form.logo_url ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#64748B]">Preview</span>
              <img
                src={form.logo_url}
                alt="Site logo preview"
                className="h-8 w-auto rounded-[6px] bg-[#F8FAFC] object-contain"
              />
            </div>
          ) : null}
        </section>

        <section className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-[#0F172A]">Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Support email"
              type="email"
              value={form.support_email ?? ""}
              onChange={(e) => set("support_email", e.target.value)}
            />
            <Input
              label="Support phone"
              value={form.support_phone ?? ""}
              onChange={(e) => set("support_phone", e.target.value)}
            />
          </div>
          <Textarea
            label="Footer text"
            rows={3}
            value={form.footer_text ?? ""}
            onChange={(e) => set("footer_text", e.target.value)}
          />
        </section>

        <section className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-[#0F172A]">Social profiles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SOCIAL_KEYS.map((key) => (
              <Input
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                placeholder="https://…"
                value={form.socials[key] ?? ""}
                onChange={(e) =>
                  set("socials", { ...form.socials, [key]: e.target.value })
                }
              />
            ))}
          </div>
        </section>

        <section className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Maintenance mode</h3>
            <p className="text-sm text-[#64748B] mt-1">
              Show a maintenance notice on the public site while you make changes.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#0F172A]">
            <input
              type="checkbox"
              className="size-4"
              checked={form.maintenance_mode}
              onChange={(e) => set("maintenance_mode", e.target.checked)}
            />
            Enabled
          </label>
        </section>

        <div className="flex gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => data && setForm(data)}>
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}

export const Route = createFileRoute("/admin/settings")({
  component: SiteSettingsPage,
});
