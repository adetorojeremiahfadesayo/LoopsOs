import type { AuditAction, AuditEvent } from "../domain/types";

interface AuditInput {
  workspaceId: string;
  actorId: string;
  action: AuditAction;
  targetType: AuditEvent["targetType"];
  targetId: string;
  targetName: string;
  beforeSummary?: string;
  afterSummary?: string;
}

export function createAuditEvent(input: AuditInput): AuditEvent {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    targetName: input.targetName,
    beforeSummary: input.beforeSummary,
    afterSummary: input.afterSummary,
    createdAt: new Date().toISOString()
  };
}
