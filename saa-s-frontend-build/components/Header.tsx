'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { TenantSwitcher } from './TenantSwitcher';
import { User, ChevronDown, Pencil, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const isDriver = user?.roles?.some((r: { name?: string }) => r.name?.toLowerCase() === 'driver');

  const handleEditProfile = () => {
    if (isDriver) {
      router.push('/driver/profile');
    } else {
      router.push('/dashboard/profile');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-700 bg-slate-800/95 backdrop-blur supports-[backdrop-filter]:bg-slate-800/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          {/* Tenant Switcher */}
          <TenantSwitcher />
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white focus-visible:ring-slate-400"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700">
                  <User className="h-4 w-4 text-slate-300" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-slate-400 text-xs">{user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
              <DropdownMenuLabel className="text-slate-200">
                <div className="flex flex-col gap-0.5">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs font-normal text-slate-400">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-600" />
              <DropdownMenuItem
                onClick={handleEditProfile}
                className="cursor-pointer text-slate-200 focus:bg-slate-700 focus:text-white"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-600" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-300 focus:bg-slate-700 focus:text-red-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

