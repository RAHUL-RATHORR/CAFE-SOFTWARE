"use client";

import { Button } from "@/components/ui/button";
import { ThemeIcon } from "@/components/theme/theme-icon";
import { useThemeStore } from "@/store/theme-store";
import { cn } from "@/lib/utils";
import type { ThemeMode } from "@/types";

const modes: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

type ThemeSwitcherProps = {
  className?: string;
};

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex rounded-xl border border-border bg-muted/50 p-1",
        className
      )}
    >
      {modes.map((option) => {
        const active = mode === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            variant={active ? "default" : "ghost"}
            size="sm"
            className="h-8 gap-1.5 rounded-lg px-2.5"
            onClick={() => setMode(option.value)}
          >
            <ThemeIcon mode={option.value} />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
