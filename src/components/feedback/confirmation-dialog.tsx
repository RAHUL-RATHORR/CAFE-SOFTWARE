"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Archive,
  Eraser,
  LogOut,
  RotateCcw,
  Trash2,
  UploadCloud,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BaseModal,
  ModalFooter,
  ModalHeader,
} from "@/components/modals/base-modal";
import { useDialogStore } from "@/store/dialog-store";
import type { ConfirmVariant } from "@/types";

const variantMeta: Record<
  ConfirmVariant,
  { icon: typeof Trash2; confirmVariant: "default" | "destructive"; defaultConfirm: string }
> = {
  delete: { icon: Trash2, confirmVariant: "destructive", defaultConfirm: "Delete" },
  logout: { icon: LogOut, confirmVariant: "default", defaultConfirm: "Log out" },
  archive: { icon: Archive, confirmVariant: "default", defaultConfirm: "Archive" },
  deactivate: { icon: Ban, confirmVariant: "destructive", defaultConfirm: "Deactivate" },
  publish: { icon: UploadCloud, confirmVariant: "default", defaultConfirm: "Publish" },
  reset: { icon: RotateCcw, confirmVariant: "default", defaultConfirm: "Reset" },
  discard: { icon: Eraser, confirmVariant: "destructive", defaultConfirm: "Discard" },
  custom: { icon: AlertTriangle, confirmVariant: "default", defaultConfirm: "Confirm" },
};

type ConfirmationDialogProps = {
  onConfirm?: () => void;
};

/**
 * Global confirmation dialog host.
 * Drive via useDialogStore.openConfirm(...) or openConfirmDialog().
 */
export function ConfirmationDialog({ onConfirm }: ConfirmationDialogProps) {
  const confirm = useDialogStore((state) => state.confirm);
  const closeConfirm = useDialogStore((state) => state.closeConfirm);
  const [isPending, setIsPending] = useState(false);

  const open = !!confirm;
  const meta = confirm ? variantMeta[confirm.variant] : variantMeta.custom;
  const Icon = meta.icon;

  return (
    <BaseModal
      open={open}
      onOpenChange={(next) => {
        if (!next && !isPending) closeConfirm();
      }}
      size="sm"
      aria-label={confirm?.title ?? "Confirmation"}
    >
      {confirm ? (
        <>
          <ModalHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Icon className="size-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold">{confirm.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {confirm.description}
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isPending}
              onClick={closeConfirm}
            >
              {confirm.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              type="button"
              variant={meta.confirmVariant}
              className="rounded-xl"
              disabled={isPending}
              onClick={async () => {
                try {
                  setIsPending(true);
                  await confirm.onConfirm?.();
                  onConfirm?.();
                  closeConfirm();
                } finally {
                  setIsPending(false);
                }
              }}
            >
              {confirm.confirmLabel ?? meta.defaultConfirm}
            </Button>
          </ModalFooter>
        </>
      ) : null}
    </BaseModal>
  );
}
