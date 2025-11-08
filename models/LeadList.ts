import { Schema, model, models } from 'mongoose';

const LeadListSchema = new Schema({
  orgId: { type: String, index: true, required: true },
  name: { type: String, required: true },
  description: String,
  leadIds: [{ type: Schema.Types.ObjectId, ref: 'Lead' }],
  createdBy: { type: String },
  tags: [String],
}, { timestamps: true });

LeadListSchema.index({ orgId: 1, name: 1 });

export default models.LeadList || model('LeadList', LeadListSchema);
