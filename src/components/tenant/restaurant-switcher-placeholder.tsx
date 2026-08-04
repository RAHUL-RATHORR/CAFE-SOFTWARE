"use client";

import { Building2, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/tenant";
import { toSwitcherOptions } from "@/lib/tenant";
import { cn } from "@/lib/utils";

type RestaurantSwitcherPlaceholderProps = {
  className?: string;
};

/**
 * Restaurant switching UI placeholder — no network calls.
 * Ready for future multi-restaurant account support.
 */
export function RestaurantSwitcherPlaceholder({
  className,
}: RestaurantSwitcherPlaceholderProps) {
  const { currentTenant, tenants, switchTenant, isReady } = useTenant();
  const options = toSwitcherOptions(tenants, currentTenant?.id);

  if (!isReady) {
    return (
      <div
        className={cn(
          "h-9 w-44 animate-pulse rounded-xl bg-muted/50",
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <div className={cn("relative", className)}>
      <label htmlFor="tenant-switcher" className="sr-only">
        Switch restaurant
      </label>
      <div className="flex items-center gap-2">
        <Building2 className="size-4 text-muted-foreground" aria-hidden />
        {options.length > 0 ? (
          <div className="relative">
            <select
              id="tenant-switcher"
              className="h-9 appearance-none rounded-xl border border-border bg-background pr-8 pl-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={currentTenant?.id ?? ""}
              onChange={(event) => {
                if (event.target.value) switchTenant(event.target.value);
              }}
              aria-label="Current restaurant"
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <ChevronsUpDown
              className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled>
            No restaurants yet
          </Button>
        )}
      </div>
    </div>
  );
}
