"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WorkspaceFooterProps = {
  children?: ReactNode;
  className?: string;
};

export function WorkspaceFooter({ children, className }: WorkspaceFooterProps) {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-border bg-background/80 px-4 py-2 text-xs text-muted-foreground md:px-6",
        className
      )}
      data-workspace-slot="footer"
    >
      {children ?? (
        <div className="flex items-center justify-between gap-3">
          <span>Workspace ready</span>
          <span className="hidden sm:inline">DineFlow layout foundation</span>
        </div>
      )}
    </footer>
  );
}
