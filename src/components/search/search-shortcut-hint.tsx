import { Command } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchShortcutHintProps = {
  className?: string;
  keys?: string[];
};

export function SearchShortcutHint({
  className,
  keys = ["⌘", "K"],
}: SearchShortcutHintProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground",
        className
      )}
      aria-hidden
    >
      {keys.map((key) => (
        <kbd
          key={key}
          className="min-w-4 rounded-md px-1 text-center font-sans"
        >
          {key === "⌘" ? <Command className="inline size-3" /> : key}
        </kbd>
      ))}
    </span>
  );
}
