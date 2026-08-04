"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ModalSize } from "@/types";

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[min(96vw,1200px)] h-[min(92vh,900px)]",
};

type BaseModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  size?: ModalSize;
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlay?: boolean;
  "aria-label"?: string;
};

export function ModalOverlay({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      aria-hidden
    />
  );
}

export function ModalCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="absolute top-3 right-3 rounded-xl"
      onClick={onClick}
      aria-label="Close dialog"
    >
      <X className="size-4" />
    </Button>
  );
}

export function ModalHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border px-5 py-4 pr-12", className)}>
      {children}
    </div>
  );
}

export function ModalBody({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function ModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BaseModal({
  open,
  onOpenChange,
  children,
  size = "md",
  className,
  showCloseButton = true,
  closeOnOverlay = true,
  "aria-label": ariaLabel = "Dialog",
}: BaseModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open, onOpenChange]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <ModalOverlay
            onClick={closeOnOverlay ? () => onOpenChange(false) : undefined}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn(
              "relative z-50 flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg outline-none",
              sizeClasses[size],
              size === "full" && "flex flex-col",
              className
            )}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {showCloseButton ? (
              <ModalCloseButton onClick={() => onOpenChange(false)} />
            ) : null}
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
