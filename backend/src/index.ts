const dns = require('dns');
// Force Node.js to use public DNS servers
dns.setServers(['8.8.8.8', '1.1.1.1']);


import path from "node:path";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { connectDatabase, disconnectDatabase } from "./config/database.config";
import { Env } from "./config/env.config";
import { HTTPSTATUS } from "./config/http-status.config";
import passport from "./config/passport.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { apiLimiter } from "./middlewares/rateLimiter.middleware";
import { routes } from "./routes/v1";
import { NotFoundException } from "./utils/app-error";
import { logger } from "./utils/logger";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use(passport.initialize());

if (Env.CORS_ORIGIN) {
  app.use(cors({ origin: Env.CORS_ORIGIN, credentials: true }));
}

app.get("/health", (_request, response) => {
  response.status(HTTPSTATUS.OK).json({ status: "ok" });
});

app.use("/api/v1", apiLimiter, routes);

// In production the built client (client/dist) is served from this same process,
// so a single Render web service hosts both the API and the SPA. Non-API GET
// requests fall back to index.html for client-side routing.
if (Env.NODE_ENV === "production") {
  const clientPath = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientPath));
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.join(clientPath, "index.html"));
  });
}

app.use((request, _response, next) => {
  next(new NotFoundException(`Route not found: ${request.method} ${request.originalUrl}`));
});

app.use(errorHandler);

let server: ReturnType<typeof app.listen> | undefined;

const shutdownSignals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
let shuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Shutting down API", { signal });

  server?.close(async (error) => {
    if (error) logger.error("Shutdown failed", { error: error.message });

    try {
      await disconnectDatabase();
      process.exitCode = error ? 1 : 0;
    } catch (disconnectError) {
      logger.error("Database disconnect failed", {
        error: disconnectError instanceof Error ? disconnectError.message : "Unknown error",
      });
      process.exitCode = 1;
    }
  });
};

const start = async () => {
  try {
    await connectDatabase();
  } catch (error) {
    logger.error("Failed to connect to MongoDB", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  }

  server = app.listen(Env.PORT, () => {
    logger.info("API listening", { port: Env.PORT, env: Env.NODE_ENV });
  });

  shutdownSignals.forEach((signal) => process.once(signal, () => shutdown(signal)));
};

start();
