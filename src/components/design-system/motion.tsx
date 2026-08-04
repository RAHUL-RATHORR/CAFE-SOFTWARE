"use client";

import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { animationDurations } from "@/constants/design";

const duration = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
} as const;

export const motionPresets = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
  },
  slideDown: {
    initial: { opacity: 0, y: -12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
  modal: {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 8 },
  },
  drawerRight: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
} as const;

type MotionBoxProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  preset?: keyof typeof motionPresets;
};

export function MotionBox({
  children,
  preset = "fade",
  ...props
}: MotionBoxProps) {
  const config = motionPresets[preset];
  return (
    <motion.div
      initial={config.initial}
      animate={config.animate}
      exit={"exit" in config ? config.exit : undefined}
      transition={{ duration: duration.normal, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MotionBox preset="fade" className={className}>
      {children}
    </MotionBox>
  );
}

export function SlideIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MotionBox preset="slideUp" className={className}>
      {children}
    </MotionBox>
  );
}

export function ScaleIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MotionBox preset="scale" className={className}>
      {children}
    </MotionBox>
  );
}

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.05 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0 },
      }}
      transition={{ duration: duration.fast }}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: duration.fast }} className={className}>
      {children}
    </motion.div>
  );
}

export const pageTransition = {
  initial: motionPresets.fade.initial,
  animate: motionPresets.fade.animate,
  exit: motionPresets.fade.exit,
  transition: { duration: duration.normal },
};

export const modalTransition = {
  ...motionPresets.modal,
  transition: { duration: duration.normal, ease: "easeOut" },
};

export const drawerTransition = {
  ...motionPresets.drawerRight,
  transition: { type: "spring", stiffness: 380, damping: 36 },
};

export { animationDurations };
