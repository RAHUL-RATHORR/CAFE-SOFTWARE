import type { ReactNode } from "react";
import { ErrorState } from "@/components/common/error-state";
import { AppIcon } from "@/components/icons";
import type { ErrorStateKind } from "@/types";

const errorCopy: Record<
  ErrorStateKind,
  { title: string; description: string }
> = {
  "404": {
    title: "Page not found",
    description: "The page you are looking for does not exist.",
  },
  "403": {
    title: "Access restricted",
    description: "You do not have permission to view this content.",
  },
  "500": {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
  },
  network: {
    title: "Network error",
    description: "Check your connection and try again.",
  },
  permission: {
    title: "Permission denied",
    description: "Your role cannot perform this action.",
  },
  retry: {
    title: "Unable to load",
    description: "We could not load this content. Retry to continue.",
  },
};

type DsErrorStateProps = {
  kind?: ErrorStateKind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  icon?: ReactNode;
};

export function DsErrorState({
  kind = "retry",
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  className,
  icon,
}: DsErrorStateProps) {
  const copy = errorCopy[kind];
  return (
    <ErrorState
      title={title ?? copy.title}
      description={description ?? copy.description}
      onRetry={onRetry}
      retryLabel={retryLabel}
      className={className}
      icon={icon ?? <AppIcon name="close" className="size-6" />}
    />
  );
}

export function Error404(props: Omit<DsErrorStateProps, "kind">) {
  return <DsErrorState {...props} kind="404" />;
}

export function Error403(props: Omit<DsErrorStateProps, "kind">) {
  return <DsErrorState {...props} kind="403" />;
}

export function Error500(props: Omit<DsErrorStateProps, "kind">) {
  return <DsErrorState {...props} kind="500" />;
}

export function NetworkError(props: Omit<DsErrorStateProps, "kind">) {
  return <DsErrorState {...props} kind="network" />;
}

export function PermissionDenied(props: Omit<DsErrorStateProps, "kind">) {
  return <DsErrorState {...props} kind="permission" />;
}

export function RetryError(props: Omit<DsErrorStateProps, "kind">) {
  return <DsErrorState {...props} kind="retry" retryLabel={props.retryLabel ?? "Retry"} />;
}
