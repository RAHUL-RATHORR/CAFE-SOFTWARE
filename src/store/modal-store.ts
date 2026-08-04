"use client";

import { create } from "zustand";

type ModalState = {
  activeModalId: string | null;
  payload: Record<string, unknown> | null;
  openModal: (id: string, payload?: Record<string, unknown>) => void;
  closeModal: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
  activeModalId: null,
  payload: null,
  openModal: (id, payload = {}) =>
    set({ activeModalId: id, payload }),
  closeModal: () => set({ activeModalId: null, payload: null }),
}));
