"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/types";

type SortButtonProps = {
  label: string;
  direction?: SortDirection;
  className?: string;
  onToggle?: () => void;
};

/**
 * UI-only sort control. Sorting logic belongs in future modules.
 */
export function SortButton({
  label,
  direction = null,
  className,
  onToggle,
}: SortButtonProps) {
  const Icon =
    direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("-ml-2 h-8 gap-1 px-2 font-medium", className)}
      onClick={onToggle}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
    </Button>
  );
}
