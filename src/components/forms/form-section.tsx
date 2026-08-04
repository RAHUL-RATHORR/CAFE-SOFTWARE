import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5",
        className
      )}
    >
      {(title || description) && (
        <header className="space-y-1 border-b border-border pb-3">
          {title ? (
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
}
