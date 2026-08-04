"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Eye, Pencil, Power, Trash2, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { deleteTable, updateTableStatus } from "@/actions/tables";
import { TABLE_STATUS_LABELS } from "@/config/tables";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type {
  RestaurantTable,
  RestaurantTableStatus,
} from "@/types/restaurant-table";

const statusVariant: Record<
  RestaurantTableStatus,
  "success" | "warning" | "info" | "secondary" | "danger"
> = {
  available: "success",
  reserved: "warning",
  occupied: "info",
  cleaning: "secondary",
  "out-of-service": "danger",
};

type RestaurantTableCardsProps = {
  items: RestaurantTable[];
};

export function RestaurantTableCards({ items }: RestaurantTableCardsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canEdit = useHasPermission(["tables.edit", "tables.manage"]);
  const canDelete = useHasPermission(["tables.delete", "tables.manage"]);

  function handleDelete(table: RestaurantTable) {
    openConfirmDialog("delete", {
      title: `Delete “${table.tableName}”?`,
      description: "This table will be soft-deleted and hidden from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const result = await deleteTable({ id: table.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Table deleted", table.tableName);
        router.refresh();
      },
    });
  }

  function cycleStatus(table: RestaurantTable) {
    const order: RestaurantTableStatus[] = [
      "available",
      "reserved",
      "occupied",
      "cleaning",
      "out-of-service",
    ];
    const index = order.indexOf(table.status);
    const next = order[(index + 1) % order.length];

    startTransition(async () => {
      const result = await updateTableStatus({ id: table.id, status: next });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Status updated", TABLE_STATUS_LABELS[result.data.status]);
      router.refresh();
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((table) => (
        <article
          key={table.id}
          className="flex flex-col rounded-xl border border-border/70 bg-card p-4 shadow-sm"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold tracking-tight">
                {table.tableName}
              </h3>
              <p className="font-mono text-xs text-muted-foreground">
                {table.tableNumber}
              </p>
            </div>
            <DsBadge variant={statusVariant[table.status]} size="sm">
              {TABLE_STATUS_LABELS[table.status]}
            </DsBadge>
          </div>

          <p className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-3.5" aria-hidden />
            {table.capacity} seats
            {table.floorLabel ? ` · ${table.floorLabel}` : ""}
          </p>

          <div className="mt-auto flex flex-wrap gap-1">
            <Link
              href={`/tables/${table.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-xl"
              )}
            >
              <Eye className="size-3.5" />
              View
            </Link>
            {canEdit.allowed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={isPending}
                onClick={() => cycleStatus(table)}
              >
                <Power className="size-3.5" />
                Status
              </Button>
            ) : null}
            {canEdit.allowed ? (
              <Link
                href={`/tables/${table.id}/edit`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "rounded-xl"
                )}
              >
                <Pencil className="size-3.5" />
              </Link>
            ) : null}
            {canDelete.allowed ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl text-destructive"
                onClick={() => handleDelete(table)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
