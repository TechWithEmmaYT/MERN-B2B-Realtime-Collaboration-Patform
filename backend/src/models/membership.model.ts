import { model, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

import type { WorkspaceRole } from "../types/roles";

export interface IMembership {
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
}

export type MembershipDocument = HydratedDocument<IMembership>;

const membershipSchema = new Schema<IMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

membershipSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });
membershipSchema.index({ workspaceId: 1, role: 1 });
membershipSchema.index({ userId: 1 });

export const Membership: Model<IMembership> = model<IMembership>(
  "Membership",
  membershipSchema,
);
