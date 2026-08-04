"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil, Power, QrCode, Trash2 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { deleteTable, updateTableStatus } from "@/actions/tables";
import {
  TABLE_SHAPE_LABELS,
  TABLE_STATUS_LABELS,
} from "@/config/tables";
import { formatRestaurantTableDate } from "@/lib/restaurant-tables";
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

type RestaurantTableDetailsProps = {
  table: RestaurantTable;
};

export function RestaurantTableDetails({ table }: RestaurantTableDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canEdit = useHasPermission(["tables.edit", "tables.manage"]);
  const canDelete = useHasPermission(["tables.delete", "tables.manage"]);

  function handleDelete() {
    openConfirmDialog("delete", {
      title: `Delete “${table.tableName}”?`,
      description: "This table will be soft-deleted and removed from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const result = await deleteTable({ id: table.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Table deleted", table.tableName);
        router.push("/tables");
        router.refresh();
      },
    });
  }

  function cycleStatus() {
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

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <AppCard
        title={table.tableName}
        description={`Table ${table.tableNumber}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DsBadge variant={statusVariant[table.status]} size="sm">
              {TABLE_STATUS_LABELS[table.status]}
            </DsBadge>
            <DsBadge
              variant={table.isActive ? "success" : "secondary"}
              size="sm"
            >
              {table.isActive ? "Active" : "Inactive"}
            </DsBadge>
            {canEdit.allowed ? (
              <Link
                href={`/tables/${table.id}/edit`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-xl"
                )}
              >
                <Pencil className="size-3.5" />
                Edit
              </Link>
            ) : null}
          </div>
        }
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Table number" value={table.tableNumber} mono />
          <DetailItem label="Capacity" value={`${table.capacity} seats`} />
          <DetailItem label="Shape" value={TABLE_SHAPE_LABELS[table.shape]} />
          <DetailItem label="Floor" value={table.floorLabel ?? "—"} />
          <DetailItem label="Location" value={table.location || "—"} />
          <DetailItem
            label="Display order"
            value={String(table.displayOrder)}
          />
          <DetailItem
            label="Created"
            value={formatRestaurantTableDate(table.createdAt)}
          />
          <DetailItem
            label="Updated"
            value={formatRestaurantTableDate(table.updatedAt)}
          />
          {table.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Notes</dt>
              <dd className="mt-1 text-sm leading-relaxed">{table.notes}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <QrCode className="size-4 text-muted-foreground" aria-hidden />
            QR code placeholder
          </div>
          <p className="break-all font-mono text-xs text-muted-foreground">
            {table.qrCodePlaceholder || "Not generated"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Architecture only — real QR rendering arrives in a later module.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
          <Link
            href="/tables"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Back to list
          </Link>
          {canEdit.allowed ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isPending}
              onClick={cycleStatus}
            >
              <Power className="size-4" />
              Cycle status
            </Button>
          ) : null}
          {canDelete.allowed ? (
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </AppCard>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value: string;
  mono?: boolean;
  children?: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-sm font-medium",
          mono && "font-mono text-xs text-muted-foreground"
        )}
      >
        {children ?? value}
      </dd>
    </div>
  );
}
