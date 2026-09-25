import { model, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

import {
  WORKSPACE_ICON_COLORS,
  WORKSPACE_ICON_TYPES,
  type WorkspaceIconColor,
  type WorkspaceIconType,
} from "../types/roles";

export interface IWorkspace {
  name: string;
  slug: string;
  iconType: WorkspaceIconType;
  iconValue: string;
  iconColor: WorkspaceIconColor;
  ownerId: Types.ObjectId;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkspaceDocument = HydratedDocument<IWorkspace>;

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    iconType: { type: String, enum: WORKSPACE_ICON_TYPES, default: "initials" },
    iconValue: { type: String, default: "" },
    iconColor: { type: String, enum: WORKSPACE_ICON_COLORS, default: "yellow" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Workspace: Model<IWorkspace> = model<IWorkspace>("Workspace", workspaceSchema);
