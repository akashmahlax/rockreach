import { Schema, model, models } from 'mongoose';

const LeadSearchSchema = new Schema({
  orgId: { type: String, index: true, required: true },
  query: Schema.Types.Mixed,
  filters: Schema.Types.Mixed,
  resultCount: Number,
  executedBy: String,
}, { timestamps: true });

LeadSearchSchema.index({ orgId: 1, createdAt: -1 });

export default models.LeadSearch || model('LeadSearch', LeadSearchSchema);
