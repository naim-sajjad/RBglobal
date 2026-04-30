'use client';

import '@/admin/globals.css';
import React from "react"
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Routes that require super-admin
  const superAdminRoutes = ['/admin/tenants'];
  
  // Check if current route requires super-admin
  const requiresSuperAdmin = superAdminRoutes.some(route => pathname?.startsWith(route));
  
  return (
    <ProtectedRoute requiredRole={requiresSuperAdmin ? 'super-admin' : undefined}>
      <div className="flex h-screen bg-slate-900 dark">
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-64">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-8 text-white [&_.text-muted-foreground]:text-slate-400">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
