"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchShortcutHint } from "@/components/search/search-shortcut-hint";
import { useSearchStore } from "@/store/search-store";
import { cn } from "@/lib/utils";

type GlobalSearchProps = {
  className?: string;
  compact?: boolean;
};

/**
 * Global search trigger. Opens the command palette foundation.
 */
export function GlobalSearch({ className, compact = false }: GlobalSearchProps) {
  const openSearch = useSearchStore((state) => state.openSearch);

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("rounded-xl", className)}
        aria-label="Open search"
        onClick={openSearch}
      >
        <Search className="size-4" />
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      className={cn(
        "hidden h-9 w-full max-w-xs items-center gap-2 rounded-xl border border-input bg-background px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50 lg:flex",
        className
      )}
      aria-label="Open global search"
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">Search...</span>
      <SearchShortcutHint />
    </button>
  );
}
