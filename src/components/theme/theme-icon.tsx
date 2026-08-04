import { Monitor, Moon, Sun } from "lucide-react";
import type { ThemeMode } from "@/types";
import { cn } from "@/lib/utils";

type ThemeIconProps = {
  mode: ThemeMode;
  className?: string;
};

export function ThemeIcon({ mode, className }: ThemeIconProps) {
  if (mode === "dark") {
    return <Moon className={cn("size-4", className)} aria-hidden />;
  }

  if (mode === "system") {
    return <Monitor className={cn("size-4", className)} aria-hidden />;
  }

  return <Sun className={cn("size-4", className)} aria-hidden />;
}
