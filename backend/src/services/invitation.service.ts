import { createHash, randomBytes } from "node:crypto";

import { Invitation } from "../models/invitation.model";
import { Membership } from "../models/membership.model";
import { User } from "../models/user.model";
import { Workspace } from "../models/workspace.model";
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
