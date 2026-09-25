import { Router } from "express";

import { getBoardHandler } from "../../controllers/board.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.use(protect);
router.get("/:boardId", getBoardHandler);

export const boardReadRoutes = router;
