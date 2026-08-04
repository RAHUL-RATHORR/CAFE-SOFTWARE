/**
 * Upload architecture placeholders for future media providers.
 * No cloud integration in this module.
 */

export type UploadProviderId = "cloudinary" | "aws-s3" | "uploadthing" | "local";

export type UploadAssetKind = "image" | "gallery" | "document";

export type UploadAsset = {
  id: string;
  url: string;
  provider: UploadProviderId;
  kind: UploadAssetKind;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
};

export type UploadProviderConfig = {
  id: UploadProviderId;
  label: string;
  enabled: boolean;
  /** Future: env-backed credentials */
  envKeys?: string[];
};

export const uploadProviders: UploadProviderConfig[] = [
  {
    id: "cloudinary",
    label: "Cloudinary",
    enabled: false,
    envKeys: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
  },
  {
    id: "aws-s3",
    label: "AWS S3",
    enabled: false,
    envKeys: ["AWS_S3_BUCKET", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
  },
  {
    id: "uploadthing",
    label: "UploadThing",
    enabled: false,
    envKeys: ["UPLOADTHING_TOKEN"],
  },
  {
    id: "local",
    label: "Local placeholder",
    enabled: true,
  },
];

export const activeUploadProvider: UploadProviderId = "local";

/** Placeholder — returns a data-URL stub path only. */
export function buildPlaceholderImageUrl(fileName = "menu-item.jpg"): string {
  return `placeholder://uploads/${encodeURIComponent(fileName)}`;
}
