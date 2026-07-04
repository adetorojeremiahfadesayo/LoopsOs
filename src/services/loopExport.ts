import type { LoopPlaybook, MemorySource, RunRecord } from "../domain/types";

export type LoopExportFormat = "markdown" | "json" | "prompt";
export type AgentTarget = "codex" | "claude" | "generic";

export interface LoopExport {
  content: string;
  filename: string;
  mimeType: string;
}

export interface AgentHandoff {
  agent: AgentTarget;
  command: string;
  content: string;
  filename: string;
  mimeType: string;
  summary: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function bulletList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

function numberedList(items: string[]) {
  return items.length ? items.map((item, index) => `${index + 1}. ${item}`).join("\n") : "1. None";
}

function toMarkdown(loop: LoopPlaybook) {
  return [
    `# ${loop.name}`,
    "",
    loop.summary,
    "",
    "## Goal",
    loop.goal,
    "",
    "## Inputs",
    bulletList(loop.inputRequirements),
    "",
    "## Steps",
    numberedList(loop.steps),
    "",
    "## Memory Rules",
    bulletList(loop.memoryRules),
    "",
    "## Validation Checks",
    bulletList(loop.validationChecks),
    "",
    "## Output Format",
    loop.outputFormat,
    "",
    "## Tags",
    bulletList(loop.tags)
  ].join("\n");
}

function toJson(loop: LoopPlaybook) {
  return JSON.stringify(
    {
      id: loop.id,
      name: loop.name,
      summary: loop.summary,
      goal: loop.goal,
      inputRequirements: loop.inputRequirements,
      steps: loop.steps,
      memoryRules: loop.memoryRules,
      validationChecks: loop.validationChecks,
      outputFormat: loop.outputFormat,
      tags: loop.tags,
      version: loop.version
    },
    null,
    2
  );
}

function toPromptTemplate(loop: LoopPlaybook) {
  return [
    `# Prompt Template: ${loop.name}`,
    "",
    `You are running the ${loop.name}.`,
    "",
    "Goal:",
    loop.goal,
    "",
    "Inputs to collect:",
    bulletList(loop.inputRequirements),
    "",
    "Follow these loop steps:",
    numberedList(loop.steps),
    "",
    "Use memory according to these rules:",
    bulletList(loop.memoryRules),
    "",
    "Validate before final answer:",
    bulletList(loop.validationChecks),
    "",
    "Respond using this format:",
    loop.outputFormat
  ].join("\n");
}

function fileSections(loop: LoopPlaybook) {
  return loop.loopFiles.length
    ? loop.loopFiles
        .map((file) =>
          [
            `## ${file.path}`,
            "",
            "```markdown",
            file.body.trim(),
            "```"
          ].join("\n")
        )
        .join("\n\n")
    : "No generated loop files were attached.";
}

function memorySections(memorySources: MemorySource[]) {
  return memorySources.length
    ? memorySources
        .map((source) =>
          [
            `### ${source.title}`,
            `- Type: ${source.type}`,
            `- Status: ${source.ingestionStatus}`,
            "",
            source.body.trim()
          ].join("\n")
        )
        .join("\n\n")
    : "No visible memory sources are currently attached.";
}

function runSections(runs: RunRecord[]) {
  return runs.length
    ? runs
        .slice(-3)
        .map((run) =>
          [
            `### Run ${run.id}`,
            `- Created: ${run.createdAt}`,
            `- Retrieved memories: ${run.retrievedMemorySourceIds.length}`,
            "",
            run.outcomeNotes,
            "",
            "Suggestions:",
            bulletList(run.improvementSuggestions)
          ].join("\n")
        )
        .join("\n\n")
    : "No completed runs have been saved yet.";
}

function agentLabel(agent: AgentTarget) {
  if (agent === "codex") {
    return "Codex";
  }
  if (agent === "claude") {
    return "Claude Code";
  }
  return "Generic CLI";
}

function agentCommand(agent: AgentTarget, filename: string) {
  if (agent === "codex") {
    return `codex exec --file ${filename}`;
  }
  if (agent === "claude") {
    return `claude -p "$(cat ${filename})"`;
  }
  return `cat ${filename} | your-agent-cli run`;
}

function agentInstruction(agent: AgentTarget) {
  if (agent === "codex") {
    return "Open this bundle in Codex and ask it to execute the loop against the current repository.";
  }
  if (agent === "claude") {
    return "Send this bundle to Claude Code as the task prompt after opening the target project.";
  }
  return "Paste this bundle into any CLI agent that accepts markdown task context.";
}

function toFullBundle(loop: LoopPlaybook, memorySources: MemorySource[], runs: RunRecord[], agent: AgentTarget) {
  return [
    `# LoopOS Agent Handoff: ${loop.name}`,
    "",
    `Target agent: ${agentLabel(agent)}`,
    agentInstruction(agent),
    "",
    "## Mission",
    loop.goal,
    "",
    "## Output Contract",
    loop.outputFormat,
    "",
    "## Loop Steps",
    numberedList(loop.steps),
    "",
    "## Validation Checks",
    bulletList(loop.validationChecks),
    "",
    "## Memory Rules",
    bulletList(loop.memoryRules),
    "",
    "## Generated Markdown Files",
    fileSections(loop),
    "",
    "## Visible Cognee Memory",
    memorySections(memorySources),
    "",
    "## Recent Run History",
    runSections(runs),
    "",
    "## Run Instructions",
    "1. Read every generated markdown file above before making changes.",
    "2. Use visible memory as durable project context, not decoration.",
    "3. Execute the loop steps in order.",
    "4. Validate against the checks before returning.",
    "5. Return outcome notes and improvement suggestions so LoopOS can remember the run."
  ].join("\n");
}

export function createLoopExport(loop: LoopPlaybook, format: LoopExportFormat): LoopExport {
  const baseName = slugify(loop.name) || "loop";

  if (format === "json") {
    return {
      content: toJson(loop),
      filename: `${baseName}.json`,
      mimeType: "application/json;charset=utf-8"
    };
  }

  if (format === "prompt") {
    return {
      content: toPromptTemplate(loop),
      filename: `${baseName}.prompt.md`,
      mimeType: "text/markdown;charset=utf-8"
    };
  }

  return {
    content: toMarkdown(loop),
    filename: `${baseName}.md`,
    mimeType: "text/markdown;charset=utf-8"
  };
}

export function createAgentHandoff(
  loop: LoopPlaybook,
  agent: AgentTarget,
  memorySources: MemorySource[] = [],
  runs: RunRecord[] = [],
  recalledSummary?: string
): AgentHandoff {
  const baseName = slugify(loop.name) || "loop";
  const filename = `${baseName}.${agent}.handoff.md`;

  return {
    agent,
    command: agentCommand(agent, filename),
    content: [
      toFullBundle(loop, memorySources, runs, agent),
      "",
      "## Latest Cognee Recall",
      recalledSummary?.trim() || "Recall has not been run for this handoff yet."
    ].join("\n"),
    filename,
    mimeType: "text/markdown;charset=utf-8",
    summary: `${agentLabel(agent)} handoff with ${loop.loopFiles.length} files, ${memorySources.length} memory sources, and ${runs.length} run records.`
  };
}
