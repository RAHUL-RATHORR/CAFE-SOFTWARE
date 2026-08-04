import type { ReactNode } from "react";

export type TableStatus =
  | "success"
  | "pending"
  | "processing"
  | "cancelled"
  | "inactive"
  | "draft";

export type SortDirection = "asc" | "desc" | null;

export type SampleTableRow = {
  id: string;
  name: string;
  status: TableStatus;
  date: string;
  amount: number;
  category: string;
  createdBy: string;
  lastUpdated: string;
};

export type TableColumnDef<T> = {
  id: string;
  header: string;
  accessorKey?: keyof T & string;
  className?: string;
  enableSorting?: boolean;
  enableHiding?: boolean;
  cell?: (row: T) => ReactNode;
};

export type FilterOption = {
  label: string;
  value: string;
};
