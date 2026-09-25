import type { CookieOptions, Response } from "express";

import { Env } from "../config/env.config";

const isProduction = Env.NODE_ENV === "production";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const setJwtAuthCookie = (response: Response, token: string): void => {
  response.cookie("accessToken", token, cookieOptions);
};

export const clearJwtAuthCookie = (response: Response): void => {
  response.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
};
