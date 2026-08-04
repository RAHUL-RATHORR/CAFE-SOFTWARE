"use client";

import type { ReactNode } from "react";
import { ConfirmationDialog } from "@/components/feedback/confirmation-dialog";
import { AlertDialog } from "@/components/feedback/alert-dialog";
import { ToastViewport } from "@/components/notifications/toast-viewport";
import { NotificationDrawer } from "@/components/notifications/notification-center";

type FeedbackProviderProps = {
  children: ReactNode;
};

/**
 * Hosts global UI interaction surfaces:
 * confirm/alert dialogs, toast viewport, notification drawer.
 * Drawer hydrates from the Notification Center server actions.
 */
export function FeedbackProvider({ children }: FeedbackProviderProps) {
  return (
    <>
      {children}
      <ConfirmationDialog />
      <AlertDialog />
      <ToastViewport />
      <NotificationDrawer />
    </>
  );
}
