'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error occurred:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-red-500 mb-2">Oops!</h1>
          <p className="text-slate-400">Something went wrong</p>
        </div>

        <p className="text-slate-300 mb-8">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="border-slate-600 bg-transparent">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
