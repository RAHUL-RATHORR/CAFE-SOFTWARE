"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WorkspaceContextAreaProps = {
  children?: ReactNode;
  className?: string;
  title?: string;
  description?: string;
};

/**
 * Optional context strip between toolbar and page content
 * (filters, scope chips, secondary status — placeholder-ready).
 */
export function WorkspaceContextArea({
  children,
  className,
  title,
  description,
}: WorkspaceContextAreaProps) {
  if (!children && !title && !description) return null;

  return (
    <section
      className={cn(
        "border-b border-border bg-muted/30 px-4 py-2.5 md:px-6",
        className
      )}
      data-workspace-slot="context"
      aria-label={title ?? "Workspace context"}
    >
      {(title || description) && (
        <div className="mb-2 min-w-0">
          {title ? (
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
          ) : null}
          {description ? (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}
