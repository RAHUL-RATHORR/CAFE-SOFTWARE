"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

type WorkspaceHeaderProps = {
  children?: ReactNode;
  className?: string;
  sticky?: boolean;
};

export function WorkspaceHeader({
  children,
  className,
  sticky,
}: WorkspaceHeaderProps) {
  const stickyHeader = useWorkspaceStore((state) => state.stickyHeader);
  const isSticky = sticky ?? stickyHeader;

  return (
    <header
      className={cn(
        "border-b border-border bg-background/90 backdrop-blur-sm",
        isSticky && "sticky top-0 z-20",
        className
      )}
      data-workspace-slot="header"
    >
      {children}
    </header>
  );
}
