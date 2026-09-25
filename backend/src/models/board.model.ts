import { model, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IBoard {
  workspaceId: Types.ObjectId;
  teamId: Types.ObjectId;
  roomId: string;
  title: string;
  description: string;
  iconKey: string;
  templateKey?: string | null;
  ownerId: Types.ObjectId;
  starredBy: Types.ObjectId[];
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type BoardDocument = HydratedDocument<IBoard>;

const boardSchema = new Schema<IBoard>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    roomId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    iconKey: { type: String, default: "blank" },
    templateKey: { type: String, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    starredBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

boardSchema.index({ workspaceId: 1, teamId: 1, archivedAt: 1, updatedAt: -1 });
boardSchema.index({ roomId: 1 }, { unique: true });

export const Board: Model<IBoard> = model<IBoard>("Board", boardSchema);
