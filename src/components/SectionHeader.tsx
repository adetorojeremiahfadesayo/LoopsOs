import type { ReactNode } from "react";

export function SectionHeader({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
        {body ? <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
