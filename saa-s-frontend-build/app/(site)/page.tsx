'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SiteLoader } from '@/components/web/SiteLoader';

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
          router.push('/home');
       //   router.push('/dashboard');
        }
      } else {
        router.push('/home');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return <SiteLoader />;
}


