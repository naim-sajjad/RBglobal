'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function UnauthorizedPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400">You don't have permission to access this resource</p>
        </div>

        <p className="text-slate-300 mb-8">
          Your current role does not have the necessary permissions to view this page. Please contact your administrator if you believe this is an error.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Go to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={logout}
            className="w-full border-slate-600 bg-transparent"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
