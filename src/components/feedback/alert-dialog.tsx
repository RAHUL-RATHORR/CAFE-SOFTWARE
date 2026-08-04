"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  OctagonAlert,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BaseModal,
  ModalFooter,
  ModalHeader,
} from "@/components/modals/base-modal";
import { useDialogStore } from "@/store/dialog-store";
import { cn } from "@/lib/utils";
import type { AlertTone } from "@/types";

const toneMeta: Record<
  AlertTone,
  { icon: typeof Info; className: string; defaultAction: string }
> = {
  success: {
    icon: CheckCircle2,
    className: "bg-success/10 text-success",
    defaultAction: "Continue",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-warning/10 text-warning",
    defaultAction: "Got it",
  },
  danger: {
    icon: OctagonAlert,
    className: "bg-destructive/10 text-destructive",
    defaultAction: "Dismiss",
  },
  error: {
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
    defaultAction: "Dismiss",
  },
  info: {
    icon: Info,
    className: "bg-primary/10 text-primary",
    defaultAction: "OK",
  },
};

/**
 * Global alert dialog host (UI only).
 * Drive via useDialogStore.openAlert(...).
 */
export function AlertDialog() {
  const alert = useDialogStore((state) => state.alert);
  const closeAlert = useDialogStore((state) => state.closeAlert);
  const open = !!alert;
  const meta = alert ? toneMeta[alert.tone] : toneMeta.info;
  const Icon = meta.icon;

  return (
    <BaseModal
      open={open}
      onOpenChange={(next) => {
        if (!next) closeAlert();
      }}
      size="sm"
      aria-label={alert?.title ?? "Alert"}
    >
      {alert ? (
        <>
          <ModalHeader>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  meta.className
                )}
              >
                <Icon className="size-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold">{alert.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {alert.description}
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalFooter>
            <Button
              type="button"
              className="rounded-xl"
              onClick={closeAlert}
            >
              {alert.actionLabel ?? meta.defaultAction}
            </Button>
          </ModalFooter>
        </>
      ) : null}
    </BaseModal>
  );
}
