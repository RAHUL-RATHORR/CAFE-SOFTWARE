export { connectToDatabase, disconnectFromDatabase } from "./connection";
export {
  DatabaseError,
  isDatabaseError,
  handleDatabaseError,
} from "./errors";
export {
  getConnectionState,
  isDatabaseConnected,
  isValidObjectId,
  toObjectId,
  normalizePagination,
  buildPaginationMeta,
  notDeletedFilter,
} from "./helpers";
export { checkDatabaseHealth } from "./health";
export {
  buildProjection,
  leanQueryOptions,
  clampPageSize,
  shouldPreferLean,
  recommendedIndexHints,
} from "./query";
