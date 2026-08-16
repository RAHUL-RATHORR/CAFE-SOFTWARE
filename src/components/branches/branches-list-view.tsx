"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { BranchesView } from "@/components/branches/branches-view";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type { BranchListResult } from "@/types/branch";

type BranchesListViewProps = {
  result: BranchListResult;
  query: {
    q: string;
    status: string;
    active: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  errorMessage?: string | null;
};

export function BranchesListView({
  result,
  query,
  errorMessage,
}: BranchesListViewProps) {
  const canCreate = useHasPermission(["branches.create", "branches.manage"]);

  return (
    <PageContainer
      title="Branches"
      description="Manage outlets, default branch, and branch-scoped tables."
      actions={
        canCreate.allowed ? (
          <Link
            href="/branches/new"
            className={cn(buttonVariants(), "rounded-xl")}
          >
            New branch
          </Link>
        ) : null
      }
    >
      <Suspense fallback={<TableLoadingSkeleton rows={6} columns={8} />}>
        <BranchesView
          result={result}
          query={query}
          errorMessage={errorMessage}
        />
      </Suspense>
    </PageContainer>
  );
}
