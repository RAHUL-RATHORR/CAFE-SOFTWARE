import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-warning/10 text-warning border-transparent",
  preparing: "bg-primary/10 text-primary border-transparent",
  ready: "bg-success/10 text-success border-transparent",
  completed: "bg-muted text-muted-foreground border-transparent",
  cancelled: "bg-destructive/10 text-destructive border-transparent",
};

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", statusStyles[status], className)}
    >
      {status}
    </Badge>
  );
}
