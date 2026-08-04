import type { LucideIcon } from "lucide-react";

export type SearchCategoryId =
  | "dashboard"
  | "orders"
  | "customers"
  | "tables"
  | "kitchen"
  | "billing"
  | "menu-items"
  | "categories"
  | "reports"
  | "settings"
  | "restaurant"
  | "profile";

export type CommandActionType = "navigate" | "theme" | "placeholder";

export type SearchCommand = {
  id: string;
  title: string;
  description?: string;
  category: SearchCategoryId;
  keywords?: string[];
  href?: string;
  actionType: CommandActionType;
  pinned?: boolean;
  favorite?: boolean;
  icon?: LucideIcon;
};

export type SearchResultGroup = {
  id: string;
  label: string;
  items: SearchCommand[];
};
