"use client";

import { DsBadge } from "@/components/badges/ds-badge";
import { getBranchStatusLabel } from "@/lib/branches";
import type { BranchStatus } from "@/types/branch";

type BranchBadgeProps = {
  status: BranchStatus;
  isMainBranch?: boolean;
  className?: string;
};

const statusVariant = {
  active: "success",
  inactive: "secondary",
  "coming-soon": "info",
  "temporarily-closed": "warning",
} as const;

export function BranchBadge({
  status,
  isMainBranch,
  className,
}: BranchBadgeProps) {
  return (
    <span className={className}>
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <DsBadge variant={statusVariant[status]} size="sm">
          {getBranchStatusLabel(status)}
        </DsBadge>
        {isMainBranch ? (
          <DsBadge variant="soft" size="sm">
            Main
          </DsBadge>
        ) : null}
      </span>
    </span>
  );
}
