import type { WorkspaceRole } from "../types/roles";

export const rolePermissions = {
  owner: [
    "workspace:update",
    "workspace:delete",
    "member:read",
    "member:invite",
    "member:update",
    "member:remove",
    "ownership:transfer",
    "team:manage",
  ],
  admin: [
    "workspace:update",
    "member:read",
    "member:invite",
    "member:update",
    "member:remove",
    "team:manage",
  ],
  member: ["workspace:read", "member:read"],
} as const satisfies Record<WorkspaceRole, readonly string[]>;

export type Permission = (typeof rolePermissions)[WorkspaceRole][number];

export const roleHierarchy: Record<WorkspaceRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export const can = (role: WorkspaceRole, permission: Permission): boolean =>
  (rolePermissions[role] as readonly string[]).includes(permission);
