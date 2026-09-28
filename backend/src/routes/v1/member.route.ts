import { Router } from "express";

import {
  listMembersHandler,
  removeMemberHandler,
  resolveMembersHandler,
  searchMembersHandler,
  updateMemberRoleHandler,
} from "../../controllers/member.controller";
import { protect } from "../../middlewares/auth.middleware";
import { requireRole, requireWorkspace } from "../../middlewares/workspace.middleware";

const router = Router({ mergeParams: true });

router.use(protect);
router.use(requireWorkspace);

router.get("/", requireRole("member:read"), listMembersHandler);
router.get("/resolve", resolveMembersHandler);
router.get("/search", searchMembersHandler);
router.patch("/:userId/role", requireRole("member:update"), updateMemberRoleHandler);
router.delete("/:userId", requireRole("member:remove"), removeMemberHandler);

export const memberRoutes = router;