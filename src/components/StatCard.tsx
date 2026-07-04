import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="loop-card rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">{label}</p>
        <span className="rounded-lg bg-[#E7F8EF] p-2 text-[#047857]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="font-display mt-4 text-3xl font-bold tracking-tight text-[#111827]">{value}</p>
      <p className="mt-1 text-sm text-[#64748B]">{detail}</p>
    </div>
  );
}
