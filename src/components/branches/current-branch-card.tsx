"use client";

import { MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BranchAvatar } from "@/components/branches/branch-avatar";
import { BranchBadge } from "@/components/branches/branch-badge";
import type { Branch } from "@/types/branch";
import { cn } from "@/lib/utils";

type CurrentBranchCardProps = {
  branch: Branch | null;
  className?: string;
};

export function CurrentBranchCard({
  branch,
  className,
}: CurrentBranchCardProps) {
  if (!branch) {
    return (
      <Card className={cn("rounded-xl border-dashed shadow-sm", className)}>
        <CardHeader>
          <CardTitle className="text-base">No branch selected</CardTitle>
          <CardDescription>
            Choose a branch from the switcher to view details.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn("rounded-xl shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 border-b border-border/60 pb-4">
        <BranchAvatar name={branch.name} size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="truncate text-lg">{branch.name}</CardTitle>
            <BranchBadge
              status={branch.status}
              isMainBranch={branch.isMainBranch}
            />
          </div>
          <CardDescription className="font-mono text-xs">
            {branch.branchCode}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 text-sm">
        <p className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {branch.address}, {branch.city}, {branch.state} {branch.postalCode}
          </span>
        </p>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Timezone</dt>
            <dd className="font-medium">{branch.timezone}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Currency</dt>
            <dd className="font-medium">{branch.currency}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="truncate font-medium">{branch.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Phone</dt>
            <dd className="font-medium">{branch.phone}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
