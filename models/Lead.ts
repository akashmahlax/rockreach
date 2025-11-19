import { getDb, Collections } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface Lead {
  _id?: ObjectId;
  orgId: string;
  personId: string;
  source: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  domain?: string;
  emails?: string[];
  phones?: string[];
  linkedin?: string;
  location?: string;
  tags?: string[];
  raw?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function findLeadByPersonId(orgId: string, personId: string) {
  const db = await getDb();
  return db.collection<Lead>(Collections.LEADS).findOne({ orgId, personId });
}

export async function upsertLead(orgId: string, personId: string, data: Partial<Lead>) {
  const db = await getDb();
  
  // Remove orgId and personId from data to avoid conflict with filter and $setOnInsert
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { orgId: _, personId: __, ...updateData } = data;
  
  return db.collection<Lead>(Collections.LEADS).findOneAndUpdate(
    { orgId, personId },
    {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
        orgId,
        personId,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
}

export async function findLeads(orgId: string, filter: Partial<Lead> = {}, limit = 100) {
  const db = await getDb();
  return db.collection<Lead>(Collections.LEADS)
    .find({ orgId, ...filter })
    .limit(limit)
    .toArray();
}

/**
 * Optimized lead search with pagination, sorting, and filtering
 */
export async function findLeadsOptimized(
  orgId: string, 
  options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    hasPhone?: boolean;
    hasEmail?: boolean;
    search?: string;
    companies?: string[];
  } = {}
) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    hasPhone,
    hasEmail,
    search,
    companies,
  } = options;

  const db = await getDb();
  const query: any = { orgId };

  // Filter by phone
  if (hasPhone) {
    query['phones.0'] = { $exists: true };
  }

  // Filter by email
  if (hasEmail) {
    query['emails.0'] = { $exists: true };
  }

  // Filter by companies
  if (companies && companies.length > 0) {
    query.company = { $in: companies };
  }

  // Text search
  if (search && search.length > 2) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { emails: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [leads, total] = await Promise.all([
    db.collection<Lead>(Collections.LEADS)
      .find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection<Lead>(Collections.LEADS).countDocuments(query),
  ]);

  return {
    leads,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: skip + leads.length < total,
    },
  };
}

/**
 * Bulk upsert leads for better performance
 */
export async function bulkUpsertLeads(orgId: string, leads: Partial<Lead>[]) {
  const db = await getDb();
  const operations = leads.map(lead => ({
    updateOne: {
      filter: { orgId, personId: lead.personId },
      update: {
        $set: {
          ...lead,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          orgId,
          personId: lead.personId,
        },
      },
      upsert: true,
    },
  }));

  return db.collection<Lead>(Collections.LEADS).bulkWrite(operations);
}

/**
 * Get lead statistics
 */
export async function getLeadStats(orgId: string) {
  const db = await getDb();
  const collection = db.collection<Lead>(Collections.LEADS);

  const [total, withEmail, withPhone, withBoth] = await Promise.all([
    collection.countDocuments({ orgId }),
    collection.countDocuments({ orgId, 'emails.0': { $exists: true } }),
    collection.countDocuments({ orgId, 'phones.0': { $exists: true } }),
    collection.countDocuments({ 
      orgId, 
      'emails.0': { $exists: true },
      'phones.0': { $exists: true }
    }),
  ]);

  return {
    total,
    withEmail,
    withPhone,
    withBoth,
    emailCoverage: total > 0 ? (withEmail / total) * 100 : 0,
    phoneCoverage: total > 0 ? (withPhone / total) * 100 : 0,
    completeCoverage: total > 0 ? (withBoth / total) * 100 : 0,
  };
}

export async function createIndexes() {
  const db = await getDb();
  const collection = db.collection<Lead>(Collections.LEADS);
  
  await collection.createIndex({ orgId: 1, personId: 1 });
  await collection.createIndex({ orgId: 1, emails: 1 });
  await collection.createIndex({ orgId: 1, company: 1 });
  await collection.createIndex({ createdAt: -1 });
}
