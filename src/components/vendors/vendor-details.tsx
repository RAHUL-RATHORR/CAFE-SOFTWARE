"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { deleteVendor } from "@/actions/vendors";
import {
  VENDOR_STATUS_LABELS,
  VENDOR_STATUS_VARIANTS,
} from "@/config/vendors";
import { formatVendorDate } from "@/lib/vendors";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { Vendor } from "@/types/vendor";

type VendorDetailsProps = {
  vendor: Vendor;
};

export function VendorDetails({ vendor }: VendorDetailsProps) {
  const router = useRouter();
  const canEdit = useHasPermission(["vendors.edit"]);
  const canDelete = useHasPermission(["vendors.delete"]);

  function handleDelete() {
    openConfirmDialog("delete", {
      title: `Delete “${vendor.companyName}”?`,
      description: "This vendor will be soft-deleted and removed from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const result = await deleteVendor({ id: vendor.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Vendor deleted", vendor.companyName);
        router.push("/vendors");
        router.refresh();
      },
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <AppCard
        title={vendor.companyName}
        description={`${vendor.vendorCode} · ${vendor.phone}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DsBadge
              variant={VENDOR_STATUS_VARIANTS[vendor.status]}
              size="sm"
            >
              {VENDOR_STATUS_LABELS[vendor.status]}
            </DsBadge>
            {canEdit.allowed ? (
              <Link
                href={`/vendors/${vendor.id}/edit`}
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
          <DetailItem label="Contact person" value={vendor.contactPerson || "—"} />
          <DetailItem label="Email" value={vendor.email || "—"} />
          <DetailItem label="Phone" value={vendor.phone} />
          <DetailItem label="GST number" value={vendor.gstNumber || "—"} />
          <DetailItem label="Rating" value={vendor.rating.toFixed(1)} />
          <DetailItem label="Created" value={formatVendorDate(vendor.createdAt)} />
          <DetailItem
            label="Address"
            value={
              [vendor.address, vendor.city, vendor.state, vendor.postalCode, vendor.country]
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
          {vendor.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Notes</dt>
              <dd className="mt-1 text-sm leading-relaxed">{vendor.notes}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
          <Link
            href="/vendors"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Back to list
          </Link>
          <Link
            href={`/purchases/new?vendorId=${vendor.id}`}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            New purchase
          </Link>
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
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{children ?? value}</dd>
    </div>
  );
}
