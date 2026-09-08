'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminNotifications } from '@/context/AdminNotificationContext';
import { adminNotificationHref } from '@/lib/admin-notification-utils';
import { AdminNotification } from '@/lib/types';
import { cn, formatApiDate } from '@/lib/utils';

export function AdminNotificationBell() {
  const router = useRouter();
  const {
    items,
    unreadCount,
    loading,
    pushPermission,
    refreshItems,
    markRead,
    markAllRead,
    enableBrowserNotifications,
  } = useAdminNotifications();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      void refreshItems();
    }
  }, [open, refreshItems]);

  const handleOpenItem = async (item: AdminNotification) => {
    try {
      if (!item.read_at) {
        await markRead(item.id);
      }
    } catch {
      // still navigate
    }

    setOpen(false);
    router.push(adminNotificationHref(item));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='relative text-slate-300 hover:bg-slate-700 hover:text-white'
          aria-label='Notifications'
        >
          <Bell className='h-5 w-5' />
          {unreadCount > 0 ? (
            <span className='absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='w-80 bg-slate-800 border-slate-700 text-white p-0'
      >
        <div className='flex items-center justify-between px-3 py-2 border-b border-slate-700'>
          <DropdownMenuLabel className='p-0 text-slate-200'>
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <button
              type='button'
              className='text-xs text-sky-300 hover:text-white'
              onClick={() => void markAllRead()}
            >
              Mark all read
            </button>
          ) : null}
        </div>

        {pushPermission === 'default' ? (
          <div className='px-3 py-2 border-b border-slate-700'>
            <button
              type='button'
              className='text-xs text-sky-300 hover:text-white'
              onClick={() => void enableBrowserNotifications()}
            >
              Enable browser notifications
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className='px-3 py-4 text-sm text-slate-400'>Loading…</p>
        ) : items.length === 0 ? (
          <p className='px-3 py-4 text-sm text-slate-400'>No notifications yet.</p>
        ) : (
          <div className='max-h-80 overflow-y-auto'>
            {items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className={cn(
                  'cursor-pointer flex flex-col items-start gap-1 px-3 py-2.5 rounded-none focus:bg-slate-700 focus:text-white',
                  !item.read_at && 'bg-slate-700/40',
                )}
                onClick={() => void handleOpenItem(item)}
              >
                <span className='text-sm font-medium leading-snug'>
                  {item.title}
                </span>
                <span className='text-xs text-slate-400 line-clamp-2'>
                  {item.message}
                </span>
                <span className='text-[10px] text-slate-500'>
                  {formatApiDate(item.created_at)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <DropdownMenuSeparator className='bg-slate-700 m-0' />
        <DropdownMenuItem
          asChild
          className='cursor-pointer justify-center text-sky-300 focus:bg-slate-700 focus:text-white rounded-none'
        >
          <Link href='/admin/timesheets/adjustment-requests' onClick={() => setOpen(false)}>
            View adjustment requests
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
