type BadgeVariant = "default" | "success" | "warning" | "error" | "primary" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[#F1F5F9] text-[#475569]",
  primary: "bg-[#EEF2FF] text-[#4F46E5]",
  success: "bg-[#F0FDF4] text-[#16A34A]",
  warning: "bg-[#FFFBEB] text-[#B45309]",
  error: "bg-[#FEF2F2] text-[#DC2626]",
  muted: "bg-[#F8FAFC] text-[#94A3B8]",
};

export default function Badge({ children, variant = "default", size = "sm", className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "text-xs px-2.5 py-0.5" : "text-sm px-3 py-1",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
