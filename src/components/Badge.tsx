import type { ReactNode } from "react";

type BadgeTone = "slate" | "teal" | "amber" | "red" | "green";

const toneClasses: Record<BadgeTone, string> = {
  slate: "border-[#DDE5E1] bg-[#F6F8F7] text-[#64748B]",
  teal: "border-[#BFE9D6] bg-[#E7F8EF] text-[#047857]",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-rose-200 bg-rose-50 text-rose-800",
  green: "border-[#BFE9D6] bg-[#E7F8EF] text-[#047857]"
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
