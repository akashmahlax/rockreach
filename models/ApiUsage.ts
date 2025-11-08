import { Schema, model, models } from 'mongoose';

const ApiUsageSchema = new Schema({
  orgId: { type: String, index: true, required: true },
  provider: { type: String, default: 'rocketreach' },
  endpoint: String,
  method: String,
  units: { type: Number, default: 1 },
  status: String,
  durationMs: Number,
  error: String,
}, { timestamps: true });

ApiUsageSchema.index({ orgId: 1, createdAt: -1 });
ApiUsageSchema.index({ provider: 1, createdAt: -1 });

export default models.ApiUsage || model('ApiUsage', ApiUsageSchema);
