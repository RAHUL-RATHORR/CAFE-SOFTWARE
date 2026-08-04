"use client";

import { Button } from "@/components/ui/button";
import { ThemeIcon } from "@/components/theme/theme-icon";
import { useThemeStore } from "@/store/theme-store";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

/**
 * Cycles light → dark → system.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const nextMode =
    mode === "light" ? "dark" : mode === "dark" ? "system" : "light";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("rounded-xl", className)}
      aria-label={`Theme: ${mode}. Click to switch to ${nextMode}`}
      onClick={() => setMode(nextMode)}
    >
      <ThemeIcon mode={mode} />
    </Button>
  );
}
