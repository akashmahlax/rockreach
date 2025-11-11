import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getEmailProviders,
  upsertEmailProvider,
  deleteEmailProvider,
} from '@/models/ProviderSettings';
import { createAuditLog } from '@/models/AuditLog';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const orgId = session.user.orgId || '';
    const providers = await getEmailProviders(orgId);

    // Don't send credentials to client
    const safeProviders = providers.map(p => ({
      ...p,
      apiKey: undefined,
      smtpConfig: p.smtpConfig
        ? { ...p.smtpConfig, password: undefined }
        : undefined,
      hasCredentials: p.hasCredentials,
    }));

    return NextResponse.json({ providers: safeProviders });
  } catch (error) {
    console.error('Failed to fetch email providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email providers' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      _id,
      provider,
      name,
      apiKey,
      smtpConfig,
      fromEmail,
      fromName,
      isEnabled,
      isDefault,
      dailyLimit,
    } = body;

    if (!provider || !name || !fromEmail || !fromName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate credentials based on provider
    if (provider === 'smtp' && !smtpConfig) {
      return NextResponse.json(
        { error: 'SMTP configuration required for SMTP provider' },
        { status: 400 }
      );
    }

    if (provider !== 'smtp' && !apiKey) {
      return NextResponse.json(
        { error: 'API key required for this provider' },
        { status: 400 }
      );
    }

    const orgId = session.user.orgId || '';
    const userId = session.user.id!;

    const result = await upsertEmailProvider(orgId, userId, {
      _id,
      provider,
      name,
      apiKey,
      smtpConfig,
      fromEmail,
      fromName,
      isEnabled: isEnabled ?? true,
      isDefault: isDefault ?? false,
      dailyLimit,
    });

    // Audit log
    if (result) {
      await createAuditLog({
        orgId,
        actorId: userId,
        action: _id ? 'update_email_provider' : 'create_email_provider',
        target: 'email_provider',
        targetId: result._id as string,
        meta: {
          provider,
          name,
          isDefault,
        },
      });
    }

    return NextResponse.json({ success: true, provider: result });
  } catch (error) {
    console.error('Failed to upsert email provider:', error);
    return NextResponse.json(
      { error: 'Failed to save email provider' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('id');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    const orgId = session.user.orgId || '';
    const deleted = await deleteEmailProvider(orgId, providerId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Audit log
    await createAuditLog({
      orgId,
      actorId: session.user.id!,
      action: 'delete_email_provider',
      target: 'email_provider',
      targetId: providerId,
      meta: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete email provider:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to delete email provider';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
