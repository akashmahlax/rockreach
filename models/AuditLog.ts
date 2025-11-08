import { Schema, model, models } from 'mongoose';

const AuditLogSchema = new Schema({
  orgId: { type: String, index: true, required: true },
  actorId: String,
  actorEmail: String,
  action: { type: String, required: true },
  target: String,
  targetId: String,
  meta: Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

AuditLogSchema.index({ orgId: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });

export default models.AuditLog || model('AuditLog', AuditLogSchema);
