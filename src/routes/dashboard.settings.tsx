import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const tabs = ["Profile", "Security", "Notifications", "Billing"];

function AccountSettingsPage() {
  const [tab, setTab] = useState("Profile");
  const [form, setForm] = useState({
    name: "Amara Okafor",
    email: "amara@gmail.com",
    bio: "Community manager and event organiser based in Lagos. Passionate about connecting people through meaningful experiences.",
    phone: "+234 810 000 0000",
    org: "TechHub Lagos",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
              tab === t ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6">
        {tab === "Profile" && (
          <div className="flex flex-col gap-5">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <img
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=128&h=128&fit=crop&auto=format"
                alt="Avatar"
                className="size-20 rounded-full object-cover"
              />
              <div>
                <Button variant="outline" size="sm">Change Photo</Button>
                <p className="text-xs text-[#94A3B8] mt-1.5">JPG, PNG up to 5MB</p>
              </div>
            </div>
            <Input label="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            <Input label="Email address" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            <Input label="Phone number" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            <Input label="Organisation" value={form.org} onChange={(e) => set("org", e.target.value)} />
            <Textarea label="Bio" rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
            <Button className="self-start">Save Changes</Button>
          </div>
        )}

        {tab === "Security" && (
          <div className="flex flex-col gap-5">
            <Input label="Current password" type="password" placeholder="••••••••" />
            <Input label="New password" type="password" placeholder="••••••••" hint="At least 8 characters" />
            <Input label="Confirm new password" type="password" placeholder="••••••••" />
            <Button className="self-start">Update Password</Button>
          </div>
        )}

        {tab === "Notifications" && (
          <div className="flex flex-col gap-4">
            {[
              { label: "New registrations", desc: "Get notified when someone registers for your event" },
              { label: "Event reminders", desc: "Receive reminders 24 hours before your event" },
              { label: "Weekly summary", desc: "Weekly digest of your event performance" },
              { label: "Product updates", desc: "New features and improvements to EventFlow" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
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
              <Button variant="outline" size="sm" className="mt-3">Add Payment Method</Button>
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
      { property: "og:description", content: "Update your EventFlow profile, password and preferences." },
    ],
  }),
  component: AccountSettingsPage,
});
