import { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncController = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler =
  (controller: AsyncController): RequestHandler =>
  (request, response, next) => {
    controller(request, response, next).catch(next);
  };
