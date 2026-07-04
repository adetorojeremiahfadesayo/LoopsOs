import {
  ArrowRight,
  BookOpenCheck,
  ChevronDown,
  CheckCircle2,
  FilePlus2,
  FileText,
  FolderOpen,
  Layers3,
  ListChecks,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { CogneeLifecycleStrip } from "../components/CogneeLifecycleStrip";
import { CogneeActionRail } from "../components/CogneeActionRail";
import { EmptyState } from "../components/EmptyState";
import type { AppState, LoopFile, LoopPlaybook, User, Workspace } from "../domain/types";

interface LoopWorkspaceProps {
  state: AppState;
  user: User;
  workspace: Workspace;
  selectedLoopId: string | null;
  onCreateFile: (loopId: string, input: { folder: string; name: string; body: string }) => void;
  onSaveFile: (
    loopId: string,
    input: { fileId: string; folder: string; name: string; body: string }
  ) => void;
  onSelectLoop: (loopId: string) => void;
  onContinue?: () => void;
}

function groupFiles(files: LoopFile[]) {
  return files.reduce<Record<string, LoopFile[]>>((groups, file) => {
    groups[file.folder] = [...(groups[file.folder] ?? []), file];
    return groups;
  }, {});
}

const folderOrder = ["loop", "model", "soul", "memory", "tools", "evals", "runbook", "handoff", "notes"];

function sortedFileGroups(files: LoopFile[]) {
  return Object.entries(groupFiles(files)).sort(([a], [b]) => {
    const aIndex = folderOrder.indexOf(a);
    const bIndex = folderOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) {
      return a.localeCompare(b);
    }
    if (aIndex === -1) {
      return 1;
    }
    if (bIndex === -1) {
      return -1;
    }
    return aIndex - bIndex;
  });
}

function defaultNewBody(name: string) {
  const title = name.trim() || "NOTES.md";
  return `# ${title}\n\nAdd dynamic context for the next agent run.`;
}

function markdownHeadings(body: string) {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("#"))
    .map((line) => line.replace(/^#+\s*/, ""))
    .filter(Boolean)
    .slice(0, 6);
}

function countWords(body: string) {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

export function LoopWorkspace({
  state,
  user,
  workspace,
  selectedLoopId,
  onCreateFile,
  onSaveFile,
  onSelectLoop,
  onContinue
}: LoopWorkspaceProps) {
  const loops = useMemo(
    () => state.loops.filter((loop) => loop.workspaceId === workspace.id && !loop.isTemplate),
    [state.loops, workspace.id]
  );
  const selectedLoop =
    loops.find((loop) => loop.id === selectedLoopId) ?? loops[0] ?? null;
  const [selectedFileId, setSelectedFileId] = useState<string | null>(selectedLoop?.loopFiles[0]?.id ?? null);
  const selectedFile = selectedLoop?.loopFiles.find((file) => file.id === selectedFileId) ?? selectedLoop?.loopFiles[0];
  const [draftBody, setDraftBody] = useState(selectedFile?.body ?? "");
  const [draftName, setDraftName] = useState(selectedFile?.name ?? "");
  const [draftFolder, setDraftFolder] = useState(selectedFile?.folder ?? "");
  const [newFileName, setNewFileName] = useState("NOTES.md");
  const [newFolder, setNewFolder] = useState("notes");
  const [detailPanel, setDetailPanel] = useState<"context" | "preview" | "outline">("context");

  useEffect(() => {
    if (selectedLoop && !selectedFileId) {
      setSelectedFileId(selectedLoop.loopFiles[0]?.id ?? null);
    }
  }, [selectedFileId, selectedLoop]);

  useEffect(() => {
    if (!selectedFile) {
      setDraftBody("");
      setDraftName("");
      setDraftFolder("");
      return;
    }

    setDraftBody(selectedFile.body);
    setDraftName(selectedFile.name);
    setDraftFolder(selectedFile.folder);
  }, [selectedFile?.id, selectedFile]);

  if (!selectedLoop) {
    return (
      <EmptyState
        title="Loop File Workspace"
        body="Duplicate one of the five industry templates first. LoopOS will generate editable markdown files for the agent."
      />
    );
  }

  const groupedFiles = sortedFileGroups(selectedLoop.loopFiles);
  const visibleMemory = state.memorySources.filter((source) => source.workspaceId === workspace.id);
  const headings = markdownHeadings(draftBody);
  const unsaved =
    selectedFile !== undefined &&
    (draftBody !== selectedFile.body || draftName !== selectedFile.name || draftFolder !== selectedFile.folder);

  function handleLoopChange(loopId: string) {
    const nextLoop = loops.find((loop) => loop.id === loopId);
    onSelectLoop(loopId);
    setSelectedFileId(nextLoop?.loopFiles[0]?.id ?? null);
  }

  function rememberCurrentFile() {
    if (!selectedFile) {
      return;
    }

    onSaveFile(selectedLoop.id, {
      body: draftBody,
      fileId: selectedFile.id,
      folder: draftFolder,
      name: draftName
    });
  }

  const workspaceDetails = (
    <section className="loop-card rounded-2xl p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F8EF] text-[#047857]">
            <Layers3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-[#111827]">Workspace details</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748B]">
              Pick one support view when you need it. The editor stays large while the details drop below.
            </p>
          </div>
        </div>

        <label className="relative block min-w-72">
          <span className="sr-only">Workspace detail panel</span>
          <select
            aria-label="Workspace detail panel"
            className="w-full appearance-none rounded-lg border border-[#DDE5E1] bg-white px-4 py-3 pr-10 text-sm font-semibold text-[#111827] shadow-sm"
            onChange={(event) => setDetailPanel(event.target.value as typeof detailPanel)}
            value={detailPanel}
          >
            <option value="context">Dynamic context pack</option>
            <option value="preview">File preview</option>
            <option value="outline">Document outline</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
        </label>
      </div>

      {detailPanel === "context" ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[#DDE5E1] bg-white p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">Goal</p>
              <p className="mt-2 text-sm leading-6 text-[#111827]">{selectedLoop.goal}</p>
            </div>
            <div className="rounded-xl border border-[#DDE5E1] bg-white p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                Handoff bundle
              </p>
              <div className="mt-3 grid gap-2 text-sm text-[#64748B] sm:grid-cols-3 lg:grid-cols-1">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-[#047857]" />
                  {selectedLoop.loopFiles.length} files
                </div>
                <div className="flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-[#047857]" />
                  {selectedLoop.steps.length} loop steps
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#047857]" />
                  {selectedLoop.validationChecks.length} checks
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#DDE5E1] bg-white p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                Visible memory
              </p>
              <p className="mt-2 text-sm leading-6 text-[#111827]">
                {visibleMemory.length} source{visibleMemory.length === 1 ? "" : "s"} can be recalled into this loop.
              </p>
            </div>
            <div className="rounded-xl border border-[#DDE5E1] bg-white p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                Current file
              </p>
              <p className="mt-2 break-all text-sm leading-6 text-[#111827]">{selectedFile?.path}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#DDE5E1] bg-[#FBFDFB] p-4">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
              Files included
            </p>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {selectedLoop.loopFiles.map((file) => (
                <button
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#E6ECE8] bg-white px-3 py-2 text-left text-sm transition hover:border-[#10B981]/50"
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-[#047857]" />
                    <span className="truncate font-semibold text-[#111827]">{file.path}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">{countWords(file.body)}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            className="loop-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold lg:col-span-2"
            onClick={onContinue}
            type="button"
          >
            Continue to Loop Builder
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-xs leading-5 text-[#64748B] lg:col-span-2">
            Opens the loop runner after your files and context are ready.
          </p>
        </div>
      ) : null}

      {detailPanel === "preview" ? (
        <div className="mt-5 rounded-xl border border-[#DDE5E1] bg-white p-5">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 text-[#047857]" />
            <h4 className="font-display text-lg font-bold text-[#111827]">File preview</h4>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#111827]">
            {draftBody.replace(/^#+\s*/gm, "").trim() || "Start writing to preview this file."}
          </p>
        </div>
      ) : null}

      {detailPanel === "outline" ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {headings.length > 0 ? (
            headings.map((heading) => (
              <div className="rounded-xl border border-[#DDE5E1] bg-white px-4 py-3 text-sm font-semibold text-[#111827]" key={heading}>
                {heading}
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-[#64748B]">No headings detected yet.</p>
          )}
        </div>
      ) : null}

    </section>
  );

  return (
    <div className="space-y-6">
      <section className="loop-card-bright rounded-2xl p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#047857]">
              Loop File Workspace
            </p>
            <h2 className="font-display mt-3 max-w-3xl text-4xl font-bold tracking-tight text-[#111827]">
              Shape the markdown brain your agent will carry.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
              Every template becomes an editable folder system. Tune the files, check the context pack, then move the
              loop into the builder for recall and execution.
            </p>
          </div>

          <label className="block min-w-72">
            <span className="text-sm font-semibold text-[#111827]">Active loop</span>
            <select
              className="mt-2 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm text-[#111827] shadow-sm"
              onChange={(event) => handleLoopChange(event.target.value)}
              value={selectedLoop.id}
            >
              {loops.map((loop) => (
                <option key={loop.id} value={loop.id}>
                  {loop.name}
                </option>
              ))}
            </select>
          </label>
        </div>

      </section>

      <CogneeLifecycleStrip current="remember" />

      <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="loop-card rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-[#111827]">Template folders</h3>
              <p className="mt-1 text-xs text-[#64748B]">Template files grouped like an agent project</p>
            </div>
            <FolderOpen className="h-5 w-5 text-[#10B981]" />
          </div>

          <div className="mt-4 max-h-[760px] space-y-3 overflow-y-auto pr-1">
            {groupedFiles.map(([folder, files]) => {
              const folderActive = files.some((file) => file.id === selectedFile?.id);
              return (
                <div className={`workspace-folder ${folderActive ? "workspace-folder-active" : ""}`} key={folder}>
                  <button
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setSelectedFileId(files[0]?.id ?? null)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="folder-glyph" />
                      <span className="min-w-0">
                        <span className="block font-display text-sm font-bold capitalize text-[#111827]">{folder}</span>
                        <span className="block text-xs text-[#64748B]">
                          {files.length} file{files.length === 1 ? "" : "s"}
                        </span>
                      </span>
                    </span>
                    {folderActive ? <CheckCircle2 className="h-4 w-4 text-[#047857]" /> : null}
                  </button>
                  <div className="mt-3 space-y-1">
                    {files.map((file) => {
                      const active = file.id === selectedFile?.id;
                      return (
                      <button
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                          active
                            ? "bg-[#E7F8EF] text-[#047857]"
                            : "text-[#64748B] hover:bg-[#F6F8F7] hover:text-[#111827]"
                        }`}
                        key={file.id}
                        onClick={() => setSelectedFileId(file.id)}
                        type="button"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </span>
                        <span className="font-mono text-[10px] text-[#94A3B8]">{countWords(file.body)}</span>
                      </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-[#E6ECE8] pt-5">
            <h3 className="font-display text-lg font-bold text-[#111827]">Create new file</h3>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm font-semibold text-[#111827]">New file name</span>
                <input
                  className="mt-2 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm text-[#111827] shadow-sm"
                  onChange={(event) => setNewFileName(event.target.value)}
                  value={newFileName}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#111827]">New folder</span>
                <input
                  className="mt-2 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm text-[#111827] shadow-sm"
                  onChange={(event) => setNewFolder(event.target.value)}
                  value={newFolder}
                />
              </label>
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#B8F3D5] bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#047857] shadow-sm hover:border-[#10B981]"
                onClick={() =>
                  onCreateFile(selectedLoop.id, {
                    body: defaultNewBody(newFileName),
                    folder: newFolder,
                    name: newFileName
                  })
                }
                type="button"
              >
                <FilePlus2 className="h-4 w-4" />
                Create file
              </button>
            </div>
          </div>
        </aside>

        <section className="loop-card overflow-hidden rounded-2xl">
          <div className="border-b border-[#E6ECE8] bg-[#F7FAF8] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                  {selectedFile?.path ?? "No file selected"}
                </p>
                <h3 className="font-display mt-2 text-2xl font-bold text-[#111827]">{draftName || "Untitled file"}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={unsaved ? "amber" : "green"}>{unsaved ? "Unsaved" : "Saved"}</Badge>
                <Badge tone={selectedFile?.cogneeMemoryId ? "green" : "amber"}>
                  {selectedFile?.cogneeMemoryId ? "remembered" : "not remembered"}
                </Badge>
                <Badge tone="slate">{countWords(draftBody)} words</Badge>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[#111827]">File name</span>
                <input
                  className="mt-2 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm text-[#111827] shadow-sm"
                  onChange={(event) => setDraftName(event.target.value)}
                  value={draftName}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#111827]">Folder</span>
                <input
                  className="mt-2 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm text-[#111827] shadow-sm"
                  onChange={(event) => setDraftFolder(event.target.value)}
                  value={draftFolder}
                />
              </label>
            </div>
          </div>

          <div className="min-h-[720px]">
            <label className="block p-5">
              <span className="text-sm font-semibold text-[#111827]">Markdown body</span>
              <textarea
                className="mt-2 min-h-[660px] w-full resize-y rounded-xl border border-[#DDE5E1] bg-white px-5 py-4 font-mono text-[15px] leading-7 text-[#111827] shadow-sm outline-none focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10"
                onChange={(event) => setDraftBody(event.target.value)}
                value={draftBody}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E6ECE8] bg-white p-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">v{selectedLoop.version}</Badge>
              <Badge tone="slate">{user.title}</Badge>
            </div>
            <p className="text-sm font-medium text-[#64748B]">Use Remember File below when the markdown is ready.</p>
          </div>
        </section>
      </section>

      <CogneeActionRail
        remember={{
          actionLabel: "Remember file",
          description: "Stores the current markdown file in Cognee for the next recall step.",
          disabled: !selectedFile,
          onAction: rememberCurrentFile,
          state: selectedFile?.cogneeMemoryId ? "current file stored" : "current file pending"
        }}
      />

      {workspaceDetails}

    </div>
  );
}
