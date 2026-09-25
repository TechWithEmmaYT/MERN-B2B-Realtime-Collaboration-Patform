import { Router } from "express";

import { createInvitationsHandler } from "../../controllers/invitation.controller";
import {
  checkSlugHandler,
  createWorkspaceHandler,
  listMyWorkspacesHandler,
} from "../../controllers/workspace.controller";
import { protect } from "../../middlewares/auth.middleware";
import { requireRole, requireWorkspace } from "../../middlewares/workspace.middleware";

const router = Router();

router.use(protect);

router.get("/", listMyWorkspacesHandler);
router.post("/", createWorkspaceHandler);
router.get("/slug-available", checkSlugHandler);
router.post(
  "/:workspaceId/invitations",
  requireWorkspace,
  requireRole("member:invite"),
  createInvitationsHandler,
);

export const workspaceRoutes = router;
