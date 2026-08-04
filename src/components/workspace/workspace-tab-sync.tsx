"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getNavItemByHref } from "@/config/navigation";
import { useTabStore } from "@/store/tab-store";

function titleFromPath(pathname: string) {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "Workspace";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Keeps workspace tabs in sync with the current route (UI only).
 */
export function WorkspaceTabSync() {
  const pathname = usePathname();
  const openTab = useTabStore((state) => state.openTab);

  useEffect(() => {
    if (!pathname) return;
    const navItem = getNavItemByHref(pathname);
    openTab({
      title: navItem?.title ?? titleFromPath(pathname),
      href: navItem?.href ?? pathname,
    });
  }, [pathname, openTab]);

  return null;
}
