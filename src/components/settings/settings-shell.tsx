"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageContainer } from "@/components/common/page-container";
import { SETTINGS_NAV_ITEMS } from "@/config/settings";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type { PermissionKey } from "@/types/rbac";

type SettingsShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function SettingsShell({
  title,
  description,
  children,
  actions,
}: SettingsShellProps) {
  const pathname = usePathname();

  return (
    <PageContainer title={title} description={description} actions={actions}>
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="Settings sections"
          className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
        >
          {SETTINGS_NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/settings" && pathname.startsWith(item.href));
            return (
              <SettingsNavLink
                key={item.id}
                href={item.href}
                label={item.label}
                active={active}
                permission={item.permission as PermissionKey | undefined}
              />
            );
          })}
        </nav>
        <div className="min-w-0 space-y-4">{children}</div>
      </div>
    </PageContainer>
  );
}

function SettingsNavLink({
  href,
  label,
  active,
  permission,
}: {
  href: string;
  label: string;
  active: boolean;
  permission?: PermissionKey;
}) {
  const gate = useHasPermission(
    permission
      ? [permission, "settings.manage", "settings.view"]
      : ["settings.view", "settings.update", "settings.edit", "settings.manage"]
  );
  if (permission && !gate.allowed && !gate.isLoading) {
    return null;
  }
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-xl px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

export function SettingsHubView() {
  return (
    <PageContainer
      title="Settings"
      description="Configure restaurant, tax, receipts, devices, security, and system preferences."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SETTINGS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="font-medium group-hover:text-primary">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
