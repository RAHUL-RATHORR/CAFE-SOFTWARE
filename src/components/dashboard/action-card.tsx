"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
};

export function ActionCard({
  href,
  title,
  description,
  icon,
  className,
}: ActionCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn("h-full", className)}
    >
      <Link
        href={href}
        className="group flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:border-primary/25 hover:shadow-md"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <ArrowUpRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
              aria-hidden
            />
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </Link>
    </motion.div>
  );
}
