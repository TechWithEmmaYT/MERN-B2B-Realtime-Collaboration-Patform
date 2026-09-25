import { model, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IAuditEvent {
  workspaceId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type AuditEventDocument = HydratedDocument<IAuditEvent>;

const auditEventSchema = new Schema<IAuditEvent>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

auditEventSchema.index({ workspaceId: 1, createdAt: -1 });
auditEventSchema.index({ workspaceId: 1, targetType: 1, targetId: 1 });

export const AuditEvent: Model<IAuditEvent> = model<IAuditEvent>(
  "AuditEvent",
  auditEventSchema,
);
