import { Router } from "express";

import {
  googleAuthHandler,
  googleCallbackHandler,
  loginHandler,
  logoutHandler,
  registerHandler,
  statusHandler,
} from "../../controllers/auth.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/logout", logoutHandler);
router.get("/status", protect, statusHandler);
router.get("/google", googleAuthHandler);
router.get("/google/callback", googleCallbackHandler);

export const authRoutes = router;
