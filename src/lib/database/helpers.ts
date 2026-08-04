import mongoose, { Types } from "mongoose";
import type {
  DatabaseConnectionState,
  PaginationMeta,
  PaginationParams,
} from "@/types/database";

const CONNECTION_STATE_MAP: Record<number, DatabaseConnectionState> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
  99: "uninitialized",
};

export function getConnectionState(): DatabaseConnectionState {
  return CONNECTION_STATE_MAP[mongoose.connection.readyState] ?? "uninitialized";
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function isValidObjectId(value: string): boolean {
  return Types.ObjectId.isValid(value);
}

export function toObjectId(value: string): Types.ObjectId {
  if (!isValidObjectId(value)) {
    throw new Error(`Invalid ObjectId: ${value}`);
  }
  return new Types.ObjectId(value);
}

export function normalizePagination(
  params: PaginationParams = {}
): Required<Pick<PaginationParams, "page" | "pageSize">> &
  Pick<PaginationParams, "sortBy" | "sortOrder"> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

  return {
    page,
    pageSize,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder ?? "desc",
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/** Soft-delete filter helper for future queries (no CRUD here). */
export function notDeletedFilter<T extends Record<string, unknown>>(
  filter: T = {} as T
): T & { isDeleted: false } {
  return { ...filter, isDeleted: false };
}
