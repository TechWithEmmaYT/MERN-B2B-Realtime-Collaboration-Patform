import { model, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

import type { InvitationStatus, WorkspaceRole } from "../types/roles";

export interface IInvitation {
  workspaceId: Types.ObjectId;
  teamId?: Types.ObjectId | null;
  email: string;
  role: WorkspaceRole;
  invitedBy: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  status: InvitationStatus;
  acceptedAt?: Date | null;
  acceptedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type InvitationDocument = HydratedDocument<IInvitation>;

const invitationSchema = new Schema<IInvitation>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked", "expired"],
      default: "pending",
    },
    acceptedAt: { type: Date, default: null },
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

invitationSchema.index(
  { workspaceId: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);
invitationSchema.index({ workspaceId: 1 });
invitationSchema.index({ email: 1, status: 1 });

export const Invitation: Model<IInvitation> = model<IInvitation>(
  "Invitation",
  invitationSchema,
);
