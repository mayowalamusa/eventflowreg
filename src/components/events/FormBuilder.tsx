import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/lib/nav";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FieldType = Database["public"]["Enums"]["field_type"];

const FIELD_TYPES: { value: FieldType; label: string; icon: string; hasOptions: boolean }[] = [
  { value: "short_text", label: "Text", icon: "🔤", hasOptions: false },
  { value: "long_text", label: "Textarea", icon: "📝", hasOptions: false },
  { value: "dropdown", label: "Dropdown", icon: "🔽", hasOptions: true },
  { value: "checkbox", label: "Checkbox", icon: "☑️", hasOptions: true },
  { value: "radio", label: "Radio", icon: "🔘", hasOptions: true },
  { value: "phone", label: "Phone", icon: "📞", hasOptions: false },
  { value: "email", label: "Email", icon: "✉️", hasOptions: false },
  { value: "date", label: "Date", icon: "📅", hasOptions: false },
];

function typeMeta(t: FieldType) {
  return FIELD_TYPES.find((f) => f.value === t) ?? FIELD_TYPES[0];
}

type DraftField = {
  key: string;
  id: string | null;
  label: string;
  field_type: FieldType;
  options: string[];
  is_required: boolean;
  placeholder: string;
  help_text: string;
};

const newKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

function blankField(type: FieldType = "short_text"): DraftField {
  return {
    key: newKey(),
    id: null,
    label: "",
    field_type: type,
    options: typeMeta(type).hasOptions ? ["Option 1", "Option 2"] : [],
    is_required: false,
    placeholder: "",
    help_text: "",
  };
}

export default function FormBuilder({ eventId }: { eventId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<DraftField[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["registration-form", eventId],
    queryFn: async () => {
      const { data: event, error: eventErr } = await supabase
        .from("events")
        .select("id, title, slug, is_published")
        .eq("id", eventId)
        .maybeSingle();
      if (eventErr) throw eventErr;

      const { data: forms, error: formErr } = await supabase
        .from("registration_forms")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (formErr) throw formErr;

      let form = forms?.[0] ?? null;
      if (!form) {
        const { data: created, error: createErr } = await supabase
          .from("registration_forms")
          .insert({ event_id: eventId })
          .select("*")
          .single();
        if (createErr) throw createErr;
        form = created;
      }

      const { data: rows, error: fieldsErr } = await supabase
        .from("event_fields")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (fieldsErr) throw fieldsErr;

      return { event, form, rows: rows ?? [] };
    },
  });

  useEffect(() => {
    if (!data) return;
    setFields(
      data.rows.map((r) => ({
        key: r.id,
        id: r.id,
        label: r.label,
        field_type: r.field_type,
        options: Array.isArray(r.options) ? (r.options as unknown[]).map(String) : [],
        is_required: r.is_required,
        placeholder: r.placeholder ?? "",
        help_text: r.help_text ?? "",
      })),
    );
    setRemovedIds([]);
  }, [data]);

  const update = (key: string, patch: Partial<DraftField>) =>
    setFields((list) => list.map((f) => (f.key === key ? { ...f, ...patch } : f)));

  function addField(type: FieldType) {
    const field = blankField(type);
    setFields((list) => [...list, field]);
    setOpenKey(field.key);
    setNotice(null);
  }

  function removeField(key: string) {
    setFields((list) => {
      const target = list.find((f) => f.key === key);
      if (target?.id) setRemovedIds((ids) => [...ids, target.id!]);
      return list.filter((f) => f.key !== key);
    });
  }

  function move(key: string, dir: -1 | 1) {
    setFields((list) => {
      const i = list.findIndex((f) => f.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const copy = [...list];
      const [item] = copy.splice(i, 1);
      copy.splice(j, 0, item);
      return copy;
    });
  }

  const save = useMutation({
    mutationFn: async () => {
      const formId = data?.form?.id ?? null;
      if (removedIds.length) {
        const { error: delErr } = await supabase.from("event_fields").delete().in("id", removedIds);
        if (delErr) throw delErr;
      }

      const payload = fields.map((f, index) => ({
        ...(f.id ? { id: f.id } : {}),
        event_id: eventId,
        form_id: formId,
        label: f.label.trim(),
        field_type: f.field_type,
        options: typeMeta(f.field_type).hasOptions ? f.options.filter((o) => o.trim()) : [],
        is_required: f.is_required,
        placeholder: f.placeholder.trim() || null,
        help_text: f.help_text.trim() || null,
        sort_order: index,
      }));

      if (payload.length) {
        const { error: upsertErr } = await supabase.from("event_fields").upsert(payload).select("id");
        if (upsertErr) throw upsertErr;
      }
    },
    onSuccess: () => {
      setError(null);
      setNotice("Registration form saved.");
      void queryClient.invalidateQueries({ queryKey: ["registration-form", eventId] });
      setTimeout(() => setNotice(null), 2500);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Could not save the form."),
  });

  function handleSave() {
    if (fields.some((f) => !f.label.trim())) {
      setError("Every custom field needs a label.");
      return;
    }
    const missingOptions = fields.some(
      (f) => typeMeta(f.field_type).hasOptions && f.options.filter((o) => o.trim()).length === 0,
    );
    if (missingOptions) {
      setError("Dropdown, radio and checkbox fields need at least one option.");
      return;
    }
    setError(null);
    save.mutate();
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-[#64748B]">Loading form builder…</div>;
  }

  return (
    <div className="p-6 flex flex-col gap-5 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            onClick={() => navigate("/dashboard/events")}
            className="text-xs text-[#64748B] hover:text-[#0F172A] mb-1"
          >
            ← Back to events
          </button>
          <h2 className="text-2xl font-bold text-[#0F172A]">Registration Form</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {data?.event?.title ? `Custom fields for “${data.event.title}”` : "Build the fields attendees fill in"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/dashboard/events/${eventId}/edit`)}>
            Event settings
          </Button>
          <Button onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save form"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#15803D]">
          {notice}
        </div>
      )}

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5">
        <p className="text-sm font-semibold text-[#0F172A]">Default fields</p>
        <p className="text-xs text-[#94A3B8] mt-0.5 mb-3">Always collected — these cannot be removed.</p>
        <div className="flex flex-wrap gap-2">
          {["Full Name", "Email", "Phone Number"].map((f) => (
            <Badge key={f} variant="muted">
              {f}
            </Badge>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">Custom fields</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {fields.length} field{fields.length === 1 ? "" : "s"} · drag-free reordering with the arrows
            </p>
          </div>
        </div>

        {fields.length === 0 && (
          <div className="text-center py-10 border border-dashed border-[#E2E8F0] rounded-[12px]">
            <div className="text-3xl mb-2">🧩</div>
            <p className="text-sm text-[#64748B]">No custom fields yet — add one below.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const meta = typeMeta(field.field_type);
            const open = openKey === field.key;
            return (
              <div key={field.key} className="border border-[#E2E8F0] rounded-[12px] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-[#F8FAFC]">
                  <div className="flex flex-col">
                    <button
                      onClick={() => move(field.key, -1)}
                      disabled={index === 0}
                      aria-label="Move field up"
                      className="text-xs text-[#64748B] hover:text-[#0F172A] disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => move(field.key, 1)}
                      disabled={index === fields.length - 1}
                      aria-label="Move field down"
                      className="text-xs text-[#64748B] hover:text-[#0F172A] disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  <span className="text-base">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {field.label || "Untitled field"}
                      {field.is_required && <span className="text-[#EF4444] ml-0.5">*</span>}
                    </p>
                    <p className="text-xs text-[#94A3B8]">{meta.label}</p>
                  </div>
                  <button
                    onClick={() => setOpenKey(open ? null : field.key)}
                    className="text-xs text-[#4F46E5] font-medium hover:underline"
                  >
                    {open ? "Done" : "Edit"}
                  </button>
                  <button
                    onClick={() => removeField(field.key)}
                    className="text-xs text-[#EF4444] hover:underline"
                  >
                    Delete
                  </button>
                </div>

                {open && (
                  <div className="p-4 flex flex-col gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Field label"
                        required
                        value={field.label}
                        onChange={(e) => update(field.key, { label: e.target.value })}
                        placeholder="e.g. Company name"
                      />
                      <Select
                        label="Field type"
                        value={field.field_type}
                        onChange={(e) => {
                          const next = e.target.value as FieldType;
                          update(field.key, {
                            field_type: next,
                            options:
                              typeMeta(next).hasOptions && field.options.length === 0
                                ? ["Option 1", "Option 2"]
                                : field.options,
                          });
                        }}
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Placeholder"
                        value={field.placeholder}
                        onChange={(e) => update(field.key, { placeholder: e.target.value })}
                        hint="Optional"
                      />
                      <Input
                        label="Help text"
                        value={field.help_text}
                        onChange={(e) => update(field.key, { help_text: e.target.value })}
                        hint="Optional"
                      />
                    </div>

                    {meta.hasOptions && (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-[#0F172A]">Options</p>
                        {field.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              className="flex-1"
                              value={opt}
                              onChange={(e) =>
                                update(field.key, {
                                  options: field.options.map((o, oi) => (oi === i ? e.target.value : o)),
                                })
                              }
                              placeholder={`Option ${i + 1}`}
                            />
                            <button
                              onClick={() =>
                                update(field.key, { options: field.options.filter((_, oi) => oi !== i) })
                              }
                              aria-label="Remove option"
                              className="text-xs text-[#EF4444] hover:underline px-2"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            update(field.key, {
                              options: [...field.options, `Option ${field.options.length + 1}`],
                            })
                          }
                          className="self-start text-xs text-[#4F46E5] font-medium hover:underline"
                        >
                          + Add option
                        </button>
                      </div>
                    )}

                    <label className="flex items-center gap-2.5 text-sm text-[#0F172A]">
                      <input
                        type="checkbox"
                        checked={field.is_required}
                        onChange={(e) => update(field.key, { is_required: e.target.checked })}
                        className="accent-[#4F46E5] size-4"
                      />
                      Required field
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <p className="text-xs font-semibold text-[#0F172A] mb-2">Add a field</p>
          <div className="flex flex-wrap gap-2">
            {FIELD_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => addField(t.value)}
                className="flex items-center gap-1.5 text-xs font-medium text-[#0F172A] bg-white border border-[#E2E8F0] rounded-[8px] px-3 py-2 hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors"
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5">
        <p className="text-sm font-semibold text-[#0F172A] mb-3">Live preview</p>
        <div className="flex flex-col gap-4">
          <Input label="Full Name" required placeholder="Jane Doe" readOnly />
          <Input label="Email" type="email" required placeholder="jane@example.com" readOnly />
          <Input label="Phone Number" type="tel" placeholder="+234 800 000 0000" readOnly />
          {fields.map((f) => (
            <PreviewField key={f.key} field={f} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewField({ field }: { field: DraftField }) {
  const label = field.label || "Untitled field";
  const options = field.options.filter((o) => o.trim());

  if (field.field_type === "long_text") {
    return (
      <Textarea
        label={label}
        required={field.is_required}
        hint={field.help_text || undefined}
        placeholder={field.placeholder}
        rows={3}
        readOnly
      />
    );
  }
  if (field.field_type === "dropdown") {
    return (
      <Select label={label} required={field.is_required} hint={field.help_text || undefined} disabled>
        <option>{field.placeholder || "Select an option"}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </Select>
    );
  }
  if (field.field_type === "radio" || field.field_type === "checkbox") {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#0F172A]">
          {label}
          {field.is_required && <span className="text-[#EF4444] ml-0.5">*</span>}
        </label>
        <div className="flex flex-col gap-1.5">
          {options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-[#475569]">
              <input
                type={field.field_type === "radio" ? "radio" : "checkbox"}
                name={field.key}
                disabled
                className="accent-[#4F46E5]"
              />
              {o}
            </label>
          ))}
        </div>
        {field.help_text && <p className="text-xs text-[#94A3B8]">{field.help_text}</p>}
      </div>
    );
  }

  const inputType =
    field.field_type === "email"
      ? "email"
      : field.field_type === "phone"
        ? "tel"
        : field.field_type === "date"
          ? "date"
          : "text";

  return (
    <Input
      label={label}
      type={inputType}
      required={field.is_required}
      hint={field.help_text || undefined}
      placeholder={field.placeholder}
      readOnly
    />
  );
}
