import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AgentDashboardClient } from './agent-client';

export default async function AgentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  return <AgentDashboardClient user={session.user} />;
}
