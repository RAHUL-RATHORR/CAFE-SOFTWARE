"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type WorkspaceBodyProps = {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
};

export function WorkspaceBody({
  children,
  className,
  scrollable = true,
}: WorkspaceBodyProps) {
  return (
    <motion.div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        scrollable && "overflow-auto",
        className
      )}
      data-workspace-slot="body"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
