import { getRocketReachSettings } from '@/models/RocketReachSettings';
import { logApiUsage } from '@/models/ApiUsage';
import { decryptSecret, type EncryptedData } from './crypto';
import { setTimeout as delay } from 'node:timers/promises';

interface RrSettings {
  baseUrl: string;
  apiKey: string;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  concurrency: number;
  isEnabled: boolean;
}

const settingsCache = new Map<string, { value: RrSettings; expires: number }>();

async function getSettings(orgId: string): Promise<RrSettings> {
  const now = Date.now();
  const cached = settingsCache.get(orgId);
  if (cached && cached.expires > now) return cached.value;

  const doc = await getRocketReachSettings(orgId);
  
  if (!doc || !doc.isEnabled) {
    throw new Error('RocketReach is not enabled for this organization');
  }

  const apiKey = doc.apiKeyEncrypted ? decryptSecret(doc.apiKeyEncrypted as EncryptedData) : '';
  
  if (!apiKey) {
    throw new Error('RocketReach API key not configured');
  }

  const value: RrSettings = {
    baseUrl: doc.baseUrl || 'https://api.rocketreach.co',
    apiKey,
    maxRetries: doc.retryPolicy?.maxRetries ?? 5,
    baseDelayMs: doc.retryPolicy?.baseDelayMs ?? 500,
    maxDelayMs: doc.retryPolicy?.maxDelayMs ?? 30000,
    concurrency: doc.concurrency ?? 2,
    isEnabled: !!doc.isEnabled,
  };

  settingsCache.set(orgId, { value, expires: now + 60_000 }); // 60s TTL
  return value;
}

async function logUsage(orgId: string, endpoint: string, method: string, status: string, durationMs: number, error?: string) {
  try {
    await logApiUsage({
      orgId,
      provider: 'rocketreach',
      endpoint,
      method,
      units: 1,
      status,
      durationMs,
      error,
    });
  } catch (err) {
    console.error('Failed to log API usage:', err);
  }
}

async function rrFetch(
  orgId: string,
  path: string,
  opts: { method?: string; query?: Record<string, string | number | undefined>; body?: unknown } = {}
) {
  const startTime = Date.now();
  const s = await getSettings(orgId);
  
  const query = opts.query || {};
  const filteredQuery = Object.entries(query).filter(([, v]) => v != null && v !== '');
  const qs = new URLSearchParams(filteredQuery as [string, string][]).toString();
  const url = `${s.baseUrl}${path}${qs ? `?${qs}` : ''}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= s.maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: opts.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': s.apiKey, // RocketReach uses 'Api-Key' header
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        cache: 'no-store',
      });

      const durationMs = Date.now() - startTime;

      // Rate limit or temporary error - retry
      if (res.status === 429 || res.status === 503) {
        const wait = Math.min(s.maxDelayMs, s.baseDelayMs * 2 ** attempt) + Math.random() * 250;
        await delay(wait);
        continue;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        const error = `RocketReach error ${res.status}: ${txt}`;
        await logUsage(orgId, path, opts.method || 'GET', `error_${res.status}`, durationMs, error);
        throw new Error(error);
      }

      const data = await res.json();
      await logUsage(orgId, path, opts.method || 'GET', 'success', durationMs);
      return data;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === s.maxRetries) {
        const durationMs = Date.now() - startTime;
        await logUsage(orgId, path, opts.method || 'GET', 'error', durationMs, lastError.message);
        throw lastError;
      }
    }
  }

  throw lastError || new Error('RocketReach retries exhausted');
}

// RocketReach API Methods
// Using official RocketReach API v2 endpoints

export async function rrSearchPeople(
  orgId: string,
  params: {
    name?: string;
    title?: string;
    company?: string;
    domain?: string;
    location?: string;
    page?: number;
    page_size?: number;
  }
) {
  const pageSize = params.page_size && params.page_size > 0 ? params.page_size : 25;
  const page = params.page && params.page > 0 ? params.page : 1;
  const start = (page - 1) * pageSize + 1;

  return rrFetch(orgId, '/api/v2/search', {
    method: 'POST',
    body: {
      query: {
        name: params.name ? [params.name] : undefined,
        current_title: params.title ? [params.title] : undefined,
        current_employer: params.company ? [params.company] : undefined,
        email_domain: params.domain ? [params.domain] : undefined,
        location: params.location ? [params.location] : undefined,
      },
      page_size: pageSize,
      start,
    },
  });
}

export async function rrLookupProfile(orgId: string, personId: string) {
  return rrFetch(orgId, `/api/v2/person/lookup`, {
    method: 'GET',
    query: { id: personId },
  });
}

export async function rrLookupEmail(orgId: string, params: { name: string; domain: string }) {
  return rrFetch(orgId, '/v2/api/lookupEmail', {
    method: 'POST',
    body: {
      name: params.name,
      email_domain: params.domain,
    },
  });
}

export async function rrBulkLookup(orgId: string, ids: string[]) {
  return rrFetch(orgId, '/v2/api/bulk/lookup', {
    method: 'POST',
    body: { ids },
  });
}

export function clearSettingsCache(orgId?: string) {
  if (orgId) {
    settingsCache.delete(orgId);
  } else {
    settingsCache.clear();
  }
}
