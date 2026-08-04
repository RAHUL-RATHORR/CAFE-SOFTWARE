"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
};

/**
 * UI-only search input. Wire filtering in future modules.
 */
export function SearchInput({
  value,
  defaultValue,
  placeholder = "Search...",
  className,
  onChange,
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full min-w-[180px] sm:max-w-xs", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 rounded-xl pl-8"
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  );
}
