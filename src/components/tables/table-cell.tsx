import type { ReactNode } from "react";
import { TableCell as UiTableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TableCellProps = {
  children: ReactNode;
  className?: string;
};

export function TableCell({ children, className }: TableCellProps) {
  return (
    <UiTableCell className={cn("px-4 py-3 text-sm", className)}>
      {children}
    </UiTableCell>
  );
}
