"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ImageIcon, Pencil, Power, Star, Trash2 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import {
  deleteMenuItem,
  toggleAvailability,
  toggleFeatured,
} from "@/actions/menu-items";
import {
  formatMenuItemDate,
  formatMenuItemPrice,
} from "@/lib/menu-items";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types/menu-item";

type MenuItemDetailsProps = {
  item: MenuItem;
};

export function MenuItemDetails({ item }: MenuItemDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canEdit = useHasPermission(["menu-items.edit", "menu-items.manage"]);
  const canDelete = useHasPermission([
    "menu-items.delete",
    "menu-items.manage",
  ]);

  function handleDelete() {
    openConfirmDialog("delete", {
      title: `Delete “${item.name}”?`,
      description: "This menu item will be soft-deleted and removed from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const result = await deleteMenuItem({ id: item.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Menu item deleted", item.name);
        router.push("/menu-items");
        router.refresh();
      },
    });
  }

  function handleToggleAvailability() {
    startTransition(async () => {
      const result = await toggleAvailability({ id: item.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(
        result.data.isAvailable ? "Item available" : "Item unavailable",
        result.data.name
      );
      router.refresh();
    });
  }

  function handleToggleFeatured() {
    startTransition(async () => {
      const result = await toggleFeatured({ id: item.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(
        result.data.isFeatured ? "Marked featured" : "Unmarked featured",
        result.data.name
      );
      router.refresh();
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <AppCard
        title={item.name}
        description={item.shortDescription || item.description || "No description"}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DsBadge
              variant={item.isAvailable ? "success" : "secondary"}
              size="sm"
            >
              {item.isAvailable ? "Available" : "Unavailable"}
            </DsBadge>
            {item.isFeatured ? (
              <DsBadge variant="warning" size="sm">
                Featured
              </DsBadge>
            ) : null}
            {canEdit.allowed ? (
              <Link
                href={`/menu-items/${item.id}/edit`}
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
        <div className="mb-5 flex items-start gap-4">
          {item.image && item.image.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt={item.name}
              className="size-24 rounded-xl object-cover"
            />
          ) : (
            <span className="flex size-24 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ImageIcon className="size-6" aria-hidden />
            </span>
          )}
          <div className="space-y-1 text-sm">
            <p className="text-2xl font-semibold tracking-tight">
              {item.discountPrice != null
                ? formatMenuItemPrice(item.discountPrice)
                : formatMenuItemPrice(item.price)}
            </p>
            {item.discountPrice != null ? (
              <p className="text-muted-foreground line-through">
                {formatMenuItemPrice(item.price)}
              </p>
            ) : null}
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Slug" value={item.slug} mono />
          <DetailItem label="SKU" value={item.sku || "—"} mono />
          <DetailItem label="Category" value={item.categoryName ?? "—"} />
          <DetailItem
            label="Diet"
            value={item.isVeg ? "Vegetarian" : "Non-vegetarian"}
          />
          <DetailItem label="Tax rate" value={`${item.taxRate}%`} />
          <DetailItem
            label="Prep time"
            value={`${item.preparationTime} min`}
          />
          <DetailItem
            label="Calories"
            value={item.calories != null ? String(item.calories) : "—"}
          />
          <DetailItem
            label="Display order"
            value={String(item.displayOrder)}
          />
          <DetailItem
            label="Created"
            value={formatMenuItemDate(item.createdAt)}
          />
          <DetailItem
            label="Updated"
            value={formatMenuItemDate(item.updatedAt)}
          />
          {item.tags.length > 0 ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Tags</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <DsBadge key={tag} variant="soft" size="sm">
                    {tag}
                  </DsBadge>
                ))}
              </dd>
            </div>
          ) : null}
          {item.description ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Description</dt>
              <dd className="mt-1 text-sm leading-relaxed">{item.description}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
          <Link
            href="/menu-items"
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
              onClick={handleToggleAvailability}
            >
              <Power className="size-4" />
              {item.isAvailable ? "Mark unavailable" : "Mark available"}
            </Button>
          ) : null}
          {canEdit.allowed ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isPending}
              onClick={handleToggleFeatured}
            >
              <Star className="size-4" />
              {item.isFeatured ? "Unfeature" : "Feature"}
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
