"use client";

import { GitBranch } from "lucide-react";
import { BranchAvatar } from "@/components/branches/branch-avatar";
import { BranchSelectorDropdown } from "@/components/branches/branch-selector-dropdown";
import { useBranch } from "@/hooks/branches";
import { cn } from "@/lib/utils";

type BranchSwitcherProps = {
  className?: string;
  showLabel?: boolean;
};

/**
 * Branch switcher — switches among dummy branches in client state only.
 */
export function BranchSwitcher({
  className,
  showLabel = true,
}: BranchSwitcherProps) {
  const {
    currentBranch,
    options,
    hasHydrated,
    isSwitching,
    switchBranch,
  } = useBranch();

  if (!hasHydrated) {
    return (
      <div
        className={cn(
          "h-10 w-56 animate-pulse rounded-xl bg-muted/50",
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <div className={cn("flex min-w-[12rem] flex-col gap-1.5", className)}>
      {showLabel ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <GitBranch className="size-3.5" aria-hidden />
          Current branch
        </span>
      ) : null}
      <div className="flex items-center gap-2">
        {currentBranch ? (
          <BranchAvatar name={currentBranch.name} size="sm" />
        ) : null}
        <BranchSelectorDropdown
          className="flex-1"
          options={options}
          value={currentBranch?.id}
          onChange={switchBranch}
          disabled={isSwitching}
          label="Switch branch"
        />
      </div>
    </div>
  );
}
