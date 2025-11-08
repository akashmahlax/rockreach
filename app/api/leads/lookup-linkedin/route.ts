import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { upsertLead } from '@/models/Lead';
import { createAuditLog } from '@/models/AuditLog';
import { logApiUsage } from '@/models/ApiUsage';
import { getRocketReachSettings } from '@/models/RocketReachSettings';
import { decryptSecret, type EncryptedData } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { linkedinUrl } = body;

    if (!linkedinUrl || typeof linkedinUrl !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    // Validate LinkedIn URL format
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[\w-]+\/?/i;
    if (!linkedinRegex.test(linkedinUrl)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid LinkedIn URL format' },
        { status: 400 }
      );
    }

    const orgId = 'default';
    const startTime = Date.now();

    // Get RocketReach settings
    const settings = await getRocketReachSettings(orgId);
    if (!settings || !settings.isEnabled) {
      return NextResponse.json(
        { ok: false, error: 'RocketReach is not configured' },
        { status: 503 }
      );
    }

    const apiKey = settings.apiKeyEncrypted 
      ? decryptSecret(settings.apiKeyEncrypted as EncryptedData)
      : null;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'RocketReach API key not found' },
        { status: 503 }
      );
    }

    // Call RocketReach API to lookup profile by LinkedIn URL
    const baseUrl = settings.baseUrl || 'https://api.rocketreach.co';
    const url = new URL(`${baseUrl}/api/v2/person/lookup`);
    url.searchParams.append('linkedin_url', linkedinUrl);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Accept': 'application/json',
      },
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      await logApiUsage({
        orgId,
        provider: 'rocketreach',
        endpoint: '/api/v2/person/lookup',
        method: 'GET',
        units: 0,
        status: 'error',
        durationMs: responseTime,
        error: `HTTP ${response.status}: ${errorText}`,
      });
      
      return NextResponse.json(
        { ok: false, error: `RocketReach API error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Debug: Log what RocketReach returned
    console.log('RocketReach result:', JSON.stringify(result, null, 2));
    console.log('Emails from RocketReach:', result.emails);
    console.log('Phones from RocketReach:', result.phones);

    if (!result || !result.id) {
      return NextResponse.json(
        { ok: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Track API usage
    await logApiUsage({
      orgId,
      provider: 'rocketreach',
      endpoint: '/api/v2/person/lookup',
      method: 'GET',
      units: 1,
      status: 'success',
      durationMs: responseTime,
    });

    // Auto-save the lead
    const leadData = {
      orgId,
      personId: result.id?.toString() || `linkedin_${Date.now()}`,
      name: result.name || `${result.first_name || ''} ${result.last_name || ''}`.trim(),
      firstName: result.first_name,
      lastName: result.last_name,
      title: result.current_title || result.title,
      company: result.current_employer || result.employer,
      // Extract email strings from RocketReach email objects
      emails: Array.isArray(result.emails) 
        ? result.emails.map((e: string | { email?: string }) => typeof e === 'string' ? e : e.email).filter((email: string | undefined): email is string => Boolean(email))
        : [],
      // Extract phone strings from RocketReach phone objects
      phones: Array.isArray(result.phones)
        ? result.phones.map((p: string | { number?: string }) => typeof p === 'string' ? p : p.number).filter((phone: string | undefined): phone is string => Boolean(phone))
        : [],
      linkedin: result.linkedin_url || linkedinUrl,
      location: result.location,
      tags: [],
      raw: result,
    };

    // Debug: Log extracted data
    console.log('Extracted leadData:', {
      emails: leadData.emails,
      phones: leadData.phones,
    });

    const savedLead = await upsertLead(orgId, leadData.personId, leadData);

    // Log the action
    await createAuditLog({
      orgId,
      actorId: session.user.email || undefined,
      actorEmail: session.user.email || undefined,
      action: 'lookup_linkedin_profile',
      target: 'lead',
      targetId: savedLead?._id?.toString(),
      meta: {
        linkedinUrl,
        leadName: leadData.name,
        autoSaved: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: savedLead?._id?.toString() || leadData.personId,
        name: leadData.name,
        first_name: leadData.firstName,
        last_name: leadData.lastName,
        current_title: leadData.title,
        current_employer: leadData.company,
        emails: leadData.emails,
        phones: leadData.phones,
        linkedin_url: leadData.linkedin,
        location: leadData.location,
      },
      lead: savedLead,
      message: 'Profile found and saved successfully',
    });
  } catch (error) {
    console.error('LinkedIn lookup failed:', error);
    
    // Track failed API call
    try {
      await logApiUsage({
        orgId: 'default',
        provider: 'rocketreach',
        endpoint: '/api/v2/person/lookup',
        method: 'GET',
        units: 0,
        status: 'error',
        durationMs: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (e) {
      console.error('Failed to track API usage:', e);
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Lookup failed' },
      { status: 500 }
    );
  }
}
