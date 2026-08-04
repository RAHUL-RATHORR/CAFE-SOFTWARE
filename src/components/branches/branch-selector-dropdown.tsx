"use client";

import { ChevronsUpDown } from "lucide-react";
import { BranchAvatar } from "@/components/branches/branch-avatar";
import { BranchBadge } from "@/components/branches/branch-badge";
import type { BranchSwitcherOption } from "@/types/branch";
import { cn } from "@/lib/utils";

type BranchSelectorDropdownProps = {
  options: BranchSwitcherOption[];
  value?: string | null;
  onChange?: (branchId: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
};

/**
 * Native select dropdown for branch selection — UI only.
 */
export function BranchSelectorDropdown({
  options,
  value,
  onChange,
  disabled,
  className,
  id = "branch-selector",
  label = "Select branch",
}: BranchSelectorDropdownProps) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        disabled={disabled || options.length === 0}
        value={value ?? ""}
        onChange={(event) => {
          if (event.target.value) onChange?.(event.target.value);
        }}
        aria-label={label}
        className="h-10 w-full appearance-none rounded-xl border border-border bg-background pr-9 pl-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {options.length === 0 ? (
          <option value="">No branches available</option>
        ) : (
          options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
              {option.isMainBranch ? " (Main)" : ""} — {option.branchCode}
            </option>
          ))
        )}
      </select>
      <ChevronsUpDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

type BranchOptionRowProps = {
  option: BranchSwitcherOption;
  selected?: boolean;
  onSelect?: () => void;
};

export function BranchOptionRow({
  option,
  selected,
  onSelect,
}: BranchOptionRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        selected ? "bg-primary/10" : "hover:bg-muted/60"
      )}
    >
      <BranchAvatar name={option.name} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{option.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {option.branchCode}
          {option.city ? ` · ${option.city}` : ""}
        </span>
      </span>
      <BranchBadge status={option.status} isMainBranch={option.isMainBranch} />
    </button>
  );
}
