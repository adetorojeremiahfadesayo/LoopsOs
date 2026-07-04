import type { LucideIcon } from "lucide-react";
import { BrainCircuit, Database, Sparkles, Trash2 } from "lucide-react";

type ActionTone = "green" | "teal" | "amber" | "red";

export interface CogneeActionState {
  actionLabel?: string;
  count?: string;
  description?: string;
  disabled?: boolean;
  onAction?: () => void;
  state: string;
}

export interface CogneeActionRailProps {
  forget?: CogneeActionState;
  improve?: CogneeActionState;
  recall?: CogneeActionState;
  remember?: CogneeActionState;
}

const actionMeta: Record<
  keyof CogneeActionRailProps,
  {
    icon: LucideIcon;
    label: string;
    tone: ActionTone;
  }
> = {
  remember: {
    icon: Database,
    label: "Remember",
    tone: "green"
  },
  recall: {
    icon: BrainCircuit,
    label: "Recall",
    tone: "teal"
  },
  improve: {
    icon: Sparkles,
    label: "Improve",
    tone: "amber"
  },
  forget: {
    icon: Trash2,
    label: "Forget",
    tone: "red"
  }
};

const toneClasses: Record<
  ActionTone,
  {
    button: string;
    icon: string;
    panel: string;
    state: string;
  }
> = {
  green: {
    button: "border-[#B8F3D5] bg-[#ECFDF5] text-[#047857] hover:border-[#10B981]",
    icon: "bg-[#E7F8EF] text-[#047857]",
    panel: "border-[#BFE9D6] bg-white",
    state: "text-[#047857]"
  },
  teal: {
    button: "border-cyan-200 bg-cyan-50 text-cyan-800 hover:border-cyan-300",
    icon: "bg-cyan-50 text-cyan-700",
    panel: "border-cyan-100 bg-white",
    state: "text-cyan-700"
  },
  amber: {
    button: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300",
    icon: "bg-amber-50 text-amber-700",
    panel: "border-amber-100 bg-white",
    state: "text-amber-700"
  },
  red: {
    button:
      "border-rose-700 bg-rose-600 font-extrabold uppercase tracking-[0.08em] text-white shadow-sm hover:bg-rose-700 disabled:border-rose-200 disabled:bg-rose-100 disabled:text-rose-300 disabled:shadow-none",
    icon: "bg-rose-600 text-white",
    panel: "border-rose-300 bg-white",
    state: "text-rose-700"
  }
};

export function CogneeActionRail({ forget, improve, recall, remember }: CogneeActionRailProps) {
  const items: Array<[keyof CogneeActionRailProps, CogneeActionState]> = [
    ["remember", remember],
    ["recall", recall],
    ["improve", improve],
    ["forget", forget]
  ].filter((item): item is [keyof CogneeActionRailProps, CogneeActionState] => Boolean(item[1]));

  return (
    <section className="loop-card rounded-2xl p-4">
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {items.map(([key, item]) => {
          const meta = actionMeta[key];
          const tone = toneClasses[meta.tone];
          const Icon = meta.icon;
          return (
            <article className={`rounded-xl border p-4 ${tone.panel}`} key={key}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold text-[#111827]">{meta.label}</h3>
                    <p className={`font-mono text-[11px] font-semibold uppercase tracking-[0.12em] ${tone.state}`}>
                      {item.state}
                    </p>
                  </div>
                </div>
                {item.count ? (
                  <span className="shrink-0 rounded-md border border-[#DDE5E1] bg-[#F6F8F7] px-2 py-1 font-mono text-[11px] font-semibold text-[#64748B]">
                    {item.count}
                  </span>
                ) : null}
              </div>

              {item.actionLabel ? (
                <>
                  <button
                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${tone.button}`}
                    disabled={item.disabled}
                    onClick={item.onAction}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {item.actionLabel}
                  </button>
                  {item.description ? (
                    <p className="mt-2 text-center text-xs leading-5 text-[#64748B]">{item.description}</p>
                  ) : null}
                </>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
