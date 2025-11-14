import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AgentController } from '@/lib/agent/AgentController';

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prompt, type, aiProviderId, emailProviderId } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const orgId = session.user.orgId || '';
    const userId = session.user.id!;

    // Create and execute agent
    const controller = new AgentController(
      orgId,
      userId,
      aiProviderId,
      emailProviderId
    );

    const task = await controller.executeTask(prompt, type || 'custom');

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Agent execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute agent' },
      { status: 500 }
    );
  }
}
