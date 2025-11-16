import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AIProvidersClient from '@/components/admin/ai-providers-client';

export default async function AIProvidersPage() {
  const session = await auth();
  
  if (!session || !session.user || session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Global AI Provider Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configure AI providers that will be used across the entire platform for all organizations. API keys are stored in plain text.
        </p>
      </div>
      
      <Suspense fallback={<div className="text-center py-12">Loading providers...</div>}>
        <AIProvidersClient />
      </Suspense>
    </div>
  );
}
