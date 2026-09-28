import "dotenv/config";

import { getEnv } from "../utils/get-env";

export const Env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: Number(getEnv("PORT", "8000")),
  LOG_LEVEL: getEnv("LOG_LEVEL", "info"),
  CORS_ORIGIN: getEnv("CORS_ORIGIN", ""),
  MONGODB_URI: getEnv("MONGODB_URI"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "7d"),
  APP_URL: getEnv("APP_URL", "http://localhost:5173"),
  RESEND_API_KEY: getEnv("RESEND_API_KEY", ""),
  RESEND_FROM_EMAIL: getEnv("RESEND_FROM_EMAIL", "Kano <onboarding@resend.dev>"),
  LIVEBLOCKS_SECRET_KEY: getEnv("LIVEBLOCKS_SECRET_KEY", ""),
  AI_GATEWAY_API_KEY: getEnv("AI_GATEWAY_API_KEY", ""),
  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID", ""),
  GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET", ""),
  GOOGLE_CALLBACK_URL: getEnv(
    "GOOGLE_CALLBACK_URL",
    "http://localhost:8000/api/v1/auth/google/callback",
  ),
} as const;
