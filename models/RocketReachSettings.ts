import { getDb, Collections } from '@/lib/db';
import type { EncryptedData } from '@/lib/crypto';

export interface RocketReachSettings {
  _id?: string;
  orgId: string;
  isEnabled: boolean;
  baseUrl: string;
  apiKeyEncrypted?: EncryptedData;
  dailyLimit: number;
  concurrency: number;
  retryPolicy: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
  version: number;
  updatedBy?: string;
  updatedAt: Date;
  createdAt?: Date;
}

export async function getRocketReachSettings(orgId: string) {
  const db = await getDb();
  return db.collection<RocketReachSettings>(Collections.ROCKET_REACH_SETTINGS)
    .findOne({ orgId });
}

export async function upsertRocketReachSettings(
  orgId: string,
  data: Partial<RocketReachSettings>
) {
  const db = await getDb();
  
  // Remove orgId from data to avoid conflict with filter
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { orgId: _, ...updateData } = data;
  
  return db.collection<RocketReachSettings>(Collections.ROCKET_REACH_SETTINGS)
    .findOneAndUpdate(
      { orgId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          orgId,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
}
