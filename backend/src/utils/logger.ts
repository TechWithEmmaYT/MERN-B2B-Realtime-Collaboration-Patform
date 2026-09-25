import winston from "winston";

import { Env } from "../config/env.config";

const { colorize, combine, errors, json, printf, timestamp } = winston.format;

const developmentFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, stack, timestamp: loggedAt, ...meta }) => {
    const metadata = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${loggedAt} [${level}]: ${String(message)}${stack ? ` ${stack}` : ""}${metadata}`;
  }),
);

export const logger = winston.createLogger({
  level: Env.LOG_LEVEL,
  format:
    Env.NODE_ENV === "production"
      ? combine(timestamp(), errors({ stack: true }), json())
      : developmentFormat,
  transports: [new winston.transports.Console()],
  silent: Env.NODE_ENV === "test",
});
