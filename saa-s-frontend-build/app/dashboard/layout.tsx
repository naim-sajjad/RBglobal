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
