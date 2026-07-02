import type { LoopPlaybook } from "../domain/types";

export type LoopExportFormat = "markdown" | "json" | "prompt";

export interface LoopExport {
  content: string;
  filename: string;
  mimeType: string;
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
