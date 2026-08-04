"use client";

import { forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      onChange,
      placeholder = "Search pages, actions, and settings...",
      className,
      onKeyDown,
    },
    ref
  ) {
    return (
      <div className={cn("relative", className)}>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Global search"
          autoComplete="off"
          spellCheck={false}
          className="h-12 w-full rounded-xl border-0 bg-transparent pr-4 pl-10 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    );
  }
);
