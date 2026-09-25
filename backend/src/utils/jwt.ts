import { sign, type SignOptions } from "jsonwebtoken";

import { Env } from "../config/env.config";

export const signJwtToken = (userId: string): string =>
  sign({ sub: userId }, Env.JWT_SECRET, {
    expiresIn: Env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
