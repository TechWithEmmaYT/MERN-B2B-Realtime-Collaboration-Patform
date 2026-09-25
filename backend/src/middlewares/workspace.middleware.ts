import { NextFunction, Request, Response } from "express";

import { Membership } from "../models/membership.model";
import { ForbiddenException, UnauthorizedException } from "../utils/app-error";
import { can, type Permission } from "../utils/organization-permission";

export const requireWorkspace = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  try {
    const workspaceId = request.params.workspaceId as string;
    const userId = request.user?.id;

    if (!userId) return next(new UnauthorizedException("Authentication required"));

    const membership = await Membership.findOne({ workspaceId, userId });
    if (!membership) {
      return next(new ForbiddenException("You are not a member of this workspace"));
    }

    request.workspaceId = workspaceId;
    request.workspaceRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole =
  (permission: Permission) => (request: Request, _response: Response, next: NextFunction) => {
    const role = request.workspaceRole;
    if (!role || !can(role, permission)) {
      return next(new ForbiddenException("You do not have permission to do this"));
    }
    next();
  };
