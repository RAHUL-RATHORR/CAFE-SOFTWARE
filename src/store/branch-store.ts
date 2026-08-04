"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRANCH_STORAGE_KEY, DUMMY_BRANCHES } from "@/config/branches";
import { findMainBranch } from "@/lib/branches";
import type { Branch } from "@/types/branch";

type BranchState = {
  currentBranch: Branch | null;
  availableBranches: Branch[];
  recentBranchIds: string[];
  isSwitching: boolean;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setAvailableBranches: (branches: Branch[]) => void;
  setCurrentBranch: (branch: Branch | null) => void;
  /** Client-only switch among dummy branches — no API */
  switchBranch: (branchId: string) => void;
  setSwitching: (value: boolean) => void;
  clearBranch: () => void;
};

const MAX_RECENT = 5;

function pushRecent(ids: string[], nextId: string): string[] {
  return [nextId, ...ids.filter((id) => id !== nextId)].slice(0, MAX_RECENT);
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      currentBranch: findMainBranch(DUMMY_BRANCHES),
      availableBranches: DUMMY_BRANCHES,
      recentBranchIds: [DUMMY_BRANCHES[0]?.id].filter(Boolean) as string[],
      isSwitching: false,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setAvailableBranches: (branches) => {
        const current = get().currentBranch;
        const stillValid =
          current && branches.some((b) => b.id === current.id)
            ? current
            : findMainBranch(branches);
        set({
          availableBranches: branches,
          currentBranch: stillValid,
        });
      },
      setCurrentBranch: (branch) =>
        set({
          currentBranch: branch,
          recentBranchIds: branch
            ? pushRecent(get().recentBranchIds, branch.id)
            : get().recentBranchIds,
        }),
      switchBranch: (branchId) => {
        const branch = get().availableBranches.find((b) => b.id === branchId);
        if (!branch) return;
        set({
          isSwitching: true,
          currentBranch: branch,
          recentBranchIds: pushRecent(get().recentBranchIds, branch.id),
        });
        // Placeholder: no network — clear switching flag immediately
        queueMicrotask(() => set({ isSwitching: false }));
      },
      setSwitching: (value) => set({ isSwitching: value }),
      clearBranch: () => set({ currentBranch: null }),
    }),
    {
      name: BRANCH_STORAGE_KEY,
      partialize: (state) => ({
        currentBranch: state.currentBranch,
        availableBranches: state.availableBranches,
        recentBranchIds: state.recentBranchIds,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
