import type { FloorOption } from "@/types/restaurant-table";

/** Floor assignment placeholders until Floor CRUD exists */
export const FLOOR_OPTIONS: FloorOption[] = [
  { value: "67a000000000000000000101", label: "Ground Floor" },
  { value: "67a000000000000000000102", label: "First Floor" },
  { value: "67a000000000000000000103", label: "Terrace" },
  { value: "67a000000000000000000104", label: "Patio" },
];

export const TABLE_STATUS_LABELS = {
  available: "Available",
  reserved: "Reserved",
  occupied: "Occupied",
  cleaning: "Cleaning",
  "out-of-service": "Out of service",
} as const;

export const TABLE_SHAPE_LABELS = {
  round: "Round",
  square: "Square",
  rectangle: "Rectangle",
  oval: "Oval",
  custom: "Custom",
} as const;

export function getFloorLabel(floorId: string | null | undefined): string | null {
  if (!floorId) return null;
  return FLOOR_OPTIONS.find((floor) => floor.value === floorId)?.label ?? null;
}
