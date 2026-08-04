import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type FormDividerProps = {
  label?: string;
  className?: string;
};

export function FormDivider({ label, className }: FormDividerProps) {
  if (!label) {
    return <Separator className={cn("my-2", className)} />;
  }

  return (
    <div className={cn("flex items-center gap-3 py-1", className)}>
      <Separator className="flex-1" />
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
