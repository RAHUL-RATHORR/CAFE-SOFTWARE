/**
 * Opaque table QR token helpers and public URL builders.
 * Rendering (canvas/PNG) lives in client components — this module stays isomorphic-safe.
 */

import { randomBytes } from "crypto";
import { siteConfig } from "@/config/site";

export type QrCodeProviderId = "placeholder" | "qrcode" | "api";

export type QrCodePayload = {
  type: "restaurant-table";
  /** Opaque public URL — never encodes database IDs */
  url: string;
  tableNumber?: string;
};

export type QrCodeRenderOptions = {
  size?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
};

export const qrCodeProviders = [
  {
    id: "qrcode" as const,
    label: "qrcode library",
    enabled: true,
  },
  {
    id: "placeholder" as const,
    label: "Placeholder",
    enabled: false,
  },
  {
    id: "api" as const,
    label: "External QR API",
    enabled: false,
  },
];

/** 32-byte cryptographically secure opaque token (base64url). */
export function createOpaqueQrToken(): string {
  return randomBytes(32).toString("base64url");
}

export function buildPublicTableQrPath(token: string): string {
  return `/order/${encodeURIComponent(token)}`;
}

export function buildPublicTableQrUrl(token: string, baseUrl?: string): string {
  const origin = (baseUrl ?? siteConfig.url).replace(/\/$/, "");
  return `${origin}${buildPublicTableQrPath(token)}`;
}

export function buildTableQrPayload(input: {
  token: string;
  tableNumber?: string;
  baseUrl?: string;
}): QrCodePayload {
  return {
    type: "restaurant-table",
    url: buildPublicTableQrUrl(input.token, input.baseUrl),
    tableNumber: input.tableNumber,
  };
}

/** @deprecated Prefer opaque token URLs via buildPublicTableQrUrl */
export function renderQrPlaceholder(
  payload: QrCodePayload,
  _options?: QrCodeRenderOptions
): string {
  void _options;
  return payload.url;
}
