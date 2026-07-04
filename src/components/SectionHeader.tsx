import type { ReactNode } from "react";

export function SectionHeader({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-[#111827]">{title}</h2>
        {body ? <p className="mt-1 text-sm leading-6 text-[#64748B]">{body}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
