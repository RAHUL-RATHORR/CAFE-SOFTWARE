import type { ThemeMode } from "@/config/theme";

export type { ThemeMode };

export type ResolvedTheme = "light" | "dark";

export type ApiResult<T> = {
  data: T | null;
  error: string | null;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
