"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil, Power, Trash2 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { deleteCategory, toggleCategoryStatus } from "@/actions/categories";
import { formatCategoryDate } from "@/lib/categories";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/category";

type CategoryDetailsProps = {
  category: Category;
};

export function CategoryDetails({ category }: CategoryDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canEdit = useHasPermission("categories.edit");
  const canDelete = useHasPermission("categories.delete");

  function handleDelete() {
    openConfirmDialog("delete", {
      title: `Delete “${category.name}”?`,
      description:
        "This category will be soft-deleted and removed from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const result = await deleteCategory({ id: category.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Category deleted", category.name);
        router.push("/categories");
        router.refresh();
      },
    });
  }

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleCategoryStatus({ id: category.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(
        result.data.isActive ? "Category activated" : "Category deactivated",
        result.data.name
      );
      router.refresh();
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <AppCard
        title={category.name}
        description={category.description || "No description"}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DsBadge
              variant={category.isActive ? "success" : "secondary"}
              size="sm"
            >
              {category.isActive ? "Active" : "Inactive"}
            </DsBadge>
            {canEdit.allowed ? (
              <Link
                href={`/categories/${category.id}/edit`}
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
          <DetailItem label="Slug" value={category.slug} mono />
          <DetailItem
            label="Display order"
            value={String(category.displayOrder)}
          />
          <DetailItem label="Color" value={category.color}>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-4 rounded-md border border-border"
                style={{ backgroundColor: category.color }}
                aria-hidden
              />
              <span className="font-mono text-xs">{category.color}</span>
            </span>
          </DetailItem>
          <DetailItem label="Icon" value={category.icon || "—"} />
          <DetailItem
            label="Created"
            value={formatCategoryDate(category.createdAt)}
          />
          <DetailItem
            label="Updated"
            value={formatCategoryDate(category.updatedAt)}
          />
          {category.image ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Image</dt>
              <dd className="mt-1 break-all text-sm">{category.image}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
          <Link
            href="/categories"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl"
            )}
          >
            Back to list
          </Link>
          {canEdit.allowed ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isPending}
              onClick={handleToggle}
            >
              <Power className="size-4" />
              {category.isActive ? "Deactivate" : "Activate"}
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
