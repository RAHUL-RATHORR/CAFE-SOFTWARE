import { FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptySearchStateProps = {
  query?: string;
  className?: string;
};

export function EmptySearchState({ query, className }: EmptySearchStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 py-10 text-center",
        className
      )}
    >
      <FileSearch className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">No results found</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        {query
          ? `Nothing matched “${query}”. Try another keyword.`
          : "Start typing to search pages and actions."}
      </p>
    </div>
  );
}
