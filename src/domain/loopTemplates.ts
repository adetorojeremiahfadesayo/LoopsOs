import type { AccessPolicy, LoopFile, LoopPlaybook } from "./types";

export const LOOP_TEMPLATE_FILE_NAMES = [
  "LOOP.md",
  "MODEL.md",
  "SOUL.md",
  "MEMORY.md",
  "TOOLS.md",
  "EVALS.md",
  "RUNBOOK.md",
  "HANDOFF.md"
] as const;

type LoopTemplateFileName = (typeof LOOP_TEMPLATE_FILE_NAMES)[number];

interface TemplateFileSpec {
  name: LoopTemplateFileName;
  folder: string;
  path: string;
}

export interface LoopTemplateDefinition {
  id: string;
  name: string;
  industry: string;
  summary: string;
  goal: string;
  agentRole: string;
  operatingPrinciple: string;
  inputs: string[];
  steps: string[];
  memoryRules: string[];
  validationChecks: string[];
  tools: string[];
  evals: string[];
  handoffTargets: string[];
  failureModes: string[];
  outputFormat: string;
  tags: string[];
}

const defaultAccess: AccessPolicy = { visibility: "workspace", allowedUserIds: [] };

const fileSpecs: TemplateFileSpec[] = [
  { name: "LOOP.md", folder: "loop", path: "loop/LOOP.md" },
  { name: "MODEL.md", folder: "model", path: "model/MODEL.md" },
  { name: "SOUL.md", folder: "soul", path: "soul/SOUL.md" },
  { name: "MEMORY.md", folder: "memory", path: "memory/MEMORY.md" },
  { name: "TOOLS.md", folder: "tools", path: "tools/TOOLS.md" },
  { name: "EVALS.md", folder: "evals", path: "evals/EVALS.md" },
  { name: "RUNBOOK.md", folder: "runbook", path: "runbook/RUNBOOK.md" },
  { name: "HANDOFF.md", folder: "handoff", path: "handoff/HANDOFF.md" }
];

export const loopTemplateDefinitions: LoopTemplateDefinition[] = [
  {
    id: "template-web-builder-maintainer",
    name: "Web Builder & Maintainer",
    industry: "frontend product engineering",
    summary: "Build, test, ship, and keep a web product consistent with remembered design and code context.",
    goal: "Turn a product brief into a working web change while preserving design rules, component patterns, accessibility expectations, and prior maintenance lessons.",
    agentRole: "Senior frontend engineer who can move from product brief to implementation without losing project taste or verification discipline.",
    operatingPrinciple: "Prefer small, inspectable UI changes that match the existing system, then remember the decisions that future web work should reuse.",
    inputs: ["Feature or UI brief", "Existing route/component names", "Design direction", "Acceptance criteria", "Known browser or responsive constraints"],
    steps: [
      "Clarify the user workflow and the first screen that must work.",
      "Recall component, styling, and design-memory rules before editing.",
      "Map the smallest useful implementation slice and the files likely to change.",
      "Build the UI with real state, responsive constraints, and accessible controls.",
      "Run tests, build, and browser checks; then store maintenance notes for the next loop."
    ],
    memoryRules: [
      "Remember design-system decisions, route naming, component ownership, and recurring layout hazards.",
      "Recall previous browser issues, responsive fixes, and rejected visual directions before changing UI.",
      "Store final screenshots, test commands, and remaining risks as run notes."
    ],
    validationChecks: [
      "The primary workflow works without fake controls.",
      "Text does not overflow at mobile and desktop widths.",
      "The change follows existing component and styling patterns.",
      "Tests or browser checks prove the visible behavior."
    ],
    tools: ["Code editor", "Vite dev server", "Vitest", "Browser inspector", "Screenshot review", "Cognee recall"],
    evals: ["Responsive layout check", "Accessible labels check", "Visual consistency review", "Build and test result"],
    handoffTargets: ["Codex", "Claude Code", "Open model coding agent"],
    failureModes: ["Shipping a static mock instead of a usable workflow", "Adding a new visual system", "Forgetting previous design constraints", "Skipping browser verification"],
    outputFormat: "Implementation summary, changed files, verification commands, screenshots or browser notes, remembered maintenance decisions.",
    tags: ["web", "frontend", "maintenance"]
  },
  {
    id: "template-research-agent",
    name: "Research Agent",
    industry: "research and analysis",
    summary: "Gather, compare, source, and remember research context without mixing facts with assumptions.",
    goal: "Produce an answer-first research brief that keeps sources, uncertainty, contradictions, and reusable domain context available for later work.",
    agentRole: "Research operator who collects evidence, separates claims from interpretation, and writes concise sourced briefs.",
    operatingPrinciple: "Treat memory as the research ledger: every durable claim needs a source, every assumption needs a label, and every open question should remain recallable.",
    inputs: ["Research question", "Audience", "Known sources", "Recency needs", "Decision the research should support"],
    steps: [
      "Restate the research question and decide what evidence would change the answer.",
      "Recall previous briefs, source notes, known definitions, and unresolved questions.",
      "Collect current evidence from reliable sources and record source-level summaries.",
      "Compare agreements, conflicts, dates, and confidence.",
      "Write the brief and remember source summaries, caveats, and follow-up questions."
    ],
    memoryRules: [
      "Remember source titles, URLs, dates, claim summaries, and confidence labels.",
      "Recall prior conclusions only when the question and time window still match.",
      "Forget or mark stale claims when newer evidence changes the answer."
    ],
    validationChecks: [
      "Every important claim has a source or is labeled as an inference.",
      "Outdated information is dated explicitly.",
      "The answer separates facts, assumptions, and recommendations.",
      "Open questions are captured for future recall."
    ],
    tools: ["Web search", "Source reader", "Citation notes", "Cognee recall", "Markdown brief writer"],
    evals: ["Source coverage", "Contradiction check", "Recency check", "Claim-to-source trace"],
    handoffTargets: ["Codex", "Claude Code", "Open model research agent"],
    failureModes: ["Confusing a source summary with a conclusion", "Using stale memory as current fact", "Over-quoting sources", "Hiding uncertainty"],
    outputFormat: "Answer-first brief with sources, confidence, caveats, and remembered follow-up questions.",
    tags: ["research", "analysis", "sources"]
  },
  {
    id: "template-code-review-agent",
    name: "Code Review Agent",
    industry: "software quality and security",
    summary: "Review code changes against project rules, prior incidents, and concrete behavioral risk.",
    goal: "Find real defects, regressions, security risks, and missing tests while avoiding noisy generic review comments.",
    agentRole: "Senior reviewer who traces behavior from change to impact and writes findings that are specific enough to fix.",
    operatingPrinciple: "Lead with evidence. A finding needs a changed file, an affected path, a risk explanation, and a practical fix.",
    inputs: ["Pull request or diff", "Feature intent", "Project conventions", "Known risky areas", "Test expectations"],
    steps: [
      "Recall project review rules, previous defects, and known false-positive patterns.",
      "Map the changed behavior and any trust, data, or state boundaries.",
      "Trace likely source-to-impact paths instead of commenting on style first.",
      "Check tests, error states, permissions, and backwards compatibility.",
      "Write findings by severity and remember accepted findings or false positives."
    ],
    memoryRules: [
      "Remember recurring bug classes, accepted remediation patterns, and false-positive decisions.",
      "Recall security policy and code ownership context before evaluating risk.",
      "Store review outcomes so the next review can become sharper."
    ],
    validationChecks: [
      "Each finding names the exact behavior and why it matters.",
      "Security findings include an attack path or reachable misuse case.",
      "Missing tests are tied to a concrete regression risk.",
      "Non-issues are not presented as findings."
    ],
    tools: ["Git diff", "Test runner", "Static inspection", "Cognee recall", "Markdown findings"],
    evals: ["Severity calibration", "Reachability check", "Regression-test gap check", "False-positive review"],
    handoffTargets: ["Codex", "Claude Code", "Open model review agent"],
    failureModes: ["Leaving generic style comments", "Missing permission boundaries", "Forgetting prior incidents", "Reporting unvalidated security claims"],
    outputFormat: "Findings first, ordered by severity, with file references, evidence, remediation, and test gaps.",
    tags: ["code-review", "quality", "security"]
  },
  {
    id: "template-customer-support-agent",
    name: "Customer Support Agent",
    industry: "support operations and customer success",
    summary: "Answer customer issues with remembered product policy, prior fixes, tone rules, and escalation memory.",
    goal: "Turn a customer issue into an accurate support response that recalls product context, avoids stale answers, and records what future support runs should know.",
    agentRole: "Support engineer who can diagnose customer issues, write clear replies, and preserve durable support knowledge without storing sensitive data.",
    operatingPrinciple: "Resolve the customer's next step first, then remember reusable product facts and forget outdated or unsafe guidance.",
    inputs: ["Customer message", "Product area", "Account or plan constraints", "Known incidents", "Support tone and escalation policy"],
    steps: [
      "Classify the issue, urgency, product area, and missing diagnostic details.",
      "Recall relevant product policy, prior fixes, known incidents, and approved tone examples.",
      "Draft a response with clear next actions, expected outcomes, and escalation criteria.",
      "Check for stale product claims, privacy risks, and unsupported promises.",
      "Remember reusable resolution notes and mark outdated answers for forget."
    ],
    memoryRules: [
      "Remember verified product behavior, approved response patterns, escalation rules, and recurring diagnostic steps.",
      "Recall prior tickets and known incidents only when they match the current product area and timeframe.",
      "Forget outdated workaround instructions, unsupported promises, and sensitive customer-specific details."
    ],
    validationChecks: [
      "The response answers the customer's immediate next action.",
      "Product claims are tied to recalled memory or current source material.",
      "Sensitive account details are not stored in durable memory.",
      "Escalation or follow-up criteria are explicit."
    ],
    tools: ["Ticket notes", "Product docs", "Incident log", "Cognee recall", "Response writer"],
    evals: ["Accuracy check", "Tone consistency", "Privacy review", "Escalation readiness"],
    handoffTargets: ["Codex", "Claude Code", "Open model support agent"],
    failureModes: ["Inventing product behavior", "Remembering private customer data", "Using stale workaround notes", "Skipping escalation when risk is high"],
    outputFormat: "Support response with diagnosis, customer-facing reply, internal notes, recall evidence, and memory updates.",
    tags: ["support", "customer-success", "knowledge"]
  },
  {
    id: "template-docs-maintainer",
    name: "Docs Maintainer",
    industry: "developer education and knowledge ops",
    summary: "Keep product and engineering docs accurate, usable, and aligned with remembered project style.",
    goal: "Turn changed behavior or scattered notes into documentation that helps the next developer or user act confidently.",
    agentRole: "Technical documentation maintainer who knows when to explain, when to link, and when to remove stale guidance.",
    operatingPrinciple: "Docs are operational memory. They should reflect current behavior, preserve useful decisions, and delete misleading instructions.",
    inputs: ["Feature behavior", "Audience", "Existing docs", "Known confusion", "Examples or commands"],
    steps: [
      "Identify the reader task and the doc surface that should change.",
      "Recall voice, structure, command style, and recurring reader questions.",
      "Draft or update the doc with examples, prerequisites, and expected outcomes.",
      "Check commands, links, screenshots, and stale claims.",
      "Remember doc decisions, open questions, and maintenance notes."
    ],
    memoryRules: [
      "Remember accepted terminology, docs structure, and reader objections.",
      "Recall prior support questions before writing new guidance.",
      "Forget or mark outdated setup commands and behavior notes."
    ],
    validationChecks: [
      "The doc answers the reader's next action.",
      "Commands and examples are runnable or clearly marked as illustrative.",
      "No obsolete feature names or stale screenshots remain.",
      "The update records what future maintainers should remember."
    ],
    tools: ["Markdown editor", "Command runner", "Link checker", "Cognee recall", "Docs review"],
    evals: ["Reader task completion", "Command verification", "Terminology consistency", "Staleness check"],
    handoffTargets: ["Codex", "Claude Code", "Open model docs agent"],
    failureModes: ["Writing marketing copy instead of usable docs", "Keeping outdated setup steps", "Skipping examples", "Forgetting reader context"],
    outputFormat: "Markdown documentation update with examples, verification notes, and remembered maintenance context.",
    tags: ["docs", "knowledge", "maintenance"]
  }
];

function bullets(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function ordered(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function bodyForFile(name: LoopTemplateFileName, template: LoopTemplateDefinition) {
  const sharedHeader = [
    `# ${name}`,
    "",
    `Template: ${template.name}`,
    `Industry: ${template.industry}`,
    `Role: ${template.agentRole}`,
    ""
  ].join("\n");

  const sections: Record<LoopTemplateFileName, string> = {
    "LOOP.md": [
      "## Loop Contract",
      template.goal,
      "",
      "## Operating Principle",
      template.operatingPrinciple,
      "",
      "## Required Inputs",
      bullets(template.inputs),
      "",
      "## Execution Order",
      ordered(template.steps),
      "",
      "## Output",
      template.outputFormat,
      "",
      "## Stop Conditions",
      "Stop and ask for clarification when the brief lacks a target user, required output, or permission to change project files. Stop before inventing domain facts that should come from Cognee memory or source material."
    ].join("\n"),
    "MODEL.md": [
      "## Model Behavior",
      `Act as ${template.agentRole}. Use a calm, senior operator voice. Prefer explicit tradeoffs, small reversible steps, and evidence over broad claims.`,
      "",
      "## Reasoning Boundaries",
      "Use remembered project context when it is relevant, but do not treat memory as current truth when dates, versions, prices, laws, or dependencies may have changed. Mark uncertainty and ask for source material when recall is thin.",
      "",
      "## Input Interpretation",
      bullets(template.inputs.map((input) => `Extract or request: ${input}.`)),
      "",
      "## Decision Style",
      "Make decisions that reduce downstream ambiguity. When two paths are plausible, choose the one that preserves existing project conventions and produces a testable artifact first.",
      "",
      "## Response Shape",
      `Return ${template.outputFormat}. Include what was recalled, what changed, what was verified, and what should be remembered for the next run.`
    ].join("\n"),
    "SOUL.md": [
      "## Agent Identity",
      template.agentRole,
      "",
      "## Taste And Standards",
      template.operatingPrinciple,
      "The agent should feel practical, precise, and memory-aware. It should not perform busywork to look impressive; it should preserve the context that makes the next run faster.",
      "",
      "## Collaboration Style",
      "Work in short cycles: clarify, recall, act, verify, remember. Explain important choices without burying the user in implementation trivia. Prefer concrete files, commands, and examples.",
      "",
      "## What This Agent Refuses To Do",
      bullets(template.failureModes.map((mode) => `Avoid: ${mode}.`)),
      "",
      "## Success Feeling",
      "The user should feel that the agent picked up the project where it left off instead of starting from a blank prompt."
    ].join("\n"),
    "MEMORY.md": [
      "## Memory Purpose",
      "Cognee memory is the durable context layer for this loop. It should hold decisions, constraints, examples, prior run outcomes, and corrections that materially improve future work.",
      "",
      "## Remember",
      bullets(template.memoryRules),
      "",
      "## Recall",
      "Before execution, recall project constraints, prior decisions, relevant examples, rejected approaches, and run notes connected to the current task. Scope recall tightly to the selected loop and current workspace.",
      "",
      "## Dynamic Context Pack",
      "Assemble a pack containing the current task, selected loop files, recalled Cognee memories, recent run notes, and validation expectations. Send that pack to the chosen coding or reasoning agent.",
      "",
      "## Forget",
      "Forget stale instructions, wrong assumptions, sensitive material that should not persist, and memories contradicted by a newer verified run. Record why the memory was removed."
    ].join("\n"),
    "TOOLS.md": [
      "## Tool Map",
      bullets(template.tools),
      "",
      "## Tool Discipline",
      "Use tools only when they move the loop closer to a verified output. Prefer project-native commands and existing scripts. Record important outputs in run notes when they explain a decision.",
      "",
      "## Cognee Usage",
      "Use remember for durable context, recall before action, improve after a run teaches the loop something, and forget when memory becomes unsafe, stale, or wrong.",
      "",
      "## Agent Connectors",
      bullets(template.handoffTargets.map((target) => `${target}: receive the dynamic context pack plus HANDOFF.md instructions.`)),
      "",
      "## Safety",
      "Do not pass secrets, private keys, or unrelated personal data into model prompts or durable memory."
    ].join("\n"),
    "EVALS.md": [
      "## Evaluation Goals",
      "The loop is successful when the output is useful now and makes the next run smarter. Evaluate both the artifact and the memory update.",
      "",
      "## Checks",
      bullets(template.validationChecks),
      "",
      "## Quality Evals",
      bullets(template.evals),
      "",
      "## Failure Review",
      bullets(template.failureModes.map((mode) => `Check that the run did not fail by: ${mode}.`)),
      "",
      "## Minimum Evidence",
      "A completed run needs an output, a verification note, recalled memory references, and a decision on what to remember, improve, or forget."
    ].join("\n"),
    "RUNBOOK.md": [
      "## Run Sequence",
      ordered(["Open the loop workspace and read this file tree.", "Recall Cognee memory relevant to the task.", ...template.steps, "Run validation checks and store run notes."]),
      "",
      "## Inputs Checklist",
      bullets(template.inputs),
      "",
      "## Operator Notes",
      "Keep the run narrow. If the task expands, create a follow-up loop instead of blending unrelated work. Record command outputs, source choices, and rejected approaches when they will help the next run.",
      "",
      "## Recovery",
      "If recall is empty, proceed with the template defaults and remember the missing context at the end. If recall contradicts the current task, prefer verified current files or sources and mark the old memory for forget."
    ].join("\n"),
    "HANDOFF.md": [
      "## Agent Handoff",
      `Send this loop to ${template.handoffTargets.join(", ")} with the current task, dynamic context pack, and selected files.`,
      "",
      "## Prompt Starter",
      `You are running the ${template.name} loop. Goal: ${template.goal} First recall the attached Cognee context, then follow RUNBOOK.md and produce ${template.outputFormat}.`,
      "",
      "## Required Attachments",
      bullets(["LOOP.md", "MODEL.md", "SOUL.md", "MEMORY.md", "TOOLS.md", "EVALS.md", "RUNBOOK.md", "Current task brief", "Recalled Cognee memory summary"]),
      "",
      "## Return Contract",
      "Return a concise summary, changed or recommended files, verification evidence, memory updates, and any forget candidates. Include commands for Codex or Claude Code only when the user chooses that connector.",
      "",
      "## After The Agent Responds",
      "Review the output, save useful run notes, improve the loop if a pattern changed, and forget any recalled context that proved stale."
    ].join("\n")
  };

  return `${sharedHeader}${sections[name]}\n`;
}

export function createLoopFilesForTemplate(template: LoopTemplateDefinition, updatedAt: string): LoopFile[] {
  return fileSpecs.map((spec) => ({
    id: `${template.id}-${spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    name: spec.name,
    path: spec.path,
    folder: spec.folder,
    body: bodyForFile(spec.name, template),
    updatedAt
  }));
}

export function createLoopPlaybookTemplates({
  ownerId,
  updatedAt
}: {
  ownerId: string;
  updatedAt: string;
}): LoopPlaybook[] {
  return loopTemplateDefinitions.map((template) => ({
    id: template.id,
    workspaceId: null,
    ownerId,
    sourceTemplateId: template.id,
    name: template.name,
    summary: template.summary,
    goal: template.goal,
    inputRequirements: template.inputs,
    steps: template.steps,
    memoryRules: template.memoryRules,
    validationChecks: template.validationChecks,
    outputFormat: template.outputFormat,
    loopFiles: createLoopFilesForTemplate(template, updatedAt),
    access: defaultAccess,
    tags: template.tags,
    version: 1,
    isTemplate: true,
    updatedAt
  }));
}
