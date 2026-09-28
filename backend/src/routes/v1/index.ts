import { Router } from "express";

import { aiRoutes } from "./ai.route";
import { authRoutes } from "./auth.route";
import { boardReadRoutes } from "./board-read.route";
import { boardRoutes } from "./board.route";
import { invitationRoutes } from "./invitation.route";
import { liveblocksAuthRoutes } from "./liveblocks.route";
import { memberRoutes } from "./member.route";
import { teamRoutes } from "./team.route";
import { workspaceRoutes } from "./workspace.route";

export const routes = Router();

routes.use("/ai", aiRoutes);
routes.use("/auth", authRoutes);
routes.use("/invitations", invitationRoutes);
routes.use("/workspaces", workspaceRoutes);
routes.use("/workspaces/:workspaceId/teams", teamRoutes);
routes.use("/workspaces/:workspaceId/boards", boardRoutes);
routes.use("/workspaces/:workspaceId/members", memberRoutes);
routes.use("/boards", boardReadRoutes);
routes.use("/liveblocks-auth", liveblocksAuthRoutes);
