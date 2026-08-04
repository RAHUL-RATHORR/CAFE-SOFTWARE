"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Megaphone } from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAnnouncementAction } from "@/actions/notification";
import {
  ANNOUNCEMENT_SCOPE_LABELS,
  ANNOUNCEMENT_STATUS_LABELS,
  NOTIFICATION_PRIORITY_LABELS,
  NOTIFICATION_PRIORITY_VARIANTS,
} from "@/config/notification";
import { formatNotificationDateTime } from "@/lib/notification/formatters";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import type { AnnouncementListResult } from "@/types/notification";

export type AnnouncementListQuery = {
  q: string;
  scope: string;
  status: string;
  page: number;
};

type AnnouncementCenterViewProps = {
  result: AnnouncementListResult;
  query: AnnouncementListQuery;
  errorMessage?: string | null;
};

export function AnnouncementCenterView({
  result,
  query,
  errorMessage,
}: AnnouncementCenterViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canManage = useHasPermission(["announcements.manage"]);

  function pushFilters(next: Partial<AnnouncementListQuery>) {
    const merged = { ...query, ...next };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.scope && merged.scope !== "all") params.set("scope", merged.scope);
    if (merged.status && merged.status !== "all") {
      params.set("status", merged.status);
    }
    if (merged.page > 1) params.set("page", String(merged.page));
    const qs = params.toString();
    router.push(qs ? `/announcements?${qs}` : "/announcements");
  }

  function publishQuick() {
    startTransition(async () => {
      const result = await createAnnouncementAction({
        title: "Restaurant notice",
        body: "Operational announcement from the announcement center.",
        scope: "restaurant",
        status: "published",
        priority: "normal",
      });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Announcement published");
      router.refresh();
    });
  }

  return (
    <PageContainer
      title="Announcements"
      description="System, restaurant, branch, and maintenance notices. Release notes are prepared as a placeholder."
      actions={
        canManage.allowed ? (
          <Button
            type="button"
            className="rounded-xl gap-1.5"
            disabled={isPending}
            onClick={publishQuick}
          >
            <Megaphone className="size-3.5" aria-hidden />
            New announcement
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <AppCard title="Filters" contentClassName="space-y-3">
          <form
            className="grid gap-3 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              pushFilters({
                q: String(form.get("q") ?? ""),
                scope: String(form.get("scope") ?? "all"),
                status: String(form.get("status") ?? "all"),
                page: 1,
              });
            }}
          >
            <Input
              name="q"
              defaultValue={query.q}
              placeholder="Search announcements…"
              className="rounded-xl md:col-span-2"
            />
            <select
              name="scope"
              defaultValue={query.scope}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="all">All scopes</option>
              {Object.entries(ANNOUNCEMENT_SCOPE_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
            <select
              name="status"
              defaultValue={query.status}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              {Object.entries(ANNOUNCEMENT_STATUS_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
            <Button type="submit" className="rounded-xl md:col-span-4 sm:w-fit">
              Apply filters
            </Button>
          </form>
        </AppCard>

        {result.items.length === 0 ? (
          <EmptyState
            title="No announcements"
            description="Published system and restaurant notices will appear here."
          />
        ) : (
          <div className="space-y-3">
            {result.items.map((item) => (
              <AppCard
                key={item.id}
                title={item.title}
                description={formatNotificationDateTime(item.createdAt)}
                contentClassName="space-y-3"
              >
                <div className="flex flex-wrap gap-2">
                  <DsBadge variant="secondary" size="sm">
                    {ANNOUNCEMENT_SCOPE_LABELS[item.scope]}
                  </DsBadge>
                  <DsBadge variant="secondary" size="sm">
                    {ANNOUNCEMENT_STATUS_LABELS[item.status]}
                  </DsBadge>
                  <DsBadge
                    variant={NOTIFICATION_PRIORITY_VARIANTS[item.priority]}
                    size="sm"
                  >
                    {NOTIFICATION_PRIORITY_LABELS[item.priority]}
                  </DsBadge>
                  {item.scope === "release-notes" ? (
                    <DsBadge variant="info" size="sm">
                      Release notes placeholder
                    </DsBadge>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {item.body}
                </p>
              </AppCard>
            ))}
          </div>
        )}

        {result.meta.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Page {result.meta.page} of {result.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!result.meta.hasPreviousPage}
                onClick={() => pushFilters({ page: query.page - 1 })}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!result.meta.hasNextPage}
                onClick={() => pushFilters({ page: query.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
