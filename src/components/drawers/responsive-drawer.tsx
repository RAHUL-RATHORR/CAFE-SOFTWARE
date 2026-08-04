"use client";

import type { ComponentProps } from "react";
import {
  BaseDrawer,
  RightDrawer,
  BottomDrawer,
} from "@/components/drawers/base-drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

type DrawerProps = Omit<ComponentProps<typeof BaseDrawer>, "side">;

/**
 * Uses bottom drawer on mobile and right drawer on desktop.
 */
export function ResponsiveDrawer(props: DrawerProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isMobile) {
    return <BottomDrawer {...props} />;
  }

  return <RightDrawer {...props} />;
}
