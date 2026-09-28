import { Router } from "express";

import { aiChatHandler, stopAiChatHandler } from "../../controllers/ai.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.post("/boards/:boardId/chat", aiChatHandler);
router.post("/boards/:boardId/chat/stop", stopAiChatHandler);

export const aiRoutes = router;
