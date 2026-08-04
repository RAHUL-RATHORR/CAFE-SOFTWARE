"use client";

import { create } from "zustand";
import type { AlertDialogConfig, ConfirmDialogConfig } from "@/types";

type DialogState = {
  confirm: ConfirmDialogConfig | null;
  alert: AlertDialogConfig | null;
  openConfirm: (config: ConfirmDialogConfig) => void;
  closeConfirm: () => void;
  openAlert: (config: AlertDialogConfig) => void;
  closeAlert: () => void;
};

export const useDialogStore = create<DialogState>((set) => ({
  confirm: null,
  alert: null,
  openConfirm: (config) => set({ confirm: config }),
  closeConfirm: () => set({ confirm: null }),
  openAlert: (config) => set({ alert: config }),
  closeAlert: () => set({ alert: null }),
}));
