export const WORKSPACE_ROLES = ["owner", "admin", "member"] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const INVITATION_STATUS = ["pending", "accepted", "revoked", "expired"] as const;

export type InvitationStatus = (typeof INVITATION_STATUS)[number];

export const WORKSPACE_ICON_TYPES = ["initials", "emoji", "image"] as const;

export type WorkspaceIconType = (typeof WORKSPACE_ICON_TYPES)[number];

export const WORKSPACE_ICON_COLORS = ["yellow", "violet", "emerald", "pink", "sky"] as const;

export type WorkspaceIconColor = (typeof WORKSPACE_ICON_COLORS)[number];
