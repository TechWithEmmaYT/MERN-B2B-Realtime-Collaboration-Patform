import type { NextFunction, Request, Response } from "express";
import passport from "passport";

import type { AuthUser } from "../types/auth";
import { UnauthorizedException } from "../utils/app-error";

export const protect = (request: Request, response: Response, next: NextFunction) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (error: unknown, user: AuthUser | false | undefined, _info: unknown) => {
      if (error) return next(error);
      if (!user) return next(new UnauthorizedException("Authentication required"));
      request.user = user;
      next();
    },
  )(request, response, next);
};
