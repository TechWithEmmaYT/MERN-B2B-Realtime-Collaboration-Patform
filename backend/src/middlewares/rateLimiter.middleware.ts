import { rateLimit } from "express-rate-limit";

import { ErrorCodes } from "../utils/app-error";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Per visitor IP (see `trust proxy` in index.ts). A board makes many calls
  // (auth, Liveblocks tokens, users, AI), so 100 was hit within minutes.
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: ErrorCodes.ERR_TOO_MANY_REQUESTS,
    message: "Too many requests. Try again later.",
  },
});
