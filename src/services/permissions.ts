import type { AppState, LoopPlaybook, MemorySource, Role } from "../domain/types";

const EDIT_ROLES = new Set<Role>(["owner", "manager", "editor"]);
const MANAGE_ROLES = new Set<Role>(["owner", "manager"]);

export function getWorkspaceRole(state: AppState, workspaceId: string, userId: string): Role | undefined {
  const workspace = state.workspaces.find((item) => item.id === workspaceId);
  return workspace?.memberRoles[userId];
}

export function canManageWorkspace(state: AppState, workspaceId: string, userId: string): boolean {
  const role = getWorkspaceRole(state, workspaceId, userId);
  return Boolean(role && MANAGE_ROLES.has(role));
}

export function canViewMemorySource(state: AppState, source: MemorySource, userId: string): boolean {
  const role = getWorkspaceRole(state, source.workspaceId, userId);
  if (!role) {
    return false;
  }

  if (source.access.visibility === "workspace") {
    return true;
  }

  if (source.access.visibility === "private") {
    return source.ownerId === userId || source.access.allowedUserIds.includes(userId) || role === "owner";
  }

  if (canManageWorkspace(state, source.workspaceId, userId)) {
    return true;
  }

  return source.access.allowedUserIds.includes(userId);
}

export function canEditLoop(state: AppState, loop: LoopPlaybook, userId: string): boolean {
  if (loop.isTemplate || !loop.workspaceId) {
    return false;
  }

  const role = getWorkspaceRole(state, loop.workspaceId, userId);
  if (!role || !EDIT_ROLES.has(role)) {
    return false;
  }

  if (loop.access.visibility === "restricted" && !canManageWorkspace(state, loop.workspaceId, userId)) {
    return loop.access.allowedUserIds.includes(userId);
  }

  return true;
}

export function canEditMemorySource(state: AppState, source: MemorySource, userId: string): boolean {
  const role = getWorkspaceRole(state, source.workspaceId, userId);
  return Boolean(role && EDIT_ROLES.has(role) && canViewMemorySource(state, source, userId));
}
