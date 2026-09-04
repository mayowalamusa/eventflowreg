import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTagSuggestions } from "@/lib/events";

interface TagInputProps {
  label?: string;
  hint?: string;
  value: string; // comma-separated, matching the rest of the form's shape
  onChange: (value: string) => void;
}

export default function TagInput({ label, hint, value, onChange }: TagInputProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestionsQuery = useQuery({
    queryKey: ["tag-suggestions"],
    queryFn: fetchTagSuggestions,
    staleTime: 5 * 60 * 1000, // suggestions don't need to be second-fresh
  });

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const existingTags = value
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  // What the user is currently typing — the fragment after the last comma.
  const currentFragment = value.split(",").pop()?.trim().toLowerCase() ?? "";

  const suggestions = (suggestionsQuery.data ?? [])
    .filter((tag) => !existingTags.includes(tag))
    .filter((tag) => (currentFragment ? tag.includes(currentFragment) : true))
    .slice(0, 8);

  function addTag(tag: string) {
    const base = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, -1); // drop the in-progress fragment being replaced
    const next = [...base, tag].join(", ") + ", ";
    onChange(next);
    inputRef.current?.focus();
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <label className="block text-sm font-medium text-[#334155] mb-1.5">{label}</label>}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="ai, startups, lagos"
        className="w-full rounded-[10px] border border-[#E2E8F0] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
      />
      {hint && <p className="text-xs text-[#94A3B8] mt-1.5">{hint}</p>}

      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#E2E8F0] rounded-[10px] shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // keep focus in the input across the click
              onClick={() => addTag(tag)}
              className="w-full text-left px-3.5 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC]"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
