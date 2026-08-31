import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useInvalidateProfile } from "@/hooks/useProfile";
import { profileSchema, saveProfile } from "@/lib/profile";

const tabs = ["Profile", "Security", "Notifications", "Billing"];

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function AccountSettingsPage() {
  const [tab, setTab] = useState("Profile");
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const invalidateProfile = useInvalidateProfile();

  const [fullName, setFullName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "ok" | "error"; msg: string } | null>(null);

  // Sync form state once the real profile has loaded. Falling back to the
  // Auth signup-time name keeps the field non-empty for a brand-new user who
  // hasn't saved a profile yet, without inventing placeholder data.
  useEffect(() => {
    if (profileLoading) return;
    setFullName(
      profile?.full_name ?? (user?.user_metadata?.["full_name"] as string | undefined) ?? "",
    );
  }, [profile, profileLoading, user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = profileSchema.safeParse({ full_name: fullName });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Please check your details.");
      }
      await saveProfile(user!.id, parsed.data);
    },
    onSuccess: () => {
      setFieldError(null);
      setStatus({ type: "ok", msg: "Profile saved." });
      void invalidateProfile();
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Could not save your profile. Please try again.";
      setFieldError(message);
      setStatus({ type: "error", msg: message });
    },
  });

  const avatarUrl = profile?.avatar_url;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0F172A]">Account Settings</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Manage your profile and preferences</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-[#F1F5F9] rounded-[10px] p-1 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "px-4 py-1.5 rounded-[8px] text-sm font-medium transition-all whitespace-nowrap",
              tab === t
                ? "bg-white text-[#0F172A] shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
        {tab === "Profile" && (
          <div className="flex flex-col gap-5">
            {status && (
              <div
                className={[
                  "rounded-[10px] px-4 py-3 text-sm border",
                  status.type === "ok"
                    ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
                    : "bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]",
                ].join(" ")}
              >
                {status.msg}
              </div>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || "Avatar"}
                  className="size-20 rounded-full object-cover"
                />
              ) : (
                <div className="size-20 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xl font-bold flex items-center justify-center shrink-0">
                  {initials(fullName || user?.email || "?")}
                </div>
              )}
              <div>
                <Button variant="outline" size="sm" disabled title="Avatar uploads are coming soon">
                  Change Photo
                </Button>
                <p className="text-xs text-[#94A3B8] mt-1.5">Avatar uploads are coming soon.</p>
              </div>
            </div>

            <Input
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={fieldError ?? undefined}
              disabled={profileLoading || saveMutation.isPending}
              required
            />
            <Input
              label="Email address"
              type="email"
              value={user?.email ?? ""}
              disabled
              hint="This is your sign-in email, managed by your account, not your profile."
            />

            <p className="text-xs text-[#64748B] -mt-2">
              Looking for organization name, bio, phone, or logo? Manage those on your{" "}
              <a href="/dashboard/organizer" className="text-[#4F46E5] font-medium hover:underline">
                Organizer Profile
              </a>{" "}
              page.
            </p>

            <Button
              className="self-start"
              onClick={() => {
                setStatus(null);
                saveMutation.mutate();
              }}
              disabled={profileLoading || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}

        {tab === "Security" && (
          <div className="flex flex-col gap-5">
            <Input label="Current password" type="password" placeholder="••••••••" />
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              hint="At least 8 characters"
            />
            <Input label="Confirm new password" type="password" placeholder="••••••••" />
            <Button className="self-start">Update Password</Button>
          </div>
        )}

        {tab === "Notifications" && (
          <div className="flex flex-col gap-4">
            {[
              {
                label: "New registrations",
                desc: "Get notified when someone registers for your event",
              },
              { label: "Event reminders", desc: "Receive reminders 24 hours before your event" },
              { label: "Weekly summary", desc: "Weekly digest of your event performance" },
              { label: "Product updates", desc: "New features and improvements to EventFlow" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{item.label}</p>
                  <p className="text-xs text-[#94A3B8]">{item.desc}</p>
                </div>
                <button className="w-11 h-6 rounded-full bg-[#4F46E5] relative">
                  <span className="absolute top-0.5 left-5 size-5 rounded-full bg-white shadow" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "Billing" && (
          <div className="flex flex-col gap-5">
            <div className="bg-[#EEF2FF] rounded-[12px] p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-[#4F46E5]">Free Plan</p>
                <Button size="sm">Upgrade to Pro</Button>
              </div>
              <p className="text-sm text-[#6366F1]">Up to 5 events · 500 registrations per month</p>
            </div>
            <div className="bg-[#F8FAFC] rounded-[12px] p-4">
              <p className="text-sm font-medium text-[#0F172A] mb-1">Payment Method</p>
              <p className="text-sm text-[#64748B]">No payment method added</p>
              <Button variant="outline" size="sm" className="mt-3">
                Add Payment Method
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Account settings — EventFlow" },
      { name: "description", content: "Update your EventFlow profile, password and preferences." },
      { property: "og:title", content: "Account settings — EventFlow" },
      {
        property: "og:description",
        content: "Update your EventFlow profile, password and preferences.",
      },
    ],
  }),
  component: AccountSettingsPage,
});
