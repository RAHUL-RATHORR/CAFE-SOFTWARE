"use client";

import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

type PageSizeSelectorProps = {
  value?: number;
  defaultValue?: number;
  options?: readonly number[];
  className?: string;
  onChange?: (size: number) => void;
};

/**
 * UI-only page size selector. Does not paginate data.
 */
export function PageSizeSelector({
  value,
  defaultValue = 10,
  options = PAGE_SIZE_OPTIONS,
  className,
  onChange,
}: PageSizeSelectorProps) {
  return (
    <label className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <span className="whitespace-nowrap">Rows per page</span>
      <select
        aria-label="Rows per page"
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={(event) => onChange?.(Number(event.target.value))}
        className="h-9 rounded-xl border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}
