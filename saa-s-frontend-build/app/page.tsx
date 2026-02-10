'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect based on role - check roles array or is_global_admin
        const isSuperAdmin = user?.is_global_admin || 
          user?.roles?.some((role: any) => role.name === 'super-admin') || 
          false;
        
        if (isSuperAdmin) {
          router.push('/admin/tenants');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/home');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-8 w-8 text-blue-500" />
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
