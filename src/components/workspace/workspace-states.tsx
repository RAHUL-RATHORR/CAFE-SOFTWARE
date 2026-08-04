"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  Construction,
  Inbox,
  Loader2,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { WorkspaceViewState } from "@/types/workspace";

type WorkspaceStatePanelProps = {
  state?: WorkspaceViewState;
  className?: string;
  onRetry?: () => void;
  emptyMessage?: string;
  errorMessage?: string;
};

const copy: Record<
  Exclude<WorkspaceViewState, "ready">,
  { title: string; description: string; icon: typeof Inbox }
> = {
  loading: {
    title: "Loading workspace",
    description: "Preparing your workspace layout…",
    icon: Loader2,
  },
  empty: {
    title: "Nothing here yet",
    description: "This workspace area has no content to show.",
    icon: Inbox,
  },
  error: {
    title: "Something went wrong",
    description: "The workspace could not load this view.",
    icon: AlertTriangle,
  },
  offline: {
    title: "You are offline",
    description: "Reconnect to continue working in the workspace.",
    icon: WifiOff,
  },
  maintenance: {
    title: "Under maintenance",
    description: "This workspace area is temporarily unavailable.",
    icon: Construction,
  },
};

export function WorkspaceStatePanel({
  state,
  className,
  onRetry,
  emptyMessage,
  errorMessage,
}: WorkspaceStatePanelProps) {
  const storeState = useWorkspaceStore((s) => s.viewState);
  const viewState = state ?? storeState;

  if (viewState === "ready") return null;

  const meta = copy[viewState];
  const Icon = meta.icon;
  const description =
    viewState === "empty"
      ? emptyMessage ?? meta.description
      : viewState === "error"
        ? errorMessage ?? meta.description
        : meta.description;

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className
      )}
      role="status"
      aria-live="polite"
      data-workspace-state={viewState}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon
          className={cn("size-5", viewState === "loading" && "animate-spin")}
          aria-hidden
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{meta.title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {(viewState === "error" || viewState === "offline") && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={!onRetry}
        >
          Retry
        </Button>
      )}
    </div>
  );
}

type WorkspaceLayoutStatesProps = {
  children: ReactNode;
  className?: string;
  onRetry?: () => void;
};

/**
 * Renders children when workspace is ready; otherwise shows a layout state panel.
 */
export function WorkspaceLayoutStates({
  children,
  className,
  onRetry,
}: WorkspaceLayoutStatesProps) {
  const viewState = useWorkspaceStore((s) => s.viewState);

  if (viewState !== "ready") {
    return (
      <WorkspaceStatePanel
        state={viewState}
        className={className}
        onRetry={onRetry}
      />
    );
  }

  return <>{children}</>;
}
