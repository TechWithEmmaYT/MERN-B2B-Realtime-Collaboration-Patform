import { Router } from "express";

import { authRoutes } from "./auth.route";
import { boardReadRoutes } from "./board-read.route";
import { boardRoutes } from "./board.route";
import { teamRoutes } from "./team.route";
import { workspaceRoutes } from "./workspace.route";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/workspaces", workspaceRoutes);
routes.use("/workspaces/:workspaceId/teams", teamRoutes);
routes.use("/workspaces/:workspaceId/boards", boardRoutes);
routes.use("/boards", boardReadRoutes);
