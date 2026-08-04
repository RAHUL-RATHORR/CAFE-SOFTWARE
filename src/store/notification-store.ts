"use client";

import { create } from "zustand";
import type { AppNotification } from "@/types";
import { sampleNotifications } from "@/store/data/sample-notifications";

type NotificationState = {
  isOpen: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  hydrated: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  hydrateFromServer: (
    notifications: AppNotification[],
    unreadCount?: number
  ) => void;
  setUnreadCount: (count: number) => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  isOpen: false,
  notifications: sampleNotifications,
  unreadCount: sampleNotifications.filter((item) => !item.read).length,
  hydrated: false,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set({ isOpen: !get().isOpen }),
  markAllRead: () =>
    set({
      notifications: get().notifications.map((item) => ({
        ...item,
        read: true,
      })),
      unreadCount: 0,
    }),
  markRead: (id) => {
    const notifications = get().notifications.map((item) =>
      item.id === id ? { ...item, read: true } : item
    );
    set({
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
    });
  },
  hydrateFromServer: (notifications, unreadCount) =>
    set({
      notifications,
      unreadCount:
        unreadCount ?? notifications.filter((item) => !item.read).length,
      hydrated: true,
    }),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
