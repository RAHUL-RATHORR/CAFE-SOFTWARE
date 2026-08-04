"use client";

import { useEffect, useRef, useState } from "react";
import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ColumnVisibilityItem = {
  id: string;
  label: string;
  visible: boolean;
  canHide?: boolean;
};

type ColumnVisibilityMenuProps = {
  columns: ColumnVisibilityItem[];
  className?: string;
  onChange?: (columnId: string, visible: boolean) => void;
};

/**
 * UI-only column visibility menu.
 */
export function ColumnVisibilityMenu({
  columns,
  className,
  onChange,
}: ColumnVisibilityMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 rounded-xl gap-2"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Columns3 className="size-4" aria-hidden />
        Columns
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-52 rounded-xl border border-border bg-popover p-2 shadow-md"
        >
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Toggle columns
          </p>
          <ul className="space-y-1">
            {columns.map((column) => (
              <li key={column.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-input accent-primary"
                    checked={column.visible}
                    disabled={column.canHide === false}
                    onChange={(event) =>
                      onChange?.(column.id, event.target.checked)
                    }
                  />
                  <span className="truncate">{column.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
