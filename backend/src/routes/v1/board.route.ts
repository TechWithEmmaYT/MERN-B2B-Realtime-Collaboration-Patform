import { Router } from "express";

import { createBoardHandler, listBoardsHandler } from "../../controllers/board.controller";
import { protect } from "../../middlewares/auth.middleware";
import { requireWorkspace } from "../../middlewares/workspace.middleware";

const router = Router({ mergeParams: true });

router.use(protect);
router.use(requireWorkspace);

router.get("/", listBoardsHandler);
router.post("/", createBoardHandler);

export const boardRoutes = router;
