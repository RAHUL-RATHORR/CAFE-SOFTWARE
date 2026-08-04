"use client";

import type { ReactNode } from "react";
import {
  ClipboardList,
  Table2,
  ChefHat,
  Receipt,
  Users,
  BarChart3,
} from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { ActionCard } from "@/components/dashboard/action-card";
import { quickActions } from "@/features/dashboard/data/dummy-data";
import type { QuickAction } from "@/types";

const actionIcons: Record<QuickAction["icon"], ReactNode> = {
  order: <ClipboardList className="size-4" />,
  tables: <Table2 className="size-4" />,
  kitchen: <ChefHat className="size-4" />,
  billing: <Receipt className="size-4" />,
  customers: <Users className="size-4" />,
  reports: <BarChart3 className="size-4" />,
};

export function QuickActions() {
  return (
    <AppCard
      title="Quick Actions"
      description="Jump into common restaurant workflows"
      contentClassName="pt-2"
      className="shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((action) => (
          <ActionCard
            key={action.id}
            href={action.href}
            title={action.title}
            description={action.description}
            icon={actionIcons[action.icon]}
          />
        ))}
      </div>
    </AppCard>
  );
}
