"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DrawerSide } from "@/types";

type BaseDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: DrawerSide;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  "aria-label"?: string;
};

const sideClasses: Record<DrawerSide, string> = {
  right: "inset-y-0 right-0 h-full w-full max-w-md border-l",
  left: "inset-y-0 left-0 h-full w-full max-w-md border-r",
  bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full border-t",
};

const sideMotion: Record<
  DrawerSide,
  { initial: { x?: string; y?: string }; animate: { x?: number; y?: number } }
> = {
  right: { initial: { x: "100%" }, animate: { x: 0 } },
  left: { initial: { x: "-100%" }, animate: { x: 0 } },
  bottom: { initial: { y: "100%" }, animate: { y: 0 } },
};

export function DrawerCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="rounded-xl"
      onClick={onClick}
      aria-label="Close drawer"
    >
      <X className="size-4" />
    </Button>
  );
}

export function DrawerHeader({
  children,
  className,
  onClose,
}: {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-border px-5 py-4",
        className
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {onClose ? <DrawerCloseButton onClick={onClose} /> : null}
    </div>
  );
}

export function DrawerBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function DrawerFooter({
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

export function BaseDrawer({
  open,
  onOpenChange,
  side = "right",
  children,
  className,
  showCloseButton = false,
  "aria-label": ariaLabel = "Drawer",
}: BaseDrawerProps) {
  const labelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const motionConfig = sideMotion[side];

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
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={labelId}
            tabIndex={-1}
            className={cn(
              "absolute z-50 flex flex-col bg-card shadow-lg outline-none",
              sideClasses[side],
              className
            )}
            initial={motionConfig.initial}
            animate={motionConfig.animate}
            exit={motionConfig.initial}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            {showCloseButton ? (
              <div className="absolute top-3 right-3 z-10">
                <DrawerCloseButton onClick={() => onOpenChange(false)} />
              </div>
            ) : null}
            {children}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export function RightDrawer(props: Omit<BaseDrawerProps, "side">) {
  return <BaseDrawer {...props} side="right" />;
}

export function LeftDrawer(props: Omit<BaseDrawerProps, "side">) {
  return <BaseDrawer {...props} side="left" />;
}

export function BottomDrawer(props: Omit<BaseDrawerProps, "side">) {
  return <BaseDrawer {...props} side="bottom" />;
}
