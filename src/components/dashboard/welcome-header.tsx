"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";

type WelcomeHeaderProps = {
  restaurantName: string;
  subtitle?: string;
};

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function WelcomeHeader({
  restaurantName,
  subtitle = "Here's what's happening today.",
}: WelcomeHeaderProps) {
  const { greeting, formattedDate } = useMemo(() => {
    const now = new Date();
    return {
      greeting: getGreeting(now),
      formattedDate: new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(now),
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-6"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{greeting},</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {restaurantName}
        </h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="inline-flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
        <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
        <span>{formattedDate}</span>
      </div>
    </motion.section>
  );
}
