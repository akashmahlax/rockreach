import { Schema, model, models } from 'mongoose';

const LeadSchema = new Schema({
  orgId: { type: String, index: true },
  personId: { type: String, index: true }, // RocketReach person ID
  source: { type: String, default: 'rocketreach' },
  name: String,
  firstName: String,
  lastName: String,
  title: String,
  company: String,
  domain: String,
  emails: [String],
  phones: [String],
  linkedin: String,
  location: String,
  tags: [String],
  raw: Schema.Types.Mixed, // Store full RocketReach response
}, { timestamps: true });

LeadSchema.index({ orgId: 1, emails: 1 });
LeadSchema.index({ orgId: 1, personId: 1 });
LeadSchema.index({ orgId: 1, company: 1 });

export default models.Lead || model('Lead', LeadSchema);
