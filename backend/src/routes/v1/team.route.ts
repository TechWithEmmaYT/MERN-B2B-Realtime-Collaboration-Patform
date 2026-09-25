import { Router } from "express";

import { createTeamHandler, listTeamsHandler } from "../../controllers/team.controller";
import { protect } from "../../middlewares/auth.middleware";
import { requireRole, requireWorkspace } from "../../middlewares/workspace.middleware";

const router = Router({ mergeParams: true });

router.use(protect);
router.use(requireWorkspace);

router.get("/", listTeamsHandler);
router.post("/", requireRole("team:manage"), createTeamHandler);

export const teamRoutes = router;
