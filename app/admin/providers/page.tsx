import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ProvidersClient } from './providers-client';

export default async function ProvidersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  if (session.user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You must be an admin to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <ProvidersClient />;
}
