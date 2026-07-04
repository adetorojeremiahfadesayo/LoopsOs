import { BrainCircuit, Database, Sparkles, Trash2 } from "lucide-react";

type LifecycleStage = "remember" | "recall" | "improve" | "forget";

const stages: Array<{
  id: LifecycleStage;
  label: string;
  body: string;
  icon: typeof Database;
}> = [
  {
    id: "remember",
    label: "Remember",
    body: "Store loop files",
    icon: Database
  },
  {
    id: "recall",
    label: "Recall",
    body: "Pull context",
    icon: BrainCircuit
  },
  {
    id: "improve",
    label: "Improve",
    body: "Update the plan",
    icon: Sparkles
  },
  {
    id: "forget",
    label: "Forget",
    body: "Remove stale memory",
    icon: Trash2
  }
];

export function CogneeLifecycleStrip({
  current,
  completed = []
}: {
  current: LifecycleStage;
  completed?: LifecycleStage[];
}) {
  return (
    <section className="rounded-2xl border border-[#DDE5E1] bg-white/90 p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const active = stage.id === current;
          const done = completed.includes(stage.id);
          return (
            <div
              aria-current={active ? "step" : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-left transition ${
                active
                  ? "border-[#10B981] bg-[#E7F8EF] text-[#064E3B]"
                  : done
                    ? "border-[#BFE9D6] bg-[#F7FAF8] text-[#047857]"
                    : "border-[#E2E8F0] bg-white text-[#64748B]"
              }`}
              key={stage.id}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.12em]">
                  {stage.label}
                </span>
                <span className="block text-xs leading-4">{stage.body}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
