import { HTTPSTATUS, HttpStatusCodeType } from "../config/http-status.config";

export const ErrorCodes = {
  ERR_INTERNAL: "ERR_INTERNAL",
  ERR_BAD_REQUEST: "ERR_BAD_REQUEST",
  ERR_UNAUTHORIZED: "ERR_UNAUTHORIZED",
  ERR_FORBIDDEN: "ERR_FORBIDDEN",
  ERR_NOT_FOUND: "ERR_NOT_FOUND",
  ERR_VALIDATION: "ERR_VALIDATION",
  ERR_TOO_MANY_REQUESTS: "ERR_TOO_MANY_REQUESTS",
  ERR_CONFLICT: "ERR_CONFLICT",
} as const;

export type ErrorCodeType = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  public readonly statusCode: HttpStatusCodeType;
  public readonly errorCode: ErrorCodeType;

  constructor(
    message: string,
    statusCode: HttpStatusCodeType = HTTPSTATUS.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCodeType = ErrorCodes.ERR_INTERNAL,
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, new.target);
  }
}

export class InternalServerException extends AppError {
  constructor(message = "Internal server error") {
    super(message, HTTPSTATUS.INTERNAL_SERVER_ERROR, ErrorCodes.ERR_INTERNAL);
  }
}

export class NotFoundException extends AppError {
  constructor(message = "Resource not found") {
    super(message, HTTPSTATUS.NOT_FOUND, ErrorCodes.ERR_NOT_FOUND);
  }
}

export class BadRequestException extends AppError {
  constructor(message = "Bad request") {
    super(message, HTTPSTATUS.BAD_REQUEST, ErrorCodes.ERR_BAD_REQUEST);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized") {
    super(message, HTTPSTATUS.UNAUTHORIZED, ErrorCodes.ERR_UNAUTHORIZED);
  }
}

export class ForbiddenException extends AppError {
  constructor(message = "Forbidden") {
    super(message, HTTPSTATUS.FORBIDDEN, ErrorCodes.ERR_FORBIDDEN);
  }
}

export class ConflictException extends AppError {
  constructor(message = "Conflict") {
    super(message, HTTPSTATUS.CONFLICT, ErrorCodes.ERR_CONFLICT);
  }
}
