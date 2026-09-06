import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  headingLevel?: "h2" | "h3";
}

export function EmptyState({ icon = "📭", title, description, action, className = "", headingLevel = "h3" }: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <div className={`text-center py-16 px-6 ef-fade-in ${className}`}>
      <div className="text-5xl mb-4" aria-hidden="true">
        {icon}
      </div>
      <Heading className="text-lg font-semibold text-[#0F172A] mb-1.5">{title}</Heading>
      {description && <p className="text-[#64748B] text-sm max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export default EmptyState;
