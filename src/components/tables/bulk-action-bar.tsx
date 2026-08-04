"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BulkActionBarProps = {
  selectedCount: number;
  className?: string;
  actions?: ReactNode;
  onClear?: () => void;
};

/**
 * UI-only bulk action bar. No mutations.
 */
export function BulkActionBar({
  selectedCount,
  className,
  actions,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-accent/50 px-4 py-3",
        className
      )}
    >
      <p className="text-sm font-medium text-foreground">
        {selectedCount} selected
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {actions ?? (
          <>
            <Button type="button" variant="outline" size="sm" className="rounded-xl">
              Mark complete
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-xl">
              Archive
            </Button>
            <Button type="button" variant="destructive" size="sm" className="rounded-xl">
              Delete
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-xl"
          onClick={onClear}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
