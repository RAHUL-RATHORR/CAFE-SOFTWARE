"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import {
  activateBranch,
  deactivateBranch,
  setDefaultBranch,
} from "@/actions/branches";
import { BRANCH_STATUS_LABELS } from "@/config/branches";
import { formatBranchDate } from "@/lib/branches";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { Branch } from "@/types/branch";

type BranchDetailsProps = {
  branch: Branch;
};

export function BranchDetails({ branch }: BranchDetailsProps) {
  const router = useRouter();
  const canEdit = useHasPermission(["branches.edit", "branches.manage"]);

  function handleToggleStatus() {
    const nextActive = branch.status !== "active";
    openConfirmDialog(nextActive ? "publish" : "deactivate", {
      title: nextActive
        ? `Activate “${branch.name}”?`
        : `Deactivate “${branch.name}”?`,
      description: nextActive
        ? "Guests will be able to place QR orders at this branch again."
        : "Existing data is kept. New QR and order entry for this branch will be blocked.",
      confirmLabel: nextActive ? "Activate" : "Deactivate",
      onConfirm: async () => {
        const result = nextActive
          ? await activateBranch({ id: branch.id })
          : await deactivateBranch({ id: branch.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success(
          nextActive ? "Branch activated" : "Branch deactivated",
          result.data.name
        );
        router.refresh();
      },
    });
  }

  function handleSetDefault() {
    openConfirmDialog("custom", {
      title: `Set “${branch.name}” as default?`,
      description: "Only one branch can be the default for this restaurant.",
      confirmLabel: "Set default",
      onConfirm: async () => {
        const result = await setDefaultBranch({ id: branch.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Default branch updated", result.data.name);
        router.refresh();
      },
    });
  }

  return (
    <PageContainer
      title={branch.name}
      description={`${branch.branchCode} · ${branch.city}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/branches/${branch.id}/tables`}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Manage tables
          </Link>
          {canEdit.allowed ? (
            <>
              <Link
                href={`/branches/${branch.id}/edit`}
                className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
              >
                Edit
              </Link>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={handleToggleStatus}
              >
                {branch.status === "active" ? "Deactivate" : "Activate"}
              </Button>
              {!branch.isMainBranch ? (
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={handleSetDefault}
                >
                  Set default
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <AppCard className="space-y-3 p-5">
          <h3 className="font-semibold">Overview</h3>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <DsBadge size="sm">
                  {BRANCH_STATUS_LABELS[branch.status]}
                </DsBadge>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Default</dt>
              <dd>{branch.isMainBranch ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tables</dt>
              <dd>{branch.tableCount ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatBranchDate(branch.createdAt)}</dd>
            </div>
          </dl>
        </AppCard>
        <AppCard className="space-y-3 p-5">
          <h3 className="font-semibold">Contact & location</h3>
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Address</dt>
              <dd>
                {branch.address}, {branch.city}, {branch.state}{" "}
                {branch.postalCode}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{branch.phone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{branch.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">GSTIN</dt>
              <dd>{branch.gstin || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Hours</dt>
              <dd>
                {branch.openingTime || "—"} – {branch.closingTime || "—"}
              </dd>
            </div>
          </dl>
        </AppCard>
      </div>
    </PageContainer>
  );
}
