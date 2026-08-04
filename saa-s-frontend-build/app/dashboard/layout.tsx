'use client';

import '@/frontend/globals.css';
import React from "react"
import { Sidebar } from '@/components/Sidebar';
import {Header} from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-slate-900 dark">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col md:ml-64">
          <Header />
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="min-w-0 p-4 text-white sm:p-6 lg:p-8 [&_.text-muted-foreground]:text-slate-400 [&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer [&_select]:cursor-pointer [&_input[type=file]]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
