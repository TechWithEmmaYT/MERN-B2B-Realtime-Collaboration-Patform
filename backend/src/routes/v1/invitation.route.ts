import { Router } from "express";

import {
  acceptInvitationHandler,
  previewInvitationHandler,
} from "../../controllers/invitation.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

// Public: show who invited you and to which workspace.
router.get("/:token", previewInvitationHandler);

// Authenticated: accept the invitation and join the workspace.
router.post("/:token/accept", protect, acceptInvitationHandler);

export const invitationRoutes = router;