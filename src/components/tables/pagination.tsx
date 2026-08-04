"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page?: number;
  totalPages?: number;
  className?: string;
  onPageChange?: (page: number) => void;
};

/**
 * UI-only pagination controls. Does not slice data.
 */
export function Pagination({
  page = 1,
  totalPages = 1,
  className,
  onPageChange,
}: PaginationProps) {
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <p className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 rounded-xl"
          disabled={!canGoPrev}
          aria-label="Previous page"
          onClick={() => onPageChange?.(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 rounded-xl"
          disabled={!canGoNext}
          aria-label="Next page"
          onClick={() => onPageChange?.(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
