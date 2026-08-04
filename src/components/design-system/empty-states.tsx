import type { ReactNode } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { AppIcon } from "@/components/icons";
import type { EmptyStateKind } from "@/types";
import type { IconName } from "@/components/icons";

const emptyCopy: Record<
  EmptyStateKind,
  { title: string; description: string; icon: IconName }
> = {
  orders: {
    title: "No orders yet",
    description: "New orders will appear here as guests place them.",
    icon: "order",
  },
  customers: {
    title: "No customers found",
    description: "Customer profiles will show up once guests visit.",
    icon: "customer",
  },
  tables: {
    title: "No tables configured",
    description: "Add floor tables to start managing seating.",
    icon: "table",
  },
  reports: {
    title: "No reports available",
    description: "Reports will populate as transactions accumulate.",
    icon: "report",
  },
  menu: {
    title: "No menu items",
    description: "Create dishes to build your restaurant menu.",
    icon: "menu",
  },
  categories: {
    title: "No categories",
    description: "Organize menu items with categories.",
    icon: "category",
  },
  search: {
    title: "No search results",
    description: "Try a different keyword or clear filters.",
    icon: "search",
  },
  generic: {
    title: "Nothing here yet",
    description: "Content will appear in this section soon.",
    icon: "dashboard",
  },
};

type DsEmptyStateProps = {
  kind?: EmptyStateKind;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function DsEmptyState({
  kind = "generic",
  title,
  description,
  action,
  className,
}: DsEmptyStateProps) {
  const copy = emptyCopy[kind];
  return (
    <EmptyState
      title={title ?? copy.title}
      description={description ?? copy.description}
      action={action}
      className={className}
      icon={<AppIcon name={copy.icon} className="size-6" />}
    />
  );
}

export function NoOrdersEmpty(props: Omit<DsEmptyStateProps, "kind">) {
  return <DsEmptyState {...props} kind="orders" />;
}

export function NoCustomersEmpty(props: Omit<DsEmptyStateProps, "kind">) {
  return <DsEmptyState {...props} kind="customers" />;
}

export function NoTablesEmpty(props: Omit<DsEmptyStateProps, "kind">) {
  return <DsEmptyState {...props} kind="tables" />;
}

export function NoReportsEmpty(props: Omit<DsEmptyStateProps, "kind">) {
  return <DsEmptyState {...props} kind="reports" />;
}

export function NoMenuEmpty(props: Omit<DsEmptyStateProps, "kind">) {
  return <DsEmptyState {...props} kind="menu" />;
}

export function NoCategoriesEmpty(props: Omit<DsEmptyStateProps, "kind">) {
  return <DsEmptyState {...props} kind="categories" />;
}

export function NoSearchResultsEmpty(props: Omit<DsEmptyStateProps, "kind">) {
  return <DsEmptyState {...props} kind="search" />;
}
