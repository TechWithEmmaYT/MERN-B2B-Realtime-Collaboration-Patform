import mongoose from "mongoose";

import { Board } from "../models/board.model";
import { Membership } from "../models/membership.model";
import { TeamMembership } from "../models/team-membership.model";
import { ForbiddenException, NotFoundException } from "../utils/app-error";
import type { WorkspaceRole } from "../types/roles";

const canAccessTeam = async (
  workspaceId: string,
  teamId: string,
  userId: string,
  role: WorkspaceRole,
) => {
  if (role === "owner" || role === "admin") return true;
  return TeamMembership.exists({ workspaceId, teamId, userId });
};

export const createBoard = async (
  workspaceId: string,
  input: {
    teamId: string;
    title: string;
    description?: string;
    templateKey?: string;
  },
  ownerId: string,
  role: WorkspaceRole,
) => {
  if (!(await canAccessTeam(workspaceId, input.teamId, ownerId, role))) {
    throw new ForbiddenException("You are not a member of this team");
  }

  const iconKey = input.templateKey ?? "blank";

  return Board.create({
    workspaceId,
    teamId: input.teamId,
    roomId: `board_${new mongoose.Types.ObjectId().toString()}`,
    title: input.title.trim(),
    description: input.description ?? "",
    iconKey,
    templateKey: input.templateKey ?? null,
    ownerId,
  });
};

export const listBoards = async (
  workspaceId: string,
  teamId: string,
  userId: string,
  role: WorkspaceRole,
) => {
  if (!(await canAccessTeam(workspaceId, teamId, userId, role))) {
    throw new ForbiddenException("You are not a member of this team");
  }

  const boards = await Board.find({ workspaceId, teamId, archivedAt: null })
    .sort({ updatedAt: -1 })
    .populate("ownerId", "name avatarUrl");

  const memberCount = await TeamMembership.countDocuments({ workspaceId, teamId });

  return boards.map((board) => {
    const owner = board.ownerId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      avatarUrl: string | null;
    };

    return {
      id: board._id.toString(),
      title: board.title,
      description: board.description,
      iconKey: board.iconKey,
      templateKey: board.templateKey,
      teamId: board.teamId.toString(),
      owner: {
        id: owner._id.toString(),
        name: owner.name,
        avatarUrl: owner.avatarUrl ?? null,
      },
      memberCount,
      isStarred: board.starredBy.some((id) => id.toString() === userId),
      lastOpenedAt: null,
      updatedAt: board.updatedAt,
      createdAt: board.createdAt,
    };
  });
};

export const getBoard = async (boardId: string, userId: string) => {
  const board = await Board.findOne({ _id: boardId, archivedAt: null }).populate(
    "ownerId",
    "name avatarUrl",
  );

  if (!board) throw new NotFoundException("Board not found");

  const membership = await Membership.findOne({
    workspaceId: board.workspaceId,
    userId,
  });
  const role = membership?.role;

  const hasAccess =
    role === "owner" || role === "admin"
      ? true
      : await TeamMembership.exists({
          workspaceId: board.workspaceId,
          teamId: board.teamId,
          userId,
        });

  if (!hasAccess) throw new ForbiddenException("You do not have access to this board");

  const memberCount = await TeamMembership.countDocuments({
    workspaceId: board.workspaceId,
    teamId: board.teamId,
  });

  const owner = board.ownerId as unknown as {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatarUrl: string | null;
  };

  return {
    id: board._id.toString(),
    title: board.title,
    description: board.description,
    iconKey: board.iconKey,
    templateKey: board.templateKey,
    teamId: board.teamId.toString(),
    workspaceId: board.workspaceId.toString(),
    roomId: board.roomId,
    owner: {
      id: owner._id.toString(),
      name: owner.name,
      avatarUrl: owner.avatarUrl ?? null,
    },
    memberCount,
    isStarred: board.starredBy.some((id) => id.toString() === userId),
    lastOpenedAt: null,
    updatedAt: board.updatedAt,
    createdAt: board.createdAt,
  };
};
