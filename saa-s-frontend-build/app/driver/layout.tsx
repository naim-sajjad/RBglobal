'use client';

import '@/frontend/globals.css';
import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';

/** Driver routes that do not require auth (no sidebar/header). */
const DRIVER_PUBLIC_PATHS = ['/driver/register'];

function isDriverPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return DRIVER_PUBLIC_PATHS.some((publicPath) => normalized === publicPath);
}

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicRoute = isDriverPublicPath(pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div className='flex h-screen bg-slate-900 dark'>
        <Sidebar />
        <div className='flex-1 flex flex-col md:ml-64'>
          <Header />
          <main className='flex-1 overflow-auto'>
            <div className='p-8 text-white [&_.text-muted-foreground]:text-slate-400'>{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
