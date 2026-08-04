"use client";

import { motion } from "framer-motion";
import { ThemeIcon } from "@/components/theme/theme-icon";
import { useThemeStore } from "@/store/theme-store";
import { cn } from "@/lib/utils";
import type { ThemeMode } from "@/types";

const previews: {
  value: ThemeMode;
  label: string;
  swatches: string[];
}[] = [
  {
    value: "light",
    label: "Light",
    swatches: ["#F8FAFC", "#FFFFFF", "#2563EB", "#E2E8F0"],
  },
  {
    value: "dark",
    label: "Dark",
    swatches: ["#020617", "#0F172A", "#3B82F6", "#1E293B"],
  },
  {
    value: "system",
    label: "System",
    swatches: ["#F8FAFC", "#0F172A", "#2563EB", "#64748B"],
  },
];

type ThemePreviewCardProps = {
  className?: string;
};

export function ThemePreviewCard({ className }: ThemePreviewCardProps) {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {previews.map((preview) => {
        const active = mode === preview.value;
        return (
          <motion.button
            key={preview.value}
            type="button"
            whileHover={{ y: -2 }}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors",
              active
                ? "border-primary bg-accent/40 shadow-sm"
                : "border-border hover:border-primary/30"
            )}
            aria-pressed={active}
            onClick={() => setMode(preview.value)}
          >
            <div className="mb-3 flex h-16 overflow-hidden rounded-lg border border-border">
              {preview.swatches.map((color) => (
                <span
                  key={color}
                  className="flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <ThemeIcon mode={preview.value} />
              <span className="text-sm font-medium">{preview.label}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
