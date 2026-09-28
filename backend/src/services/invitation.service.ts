import { createHash, randomBytes } from "node:crypto";

import mongoose from "mongoose";

import { Invitation } from "../models/invitation.model";
import { Membership } from "../models/membership.model";
import { Team } from "../models/team.model";
import { TeamMembership } from "../models/team-membership.model";
import { User } from "../models/user.model";
import { Workspace } from "../models/workspace.model";
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "../utils/app-error";
import { sendInvitationEmail } from "./email.service";
import type { WorkspaceRole } from "../types/roles";

const INVITE_EXPIRY_DAYS = 7;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const createInvitations = async (input: {
  workspaceId: string;
  invites: { email: string; role: WorkspaceRole }[];
  defaultRole?: WorkspaceRole;
  actorId: string;
}) => {
  const invited: string[] = [];
  const skipped: string[] = [];
  const { workspaceId, invites, defaultRole, actorId } = input;

  const [workspace, inviter] = await Promise.all([
    Workspace.findById(workspaceId).select("name"),
    User.findById(actorId).select("name"),
  ]);
  const emails: Promise<void>[] = [];

  for (const row of invites) {
    const email = row.email;
    const role = row.role ?? defaultRole ?? "member";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const membership = await Membership.findOne({ workspaceId, userId: existingUser._id });
      if (membership) {
        skipped.push(email);
        continue;
      }
    }

    const token = randomBytes(32).toString("hex");

    try {
      const invitation = await Invitation.create({
        workspaceId,
        email,
        role,
        invitedBy: actorId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      });
      invited.push(email);
      emails.push(
        sendInvitationEmail({
          invitationId: invitation._id.toString(),
          to: email,
          token,
          workspaceName: workspace?.name ?? "a workspace",
          inviterName: inviter?.name ?? "A teammate",
        }),
      );
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        skipped.push(email);
        continue;
      }
      throw error;
    }
  }

  // Email delivery is best-effort: the invitation is already saved and can be resent.
  await Promise.all(emails);

  return { invited, skipped };
};

/** Pending invitations for a workspace, newest first. */
export const listInvitations = async (workspaceId: string) => {
  const invitations = await Invitation.find({ workspaceId, status: "pending" })
    .sort({ createdAt: -1 })
    .lean();

  return invitations.map((invitation) => ({
    id: invitation._id.toString(),
    email: invitation.email,
    role: invitation.role,
    invitedAt: invitation.createdAt.toISOString(),
  }));
};

/** Revoke a pending invitation so it can no longer be accepted. */
export const revokeInvitation = async (workspaceId: string, invitationId: string) => {
  const invitation = await Invitation.findOne({
    _id: invitationId,
    workspaceId,
    status: "pending",
  });
  if (!invitation) throw new NotFoundException("Invitation not found");

  invitation.status = "revoked";
  await invitation.save();

  return { id: invitation._id.toString(), status: invitation.status };
};

/** Public preview of an invitation: who invited you, and where to. */
export const previewInvitation = async (token: string) => {
  const invitation = await Invitation.findOne({ tokenHash: hashToken(token) });
  if (!invitation) throw new NotFoundException("This invitation link is invalid");

  const [workspace, inviter, team] = await Promise.all([
    Workspace.findById(invitation.workspaceId).select("name"),
    User.findById(invitation.invitedBy).select("name"),
    invitation.teamId
      ? Team.findById(invitation.teamId).select("name")
      : Promise.resolve(null),
  ]);

  return {
    id: invitation._id.toString(),
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expired: invitation.expiresAt.getTime() < Date.now(),
    workspaceName: workspace?.name ?? "a workspace",
    inviterName: inviter?.name ?? "A teammate",
    teamName: team?.name ?? null,
  };
};

/**
 * Accept an invitation: adds the user to the workspace, the General team and
 * (when present) the invited team, then marks the invitation accepted.
 */
export const acceptInvitation = async (
  token: string,
  user: { id: string; email: string },
) => {
  const invitation = await Invitation.findOne({ tokenHash: hashToken(token) });
  if (!invitation) throw new NotFoundException("This invitation link is invalid");

  if (invitation.status === "revoked") {
    throw new ForbiddenException("This invitation has been revoked");
  }
  if (invitation.status === "accepted") {
    throw new ConflictException("This invitation has already been used");
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    invitation.status = "expired";
    await invitation.save();
    throw new ForbiddenException("This invitation has expired");
  }
  if (invitation.email !== user.email) {
    throw new ForbiddenException("This invitation was sent to a different email address");
  }

  const workspaceId = invitation.workspaceId.toString();
  const userId = user.id;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingMembership = await Membership.findOne({ workspaceId, userId }).session(
      session,
    );
    if (!existingMembership) {
      await Membership.create([{ workspaceId, userId, role: invitation.role }], {
        session,
      });
    }

    // Everyone belongs to the General team.
    const generalTeam = await Team.findOne({ workspaceId, slug: "general" }).session(
      session,
    );
    if (generalTeam) {
      const inGeneral = await TeamMembership.findOne({
        workspaceId,
        teamId: generalTeam._id,
        userId,
      }).session(session);
      if (!inGeneral) {
        await TeamMembership.create(
          [{ workspaceId, teamId: generalTeam._id, userId }],
          { session },
        );
      }
    }

    // Add to the invited team when the invitation targets one.
    if (invitation.teamId) {
      const inTeam = await TeamMembership.findOne({
        workspaceId,
        teamId: invitation.teamId,
        userId,
      }).session(session);
      if (!inTeam) {
        await TeamMembership.create(
          [{ workspaceId, teamId: invitation.teamId, userId }],
          { session },
        );
      }
    }

    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = new mongoose.Types.ObjectId(userId);
    await invitation.save({ session });

    await session.commitTransaction();

    return {
      workspaceId,
      teamId: invitation.teamId ? invitation.teamId.toString() : null,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
