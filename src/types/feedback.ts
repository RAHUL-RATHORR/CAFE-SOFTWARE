import type { ReactNode } from "react";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export type DrawerSide = "left" | "right" | "bottom";

export type ConfirmVariant =
  | "delete"
  | "logout"
  | "archive"
  | "deactivate"
  | "publish"
  | "reset"
  | "discard"
  | "custom";

export type AlertTone = "success" | "warning" | "danger" | "info" | "error";

export type ToastTone = "success" | "error" | "warning" | "info" | "loading";

export type NotificationCategory =
  | "orders"
  | "kitchen"
  | "billing"
  | "customers"
  | "system"
  | "security"
  | "inventory"
  | "purchases"
  | "staff"
  | "subscription"
  | "admin"
  | "announcements";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  duration?: number | null;
  persistent?: boolean;
  actionLabel?: string;
  undoLabel?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  createdAt: string;
  read: boolean;
  /** Optional deep-link when available from server notifications */
  actionUrl?: string;
};

export type ConfirmDialogConfig = {
  id: string;
  variant: ConfirmVariant;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Optional confirm handler — invoked when the user confirms */
  onConfirm?: () => void | Promise<void>;
};

export type AlertDialogConfig = {
  id: string;
  tone: AlertTone;
  title: string;
  description: string;
  actionLabel?: string;
};

export type ModalRenderProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
};
