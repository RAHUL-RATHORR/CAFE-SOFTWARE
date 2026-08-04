export type DesignTone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type DesignSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline"
  | "soft"
  | "filled"
  | "ghost";

export type StatusKind =
  | "active"
  | "inactive"
  | "pending"
  | "preparing"
  | "cooking"
  | "ready"
  | "completed"
  | "delivered"
  | "cancelled"
  | "draft"
  | "published"
  | "archived"
  | "online"
  | "offline"
  | "busy"
  | "away";

export type StatusDisplay = "dot" | "badge" | "chip" | "pill";

export type EmptyStateKind =
  | "orders"
  | "customers"
  | "tables"
  | "reports"
  | "menu"
  | "categories"
  | "search"
  | "generic";

export type ErrorStateKind =
  | "404"
  | "403"
  | "500"
  | "network"
  | "permission"
  | "retry";
