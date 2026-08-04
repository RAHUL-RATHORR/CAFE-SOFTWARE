"use client";

import { useEffect, useTransition } from "react";
import {
  Bell,
  CheckCheck,
  ClipboardList,
  ChefHat,
  Receipt,
  Users,
  Settings,
  Shield,
  Package,
  Truck,
  UserCog,
  CreditCard,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  RightDrawer,
  DrawerHeader,
  DrawerBody,
} from "@/components/drawers";
import { useNotificationStore } from "@/store/notification-store";
import {
  getNotifications,
  markNotificationsRead,
} from "@/actions/notification";
import { formatRelativeTime } from "@/lib/notification/formatters";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationCategory } from "@/types";
import type { Notification } from "@/types/notification";

const categoryIcon: Record<NotificationCategory, typeof Bell> = {
  orders: ClipboardList,
  kitchen: ChefHat,
  billing: Receipt,
  customers: Users,
  system: Settings,
  security: Shield,
  inventory: Package,
  purchases: Truck,
  staff: UserCog,
  subscription: CreditCard,
  admin: Shield,
  announcements: Megaphone,
};

function toAppNotification(item: Notification): AppNotification {
  return {
    id: item.id,
    title: item.title,
    description: item.message,
    category: (item.category as NotificationCategory) || "system",
    createdAt: formatRelativeTime(item.createdAt),
    read: item.status !== "unread",
    actionUrl: item.actionUrl || undefined,
  };
}

export function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-12 text-center">
      <Bell className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">No notifications</p>
      <p className="text-xs text-muted-foreground">
        You&apos;re all caught up for now.
      </p>
    </div>
  );
}

export function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead?: (id: string) => void;
}) {
  const Icon = categoryIcon[notification.category] ?? Bell;

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/50",
        !notification.read && "border-primary/20 bg-accent/30"
      )}
      onClick={() => onRead?.(notification.id)}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{notification.title}</p>
          {!notification.read ? (
            <span
              className="mt-1 size-2 shrink-0 rounded-full bg-primary"
              aria-label="Unread"
            />
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {notification.description}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {notification.category} · {notification.createdAt}
        </p>
      </div>
    </button>
  );
}

export function NotificationCard({
  notifications,
  onRead,
}: {
  notifications: AppNotification[];
  onRead?: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return <NotificationEmptyState />;
  }

  return (
    <div className="space-y-2">
      {notifications.map((item) => (
        <NotificationItem key={item.id} notification={item} onRead={onRead} />
      ))}
    </div>
  );
}

export function NotificationBell() {
  const togglePanel = useNotificationStore((state) => state.togglePanel);
  const unread = useNotificationStore((state) => state.unreadCount);
  const hydrate = useNotificationStore((state) => state.hydrateFromServer);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getNotifications({
        page: 1,
        pageSize: 20,
        status: "all",
        type: "all",
        category: "all",
        priority: "all",
      });
      if (cancelled || !result.success) return;
      hydrate(
        result.data.items.map(toAppNotification),
        result.data.unreadCount
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative rounded-xl"
      aria-label={
        unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
      }
      onClick={togglePanel}
    >
      <Bell className="size-4" />
      {unread > 0 ? (
        <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Button>
  );
}

export function NotificationDrawer() {
  const isOpen = useNotificationStore((state) => state.isOpen);
  const closePanel = useNotificationStore((state) => state.closePanel);
  const notifications = useNotificationStore((state) => state.notifications);
  const markAllReadLocal = useNotificationStore((state) => state.markAllRead);
  const markReadLocal = useNotificationStore((state) => state.markRead);
  const hydrate = useNotificationStore((state) => state.hydrateFromServer);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      const result = await getNotifications({
        page: 1,
        pageSize: 30,
        status: "all",
        type: "all",
        category: "all",
        priority: "all",
      });
      if (cancelled || !result.success) return;
      hydrate(
        result.data.items.map(toAppNotification),
        result.data.unreadCount
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, hydrate]);

  function markAll() {
    startTransition(async () => {
      markAllReadLocal();
      await markNotificationsRead({ markAll: true });
    });
  }

  function markOne(id: string) {
    startTransition(async () => {
      markReadLocal(id);
      await markNotificationsRead({ ids: [id] });
    });
  }

  return (
    <RightDrawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closePanel();
      }}
      aria-label="Notification center"
    >
      <DrawerHeader onClose={closePanel}>
        <div>
          <h2 className="text-base font-semibold">Notifications</h2>
          <p className="text-xs text-muted-foreground">
            In-app alerts from across DineFlow
          </p>
        </div>
      </DrawerHeader>
      <div className="flex items-center justify-between border-b border-border px-5 py-2">
        <p className="text-xs text-muted-foreground">
          {notifications.filter((item) => !item.read).length} unread
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 rounded-lg text-xs"
            disabled={isPending}
            onClick={markAll}
          >
            <CheckCheck className="size-3.5" aria-hidden />
            Mark all read
          </Button>
          <Link
            href="/notifications"
            onClick={closePanel}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Open
          </Link>
        </div>
      </div>
      <DrawerBody>
        <NotificationCard notifications={notifications} onRead={markOne} />
      </DrawerBody>
    </RightDrawer>
  );
}
