import { useMemo, useState } from "react";
import { Clipboard, Download } from "lucide-react";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";
import type { AppState, Workspace } from "../domain/types";
import { createLoopExport, type LoopExportFormat } from "../services/loopExport";

export function LoopExportPage({
  state,
  workspace,
  selectedLoopId,
  onSelectLoop
}: {
  state: AppState;
  workspace: Workspace;
  selectedLoopId: string | null;
  onSelectLoop: (loopId: string) => void;
}) {
  const loops = state.loops.filter((loop) => loop.workspaceId === workspace.id && !loop.isTemplate);
  const selectedLoop = loops.find((loop) => loop.id === selectedLoopId) ?? loops[0];
  const [exportFormat, setExportFormat] = useState<LoopExportFormat>("markdown");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const loopExport = useMemo(
    () => (selectedLoop ? createLoopExport(selectedLoop, exportFormat) : null),
    [exportFormat, selectedLoop]
  );

  if (!selectedLoop) {
    return <EmptyState title="No loop to export" body="Duplicate a template before exporting a loop package." />;
  }

  async function copyExport() {
    if (!loopExport) {
      return;
    }

    try {
      await navigator.clipboard.writeText(loopExport.content);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus(null), 2200);
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  function downloadExport() {
    if (!loopExport) {
      return;
    }

    const blob = new Blob([loopExport.content], { type: loopExport.mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = loopExport.filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="loop-card-bright rounded-2xl p-6">
        <SectionHeader
          title="Export Loop"
          body="Package a loop contract as Markdown, JSON, or a reusable prompt template."
          action={loopExport ? <Badge tone="slate">{loopExport.filename}</Badge> : null}
        />
        <label className="mt-4 block max-w-xl">
          <span className="text-sm font-semibold text-[#111827]">Loop</span>
          <select
            className="mt-2 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm text-[#111827] shadow-sm"
            onChange={(event) => onSelectLoop(event.target.value)}
            value={selectedLoop.id}
          >
            {loops.map((loop) => (
              <option key={loop.id} value={loop.id}>
                {loop.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[0.42fr_1fr]">
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Export format</span>
              <select
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => setExportFormat(event.target.value as LoopExportFormat)}
                value={exportFormat}
              >
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
                <option value="prompt">Prompt template</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                onClick={copyExport}
                type="button"
              >
                <Clipboard className="h-4 w-4" />
                {copyStatus ?? "Copy"}
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                onClick={downloadExport}
                type="button"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Export preview</span>
            <textarea
              className="mt-2 min-h-[520px] w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-700 outline-none"
              readOnly
              value={loopExport?.content ?? ""}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
