import { CopyPlus } from "lucide-react";
import type { AppState, Workspace } from "../domain/types";
import { Badge } from "../components/Badge";
import { SectionHeader } from "../components/SectionHeader";

export function Templates({
  state,
  workspace,
  onDuplicate
}: {
  state: AppState;
  workspace: Workspace;
  onDuplicate: (templateId: string) => void;
}) {
  const templates = state.loops.filter((loop) => loop.isTemplate);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Template Library"
        body={`Duplicate a proven loop into ${workspace.name}, then bind it to governed Cognee memory.`}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {templates.map((template) => (
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={template.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">{template.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{template.summary}</p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                onClick={() => onDuplicate(template.id)}
                type="button"
              >
                <CopyPlus className="h-4 w-4" />
                Duplicate
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Steps</p>
                <ol className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                  {template.steps.slice(0, 4).map((step) => (
                    <li key={step}>- {step}</li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Validation</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                  {template.validationChecks.map((check) => (
                    <li key={check}>- {check}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
