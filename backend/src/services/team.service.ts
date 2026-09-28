import mongoose from "mongoose";

import { AuditEvent } from "../models/audit-event.model";
import { Membership } from "../models/membership.model";
import { Team } from "../models/team.model";
import { TeamMembership } from "../models/team-membership.model";
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "../utils/app-error";
import { listBoards } from "./board.service";
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
      _id: mongoose.trusted({ $in: memberships.map((m) => m.teamId) }),
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

const listTeamMembers = async (workspaceId: string, teamId: string) => {
  const teamMemberships = await TeamMembership.find({ workspaceId, teamId }).populate(
    "userId",
    "name email avatarUrl",
  );

  const memberIds = teamMemberships.map(
    (membership) =>
      (membership.userId as unknown as { _id: mongoose.Types.ObjectId })._id,
  );

  const memberships = await Membership.find({
    workspaceId,
    userId: mongoose.trusted({ $in: memberIds }),
  });
  const roleMap = new Map(memberships.map((m) => [m.userId.toString(), m.role]));

  return teamMemberships.map((membership) => {
    const user = membership.userId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
      avatarUrl: string | null;
    };

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      role: roleMap.get(user._id.toString()) ?? "member",
    };
  });
};

export const getTeam = async (
  workspaceId: string,
  teamId: string,
  userId: string,
  role: WorkspaceRole,
) => {
  if (!mongoose.isValidObjectId(teamId)) {
    throw new NotFoundException("Team not found");
  }

  if (role !== "owner" && role !== "admin") {
    const isMember = await TeamMembership.exists({ workspaceId, teamId, userId });
    if (!isMember) throw new ForbiddenException("You are not a member of this team");
  }

  const team = await Team.findOne({ _id: teamId, workspaceId, archivedAt: null });
  if (!team) throw new NotFoundException("Team not found");

  const [boards, members] = await Promise.all([
    listBoards(workspaceId, teamId, userId, role),
    listTeamMembers(workspaceId, teamId),
  ]);

  return {
    id: team._id.toString(),
    name: team.name,
    slug: team.slug,
    memberCount: members.length,
    boards,
    members,
  };
};

/**
 * Add workspace members to a team. Callers are gated by `requireRole("team:manage")`
 * (owner/admin) upstream. Non-workspace-members and existing team members are skipped.
 */
export const addTeamMembers = async (
  workspaceId: string,
  teamId: string,
  userIds: string[],
  actorId: string,
) => {
  if (!mongoose.isValidObjectId(teamId)) {
    throw new NotFoundException("Team not found");
  }

  const team = await Team.findOne({ _id: teamId, workspaceId, archivedAt: null });
  if (!team) throw new NotFoundException("Team not found");

  const validIds = [...new Set(userIds)].filter((id) => mongoose.isValidObjectId(id));

  // Only workspace members can be added to a team.
  const workspaceMemberships = await Membership.find({
    workspaceId,
    userId: mongoose.trusted({ $in: validIds }),
  });
  const workspaceMemberIds = new Set(
    workspaceMemberships.map((membership) => membership.userId.toString()),
  );

  // People already in the team are skipped.
  const existing = await TeamMembership.find({
    workspaceId,
    teamId,
    userId: mongoose.trusted({ $in: validIds }),
  });
  const existingIds = new Set(existing.map((membership) => membership.userId.toString()));

  const toAdd = validIds.filter(
    (id) => workspaceMemberIds.has(id) && !existingIds.has(id),
  );
  const skipped = validIds.filter((id) => !toAdd.includes(id));

  if (toAdd.length > 0) {
    await TeamMembership.insertMany(
      toAdd.map((userId) => ({ teamId, userId, workspaceId })),
    );
  }

  await AuditEvent.create({
    workspaceId,
    actorId,
    action: "team.members_added",
    targetType: "team",
    targetId: teamId,
    metadata: { added: toAdd.length, skipped: skipped.length },
  });

  return { added: toAdd, skipped };
};

/**
 * Remove a member from a team. Members can't be removed from the General team
 * (everyone in the workspace belongs to it). Gated by `requireRole("team:manage")`.
 */
export const removeTeamMember = async (
  workspaceId: string,
  teamId: string,
  userId: string,
  actorId: string,
) => {
  if (!mongoose.isValidObjectId(teamId) || !mongoose.isValidObjectId(userId)) {
    throw new NotFoundException("Member not found in this team");
  }

  const team = await Team.findOne({ _id: teamId, workspaceId, archivedAt: null });
  if (!team) throw new NotFoundException("Team not found");

  if (team.slug === "general") {
    throw new ForbiddenException("Members cannot be removed from the General team");
  }

  const membership = await TeamMembership.findOneAndDelete({
    workspaceId,
    teamId,
    userId,
  });
  if (!membership) throw new NotFoundException("Member not found in this team");

  await AuditEvent.create({
    workspaceId,
    actorId,
    action: "team.member_removed",
    targetType: "team_membership",
    targetId: userId,
    metadata: { teamId },
  });
};
