import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";

type CardSkeletonProps = {
  count?: number;
  className?: string;
};

export function CardSkeleton({ count = 4, className }: CardSkeletonProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-9 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

type ListSkeletonProps = {
  rows?: number;
  className?: string;
};

export function ListSkeleton({ rows = 5, className }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border bg-card p-3"
        >
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

type LoadingSkeletonsProps = {
  variant?: "table" | "cards" | "list";
  className?: string;
};

/**
 * Shared loading skeleton variants for cards, tables, and lists.
 */
export function LoadingSkeletons({
  variant = "table",
  className,
}: LoadingSkeletonsProps) {
  if (variant === "cards") {
    return <CardSkeleton className={className} />;
  }

  if (variant === "list") {
    return <ListSkeleton className={className} />;
  }

  return <TableLoadingSkeleton className={className} />;
}
