import { Router } from "express";

import { liveblocksAuthHandler } from "../../controllers/liveblocks.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/", protect, liveblocksAuthHandler);

export const liveblocksAuthRoutes = router;
