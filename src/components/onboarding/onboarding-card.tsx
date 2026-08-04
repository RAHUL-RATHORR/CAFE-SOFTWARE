"use client";

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

type OnboardingCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function OnboardingCard({
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: OnboardingCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border-border/70 shadow-sm",
        className
      )}
    >
      {(title || description) && (
        <CardHeader className="space-y-1.5 border-b border-border/60 pb-4">
          {title ? (
            <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
          ) : null}
          {description ? (
            <CardDescription className="text-sm leading-relaxed">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
      )}
      <CardContent className={cn("pt-6", contentClassName)}>{children}</CardContent>
      {footer ? (
        <CardFooter className="border-t border-border/60 pt-4">{footer}</CardFooter>
      ) : null}
    </Card>
  );
}
