'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { TenantSwitcher } from './TenantSwitcher';
import { User } from 'lucide-react';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-700 bg-slate-800/95 backdrop-blur supports-[backdrop-filter]:bg-slate-800/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          {/* Tenant Switcher */}
          <TenantSwitcher />
        </div>

        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            <div className="hidden md:block">
              <p className="text-white font-medium">{user?.name}</p>
              <p className="text-slate-400 text-xs">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

