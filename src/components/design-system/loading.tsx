import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton, ListSkeleton } from "@/components/common/loading-skeletons";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { cn } from "@/lib/utils";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
    </span>
  );
}

export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-hidden>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-2 animate-pulse rounded-full bg-primary/70"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-4 md:p-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <CardSkeleton />
      <TableLoadingSkeleton />
    </div>
  );
}

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-4 md:p-6", className)}>
      <Skeleton className="h-24 w-full rounded-xl" />
      <CardSkeleton count={4} />
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-64 rounded-xl xl:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <TableLoadingSkeleton />
    </div>
  );
}

export {
  CardSkeleton,
  ListSkeleton,
  TableLoadingSkeleton as TableSkeleton,
};
