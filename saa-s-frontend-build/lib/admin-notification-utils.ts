import { AdminNotification } from '@/lib/types';

export function adminNotificationHref(item: AdminNotification): string {
  // Prefer explicit href (e.g. timesheet submitted → detail).
  if (typeof item.meta?.href === 'string' && item.meta.href) {
    return item.meta.href;
  }
  if (item.meta?.review_id) {
    return `/admin/timesheets/adjustment-requests?id=${item.meta.review_id}`;
  }
  if (item.meta?.timesheet_id) {
    return `/admin/timesheets/${item.meta.timesheet_id}`;
  }
  return '/admin/timesheets';
}

export function canUseBrowserNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function browserNotificationPermission():
  | NotificationPermission
  | 'unsupported' {
  if (!canUseBrowserNotifications()) return 'unsupported';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!canUseBrowserNotifications()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function showBrowserNotification(
  item: AdminNotification,
  onClick?: () => void,
): void {
  if (!canUseBrowserNotifications() || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(item.title, {
      body: item.message,
      icon: '/icon.svg',
      tag: `admin-notification-${item.id}`,
      requireInteraction: false,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      notification.close();
      onClick?.();
    };
  } catch {
    // Ignore if the browser blocks notifications.
  }
}
