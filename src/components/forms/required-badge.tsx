import { cn } from "@/lib/utils";

type RequiredBadgeProps = {
  className?: string;
};

export function RequiredBadge({ className }: RequiredBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-destructive uppercase",
        className
      )}
    >
      Required
    </span>
  );
}
