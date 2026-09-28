import { Router } from "express";

import { getBoardHandler, getBoardTemplateHandler } from "../../controllers/board.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.get("/templates/:key", getBoardTemplateHandler);
router.get("/:boardId", getBoardHandler);

export const boardReadRoutes = router;