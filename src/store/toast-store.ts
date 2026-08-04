"use client";

import { create } from "zustand";
import type { ToastItem, ToastTone } from "@/types";

type ToastInput = Omit<ToastItem, "id"> & { id?: string };

type ToastState = {
  toasts: ToastItem[];
  pushToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

function createId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = toast.id ?? createId();
    const next: ToastItem = {
      id,
      title: toast.title,
      description: toast.description,
      tone: toast.tone,
      duration: toast.persistent ? null : (toast.duration ?? 4000),
      persistent: toast.persistent ?? false,
      actionLabel: toast.actionLabel,
      undoLabel: toast.undoLabel,
    };

    set({ toasts: [...get().toasts, next] });
    return id;
  },
  dismissToast: (id) =>
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
  clearToasts: () => set({ toasts: [] }),
}));

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().pushToast({ title, description, tone: "success" }),
  error: (title: string, description?: string) =>
    useToastStore.getState().pushToast({ title, description, tone: "error" }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().pushToast({ title, description, tone: "warning" }),
  info: (title: string, description?: string) =>
    useToastStore.getState().pushToast({ title, description, tone: "info" }),
  loading: (title: string, description?: string) =>
    useToastStore
      .getState()
      .pushToast({ title, description, tone: "loading" as ToastTone, persistent: true }),
};
