import { Schema, model, models } from 'mongoose';

const EncryptedSchema = new Schema({
  cipher: String,
  iv: String,
  tag: String,
  ver: { type: Number, default: 1 },
}, { _id: false });

const RocketReachSettingsSchema = new Schema({
  orgId: { type: String, index: true, required: true, unique: true },
  isEnabled: { type: Boolean, default: true },
  baseUrl: { type: String, default: 'https://api.rocketreach.co' },
  apiKeyEncrypted: { type: EncryptedSchema, required: false },
  dailyLimit: { type: Number, default: 1000 },
  concurrency: { type: Number, default: 2 },
  retryPolicy: {
    maxRetries: { type: Number, default: 5 },
    baseDelayMs: { type: Number, default: 500 },
    maxDelayMs: { type: Number, default: 30000 },
  },
  version: { type: Number, default: 1 },
  updatedBy: { type: String },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default models.RocketReachSettings || model('RocketReachSettings', RocketReachSettingsSchema);
