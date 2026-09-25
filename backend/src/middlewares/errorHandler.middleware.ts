import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { Env } from "../config/env.config";
import { HTTPSTATUS } from "../config/http-status.config";
import { AppError, ErrorCodes } from "../utils/app-error";
import { logger } from "../utils/logger";

const formatZodError = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const route = `${request.method} ${request.originalUrl}`;

  if (error instanceof ZodError) {
    logger.warn("Validation failed", { route });

    return response.status(HTTPSTATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      errorCode: ErrorCodes.ERR_VALIDATION,
      message: "Validation failed",
      errors: formatZodError(error),
    });
  }

  if (error instanceof AppError) {
    logger.warn("Request failed", {
      route,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
    });

    return response.status(error.statusCode).json({
      success: false,
      errorCode: error.errorCode,
      message: error.message,
    });
  }

  logger.error("Unhandled error", {
    route,
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });

  return response.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    errorCode: ErrorCodes.ERR_INTERNAL,
    message:
      Env.NODE_ENV === "production"
        ? "Internal server error"
        : error instanceof Error
          ? error.message
          : "Internal server error",
  });
};
