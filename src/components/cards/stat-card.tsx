"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StatTrend } from "@/types";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  trend?: StatTrend;
  icon?: ReactNode;
  accent?: "primary" | "success" | "warning" | "danger";
  className?: string;
};

const accentStyles = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
} as const;

export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  accent = "primary",
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("h-full", className)}
    >
      <Card className="h-full rounded-xl shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon ? (
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-xl",
                accentStyles[accent]
              )}
            >
              {icon}
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-semibold tracking-tight md:text-3xl">{value}</p>
          {trend ? (
            <div className="flex items-center gap-1.5 text-xs">
              <TrendIndicator trend={trend} />
              <span className="text-muted-foreground">{trend.label}</span>
            </div>
          ) : null}
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TrendIndicator({ trend }: { trend: StatTrend }) {
  if (trend.direction === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 font-medium text-success">
        <TrendingUp className="size-3.5" aria-hidden />
        {trend.value}%
      </span>
    );
  }

  if (trend.direction === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 font-medium text-destructive">
        <TrendingDown className="size-3.5" aria-hidden />
        {trend.value}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 font-medium text-muted-foreground">
      <Minus className="size-3.5" aria-hidden />
      {trend.value}%
    </span>
  );
}
