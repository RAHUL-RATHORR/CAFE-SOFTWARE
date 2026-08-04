import type { ReactNode } from "react";
import {
  TableHead,
  TableHeader as UiTableHeader,
  TableRow as UiTableHeaderRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TableHeaderProps = {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
};

/**
 * Enterprise table header wrapper with optional sticky support.
 */
export function TableHeader({
  children,
  className,
  sticky = true,
}: TableHeaderProps) {
  return (
    <UiTableHeader
      className={cn(
        sticky && "sticky top-0 z-10 bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80",
        className
      )}
    >
      <UiTableHeaderRow className="hover:bg-transparent">{children}</UiTableHeaderRow>
    </UiTableHeader>
  );
}

type TableHeaderCellProps = {
  children: ReactNode;
  className?: string;
};

export function TableHeaderCell({ children, className }: TableHeaderCellProps) {
  return (
    <TableHead
      className={cn(
        "h-11 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
        className
      )}
    >
      {children}
    </TableHead>
  );
}
