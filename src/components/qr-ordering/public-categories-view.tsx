"use client";

import Link from "next/link";
import { PublicMenuShell } from "@/components/qr-ordering/public-menu-shell";
import { EmptyState } from "@/components/common/empty-state";
import { buildPublicMenuPath } from "@/config/qr-ordering";
import type { Category } from "@/types/category";

type PublicCategoriesViewProps = {
  restaurantParam: string;
  restaurantName: string;
  tableParam?: string;
  tableLabel?: string | null;
  categories: Category[];
};

export function PublicCategoriesView({
  restaurantParam,
  restaurantName,
  tableParam,
  tableLabel,
  categories,
}: PublicCategoriesViewProps) {
  return (
    <PublicMenuShell
      restaurantSlug={restaurantParam}
      restaurantName={restaurantName}
      tableParam={tableParam}
      tableLabel={tableLabel}
      active="categories"
    >
      {categories.length === 0 ? (
        <EmptyState
          title="No categories"
          description="Categories will appear when the restaurant publishes its menu."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`${buildPublicMenuPath(restaurantParam, undefined, tableParam)}?categoryId=${category.id}`}
                className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
              >
                <span className="font-medium">{category.name}</span>
                <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {category.description || "Browse items in this category"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PublicMenuShell>
  );
}
