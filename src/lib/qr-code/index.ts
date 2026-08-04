/**
 * QR code architecture placeholder for table deep-links.
 * No real QR generation in this module.
 */

export type QrCodeProviderId = "placeholder" | "qrcode" | "api";

export type QrCodePayload = {
  type: "restaurant-table";
  restaurantId: string;
  tableId?: string;
  tableNumber: string;
  url: string;
};

export type QrCodeRenderOptions = {
  size?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
};

export const qrCodeProviders = [
  {
    id: "placeholder" as const,
    label: "Placeholder",
    enabled: true,
  },
  {
    id: "qrcode" as const,
    label: "qrcode library (future)",
    enabled: false,
  },
  {
    id: "api" as const,
    label: "External QR API (future)",
    enabled: false,
  },
];

export function buildTableQrPayload(input: {
  restaurantId: string;
  tableId?: string;
  tableNumber: string;
}): QrCodePayload {
  const url = `dineflow://table/${input.restaurantId}/${encodeURIComponent(input.tableNumber)}`;
  return {
    type: "restaurant-table",
    restaurantId: input.restaurantId,
    tableId: input.tableId,
    tableNumber: input.tableNumber,
    url,
  };
}

/** Returns a deterministic placeholder string — not a rendered QR image. */
export function renderQrPlaceholder(
  payload: QrCodePayload,
  _options?: QrCodeRenderOptions
): string {
  void _options;
  return payload.url;
}
