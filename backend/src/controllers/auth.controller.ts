import type { NextFunction, Request, Response } from "express";
import passport from "passport";

import { Env } from "../config/env.config";
import { HTTPSTATUS } from "../config/http-status.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { login, register } from "../services/auth.service";
import { ErrorCodes } from "../utils/app-error";
import { clearJwtAuthCookie, setJwtAuthCookie } from "../utils/cookie";
import { signJwtToken } from "../utils/jwt";
import { loginSchema, registerSchema } from "../validators/auth.validator";

export const registerHandler = asyncHandler(async (request, response) => {
  const input = registerSchema.parse(request.body);
  const { user, token } = await register(input);

  setJwtAuthCookie(response, token);
  response.status(HTTPSTATUS.CREATED).json({ success: true, data: { user } });
});

export const loginHandler = asyncHandler(async (request, response) => {
  const input = loginSchema.parse(request.body);
  const { user, token } = await login(input);

  setJwtAuthCookie(response, token);
  response.status(HTTPSTATUS.OK).json({ success: true, data: { user } });
});

export const logoutHandler = asyncHandler(async (_request, response) => {
  clearJwtAuthCookie(response);
  response.status(HTTPSTATUS.OK).json({ success: true, data: null });
});

export const statusHandler = asyncHandler(async (request, response) => {
  response.status(HTTPSTATUS.OK).json({ success: true, data: { user: request.user } });
});

export const googleAuthHandler = (request: Request, response: Response, next: NextFunction) => {
  if (!Env.GOOGLE_CLIENT_ID || !Env.GOOGLE_CLIENT_SECRET) {
    response.status(HTTPSTATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      errorCode: ErrorCodes.ERR_INTERNAL,
      message: "Google OAuth is not configured",
    });
    return;
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(request, response, next);
};

export const googleCallbackHandler = (request: Request, response: Response, next: NextFunction) => {
  passport.authenticate("google", { session: false }, (error, user) => {
    if (error || !user) {
      return response.redirect(`${Env.APP_URL}/sign-in?error=google`);
    }

    const { id } = user as { id: string };
    setJwtAuthCookie(response, signJwtToken(id));
    response.redirect(`${Env.APP_URL}/dashboard`);
  })(request, response, next);
};
