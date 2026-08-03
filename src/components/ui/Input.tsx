import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[#0F172A]">
            {label}
            {props.required && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{leftIcon}</span>
          )}
          <input
            ref={ref}
            {...props}
            className={[
              "w-full bg-white border rounded-[8px] text-sm text-[#0F172A] placeholder-[#94A3B8]",
              "transition-all duration-150 outline-none",
              "focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10",
              error ? "border-[#EF4444]" : "border-[#E2E8F0]",
              leftIcon ? "pl-9" : "pl-3",
              rightIcon ? "pr-9" : "pr-3",
              "py-2.5",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{rightIcon}</span>
          )}
        </div>
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#94A3B8]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[#0F172A]">
            {label}
            {props.required && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          {...props}
          className={[
            "w-full bg-white border rounded-[8px] text-sm text-[#0F172A] placeholder-[#94A3B8] resize-none",
            "px-3 py-2.5 transition-all duration-150 outline-none",
            "focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10",
            error ? "border-[#EF4444]" : "border-[#E2E8F0]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#94A3B8]">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function Select({ label, error, options, value, onChange, placeholder, required }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#0F172A]">
          {label}
          {required && <span className="text-[#EF4444] ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={[
          "w-full bg-white border rounded-[8px] text-sm text-[#0F172A] px-3 py-2.5",
          "transition-all duration-150 outline-none appearance-none cursor-pointer",
          "focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10",
          error ? "border-[#EF4444]" : "border-[#E2E8F0]",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
