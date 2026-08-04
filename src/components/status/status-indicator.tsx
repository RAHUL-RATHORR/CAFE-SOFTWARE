import { cn } from "@/lib/utils";
import { DsBadge } from "@/components/badges";
import type { StatusDisplay, StatusKind } from "@/types";

const statusMeta: Record<
  StatusKind,
  { label: string; tone: "success" | "warning" | "danger" | "info" | "secondary" | "soft" }
> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "secondary" },
  pending: { label: "Pending", tone: "warning" },
  preparing: { label: "Preparing", tone: "info" },
  cooking: { label: "Cooking", tone: "info" },
  ready: { label: "Ready", tone: "success" },
  completed: { label: "Completed", tone: "soft" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  draft: { label: "Draft", tone: "secondary" },
  published: { label: "Published", tone: "success" },
  archived: { label: "Archived", tone: "secondary" },
  online: { label: "Online", tone: "success" },
  offline: { label: "Offline", tone: "secondary" },
  busy: { label: "Busy", tone: "danger" },
  away: { label: "Away", tone: "warning" },
};

const toneDot: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-sky-500",
  secondary: "bg-muted-foreground",
  soft: "bg-primary",
};

type StatusIndicatorProps = {
  status: StatusKind;
  display?: StatusDisplay;
  className?: string;
};

export function StatusIndicator({
  status,
  display = "badge",
  className,
}: StatusIndicatorProps) {
  const meta = statusMeta[status];

  if (display === "dot") {
    return (
      <span
        className={cn("inline-flex items-center gap-2 text-sm", className)}
        aria-label={meta.label}
      >
        <span className={cn("size-2 rounded-full", toneDot[meta.tone])} />
        <span>{meta.label}</span>
      </span>
    );
  }

  if (display === "chip" || display === "pill") {
    return (
      <DsBadge
        variant={meta.tone === "soft" ? "soft" : meta.tone}
        className={cn(display === "pill" && "rounded-full", className)}
      >
        <span className={cn("size-1.5 rounded-full", toneDot[meta.tone])} />
        {meta.label}
      </DsBadge>
    );
  }

  return (
    <DsBadge
      variant={meta.tone === "soft" ? "soft" : meta.tone}
      className={className}
    >
      {meta.label}
    </DsBadge>
  );
}

export { statusMeta };
