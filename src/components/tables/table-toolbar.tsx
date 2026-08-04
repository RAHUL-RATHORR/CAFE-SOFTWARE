"use client";

import type { ReactNode } from "react";
import { Download, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/tables/search-input";
import { FilterDropdown } from "@/components/tables/filter-dropdown";
import { ColumnVisibilityMenu, type ColumnVisibilityItem } from "@/components/tables/column-visibility-menu";
import { cn } from "@/lib/utils";
import type { FilterOption } from "@/types";

type TableToolbarProps = {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  categoryOptions?: FilterOption[];
  categoryValue?: string;
  onCategoryChange?: (value: string) => void;
  dateValue?: string;
  onDateChange?: (value: string) => void;
  columns?: ColumnVisibilityItem[];
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void;
  selectedCount?: number;
  onRefresh?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  trailing?: ReactNode;
  className?: string;
};

/**
 * Enterprise table toolbar — UI only (no real filter/search/export logic).
 */
export function TableToolbar({
  searchPlaceholder = "Search records...",
  searchValue,
  onSearchChange,
  statusOptions,
  statusValue,
  onStatusChange,
  categoryOptions,
  categoryValue,
  onCategoryChange,
  dateValue,
  onDateChange,
  columns,
  onColumnVisibilityChange,
  selectedCount = 0,
  onRefresh,
  onExport,
  onImport,
  trailing,
  className,
}: TableToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchInput
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={onSearchChange}
          />

          {statusOptions ? (
            <FilterDropdown
              label="Status filter"
              options={statusOptions}
              value={statusValue}
              onChange={onStatusChange}
            />
          ) : null}

          {categoryOptions ? (
            <FilterDropdown
              label="Category filter"
              options={categoryOptions}
              value={categoryValue}
              onChange={onCategoryChange}
            />
          ) : null}

          <label className="flex min-w-[150px] flex-col">
            <span className="sr-only">Date filter</span>
            <input
              type="date"
              aria-label="Date filter placeholder"
              value={dateValue}
              onChange={(event) => onDateChange?.(event.target.value)}
              className="h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {columns ? (
            <ColumnVisibilityMenu
              columns={columns}
              onChange={onColumnVisibilityChange}
            />
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl gap-2"
            onClick={onRefresh}
          >
            <RefreshCw className="size-4" aria-hidden />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl gap-2"
            onClick={onImport}
          >
            <Upload className="size-4" aria-hidden />
            Import
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl gap-2"
            onClick={onExport}
          >
            <Download className="size-4" aria-hidden />
            Export
          </Button>
          {trailing}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {selectedCount > 0
          ? `${selectedCount} row${selectedCount === 1 ? "" : "s"} selected`
          : "No rows selected"}
      </p>
    </div>
  );
}
