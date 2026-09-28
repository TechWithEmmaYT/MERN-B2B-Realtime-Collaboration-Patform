import mongoose from "mongoose";

import { AuditEvent } from "../models/audit-event.model";
import { Membership } from "../models/membership.model";
import { TeamMembership } from "../models/team-membership.model";
import { User } from "../models/user.model";
import { ForbiddenException, NotFoundException } from "../utils/app-error";
import { getUserColor } from "../utils/user-color";
import type { WorkspaceRole } from "../types/roles";

const MAX_RESOLVE = 100;
const MAX_SUGGESTIONS = 10;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// `sanitizeFilter` is on globally, so query operators must be wrapped in trusted().
const workspaceMemberIds = async (workspaceId: string, userIds?: string[]) => {
  const filter: Record<string, unknown> = { workspaceId };
  if (userIds) filter.userId = mongoose.trusted({ $in: userIds });
  const memberships = await Membership.find(filter).select("userId").lean();
  return memberships.map((membership) => membership.userId);
};

/** Name, avatar and colour for the given users — only those in this workspace. */
export const resolveWorkspaceUsers = async (workspaceId: string, userIds: string[]) => {
  const validIds = [...new Set(userIds)]
    .filter((id) => mongoose.isValidObjectId(id))
    .slice(0, MAX_RESOLVE);
  if (validIds.length === 0) return [];

  const memberIds = await workspaceMemberIds(workspaceId, validIds);
  const users = await User.find({ _id: mongoose.trusted({ $in: memberIds }) })
    .select("name avatarUrl")
    .lean();

  return users.map((user) => {
    const id = user._id.toString();
    return { id, name: user.name, avatar: user.avatarUrl ?? "", color: getUserColor(id) };
  });
};

/** User ids of workspace members whose name or email matches `text` (for @mentions). */
export const searchWorkspaceMembers = async (workspaceId: string, text: string) => {
  const memberIds = await workspaceMemberIds(workspaceId);
  const filter: Record<string, unknown> = { _id: mongoose.trusted({ $in: memberIds }) };

  const query = text.trim();
  if (query) {
    const pattern = new RegExp(escapeRegex(query), "i");
    filter.$or = mongoose.trusted([{ name: pattern }, { email: pattern }]);
  }

  const users = await User.find(filter).select("_id").sort({ name: 1 }).limit(MAX_SUGGESTIONS).lean();
  return users.map((user) => user._id.toString());
};

type PopulatedMemberUser = { _id: mongoose.Types.ObjectId; name: string; email: string };
type PopulatedMemberTeam = { _id: mongoose.Types.ObjectId; name: string };

/** Every member of a workspace, with the teams they belong to. */
export const listWorkspaceMembers = async (workspaceId: string) => {
  const memberships = await Membership.find({ workspaceId })
    .populate("userId", "name email")
    .sort({ joinedAt: 1 })
    .lean();

  const userIds = memberships.map(
    (membership) => (membership.userId as unknown as PopulatedMemberUser)._id,
  );

  const teamMemberships = await TeamMembership.find({
    workspaceId,
    userId: mongoose.trusted({ $in: userIds }),
  })
    .populate("teamId", "name")
    .lean();

  const teamsByUser = new Map<string, string[]>();
  for (const tm of teamMemberships) {
    const userId = (tm.userId as mongoose.Types.ObjectId).toString();
    const team = tm.teamId as unknown as PopulatedMemberTeam;
    const list = teamsByUser.get(userId) ?? [];
    list.push(team.name);
    teamsByUser.set(userId, list);
  }

  return memberships.map((membership) => {
    const user = membership.userId as unknown as PopulatedMemberUser;
    const id = user._id.toString();
    return {
      id,
      name: user.name,
      email: user.email,
      role: membership.role,
      joinedAt: membership.joinedAt.toISOString(),
      teams: teamsByUser.get(id) ?? [],
    };
  });
};

/**
 * Change a member's role (admin ⇄ member). The owner's role is immutable, and
 * `requireRole("member:update")` upstream already restricts this to owner/admin.
 */
export const updateMemberRole = async (
  workspaceId: string,
  targetUserId: string,
  role: WorkspaceRole,
  actorId: string,
) => {
  const membership = await Membership.findOne({ workspaceId, userId: targetUserId });
  if (!membership) throw new NotFoundException("Member not found in this workspace");
  if (membership.role === "owner") {
    throw new ForbiddenException("The workspace owner's role cannot be changed");
  }

  const from = membership.role;
  membership.role = role;
  await membership.save();

  await AuditEvent.create({
    workspaceId,
    actorId,
    action: "member.role_updated",
    targetType: "membership",
    targetId: targetUserId,
    metadata: { from, to: role },
  });

  return { id: targetUserId, role };
};

/**
 * Remove a member from a workspace. Also cleans up their team memberships. The
 * owner cannot be removed, and `requireRole("member:remove")` restricts this to
 * owner/admin upstream.
 */
export const removeWorkspaceMember = async (
  workspaceId: string,
  targetUserId: string,
  actorId: string,
) => {
  const membership = await Membership.findOne({ workspaceId, userId: targetUserId });
  if (!membership) throw new NotFoundException("Member not found in this workspace");
  if (membership.role === "owner") {
    throw new ForbiddenException("The workspace owner cannot be removed");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await Membership.deleteOne({ workspaceId, userId: targetUserId }).session(session);
    await TeamMembership.deleteMany({ workspaceId, userId: targetUserId }).session(
      session,
    );
    await AuditEvent.create(
      [
        {
          workspaceId,
          actorId,
          action: "member.removed",
          targetType: "membership",
          targetId: targetUserId,
        },
      ],
      { session },
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
