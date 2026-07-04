import { ArrowRight, BrainCircuit, CheckCircle2, CopyPlus, FileText, FolderOpen, Sparkles } from "lucide-react";
import type { AppState, Workspace } from "../domain/types";
import { Badge } from "../components/Badge";
import { CogneeLifecycleStrip } from "../components/CogneeLifecycleStrip";

const workflowSteps = [
  { label: "Pick", body: "Choose a loop pattern" },
  { label: "Edit", body: "Tune the markdown files" },
  { label: "Recall", body: "Attach Cognee memory" },
  { label: "Run", body: "Ship the agent handoff" }
];

export function Templates({
  state,
  workspace,
  onDuplicate
}: {
  state: AppState;
  workspace: Workspace;
  onDuplicate: (templateId: string) => void;
}) {
  const templates = state.loops.filter((loop) => loop.isTemplate && loop.workspaceId === null);

  return (
    <div className="space-y-7">
      <section className="loop-card-bright rounded-2xl p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#047857]">
              Template library
            </p>
            <h2 className="font-display mt-3 max-w-3xl text-4xl font-bold tracking-tight text-[#111827]">
              Choose the loop your agent should follow.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
              {workspace.name} starts from a reusable industry pattern, then opens the generated files in Workspace.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#BFE9D6] bg-white px-4 py-3 text-sm font-semibold text-[#047857] shadow-sm">
            <BrainCircuit className="h-4 w-4" />
            {templates.length} loop patterns
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {workflowSteps.map((step, index) => (
            <div className="rounded-xl border border-[#DDE5E1] bg-white p-4" key={step.label}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-semibold text-[#047857]">0{index + 1}</span>
                {index < workflowSteps.length - 1 ? <ArrowRight className="h-4 w-4 text-[#94A3B8]" /> : <CheckCircle2 className="h-4 w-4 text-[#10B981]" />}
              </div>
              <p className="mt-3 font-display text-base font-bold text-[#111827]">{step.label}</p>
              <p className="mt-1 text-sm text-[#64748B]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <CogneeLifecycleStrip current="remember" />

      <div className="grid gap-5 xl:grid-cols-2">
        {templates.map((template, index) => {
          const visibleFiles = template.loopFiles.filter((file) =>
            ["LOOP.md", "MODEL.md", "SOUL.md", "MEMORY.md", "HANDOFF.md"].includes(file.name)
          );
          const hiddenFileCount = template.loopFiles.length - visibleFiles.length;
          const templateArea = template.tags[0] ?? "agent loop";

          return (
            <article
              className={`loop-card rounded-2xl p-5 ${index === 0 ? "border-[#10B981]/45 ring-4 ring-[#10B981]/10" : ""}`}
              key={template.id}
            >
              <div className="flex h-full flex-col gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={index === 0 ? "green" : "slate"}>{templateArea}</Badge>
                      <Badge tone="teal">{template.loopFiles.length} files</Badge>
                    </div>
                    <h3 className="font-display mt-3 text-2xl font-bold tracking-tight text-[#111827]">
                      {template.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#64748B]">{template.summary}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-xl border border-[#DDE5E1] bg-[#F7FAF8] p-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#047857]" />
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                        Agent goal
                      </p>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#111827]">{template.goal}</p>
                  </div>

                  <div className="rounded-xl border border-[#DDE5E1] bg-white p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#047857]" />
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                        First checks
                      </p>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm leading-5 text-[#64748B]">
                      {template.validationChecks.slice(0, 2).map((check) => (
                        <li className="flex gap-2" key={check}>
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]" />
                          <span>{check}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#DDE5E1] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-[#047857]" />
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                        Generated workspace
                      </p>
                    </div>
                    <p className="text-xs font-medium text-[#64748B]">Opens as editable Markdown</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {visibleFiles.map((file) => (
                      <span
                        className="inline-flex items-center gap-2 rounded-lg border border-[#DDE5E1] bg-[#F7FAF8] px-3 py-2 font-mono text-xs font-semibold text-[#111827]"
                        key={file.path}
                      >
                        <FileText className="h-3.5 w-3.5 text-[#047857]" />
                        {file.name}
                      </span>
                    ))}
                    {hiddenFileCount > 0 ? (
                      <span className="inline-flex items-center rounded-lg border border-[#BFE9D6] bg-[#E7F8EF] px-3 py-2 font-mono text-xs font-semibold text-[#047857]">
                        +{hiddenFileCount} more
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                  <button
                    className="loop-primary-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
                    onClick={() => onDuplicate(template.id)}
                    type="button"
                  >
                    <CopyPlus className="h-4 w-4" />
                    Use template
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
