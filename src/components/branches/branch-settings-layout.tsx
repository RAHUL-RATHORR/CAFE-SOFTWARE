"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { BranchSwitcher } from "@/components/branches/branch-switcher";
import { CurrentBranchCard } from "@/components/branches/current-branch-card";
import { RecentBranchesPlaceholder } from "@/components/branches/recent-branches-placeholder";
import { branchSettingsSections } from "@/config/branches";
import { useBranch } from "@/hooks/branches";
import { cn } from "@/lib/utils";

type BranchSettingsNavProps = {
  activeId?: string;
  className?: string;
};

export function BranchSettingsNav({
  activeId,
  className,
}: BranchSettingsNavProps) {
  return (
    <nav
      aria-label="Branch settings"
      className={cn(
        "flex gap-1 overflow-x-auto rounded-xl border border-border/70 bg-card p-1.5 sm:flex-col",
        className
      )}
    >
      {branchSettingsSections.map((section) => {
        const active = section.id === activeId;
        return (
          <Link
            key={section.id}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <span>{section.title}</span>
            <ChevronRight className="size-3.5 opacity-50 sm:hidden" aria-hidden />
          </Link>
        );
      })}
    </nav>
  );
}

type BranchSettingsPlaceholderProps = {
  sectionId: (typeof branchSettingsSections)[number]["id"];
  title: string;
  description: string;
  children?: ReactNode;
};

export function BranchSettingsPlaceholder({
  sectionId,
  title,
  description,
  children,
}: BranchSettingsPlaceholderProps) {
  return (
    <PageContainer title={title} description={description}>
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <BranchSettingsNav activeId={sectionId} />
        <div className="space-y-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Placeholder settings — no save or API in this module.
          </p>
          {children}
        </div>
      </div>
    </PageContainer>
  );
}

export function BranchesSettingsHub({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { currentBranch, recentBranches, switchBranch } = useBranch();

  const body = (
    <>
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <CurrentBranchCard branch={currentBranch} />
        <RecentBranchesPlaceholder
          branches={recentBranches}
          currentBranchId={currentBranch?.id}
          onSelect={switchBranch}
        />
      </div>

      <div className="mx-auto mt-2 w-full max-w-5xl">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          Branch settings sections
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {branchSettingsSections.map((section) => (
            <li key={section.id}>
              <Link
                href={section.href}
                className="flex h-full flex-col rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
              >
                <span className="font-medium">{section.title}</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {section.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{body}</div>;
  }

  return (
    <PageContainer
      title="Branches"
      description="Manage outlets under your restaurant. Switching updates local state only."
      actions={<BranchSwitcher showLabel={false} className="w-56" />}
    >
      {body}
    </PageContainer>
  );
}
