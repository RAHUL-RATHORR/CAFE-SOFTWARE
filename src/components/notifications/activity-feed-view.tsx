"use client";

import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACTIVITY_CATEGORY_LABELS,
} from "@/config/notification";
import {
  formatNotificationDateTime,
  formatRelativeTime,
} from "@/lib/notification/formatters";
import { cn } from "@/lib/utils";
import type { ActivityListResult } from "@/types/notification";

export type ActivityListQuery = {
  q: string;
  category: string;
  page: number;
};

type ActivityFeedViewProps = {
  result: ActivityListResult;
  query: ActivityListQuery;
  errorMessage?: string | null;
};

export function ActivityFeedView({
  result,
  query,
  errorMessage,
}: ActivityFeedViewProps) {
  const router = useRouter();

  function pushFilters(next: Partial<ActivityListQuery>) {
    const merged = { ...query, ...next };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.category && merged.category !== "all") {
      params.set("category", merged.category);
    }
    if (merged.page > 1) params.set("page", String(merged.page));
    const qs = params.toString();
    router.push(qs ? `/activity?${qs}` : "/activity");
  }

  return (
    <PageContainer
      title="Activity"
      description="Recent events across orders, billing, inventory, staff, and admin — timeline view."
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <AppCard title="Filters" contentClassName="space-y-3">
          <form
            className="grid gap-3 md:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              pushFilters({
                q: String(form.get("q") ?? ""),
                category: String(form.get("category") ?? "all"),
                page: 1,
              });
            }}
          >
            <Input
              name="q"
              defaultValue={query.q}
              placeholder="Search activity…"
              className="rounded-xl md:col-span-2"
            />
            <select
              name="category"
              defaultValue={query.category}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="all">All categories</option>
              {Object.entries(ACTIVITY_CATEGORY_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
            <Button type="submit" className="rounded-xl md:col-span-3 sm:w-fit">
              Apply filters
            </Button>
          </form>
        </AppCard>

        <AppCard
          title="Event timeline"
          description="Chronological feed of restaurant activity"
          contentClassName="pt-2"
        >
          {result.items.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Domain events from Orders, Kitchen, Billing, Staff, and Admin will appear on this timeline."
            />
          ) : (
            <ol className="space-y-0">
              {result.items.map((item, index) => (
                <li
                  key={item.id}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {index < result.items.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-px bg-border"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 size-[18px] shrink-0 rounded-full border-2 border-primary bg-primary/20"
                    )}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <DsBadge variant="secondary" size="sm">
                        {ACTIVITY_CATEGORY_LABELS[item.category]}
                      </DsBadge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.actorName || "System"} · {item.action} ·{" "}
                      {formatNotificationDateTime(item.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </AppCard>

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
