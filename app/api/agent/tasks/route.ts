import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AgentController } from '@/lib/agent/AgentController';

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('id');
    const orgId = session.user.orgId || '';

    if (taskId) {
      // Get specific task
      const task = await AgentController.getTaskById(taskId);
      
      if (!task || task.organizationId !== orgId) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      return NextResponse.json({ task });
    }

    // List all tasks for organization
    const limit = parseInt(searchParams.get('limit') || '50');
    const tasks = await AgentController.listTasks(orgId, limit);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
