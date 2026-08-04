"use client";

import { useMemo } from "react";
import { useBranchStore } from "@/store/branch-store";
import {
  getBranchStatusLabel,
  toBranchSummary,
  toBranchSwitcherOptions,
} from "@/lib/branches";

export function useBranch() {
  const currentBranch = useBranchStore((s) => s.currentBranch);
  const availableBranches = useBranchStore((s) => s.availableBranches);
  const recentBranchIds = useBranchStore((s) => s.recentBranchIds);
  const isSwitching = useBranchStore((s) => s.isSwitching);
  const hasHydrated = useBranchStore((s) => s.hasHydrated);
  const switchBranch = useBranchStore((s) => s.switchBranch);
  const setCurrentBranch = useBranchStore((s) => s.setCurrentBranch);
  const clearBranch = useBranchStore((s) => s.clearBranch);

  const options = useMemo(
    () => toBranchSwitcherOptions(availableBranches, currentBranch?.id),
    [availableBranches, currentBranch?.id]
  );

  const recentBranches = useMemo(() => {
    return recentBranchIds
      .map((id) => availableBranches.find((b) => b.id === id))
      .filter(Boolean) as typeof availableBranches;
  }, [recentBranchIds, availableBranches]);

  const summary = currentBranch ? toBranchSummary(currentBranch) : null;

  return {
    currentBranch,
    availableBranches,
    recentBranches,
    options,
    summary,
    isSwitching,
    hasHydrated,
    statusLabel: currentBranch
      ? getBranchStatusLabel(currentBranch.status)
      : null,
    switchBranch,
    setCurrentBranch,
    clearBranch,
  };
}

export function useCurrentBranch() {
  const currentBranch = useBranchStore((s) => s.currentBranch);
  const hasHydrated = useBranchStore((s) => s.hasHydrated);
  return { branch: currentBranch, hasHydrated };
}
