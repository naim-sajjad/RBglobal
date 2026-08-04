'use client';

import React from 'react';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Shield,
  Lock,
  LogOut,
  Menu,
  X,
  Truck,
  User,
  Briefcase,
  Layers,
  FileSpreadsheet,
  Calendar,
  Receipt,
  Banknote,
  Percent,
  Building2,
  UserPlus,
  Globe2,
  ChevronDown,
  ClipboardList,
  Newspaper,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredRole?: string;
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [websiteOpen, setWebsiteOpen] = useState(true);

  // Check if user is super-admin
  const isSuperAdmin =
    user?.is_global_admin ||
    user?.roles?.some((role: any) => role.name === 'super-admin') ||
    false;
  // Check if user is a driver
  const isDriver =
    user?.roles?.some((role: any) => role.name?.toLowerCase() === 'driver') ||
    false;
  // For drivers, show Profile and Timesheets
  const navItems: NavItem[] = isDriver
    ? [
        {
          label: 'My Profile',
          href: '/driver/profile',
          icon: <User className='w-5 h-5' />,
        },
        {
          label: 'Timesheets',
          href: '/driver/timesheets',
          icon: <FileSpreadsheet className='w-5 h-5' />,
        },
      ]
    : [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: <LayoutDashboard className='w-5 h-5' />,
        },
        {
          label: 'Users',
          href: '/admin/users',
          icon: <Users className='w-5 h-5' />,
        },
        {
          label: 'Roles',
          href: '/admin/roles',
          icon: <Shield className='w-5 h-5' />,
        },
        {
          label: 'Permissions',
          href: '/admin/permissions',
          icon: <Lock className='w-5 h-5' />,
        },
        {
          label: 'Drivers',
          href: '/admin/drivers',
          icon: <Truck className='w-5 h-5' />,
        },
        {
          label: 'Driver registration',
          href: '/driver/register',
          icon: <UserPlus className='w-5 h-5' />,
        },
        {
          label: 'Driver Classes',
          href: '/admin/driver-classes',
          icon: <Layers className='w-5 h-5' />,
        },
        {
          label: 'Employers',
          href: '/admin/employers',
          icon: <Briefcase className='w-5 h-5' />,
        },
        {
          label: 'Timesheets',
          href: '/admin/timesheets',
          icon: <Calendar className='w-5 h-5' />,
        },
        {
          label: 'Client billing',
          href: '/admin/billing/invoices',
          icon: <Receipt className='w-5 h-5' />,
        },
        {
          label: 'Payroll',
          href: '/admin/payroll',
          icon: <Banknote className='w-5 h-5' />,
        },
        {
          label: 'Tax configuration',
          href: '/admin/settings/billing-tax',
          icon: <Percent className='w-5 h-5' />,
        },
        {
          label: 'Company profile',
          href: '/admin/settings/company-profile',
          icon: <Building2 className='w-5 h-5' />,
        },
        ...(isSuperAdmin
          ? [
              {
                label: 'Tenants',
                href: '/admin/tenants',
                icon: <Users className='w-5 h-5' />,
                requiredRole: 'super-admin',
              },
            ]
          : []),
      ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className='fixed top-4 left-4 z-50 md:hidden'>
        <Button
          variant='outline'
          size='icon'
          onClick={() => setIsOpen(!isOpen)}
          className='text-white bg-slate-700 border-slate-600'
        >
          {isOpen ? <X className='h-4 w-4' /> : <Menu className='h-4 w-4' />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform bg-slate-800 border-r border-slate-700 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex flex-col h-full'>
          {/* Logo */}
          <div className='flex items-center justify-center h-16 border-b border-slate-700'>
            <h1 className='text-xl font-bold text-white'>R&B Global</h1>
          </div>

          {/* Navigation */}
          <nav className='flex-1 overflow-y-auto px-4 py-6 space-y-2'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className='flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors'
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            {!isDriver && (
              <div>
                <button
                  type='button'
                  onClick={() => setWebsiteOpen((open) => !open)}
                  className='flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors'
                >
                  <Globe2 className='w-5 h-5' />
                  <span className='flex-1 text-left'>Website</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${websiteOpen ? 'rotate-180' : ''}`} />
                </button>
                {websiteOpen && (
                  <div className='ml-5 mt-1 space-y-1 border-l border-slate-600 pl-3'>
                    {[
                      ['Forms and Submissions', '/dashboard/forms', <ClipboardList key='forms' className='w-4 h-4' />],
                      ['Blogs', '/dashboard/website/blogs', <Newspaper key='blog' className='w-4 h-4' />],
                      ['Jobs', '/dashboard/website/jobs', <Briefcase key='job' className='w-4 h-4' />],
                    ].map(([label, href, icon]) => (
                      <Link key={String(href)} href={String(href)} onClick={() => setIsOpen(false)}
                        className='flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-md'>
                        {icon}{label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* User section */}
          <div className='border-t border-slate-700 p-4 space-y-4'>
            <div className='text-sm'>
              <p className='text-slate-400 text-xs'>Signed in as</p>
              <p className='text-white font-medium truncate'>
                {user?.name || user?.email}
              </p>
              <p className='text-slate-400 text-xs capitalize mt-1'>
                {user?.roles?.[0]?.name || 'user'}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant='outline'
              className='w-full gap-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 bg-transparent'
            >
              <LogOut className='w-4 h-4' />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 z-30 bg-black/50 md:hidden'
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
