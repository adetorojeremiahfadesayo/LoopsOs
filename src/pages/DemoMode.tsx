import { CheckCircle2, Cloud, Database, KeyRound, PlayCircle, ShieldCheck, TerminalSquare } from "lucide-react";
import type { AppState } from "../domain/types";
import { Badge } from "../components/Badge";
import { SectionHeader } from "../components/SectionHeader";
import type { CogneeStatus } from "../services/cognee";

const demoSteps = [
  "Open Templates and duplicate a loop into the team workspace.",
  "Open Memory and ingest Markdown sources into Cognee datasets.",
  "Open Loop Builder and click Improve with Cognee.",
  "Switch to Vera Viewer and improve again to prove restricted memory is excluded.",
  "Save run notes so the next run has a reflection trail."
];

const proofPoints = [
  "One Cognee dataset is created per memory source.",
  "LoopOS filters allowed sources before recall.",
  "Managers can restrict memory access and every change is audited.",
  "The app keeps working in demo fallback mode if Cognee is offline."
];

export function DemoMode({ state, cogneeStatus }: { state: AppState; cogneeStatus: CogneeStatus }) {
  const ingested = state.memorySources.filter((source) => source.ingestionStatus === "ingested").length;
  const loops = state.loops.filter((loop) => !loop.isTemplate).length;
  const restricted = state.memorySources.filter((source) => source.access.visibility === "restricted").length;
  const statusTone = cogneeStatus.ok ? "green" : "amber";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Badge tone="teal">WeMakeDevs Cognee Hackathon</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Hackathon Demo</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              LoopOS is a memory-powered loop engineering platform for AI that does not forget. It turns team docs,
              rules, run notes, and reusable playbooks into governed Cognee memory for solo developers and AI teams.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold text-slate-950">{loops}</p>
              <p className="text-sm text-slate-500">workspace loops</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold text-slate-950">{ingested}</p>
              <p className="text-sm text-slate-500">ingested memories</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold text-slate-950">{restricted}</p>
              <p className="text-sm text-slate-500">restricted sources</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
          <SectionHeader title="Cognee Status" body={cogneeStatus.message} action={<Badge tone={statusTone}>{cogneeStatus.mode}</Badge>} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/80 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-teal-900">
                <Cloud className="h-4 w-4" />
                <p className="text-sm font-semibold">Target</p>
              </div>
              <p className="mt-2 break-words text-sm text-slate-600">{cogneeStatus.baseUrl ?? "Local demo fallback"}</p>
            </div>
            <div className="rounded-lg border border-white/80 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-teal-900">
                <KeyRound className="h-4 w-4" />
                <p className="text-sm font-semibold">Credential mode</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">{cogneeStatus.configured ? "Configured" : "No key required for fallback"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader title="Live Walkthrough" body="A short path that shows memory, permissions, loop improvement, and saved runs." />
          <div className="space-y-3">
            {demoSteps.map((step, index) => (
              <div className="flex gap-3 rounded-lg border border-slate-200 p-4" key={step}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-slate-600">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader title="Judging Proof" body="What the judges should notice during the demo." />
          <div className="space-y-3">
            {proofPoints.map((point) => (
              <div className="flex items-start gap-3" key={point}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                <p className="text-sm leading-6 text-slate-600">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <TerminalSquare className="h-4 w-4" />
            <h3 className="font-semibold">Run Commands</h3>
          </div>
          <div className="mt-4 space-y-3 font-mono text-sm leading-6 text-slate-200">
            <p>npm install</p>
            <p>Copy-Item .env.example .env</p>
            <p>npm run dev:full</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone="slate">local Cognee</Badge>
            <Badge tone="slate">Cognee Cloud</Badge>
            <Badge tone="slate">demo fallback</Badge>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-900">
              <PlayCircle className="h-4 w-4" />
              <h3 className="font-semibold">Pitch line</h3>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-amber-950/80">
              Loop engineering is becoming the way teams make AI work repeatable. LoopOS adds Cognee memory, access
              control, and run history so those loops improve instead of starting from zero every time.
            </p>
          </div>
          <ShieldCheck className="h-8 w-8 text-amber-700" />
        </div>
      </section>
    </div>
  );
}
