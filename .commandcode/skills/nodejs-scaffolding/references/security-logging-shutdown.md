# Base Security, Logging, and Shutdown

Use these patterns as compact defaults and adapt names to the existing project.

## Helmet and rate limiting

Install through npm so package versions come from the registry:

```bash
npm install helmet express-rate-limit winston
```

Start with `helmet()` defaults. Change individual headers only for a concrete application requirement; do not disable security headers merely to silence a frontend integration issue.

```ts
import { rateLimit } from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: "ERR_TOO_MANY_REQUESTS",
    message: "Too many requests. Try again later.",
  },
});
```

Apply `helmet()` before routes and mount the limiter on API routes, not the hosting health check:

```ts
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.get("/health", (_request, response) => response.status(200).json({ status: "ok" }));
app.use("/api/v1", apiLimiter, routes);
```

Aggregate feature routers in one versioned entrypoint:

```ts
import { Router } from "express";

import { authRoutes } from "./auth.route";

export const routes = Router();

routes.use("/auth", authRoutes);
```

When the base scaffold has no feature routes yet, export the empty `Router` and add feature routers there as they are created. A future breaking API contract belongs in a separate `routes/v2` tree; do not copy routes into `v2` before a real breaking change exists.

The default rate-limit memory store is suitable for a single process. Recommend a shared store only when the app will run across multiple processes or instances. Configure Express `trust proxy` only from the actual deployment topology; never blindly trust every proxy.

## Console-only Winston logger

```ts
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
```

Use structured metadata such as request IDs, route names, status codes, and durations. Do not log secrets, authentication headers, cookies, passwords, tokens, complete payment payloads, or raw request bodies. Add an external transport only when the user selects a logging provider.

## Graceful shutdown

Keep the HTTP server reference. Make shutdown idempotent so receiving two signals does not run cleanup twice.

```ts
const server = app.listen(Env.PORT, () => {
  logger.info("API listening", { port: Env.PORT });
});

const shutdownSignals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
let shuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Shutting down API", { signal });
  server.close((error) => {
    if (error) logger.error("Shutdown failed", { error: error.message });
    process.exitCode = error ? 1 : 0;
  });
};

shutdownSignals.forEach((signal) => process.once(signal, () => shutdown(signal)));
```

When a database exists, make the server-close callback asynchronous and await its disconnect function before setting the final exit code. Add a bounded force-shutdown timer only when the deployment needs protection from stuck connections; call `.unref()` on that timer.

## MongoDB query injection

Do not add a request-mutation package by default. Use Mongoose's built-in filter sanitization and validated field selection:

```ts
mongoose.set("sanitizeFilter", true);
```

Set it before connecting. Parse request input with Zod, select allowed fields, and build the filter/update explicitly. `sanitizeFilter` is defense in depth, not a replacement for validation or authorization. Use `mongoose.trusted()` only for server-authored operators that are intentionally allowed.

## References

- [Helmet documentation](https://helmetjs.github.io/)
- [express-rate-limit configuration](https://express-rate-limit.mintlify.app/reference/configuration)
- [Winston documentation](https://github.com/winstonjs/winston)
- [Mongoose sanitizeFilter](https://mongoosejs.com/docs/api/mongoose.html#Mongoose.prototype.sanitizeFilter())
