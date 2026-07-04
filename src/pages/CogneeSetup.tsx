import { Cloud, KeyRound, PlayCircle, Server, Settings2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { CogneeStatus } from "../services/cognee";
import {
  type CogneeConnection,
  type CogneeConnectionKind,
  defaultCogneeConnection
} from "../services/cogneeConnection";

interface CogneeSetupProps {
  connection: CogneeConnection | null;
  status: CogneeStatus;
  onRefresh: () => void;
  onSave: (connection: CogneeConnection) => void;
  onStartLocal?: () => void;
}

export function CogneeSetup({ connection, status, onRefresh, onSave, onStartLocal }: CogneeSetupProps) {
  const [draft, setDraft] = useState<CogneeConnection>(connection ?? defaultCogneeConnection("hosted-demo"));
  const [customOpen, setCustomOpen] = useState(false);

  useEffect(() => {
    if (connection) {
      setDraft(connection);
    }
  }, [connection]);

  function chooseKind(kind: CogneeConnectionKind) {
    setDraft((current) => ({
      ...defaultCogneeConnection(kind),
      apiKey: kind === current.kind ? current.apiKey : ""
    }));
  }

  return (
    <div className="space-y-6">
      <section className="loop-card-bright rounded-2xl p-6">
        <div className="max-w-3xl">
          <h2 className="font-display max-w-3xl text-4xl font-bold tracking-tight text-[#111827]">
            Start with real Cognee memory.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#64748B]">
            Choose where LoopOS should store and recall memory. Use the hosted cloud path for the fastest setup, or
            start the local open source path when you want memory to stay on your machine.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="loop-card rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981] text-white shadow-sm">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-[#111827]">Use LoopOS Cognee Cloud</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                Connects through the LoopOS backend so you can use cloud memory without pasting credentials into the
                browser.
              </p>
              <button
                className="loop-primary-button mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
                onClick={() => onSave(defaultCogneeConnection("hosted-demo"))}
                type="button"
              >
                <Sparkles className="h-4 w-4" />
                Use cloud memory
              </button>
            </div>
          </div>
        </article>

        <article className="loop-card rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F8EF] text-[#047857]">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-[#111827]">Start open source Cognee</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                Starts the local Cognee Docker path with local Ollama/Fastembed defaults. No API key form in the main
                workflow.
              </p>
              <button
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#B8F3D5] bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#047857] shadow-sm hover:border-[#10B981]"
                onClick={onStartLocal}
                type="button"
              >
                <PlayCircle className="h-4 w-4" />
                Start local memory
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="loop-card rounded-2xl p-6">
        <button
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setCustomOpen((open) => !open)}
          type="button"
        >
          <span>
            <span className="flex items-center gap-2 font-display text-xl font-bold text-[#111827]">
              <Settings2 className="h-5 w-5 text-[#047857]" />
              Custom connection
            </span>
            <span className="mt-1 block text-sm leading-6 text-[#64748B]">
              Bring your own Cognee Cloud key or point LoopOS at a custom local server.
            </span>
          </span>
          <span className="rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm font-semibold text-[#64748B]">
            {customOpen ? "Close" : "Open"}
          </span>
        </button>

        {customOpen ? (
          <div className="mt-5 border-t border-[#E6ECE8] pt-5">
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                  draft.kind === "cloud"
                    ? "bg-[#10B981] text-white"
                    : "border border-[#DDE5E1] bg-white text-[#64748B]"
                }`}
                onClick={() => chooseKind("cloud")}
                type="button"
              >
                <KeyRound className="h-4 w-4" />
                Custom cloud
              </button>
              <button
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                  draft.kind === "local"
                    ? "bg-[#10B981] text-white"
                    : "border border-[#DDE5E1] bg-white text-[#64748B]"
                }`}
                onClick={() => chooseKind("local")}
                type="button"
              >
                <Server className="h-4 w-4" />
                Custom local
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[#111827]">Base URL</span>
                <input
                  className="mt-2 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm text-[#111827] shadow-sm"
                  onChange={(event) => setDraft((current) => ({ ...current, baseUrl: event.target.value }))}
                  value={draft.baseUrl}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#111827]">Auth mode</span>
                <select
                  className="mt-2 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm text-[#111827] shadow-sm"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      authMode: event.target.value as CogneeConnection["authMode"]
                    }))
                  }
                  value={draft.authMode === "backend-demo" ? "api-key" : draft.authMode}
                >
                  <option value="none">No auth</option>
                  <option value="api-key">API key</option>
                  <option value="bearer">Bearer token</option>
                </select>
              </label>

              <label className="block lg:col-span-2">
                <span className="text-sm font-semibold text-[#111827]">API key</span>
                <input
                  className="mt-2 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm text-[#111827] shadow-sm"
                  onChange={(event) => setDraft((current) => ({ ...current, apiKey: event.target.value }))}
                  placeholder={draft.authMode === "none" ? "Optional for no-auth local Cognee" : "Paste your key"}
                  type="password"
                  value={draft.apiKey ?? ""}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="loop-primary-button rounded-lg px-4 py-2 text-sm font-semibold"
                onClick={() => onSave(draft)}
                type="button"
              >
                Save custom setup
              </button>
              <button
                className="rounded-lg border border-[#DDE5E1] bg-white px-4 py-2 text-sm font-semibold text-[#64748B] shadow-sm hover:border-[#10B981]/40 hover:text-[#047857]"
                onClick={onRefresh}
                type="button"
              >
                Test custom connection
              </button>
              <p className="flex items-center text-sm text-[#64748B]">
                Bridge status: {status.ok ? "connected" : status.message}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
