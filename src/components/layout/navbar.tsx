"use client";

import { Menu, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUiStore } from "@/store/ui-store";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { NotificationBell } from "@/components/notifications";
import { GlobalSearch } from "@/components/search";
import { ThemeToggle } from "@/components/theme";

const RESTAURANT_PLACEHOLDER = "Sunrise Cafe";
const USER_PLACEHOLDER = {
  initials: "AD",
  name: "Alex Doe",
  role: "Manager",
};

export function Navbar() {
  const openMobileSidebar = useUiStore((state) => state.openMobileSidebar);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={openMobileSidebar}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden min-w-0 items-center gap-2 sm:flex">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Store className="size-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-none">
                {RESTAURANT_PLACEHOLDER}
              </p>
              <p className="truncate text-xs text-muted-foreground">Restaurant</p>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          <div className="hidden min-w-0 flex-1 md:block">
            <BreadcrumbNav />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <GlobalSearch className="mr-1 hidden lg:flex" />
          <GlobalSearch compact className="lg:hidden" />

          <ThemeToggle />

          <NotificationBell />

          <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

          <div className="flex items-center gap-2 pl-1">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground">
              {USER_PLACEHOLDER.initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-none">{USER_PLACEHOLDER.name}</p>
              <p className="text-xs text-muted-foreground">{USER_PLACEHOLDER.role}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2 md:hidden">
        <div className="mb-2 flex items-center gap-2 sm:hidden">
          <Store className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="truncate text-xs font-medium">{RESTAURANT_PLACEHOLDER}</span>
        </div>
        <BreadcrumbNav />
      </div>
    </header>
  );
}
