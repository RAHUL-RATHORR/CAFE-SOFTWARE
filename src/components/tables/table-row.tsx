import type { ReactNode } from "react";
import { TableRow as UiTableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TableRowProps = {
  children: ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
};

export function TableRow({
  children,
  className,
  selected = false,
  onClick,
}: TableRowProps) {
  return (
    <UiTableRow
      data-state={selected ? "selected" : undefined}
      onClick={onClick}
      className={cn(
        "transition-colors hover:bg-muted/50 data-[state=selected]:bg-accent/40",
        className
      )}
    >
      {children}
    </UiTableRow>
  );
}
