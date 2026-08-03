interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  accent?: string;
}

export default function StatCard({ label, value, trend, trendUp, icon, accent = "#4F46E5" }: StatCardProps) {
  return (
    <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#64748B]">{label}</span>
        <span
          className="size-9 rounded-[10px] flex items-center justify-center text-white text-base"
          style={{ backgroundColor: accent }}
        >
          {icon}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-[#0F172A] leading-none">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trendUp ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FEF2F2] text-[#DC2626]"
            }`}
          >
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
