"use client";

import { Clock } from "lucide-react";
import { BranchOptionRow } from "@/components/branches/branch-selector-dropdown";
import type { Branch } from "@/types/branch";
import { cn } from "@/lib/utils";

type RecentBranchesPlaceholderProps = {
  branches: Branch[];
  currentBranchId?: string | null;
  onSelect?: (branchId: string) => void;
  className?: string;
};

/**
 * Recent branches list placeholder — client history only.
 */
export function RecentBranchesPlaceholder({
  branches,
  currentBranchId,
  onSelect,
  className,
}: RecentBranchesPlaceholderProps) {
  if (branches.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground",
          className
        )}
      >
        <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
          <Clock className="size-4" aria-hidden />
          Recent branches
        </div>
        <p>No recent branches yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="size-4 text-muted-foreground" aria-hidden />
        Recent branches
      </div>
      <ul className="space-y-1 rounded-xl border border-border/70 bg-card p-1.5">
        {branches.map((branch) => (
          <li key={branch.id}>
            <BranchOptionRow
              option={{
                id: branch.id,
                name: branch.name,
                branchCode: branch.branchCode,
                city: branch.city,
                status: branch.status,
                isMainBranch: branch.isMainBranch,
                isActive: branch.id === currentBranchId,
              }}
              selected={branch.id === currentBranchId}
              onSelect={() => onSelect?.(branch.id)}
            />
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Local history only — not synced to the server.
      </p>
    </div>
  );
}
