import { Schema, model, models } from 'mongoose';

const OrganizationSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, required: true },
  plan: { type: String, default: 'free', enum: ['free', 'starter', 'professional', 'enterprise'] },
  status: { type: String, default: 'active', enum: ['active', 'suspended', 'cancelled'] },
  ownerId: String,
  memberIds: [String],
}, { timestamps: true });

OrganizationSchema.index({ slug: 1 });

export default models.Organization || model('Organization', OrganizationSchema);
