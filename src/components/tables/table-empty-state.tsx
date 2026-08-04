import type { ReactNode } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TableEmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: ReactNode;
  className?: string;
};

export function TableEmptyState({
  title = "No records found",
  description = "Try adjusting filters or create a new record to get started.",
  actionLabel = "Add record",
  onAction,
  illustration,
  className,
}: TableEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center",
        className
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {illustration ?? <FileSpreadsheet className="size-7" aria-hidden />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {onAction ? (
        <Button type="button" className="rounded-xl" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
