import mongoose from "mongoose";

import { Team } from "../models/team.model";
import { TeamMembership } from "../models/team-membership.model";
import { ConflictException } from "../utils/app-error";
import type { WorkspaceRole } from "../types/roles";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const listTeams = async (
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
) => {
  let teams;

  if (role === "owner" || role === "admin") {
    teams = await Team.find({ workspaceId, archivedAt: null }).sort({ createdAt: 1 });
  } else {
    const memberships = await TeamMembership.find({ workspaceId, userId });
    teams = await Team.find({
      workspaceId,
      _id: { $in: memberships.map((m) => m.teamId) },
      archivedAt: null,
    }).sort({ createdAt: 1 });
  }

  const teamIds = teams.map((team) => team._id);
  const counts = await TeamMembership.aggregate([
    { $match: { teamId: { $in: teamIds } } },
    { $group: { _id: "$teamId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count as number]));

  return teams.map((team) => ({
    id: team._id.toString(),
    name: team.name,
    memberCount: countMap.get(team._id.toString()) ?? 0,
  }));
};

export const createTeam = async (
  workspaceId: string,
  name: string,
  creatorId: string,
) => {
  const slug = slugify(name);

  if (await Team.exists({ workspaceId, slug })) {
    throw new ConflictException("A team with this name already exists");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [team] = await Team.create(
      [{ workspaceId, name: name.trim(), slug }],
      { session },
    );

    await TeamMembership.create(
      [{ teamId: team._id, userId: creatorId, workspaceId }],
      { session },
    );

    await session.commitTransaction();

    return { id: team._id.toString(), name: team.name, memberCount: 1 };
  } catch (error) {
    await session.abortTransaction();

    if ((error as { code?: number }).code === 11000) {
      throw new ConflictException("A team with this name already exists");
    }
    throw error;
  } finally {
    await session.endSession();
  }
};
