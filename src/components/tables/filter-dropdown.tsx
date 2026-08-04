"use client";

import { cn } from "@/lib/utils";
import type { FilterOption } from "@/types";

type FilterDropdownProps = {
  label: string;
  value?: string;
  defaultValue?: string;
  options: FilterOption[];
  className?: string;
  onChange?: (value: string) => void;
};

/**
 * UI-only filter select. Does not apply real filtering.
 */
export function FilterDropdown({
  label,
  value,
  defaultValue,
  options,
  className,
  onChange,
}: FilterDropdownProps) {
  return (
    <label className={cn("flex min-w-[140px] flex-col gap-1", className)}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
