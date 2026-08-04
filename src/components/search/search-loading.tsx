import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SearchLoadingProps = {
  rows?: number;
  className?: string;
};

export function SearchLoading({ rows = 5, className }: SearchLoadingProps) {
  return (
    <div className={cn("space-y-2 px-2 py-3", className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Skeleton className="size-8 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
