import type { AppState, AuditEvent, LoopPlaybook, MemorySource, User, Workspace } from "./types";

export const USER_IDS = {
  solo: "user-ada",
  manager: "user-maya",
  developer: "user-devon",
  viewer: "user-vera"
} as const;

export const WORKSPACE_IDS = {
  solo: "workspace-solo",
  team: "workspace-team"
} as const;

export const LOOP_IDS = {
  securityReview: "loop-security-review"
} as const;

export const MEMORY_IDS = {
  projectOverview: "memory-project-overview",
  codingStandards: "memory-coding-standards",
  securityRules: "memory-security-rules"
} as const;

const now = "2026-07-02T10:00:00.000Z";

const users: User[] = [
  {
    id: USER_IDS.solo,
    name: "Ada Solo",
    title: "Independent AI builder",
    avatarInitials: "AS"
  },
  {
    id: USER_IDS.manager,
    name: "Maya Manager",
    title: "AI workflow manager",
    avatarInitials: "MM"
  },
  {
    id: USER_IDS.developer,
    name: "Devon Developer",
    title: "Loop engineer",
    avatarInitials: "DD"
  },
  {
    id: USER_IDS.viewer,
    name: "Vera Viewer",
    title: "Security observer",
    avatarInitials: "VV"
  }
];

const workspaces: Workspace[] = [
  {
    id: WORKSPACE_IDS.solo,
    name: "Ada's Solo Lab",
    kind: "solo",
    description: "A personal workspace for reusable coding and research loops.",
    memberRoles: {
      [USER_IDS.solo]: "owner"
    }
  },
  {
    id: WORKSPACE_IDS.team,
    name: "Loop Engineering Guild",
    kind: "team",
    description: "Shared loop playbooks, governed memory, and audit history for an AI team.",
    memberRoles: {
      [USER_IDS.manager]: "owner",
      [USER_IDS.developer]: "editor",
      [USER_IDS.viewer]: "viewer"
    }
  }
];

const templateBase = {
  workspaceId: null,
  ownerId: USER_IDS.manager,
  access: { visibility: "workspace", allowedUserIds: [] },
  version: 1,
  isTemplate: true,
  updatedAt: now
} satisfies Partial<LoopPlaybook>;

const templates: LoopPlaybook[] = [
  {
    ...templateBase,
    id: "template-code-feature",
    name: "Code Feature Loop",
    summary: "Plan, implement, test, and summarize a feature with durable project context.",
    goal: "Ship a scoped feature without losing project conventions or verification steps.",
    inputRequirements: ["Feature brief", "Relevant files", "Acceptance criteria"],
    steps: ["Clarify the requirement", "Inspect existing patterns", "Implement the smallest useful slice", "Run tests", "Write a concise handoff"],
    memoryRules: ["Recall project conventions", "Remember failing tests and fixes", "Store final implementation notes"],
    validationChecks: ["Acceptance criteria are met", "Tests pass", "No unrelated files changed"],
    outputFormat: "Implementation summary, test results, and next recommended step.",
    tags: ["coding", "feature"]
  },
  {
    ...templateBase,
    id: "template-bug-fix",
    name: "Bug Fix Loop",
    summary: "Reproduce, isolate, fix, and prevent a defect from returning.",
    goal: "Turn a reported bug into a tested, explained fix.",
    inputRequirements: ["Bug report", "Expected behavior", "Observed behavior"],
    steps: ["Reproduce the bug", "Locate the failing boundary", "Write a regression test", "Patch the issue", "Verify the fix"],
    memoryRules: ["Recall similar historical failures", "Remember root cause and regression test"],
    validationChecks: ["Regression test fails before the fix", "Regression test passes after the fix"],
    outputFormat: "Root cause, patch summary, regression coverage, and risk note.",
    tags: ["coding", "debugging"]
  },
  {
    ...templateBase,
    id: "template-security-review",
    name: "Security Review Loop",
    summary: "Inspect a change against team security rules and produce validated findings.",
    goal: "Find real security risks while avoiding noisy scanner-style guesses.",
    inputRequirements: ["Code diff or feature description", "Security policy", "Relevant data flows"],
    steps: ["Map trust boundaries", "Trace source-to-sink paths", "Check authentication and authorization", "Validate exploitability", "Write findings with severity"],
    memoryRules: ["Recall security policy", "Remember validated findings and false positives"],
    validationChecks: ["Every finding has an attack path", "Permissions and data exposure are checked"],
    outputFormat: "Findings ordered by severity with evidence and remediation.",
    tags: ["security", "review"]
  },
  {
    ...templateBase,
    id: "template-research-brief",
    name: "Research Brief Loop",
    summary: "Gather sources, extract claims, compare evidence, and produce a brief.",
    goal: "Create a sourced briefing that separates facts from assumptions.",
    inputRequirements: ["Research question", "Source list", "Audience"],
    steps: ["Collect source notes", "Extract key claims", "Compare agreements and conflicts", "Write brief", "List open questions"],
    memoryRules: ["Recall previous briefs", "Store source summaries and open questions"],
    validationChecks: ["Claims have sources", "Uncertainty is labeled"],
    outputFormat: "Answer-first brief with evidence and caveats.",
    tags: ["research", "analysis"]
  },
  {
    ...templateBase,
    id: "template-documentation",
    name: "Documentation Loop",
    summary: "Turn technical context into usable docs that match project style.",
    goal: "Produce docs that help the next developer act quickly.",
    inputRequirements: ["Feature behavior", "Audience", "Existing docs style"],
    steps: ["Recall doc conventions", "Draft structure", "Write examples", "Check gaps", "Add maintenance notes"],
    memoryRules: ["Recall tone and doc structure", "Remember recurring reader questions"],
    validationChecks: ["Examples are runnable", "No hidden prerequisites"],
    outputFormat: "Markdown-ready documentation with examples.",
    tags: ["docs", "knowledge"]
  },
  {
    ...templateBase,
    id: "template-content-refinement",
    name: "Content Refinement Loop",
    summary: "Draft, critique, rewrite, and preserve a consistent voice.",
    goal: "Create polished content that reflects remembered brand or personal voice.",
    inputRequirements: ["Draft", "Audience", "Tone rules"],
    steps: ["Recall tone examples", "Identify friction", "Rewrite for clarity", "Check claims", "Produce final version"],
    memoryRules: ["Recall voice examples", "Remember accepted phrasing patterns"],
    validationChecks: ["Tone matches memory", "Claims are not overstated"],
    outputFormat: "Final content with change rationale.",
    tags: ["content", "voice"]
  }
];

const loops: LoopPlaybook[] = [
  ...templates,
  {
    id: LOOP_IDS.securityReview,
    workspaceId: WORKSPACE_IDS.team,
    ownerId: USER_IDS.manager,
    name: "Guild Security Review Loop",
    summary: "A team-approved security review loop connected to governed Cognee memory.",
    goal: "Review code changes against the guild's authorization, secrets, and data exposure rules.",
    inputRequirements: ["Pull request summary", "Changed files", "Data touched by the change"],
    steps: ["Classify the change", "Recall security rules", "Trace user-controlled inputs", "Check authz decisions", "Write validated findings"],
    memoryRules: ["Recall security policy and coding standards", "Save false-positive notes", "Save accepted remediation patterns"],
    validationChecks: ["Every finding has evidence", "Restricted docs are only recalled for allowed members"],
    outputFormat: "Severity-ranked review with evidence, affected files, and fixes.",
    access: { visibility: "workspace", allowedUserIds: [] },
    tags: ["security", "team", "cognee"],
    version: 2,
    isTemplate: false,
    updatedAt: "2026-07-02T09:20:00.000Z"
  }
];

const memorySources: MemorySource[] = [
  {
    id: MEMORY_IDS.projectOverview,
    workspaceId: WORKSPACE_IDS.team,
    ownerId: USER_IDS.manager,
    title: "Project Overview",
    type: "project-docs",
    body: "# Loop Engineering Guild\nThe team builds AI workflow loops that can plan, act, observe, verify, and improve. Shared memory should preserve project constraints and prior decisions.",
    access: { visibility: "workspace", allowedUserIds: [] },
    ingestionStatus: "ingested",
    cogneeMemoryId: "cognee-memory-project-overview",
    createdAt: "2026-07-02T08:10:00.000Z",
    updatedAt: "2026-07-02T08:10:00.000Z"
  },
  {
    id: MEMORY_IDS.codingStandards,
    workspaceId: WORKSPACE_IDS.team,
    ownerId: USER_IDS.manager,
    title: "Coding Standards",
    type: "team-rules",
    body: "# Coding Standards\nPrefer small modules, test service logic first, keep audit and permission checks outside UI components, and record user-visible changes.",
    access: { visibility: "workspace", allowedUserIds: [] },
    ingestionStatus: "ingested",
    cogneeMemoryId: "cognee-memory-coding-standards",
    createdAt: "2026-07-02T08:20:00.000Z",
    updatedAt: "2026-07-02T08:20:00.000Z"
  },
  {
    id: MEMORY_IDS.securityRules,
    workspaceId: WORKSPACE_IDS.team,
    ownerId: USER_IDS.manager,
    title: "Security Rules",
    type: "security-policy",
    body: "# Security Rules\nNever recall restricted customer data for viewers. Every security finding needs an attack path, affected asset, severity, and remediation. Treat permission bypasses as high risk.",
    access: { visibility: "restricted", allowedUserIds: [USER_IDS.manager, USER_IDS.developer] },
    ingestionStatus: "ingested",
    cogneeMemoryId: "cognee-memory-security-rules",
    createdAt: "2026-07-02T08:30:00.000Z",
    updatedAt: "2026-07-02T08:30:00.000Z"
  },
  {
    id: "memory-solo-codex",
    workspaceId: WORKSPACE_IDS.solo,
    ownerId: USER_IDS.solo,
    title: "Solo Codex Preferences",
    type: "prompt-examples",
    body: "# Solo Preferences\nKeep implementation plans short, run tests before summarizing, and store useful command outputs for later loops.",
    access: { visibility: "private", allowedUserIds: [USER_IDS.solo] },
    ingestionStatus: "draft",
    createdAt: "2026-07-02T09:00:00.000Z",
    updatedAt: "2026-07-02T09:00:00.000Z"
  }
];

const auditEvents: AuditEvent[] = [
  {
    id: "audit-001",
    workspaceId: WORKSPACE_IDS.team,
    actorId: USER_IDS.manager,
    action: "memory.ingested",
    targetType: "memory",
    targetId: MEMORY_IDS.projectOverview,
    targetName: "Project Overview",
    afterSummary: "Stored in Cognee as shared project memory.",
    createdAt: "2026-07-02T08:12:00.000Z"
  },
  {
    id: "audit-002",
    workspaceId: WORKSPACE_IDS.team,
    actorId: USER_IDS.manager,
    action: "memory.access_changed",
    targetType: "memory",
    targetId: MEMORY_IDS.securityRules,
    targetName: "Security Rules",
    beforeSummary: "Visible to workspace",
    afterSummary: "Restricted to Maya Manager and Devon Developer",
    createdAt: "2026-07-02T08:35:00.000Z"
  },
  {
    id: "audit-003",
    workspaceId: WORKSPACE_IDS.team,
    actorId: USER_IDS.developer,
    action: "loop.edited",
    targetType: "loop",
    targetId: LOOP_IDS.securityReview,
    targetName: "Guild Security Review Loop",
    afterSummary: "Added authorization and restricted-memory validation checks.",
    createdAt: "2026-07-02T09:22:00.000Z"
  }
];

export const seedState: AppState = {
  users,
  workspaces,
  loops,
  memorySources,
  runs: [
    {
      id: "run-001",
      workspaceId: WORKSPACE_IDS.team,
      loopId: LOOP_IDS.securityReview,
      actorId: USER_IDS.developer,
      retrievedMemorySourceIds: [MEMORY_IDS.projectOverview, MEMORY_IDS.codingStandards, MEMORY_IDS.securityRules],
      generatedPlan:
        "Cognee recalled the guild overview, coding standards, and security rules. Start by mapping trust boundaries, then inspect authorization checks before writing severity-ranked findings.",
      outcomeNotes: "The loop caught one missing owner check and one false positive around public metadata.",
      improvementSuggestions: ["Add an explicit owner-check step", "Remember public metadata exceptions for future reviews"],
      createdAt: "2026-07-02T09:45:00.000Z"
    }
  ],
  auditEvents,
  selectedWorkspaceId: WORKSPACE_IDS.team,
  selectedUserId: USER_IDS.manager
};

export function createSeedState(): AppState {
  return JSON.parse(JSON.stringify(seedState)) as AppState;
}
