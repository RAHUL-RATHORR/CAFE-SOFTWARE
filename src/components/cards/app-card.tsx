import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AppCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AppCard({
  title,
  description,
  children,
  footer,
  action,
  className,
  contentClassName,
}: AppCardProps) {
  return (
    <Card className={cn("rounded-xl shadow-sm", className)}>
      {(title || description || action) && (
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              {title ? <CardTitle>{title}</CardTitle> : null}
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
            {action}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
