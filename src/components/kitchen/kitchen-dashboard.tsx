"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, List } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { FilterDropdown } from "@/components/tables/filter-dropdown";
import { TableEmptyState } from "@/components/tables/table-empty-state";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { Button } from "@/components/ui/button";
import { KitchenBoardView } from "@/components/kitchen/kitchen-board-view";
import { KitchenTicketCard } from "@/components/kitchen/kitchen-ticket-card";
import { KitchenSummaryCards } from "@/components/kitchen/kitchen-summary-cards";
import {
  ORDER_PRIORITY_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
} from "@/config/orders";
import {
  ORDER_PRIORITIES,
  ORDER_STATUSES,
  ORDER_TYPES,
} from "@/types/order";
import type {
  KitchenDashboardData,
  KitchenFilterOptions,
} from "@/types/kitchen";

const statusFilterOptions = [
  { label: "All statuses", value: "all" },
  ...ORDER_STATUSES.map((value) => ({
    value,
    label: ORDER_STATUS_LABELS[value],
  })),
];

const orderTypeFilterOptions = [
  { label: "All types", value: "all" },
  ...ORDER_TYPES.map((value) => ({
    value,
    label: ORDER_TYPE_LABELS[value],
  })),
];

const priorityFilterOptions = [
  { label: "All priorities", value: "all" },
  ...ORDER_PRIORITIES.map((value) => ({
    value,
    label: ORDER_PRIORITY_LABELS[value],
  })),
];

type KitchenDashboardProps = {
  data: KitchenDashboardData;
  filterOptions: KitchenFilterOptions;
  query: {
    q: string;
    status: string;
    orderType: string;
    priority: string;
    tableId: string;
    assignedChefId: string;
    view: "board" | "queue";
  };
  errorMessage?: string | null;
};

export function KitchenDashboard({
  data,
  filterOptions,
  query,
  errorMessage,
}: KitchenDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);

  const updateParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setSearchValue(query.q);
  }, [query.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchValue === query.q) return;
      updateParams({ q: searchValue });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchValue, query.q, updateParams]);

  const hasFilters =
    Boolean(query.q) ||
    query.status !== "all" ||
    query.orderType !== "all" ||
    query.priority !== "all" ||
    Boolean(query.tableId) ||
    Boolean(query.assignedChefId);

  const tableOptions = [
    { label: "All tables", value: "all" },
    ...filterOptions.tables,
  ];
  const chefOptions = [
    { label: "All chefs", value: "all" },
    ...filterOptions.chefs,
  ];

  return (
    <div className="space-y-4">
      <KitchenSummaryCards summary={data.summary} />

      <AppCard
        title="Kitchen queue"
        description="Live preparation board and ticket queue"
        className="shadow-sm"
        contentClassName="space-y-4"
        action={
          <div className="flex items-center gap-1 rounded-xl border border-border p-1">
            <Button
              type="button"
              variant={query.view === "board" ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-lg"
              aria-label="Board view"
              aria-pressed={query.view === "board"}
              onClick={() => updateParams({ view: "board" })}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              type="button"
              variant={query.view === "queue" ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-lg"
              aria-label="Queue view"
              aria-pressed={query.view === "queue"}
              onClick={() => updateParams({ view: "queue" })}
            >
              <List className="size-4" />
            </Button>
          </div>
        }
      >
        <TableToolbar
          searchPlaceholder="Search order #, customer, table, item…"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusOptions={statusFilterOptions}
          statusValue={query.status}
          onStatusChange={(value) => updateParams({ status: value })}
          onRefresh={() => router.refresh()}
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Order type filter"
            options={orderTypeFilterOptions}
            value={query.orderType || "all"}
            onChange={(value) =>
              updateParams({ orderType: value === "all" ? undefined : value })
            }
          />
          <FilterDropdown
            label="Priority filter"
            options={priorityFilterOptions}
            value={query.priority || "all"}
            onChange={(value) =>
              updateParams({ priority: value === "all" ? undefined : value })
            }
          />
          <FilterDropdown
            label="Table filter"
            options={tableOptions}
            value={query.tableId || "all"}
            onChange={(value) =>
              updateParams({ tableId: value === "all" ? undefined : value })
            }
          />
          <FilterDropdown
            label="Chef filter"
            options={chefOptions}
            value={query.assignedChefId || "all"}
            onChange={(value) =>
              updateParams({
                assignedChefId: value === "all" ? undefined : value,
              })
            }
          />
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        ) : null}

        {isPending ? <TableLoadingSkeleton rows={4} columns={4} /> : null}

        {!isPending && data.tickets.length === 0 ? (
          <TableEmptyState
            title={hasFilters ? "No matching tickets" : "Kitchen is clear"}
            description={
              hasFilters
                ? "Try adjusting search or filters."
                : "New orders will appear here as tickets."
            }
          />
        ) : null}

        {!isPending && data.tickets.length > 0 && query.view === "board" ? (
          <KitchenBoardView board={data.board} />
        ) : null}

        {!isPending && data.tickets.length > 0 && query.view === "queue" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {data.tickets.map((ticket) => (
              <KitchenTicketCard key={ticket.id} ticket={ticket} />
            ))}
          </motion.div>
        ) : null}
      </AppCard>
    </div>
  );
}
