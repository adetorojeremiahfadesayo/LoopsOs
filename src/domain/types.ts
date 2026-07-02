export type Role = "owner" | "manager" | "editor" | "viewer";

export type WorkspaceKind = "solo" | "team";

export type MemorySourceType =
  | "project-docs"
  | "team-rules"
  | "prompt-examples"
  | "run-notes"
  | "security-policy"
  | "research-notes";

export type AccessVisibility = "workspace" | "restricted" | "private";

export type IngestionStatus = "draft" | "ingested" | "error";

export interface User {
  id: string;
  name: string;
  title: string;
  avatarInitials: string;
}

export interface Workspace {
  id: string;
  name: string;
  kind: WorkspaceKind;
  description: string;
  memberRoles: Record<string, Role>;
}

export interface AccessPolicy {
  visibility: AccessVisibility;
  allowedUserIds: string[];
}

export interface LoopPlaybook {
  id: string;
  workspaceId: string | null;
  ownerId: string;
  name: string;
  summary: string;
  goal: string;
  inputRequirements: string[];
  steps: string[];
  memoryRules: string[];
  validationChecks: string[];
  outputFormat: string;
  access: AccessPolicy;
  tags: string[];
  version: number;
  isTemplate: boolean;
  updatedAt: string;
}

export interface MemorySource {
  id: string;
  workspaceId: string;
  ownerId: string;
  title: string;
  type: MemorySourceType;
  body: string;
  access: AccessPolicy;
  ingestionStatus: IngestionStatus;
  cogneeMemoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RunRecord {
  id: string;
  workspaceId: string;
  loopId: string;
  actorId: string;
  retrievedMemorySourceIds: string[];
  generatedPlan: string;
  outcomeNotes: string;
  improvementSuggestions: string[];
  createdAt: string;
}

export type AuditAction =
  | "memory.created"
  | "memory.edited"
  | "memory.ingested"
  | "memory.access_changed"
  | "loop.created"
  | "loop.edited"
  | "loop.duplicated"
  | "loop.improved"
  | "member.invited"
  | "member.role_changed"
  | "run.completed";

export interface AuditEvent {
  id: string;
  workspaceId: string;
  actorId: string;
  action: AuditAction;
  targetType: "memory" | "loop" | "member" | "run" | "workspace";
  targetId: string;
  targetName: string;
  beforeSummary?: string;
  afterSummary?: string;
  createdAt: string;
}

export interface AppState {
  users: User[];
  workspaces: Workspace[];
  loops: LoopPlaybook[];
  memorySources: MemorySource[];
  runs: RunRecord[];
  auditEvents: AuditEvent[];
  selectedWorkspaceId: string;
  selectedUserId: string;
}
