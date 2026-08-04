import { performanceConfig } from "@/config/performance";

/**
 * Virtualization-ready helpers for large tables.
 * No virtualization library — callers can plug row windows into UI later.
 */

export type VirtualWindow = {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
  visibleCount: number;
};

export function computeVirtualWindow(input: {
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  totalRows: number;
  overscan?: number;
}): VirtualWindow {
  const overscan = input.overscan ?? performanceConfig.tables.overscan;
  const rowHeight = Math.max(1, input.rowHeight);
  const totalRows = Math.max(0, input.totalRows);
  const visibleCount = Math.ceil(input.viewportHeight / rowHeight);
  const startIndex = Math.max(
    0,
    Math.floor(input.scrollTop / rowHeight) - overscan
  );
  const endIndex = Math.min(
    totalRows,
    startIndex + visibleCount + overscan * 2
  );

  return {
    startIndex,
    endIndex,
    offsetY: startIndex * rowHeight,
    totalHeight: totalRows * rowHeight,
    visibleCount,
  };
}

export function shouldVirtualize(rowCount: number): boolean {
  return rowCount >= performanceConfig.tables.virtualizationThreshold;
}

export function sliceWindow<T>(
  rows: T[],
  window: Pick<VirtualWindow, "startIndex" | "endIndex">
): T[] {
  return rows.slice(window.startIndex, window.endIndex);
}
