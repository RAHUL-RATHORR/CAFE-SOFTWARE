import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/empty-state";

export type ColumnDef<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  caption?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  getRowKey: (row: T) => string;
};

export function DataTable<T>({
  columns,
  data,
  caption,
  emptyTitle = "No records found",
  emptyDescription = "There is no data to display yet.",
  className,
  getRowKey,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} className={className} />
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      <Table>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
