import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TableLoadingSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

export function TableLoadingSkeleton({
  rows = 6,
  columns = 6,
  className,
}: TableLoadingSkeletonProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <div className="border-b bg-muted/40 px-4 py-3">
        <div className="flex gap-3">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`head-${index}`} className="h-4 flex-1 rounded-md" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-3 px-4 py-3.5">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-4 flex-1 rounded-md"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
