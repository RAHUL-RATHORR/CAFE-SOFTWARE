"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeIcon } from "@/components/theme/theme-icon";
import { useThemeStore } from "@/store/theme-store";
import { cn } from "@/lib/utils";
import type { ThemeMode } from "@/types";

const modes: { value: ThemeMode; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Bright workspace" },
  { value: "dark", label: "Dark", description: "Low-light friendly" },
  { value: "system", label: "System", description: "Match device setting" },
];

type ThemeMenuProps = {
  className?: string;
};

export function ThemeMenu({ className }: ThemeMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const current = modes.find((item) => item.value === mode) ?? modes[2];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full justify-between rounded-xl gap-2"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="inline-flex items-center gap-2">
          <ThemeIcon mode={mode} />
          {current.label}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </Button>

      {open ? (
        <div
          role="listbox"
          aria-label="Select theme"
          className="absolute z-40 mt-2 w-full rounded-xl border border-border bg-popover p-1.5 shadow-md"
        >
          {modes.map((option) => {
            const active = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted",
                  active && "bg-accent/50"
                )}
                onClick={() => {
                  setMode(option.value);
                  setOpen(false);
                }}
              >
                <ThemeIcon mode={option.value} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </span>
                {active ? <Check className="size-4 text-primary" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
