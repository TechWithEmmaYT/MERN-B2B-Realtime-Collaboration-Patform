import type { AuthUser } from "./auth";
import type { WorkspaceRole } from "./roles";

declare global {
  namespace Express {
    interface User extends AuthUser {}
    interface Request {
      workspaceId?: string;
      workspaceRole?: WorkspaceRole;
    }
  }
}

export {};
