import { model, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export interface ITeamMembership {
  teamId: Types.ObjectId;
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  addedAt: Date;
}

export type TeamMembershipDocument = HydratedDocument<ITeamMembership>;

const teamMembershipSchema = new Schema<ITeamMembership>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

teamMembershipSchema.index({ teamId: 1, userId: 1 }, { unique: true });
teamMembershipSchema.index({ workspaceId: 1, userId: 1 });

export const TeamMembership: Model<ITeamMembership> = model<ITeamMembership>(
  "TeamMembership",
  teamMembershipSchema,
);
