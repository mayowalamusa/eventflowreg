import { type ReactNode, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm",
  secondary: "bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5]",
  outline: "border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC]",
  ghost: "hover:bg-[#F1F5F9] text-[#475569]",
  danger: "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-base px-6 py-3 gap-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  fullWidth = false,
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-medium rounded-[8px] transition-all duration-150 cursor-pointer select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading && (
        <svg aria-hidden="true" className="animate-spin -ml-0.5 size-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
