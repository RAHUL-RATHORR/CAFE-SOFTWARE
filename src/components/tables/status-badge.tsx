import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TableStatus } from "@/types";

const statusStyles: Record<TableStatus, string> = {
  success: "bg-success/10 text-success border-transparent",
  pending: "bg-warning/10 text-warning border-transparent",
  processing: "bg-primary/10 text-primary border-transparent",
  cancelled: "bg-destructive/10 text-destructive border-transparent",
  inactive: "bg-muted text-muted-foreground border-transparent",
  draft: "bg-secondary text-secondary-foreground border-transparent",
};

const statusLabels: Record<TableStatus, string> = {
  success: "Success",
  pending: "Pending",
  processing: "Processing",
  cancelled: "Cancelled",
  inactive: "Inactive",
  draft: "Draft",
};

type StatusBadgeProps = {
  status: TableStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(statusStyles[status], className)}
    >
      {statusLabels[status]}
    </Badge>
  );
}
