/**
 * Centralized Version Configuration for DineFlow.
 * Single source of truth for application version and build metadata.
 */

export const APP_VERSION = "1.0.0";
export const APP_NAME = "DineFlow";

export function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION ?? APP_VERSION;
}

export function getBuildId(): string {
  return (
    process.env.NEXT_PUBLIC_BUILD_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.BUILD_ID ??
    "v1.0.0-release"
  );
}

export function getVersionInfo() {
  return {
    name: APP_NAME,
    version: getAppVersion(),
    buildId: getBuildId(),
    releaseDate: "2026-09-10",
    environment: process.env.NODE_ENV ?? "production",
  };
}
