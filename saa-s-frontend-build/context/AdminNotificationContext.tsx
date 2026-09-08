'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { AdminNotification } from '@/lib/types';
import {
  adminNotificationHref,
  browserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from '@/lib/admin-notification-utils';

const POLL_INTERVAL_MS = 5_000;

type AdminNotificationContextValue = {
  items: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  refresh: () => Promise<void>;
  refreshItems: () => Promise<void>;
  markRead: (notificationId: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  enableBrowserNotifications: () => Promise<void>;
};

const AdminNotificationContext = createContext<
  AdminNotificationContextValue | undefined
>(undefined);

function isStaffUser(user: ReturnType<typeof useAuth>['user']): boolean {
  return !user?.roles?.some((r: { name?: string }) =>
    r.name?.toLowerCase() === 'driver',
  );
}

export function AdminNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const staff = isStaffUser(user);

  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => browserNotificationPermission());

  const lastPolledIdRef = useRef(0);
  const initializedRef = useRef(false);

  const handleIncoming = useCallback(
    (incoming: AdminNotification[]) => {
      if (incoming.length === 0) return;

      setUnreadCount((count) => count + incoming.length);
      setItems((prev) => {
        const existing = new Set(prev.map((item) => item.id));
        const merged = [...incoming.filter((item) => !existing.has(item.id)), ...prev];
        return merged.slice(0, 30);
      });

      for (const item of incoming) {
        const href = adminNotificationHref(item);
        showBrowserNotification(item, () => {
          window.focus();
          router.push(href);
        });

        if (document.hasFocus()) {
          toast.info(item.title, {
            description: item.message,
            action: {
              label: 'Open',
              onClick: () => router.push(href),
            },
          });
        }
      }
    },
    [router],
  );

  const refresh = useCallback(async () => {
    if (!staff) return;
    try {
      const res = await apiClient.getAdminNotificationUnreadCount();
      setUnreadCount(res.count ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, [staff]);

  const refreshItems = useCallback(async () => {
    if (!staff) return;
    setLoading(true);
    try {
      const res = await apiClient.getAdminNotifications({ per_page: 15 });
      const nextItems = res.data ?? [];
      setItems(nextItems);
      const maxId = nextItems.reduce((max, item) => Math.max(max, item.id), 0);
      if (maxId > lastPolledIdRef.current) {
        lastPolledIdRef.current = maxId;
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [staff]);

  const pollNew = useCallback(async () => {
    if (!staff) return;
    try {
      const res = await apiClient.getRecentAdminNotifications(
        lastPolledIdRef.current,
      );
      const incoming = res.data ?? [];
      if (incoming.length > 0) {
        const maxId = incoming.reduce((max, item) => Math.max(max, item.id), 0);
        lastPolledIdRef.current = Math.max(lastPolledIdRef.current, maxId);
        handleIncoming(incoming);
      }
    } catch {
      // Ignore transient poll failures.
    }
  }, [staff, handleIncoming]);

  const markRead = useCallback(
    async (notificationId: number) => {
      await apiClient.markAdminNotificationRead(notificationId);
      setUnreadCount((count) => Math.max(0, count - 1));
      setItems((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? { ...item, read_at: item.read_at ?? new Date().toISOString() }
            : item,
        ),
      );
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    await apiClient.markAllAdminNotificationsRead();
    setUnreadCount(0);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        read_at: item.read_at ?? new Date().toISOString(),
      })),
    );
  }, []);

  const enableBrowserNotifications = useCallback(async () => {
    const permission = await requestBrowserNotificationPermission();
    setPushPermission(permission);
    if (permission === 'granted') {
      toast.success('Browser notifications enabled');
    } else if (permission === 'denied') {
      toast.error('Browser notifications are blocked in your browser settings');
    }
  }, []);

  useEffect(() => {
    if (!staff) {
      initializedRef.current = false;
      lastPolledIdRef.current = 0;
      setItems([]);
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      try {
        const res = await apiClient.getAdminNotifications({ per_page: 1 });
        const latest = res.data?.[0];
        lastPolledIdRef.current = latest?.id ?? 0;
        initializedRef.current = true;
        await refresh();
      } catch {
        initializedRef.current = true;
      }
    };

    void bootstrap();

    const interval = window.setInterval(() => {
      if (!cancelled && initializedRef.current) {
        void pollNew();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [staff, pollNew, refresh]);

  const value: AdminNotificationContextValue = {
    items,
    unreadCount,
    loading,
    pushPermission,
    refresh,
    refreshItems,
    markRead,
    markAllRead,
    enableBrowserNotifications,
  };

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications(): AdminNotificationContextValue {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error(
      'useAdminNotifications must be used within AdminNotificationProvider',
    );
  }
  return context;
}
