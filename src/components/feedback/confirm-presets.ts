/**
 * Helpers for opening confirmation dialogs by variant (UI only).
 */
import { useDialogStore } from "@/store/dialog-store";
import type { ConfirmVariant } from "@/types";

const defaults: Record<
  Exclude<ConfirmVariant, "custom">,
  { title: string; description: string }
> = {
  delete: {
    title: "Delete item?",
    description: "This will permanently remove the selected item.",
  },
  logout: {
    title: "Log out?",
    description: "You will need to sign in again to continue.",
  },
  archive: {
    title: "Archive item?",
    description: "The item will be moved to the archive.",
  },
  deactivate: {
    title: "Deactivate item?",
    description: "This item will no longer be available.",
  },
  publish: {
    title: "Publish now?",
    description: "This will make the content visible immediately.",
  },
  reset: {
    title: "Reset values?",
    description: "All unsaved changes will be restored to defaults.",
  },
  discard: {
    title: "Discard changes?",
    description: "Unsaved edits will be lost.",
  },
};

export function openConfirmDialog(
  variant: ConfirmVariant,
  overrides?: {
    title?: string;
    description?: string;
    id?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void | Promise<void>;
  }
) {
  const preset =
    variant === "custom"
      ? {
          title: overrides?.title ?? "Confirm action",
          description: overrides?.description ?? "Please confirm to continue.",
        }
      : defaults[variant];

  useDialogStore.getState().openConfirm({
    id: overrides?.id ?? `confirm-${variant}`,
    variant,
    title: overrides?.title ?? preset.title,
    description: overrides?.description ?? preset.description,
    confirmLabel: overrides?.confirmLabel,
    cancelLabel: overrides?.cancelLabel,
    onConfirm: overrides?.onConfirm,
  });
}
