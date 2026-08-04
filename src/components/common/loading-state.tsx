import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
  fullHeight?: boolean;
};

export function LoadingState({
  label = "Loading...",
  className,
  fullHeight = false,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center",
        fullHeight && "min-h-[320px]",
        className
      )}
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
