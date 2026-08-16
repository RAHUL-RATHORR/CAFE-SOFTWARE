"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Eye, Printer, QrCode, RefreshCw, Ban } from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { QrPreviewModal } from "@/components/qr-code/qr-preview-modal";
import { QrPrintSheet } from "@/components/qr-code/qr-print-sheet";
import { downloadQrPng } from "@/components/qr-code/download-qr";
import {
  confirmBulkTables,
  createTable,
  generateTableQr,
  previewBulkTables,
  regenerateTableQr,
  revokeTableQr,
  setTableActive,
} from "@/actions/tables";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { Branch } from "@/types/branch";
import type {
  BulkTablePreviewItem,
  RestaurantTable,
} from "@/types/restaurant-table";

type BranchTablesViewProps = {
  branch: Branch;
  tables: RestaurantTable[];
  errorMessage?: string | null;
};

export function BranchTablesView({
  branch,
  tables,
  errorMessage,
}: BranchTablesViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canCreate = useHasPermission(["tables.create", "tables.manage"]);
  const canEdit = useHasPermission(["tables.edit", "tables.manage"]);

  const [manualNumber, setManualNumber] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCapacity, setManualCapacity] = useState(4);

  const [prefix, setPrefix] = useState("T");
  const [startNumber, setStartNumber] = useState(1);
  const [count, setCount] = useState(5);
  const [capacity, setCapacity] = useState(4);
  const [preview, setPreview] = useState<{
    creatable: BulkTablePreviewItem[];
    conflicting: BulkTablePreviewItem[];
    skipped: BulkTablePreviewItem[];
  } | null>(null);

  const [previewTable, setPreviewTable] = useState<RestaurantTable | null>(
    null
  );
  const [printOpen, setPrintOpen] = useState(false);

  const qrItems = useMemo(
    () =>
      tables
        .filter((table) => table.qr?.isActive && table.qr.publicUrl)
        .map((table) => ({
          tableNumber: table.tableNumber,
          tableName: table.tableName,
          url: table.qr!.publicUrl,
        })),
    [tables]
  );

  function refresh() {
    router.refresh();
  }

  function handleCreateManual() {
    startTransition(async () => {
      const result = await createTable({
        tableNumber: manualNumber.trim(),
        tableName: manualName.trim() || `Table ${manualNumber.trim()}`,
        capacity: manualCapacity,
        branchId: branch.id,
        shape: "square",
        status: "available",
        isActive: true,
        displayOrder: tables.length,
      });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Table created", result.data.tableNumber);
      setManualNumber("");
      setManualName("");
      refresh();
    });
  }

  function handlePreviewBulk() {
    startTransition(async () => {
      const result = await previewBulkTables({
        branchId: branch.id,
        prefix,
        startNumber,
        count,
        capacity,
      });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      setPreview({
        creatable: result.data.creatable,
        conflicting: result.data.conflicting,
        skipped: result.data.skipped,
      });
    });
  }

  function handleConfirmBulk() {
    if (!preview?.creatable.length) return;
    openConfirmDialog("custom", {
      title: `Create ${preview.creatable.length} tables?`,
      description: `${preview.conflicting.length} conflict(s) will be skipped.`,
      confirmLabel: "Create tables",
      onConfirm: async () => {
        const result = await confirmBulkTables({
          branchId: branch.id,
          prefix,
          startNumber,
          count,
          capacity,
          confirmedNumbers: preview.creatable.map((row) => row.tableNumber),
        });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success(`Created ${result.data.created.length} tables`);
        setPreview(null);
        refresh();
      },
    });
  }

  function handleToggleActive(table: RestaurantTable) {
    openConfirmDialog(table.isActive ? "deactivate" : "publish", {
      title: table.isActive
        ? `Deactivate table ${table.tableNumber}?`
        : `Activate table ${table.tableNumber}?`,
      description: table.isActive
        ? "Active QR codes for this table will be revoked."
        : "The table will accept QR ordering again after a new QR is issued.",
      confirmLabel: table.isActive ? "Deactivate" : "Activate",
      onConfirm: async () => {
        const result = await setTableActive({
          id: table.id,
          isActive: !table.isActive,
        });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success(
          result.data.isActive ? "Table activated" : "Table deactivated"
        );
        refresh();
      },
    });
  }

  function handleGenerateQr(table: RestaurantTable, regenerate = false) {
    startTransition(async () => {
      const result = regenerate
        ? await regenerateTableQr({ tableId: table.id })
        : await generateTableQr({ tableId: table.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(regenerate ? "QR regenerated" : "QR generated");
      refresh();
    });
  }

  function handleRevokeQr(table: RestaurantTable) {
    openConfirmDialog("deactivate", {
      title: `Revoke QR for ${table.tableNumber}?`,
      description: "Existing printed codes will stop working immediately.",
      confirmLabel: "Revoke",
      onConfirm: async () => {
        const result = await revokeTableQr({ tableId: table.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("QR revoked");
        refresh();
      },
    });
  }

  return (
    <PageContainer
      title={`${branch.name} tables`}
      description="Create tables, auto-generate ranges, and manage opaque QR codes."
      actions={
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link
            href={`/branches/${branch.id}`}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Back to branch
          </Link>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={qrItems.length === 0}
            onClick={() => setPrintOpen(true)}
          >
            <Printer className="size-4" />
            Print all QR codes
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={qrItems.length === 0}
            onClick={() => setPrintOpen(true)}
          >
            <Download className="size-4" />
            Download all QR codes
          </Button>
        </div>
      }
    >
      <div className="space-y-4 print:hidden">
        {errorMessage ? (
          <AppCard className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </AppCard>
        ) : null}

        {branch.status !== "active" ? (
          <AppCard className="border-warning/40 bg-warning/5 p-4 text-sm">
            This branch is not active. Activate it before creating tables or
            issuing QR codes.
          </AppCard>
        ) : null}

        {canCreate.allowed ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <AppCard className="space-y-3 p-5">
              <h3 className="font-semibold">Create table</h3>
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  placeholder="Number"
                  value={manualNumber}
                  onChange={(e) => setManualNumber(e.target.value)}
                />
                <Input
                  placeholder="Name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
                <Input
                  type="number"
                  min={1}
                  value={manualCapacity}
                  onChange={(e) => setManualCapacity(Number(e.target.value))}
                />
              </div>
              <Button
                type="button"
                className="rounded-xl"
                disabled={isPending || !manualNumber.trim()}
                onClick={handleCreateManual}
              >
                Create table
              </Button>
            </AppCard>

            <AppCard className="space-y-3 p-5">
              <h3 className="font-semibold">Auto-generate tables</h3>
              <div className="grid gap-2 sm:grid-cols-4">
                <Input
                  placeholder="Prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                />
                <Input
                  type="number"
                  min={1}
                  value={startNumber}
                  onChange={(e) => setStartNumber(Number(e.target.value))}
                />
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
                <Input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={isPending}
                  onClick={handlePreviewBulk}
                >
                  Preview
                </Button>
                <Button
                  type="button"
                  className="rounded-xl"
                  disabled={isPending || !preview?.creatable.length}
                  onClick={handleConfirmBulk}
                >
                  Confirm create
                </Button>
              </div>
              {preview ? (
                <div className="space-y-2 text-sm">
                  <p>
                    Creatable: {preview.creatable.length} · Conflicts:{" "}
                    {preview.conflicting.length} · Skipped:{" "}
                    {preview.skipped.length}
                  </p>
                  {preview.conflicting.length > 0 ? (
                    <p className="text-muted-foreground">
                      Conflicts:{" "}
                      {preview.conflicting
                        .map((row) => row.tableNumber)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </AppCard>
          </div>
        ) : null}

        <AppCard className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>QR</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No tables in this branch yet.
                  </TableCell>
                </TableRow>
              ) : (
                tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-mono text-xs">
                      {table.tableNumber}
                    </TableCell>
                    <TableCell>{table.tableName}</TableCell>
                    <TableCell>{table.capacity}</TableCell>
                    <TableCell>
                      <DsBadge
                        size="sm"
                        variant={table.isActive ? "success" : "secondary"}
                      >
                        {table.isActive ? "Active" : "Inactive"}
                      </DsBadge>
                    </TableCell>
                    <TableCell>
                      {table.qr?.isActive ? (
                        <DsBadge size="sm" variant="info">
                          Active QR
                        </DsBadge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {canEdit.allowed ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-xl"
                              title={table.qr ? "Regenerate QR" : "Generate QR"}
                              onClick={() =>
                                handleGenerateQr(table, Boolean(table.qr))
                              }
                            >
                              {table.qr ? (
                                <RefreshCw className="size-4" />
                              ) : (
                                <QrCode className="size-4" />
                              )}
                            </Button>
                            {table.qr?.isActive ? (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-xl"
                                  title="Preview QR"
                                  onClick={() => setPreviewTable(table)}
                                >
                                  <Eye className="size-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-xl"
                                  title="Download QR"
                                  onClick={() =>
                                    downloadQrPng({
                                      url: table.qr!.publicUrl,
                                      filename: `${branch.branchCode}-${table.tableNumber}.png`,
                                    })
                                  }
                                >
                                  <Download className="size-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-xl"
                                  title="Revoke QR"
                                  onClick={() => handleRevokeQr(table)}
                                >
                                  <Ban className="size-4" />
                                </Button>
                              </>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-xl"
                              title={
                                table.isActive ? "Deactivate" : "Activate"
                              }
                              onClick={() => handleToggleActive(table)}
                            >
                              {table.isActive ? "Off" : "On"}
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AppCard>
      </div>

      <QrPreviewModal
        open={Boolean(previewTable?.qr)}
        onOpenChange={(open) => {
          if (!open) setPreviewTable(null);
        }}
        title={
          previewTable
            ? `${previewTable.tableName} (${previewTable.tableNumber})`
            : "QR preview"
        }
        url={previewTable?.qr?.publicUrl}
        onDownload={
          previewTable?.qr
            ? () =>
                downloadQrPng({
                  url: previewTable.qr!.publicUrl,
                  filename: `${branch.branchCode}-${previewTable.tableNumber}.png`,
                })
            : undefined
        }
        onPrint={() => setPrintOpen(true)}
      />

      <QrPrintSheet
        open={printOpen}
        onOpenChange={setPrintOpen}
        branchName={branch.name}
        items={
          previewTable?.qr
            ? [
                {
                  tableNumber: previewTable.tableNumber,
                  tableName: previewTable.tableName,
                  url: previewTable.qr.publicUrl,
                },
              ]
            : qrItems
        }
      />
    </PageContainer>
  );
}
