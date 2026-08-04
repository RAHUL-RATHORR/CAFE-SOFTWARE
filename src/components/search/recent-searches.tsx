"use client";

import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RecentSearchesProps = {
  items: string[];
  onSelect: (value: string) => void;
  onClear?: () => void;
  className?: string;
};

export function RecentSearches({
  items,
  onSelect,
  onClear,
  className,
}: RecentSearchesProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("px-2 py-2", className)}>
      <div className="mb-1 flex items-center justify-between px-3">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Recent searches
        </p>
        {onClear ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg px-2 text-xs"
            onClick={onClear}
          >
            Clear
          </Button>
        ) : null}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted/70"
            onClick={() => onSelect(item)}
          >
            <Clock className="size-3.5 text-muted-foreground" aria-hidden />
            <span className="truncate">{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
