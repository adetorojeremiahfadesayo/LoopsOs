import {
  createLoopFilesForTemplate,
  createLoopPlaybookTemplates,
  loopTemplateDefinitions
} from "./loopTemplates";
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

const templates: LoopPlaybook[] = createLoopPlaybookTemplates({
  ownerId: USER_IDS.manager,
  updatedAt: now
});

const codeReviewTemplate = loopTemplateDefinitions.find((template) => template.id === "template-code-review-agent")!;

const loops: LoopPlaybook[] = [
  ...templates,
  {
    id: LOOP_IDS.securityReview,
    workspaceId: WORKSPACE_IDS.team,
    ownerId: USER_IDS.manager,
    sourceTemplateId: codeReviewTemplate.id,
    name: "Guild Security Review Loop",
    summary: "A team-approved security review loop connected to governed Cognee memory.",
    goal: "Review code changes against the guild's authorization, secrets, and data exposure rules.",
    inputRequirements: ["Pull request summary", "Changed files", "Data touched by the change"],
    steps: ["Classify the change", "Recall security rules", "Trace user-controlled inputs", "Check authz decisions", "Write validated findings"],
    memoryRules: ["Recall security policy and coding standards", "Save false-positive notes", "Save accepted remediation patterns"],
    validationChecks: ["Every finding has evidence", "Restricted docs are only recalled for allowed members"],
    outputFormat: "Severity-ranked review with evidence, affected files, and fixes.",
    loopFiles: createLoopFilesForTemplate(codeReviewTemplate, "2026-07-02T09:20:00.000Z"),
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
  selectedWorkspaceId: WORKSPACE_IDS.solo,
  selectedUserId: USER_IDS.solo
};

export function createSeedState(): AppState {
  return JSON.parse(JSON.stringify(seedState)) as AppState;
}
