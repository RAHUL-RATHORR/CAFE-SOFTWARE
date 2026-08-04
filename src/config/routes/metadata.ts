import type { Metadata } from "next";
import { appConfig } from "@/config/app";
import type { PageMetadataConfig, RouteConfig } from "@/types/navigation";
import { routeRegistry, type RouteName } from "./registry";

function isRouteName(value: string): value is RouteName {
  return Object.prototype.hasOwnProperty.call(routeRegistry, value);
}

function isRouteConfig(
  input: PageMetadataConfig | RouteConfig | RouteName
): input is RouteConfig {
  return (
    typeof input === "object" &&
    input !== null &&
    "path" in input &&
    "name" in input
  );
}

function metadataFromRoute(route: RouteConfig): PageMetadataConfig {
  return (
    route.metadata ?? {
      title: route.pageTitle ?? route.breadcrumbTitle ?? route.name,
    }
  );
}

export function getRouteMetadata(
  name: RouteName
): PageMetadataConfig | undefined {
  return routeRegistry[name].metadata;
}

export function getRoutePageMetadata(
  name: RouteName
): PageMetadataConfig | undefined {
  return getRouteMetadata(name);
}

/**
 * Builds a Next.js Metadata object from route config (placeholder-ready).
 * Does not implement real OG image fetching.
 */
export function buildPageMetadata(
  input: PageMetadataConfig | RouteConfig | RouteName
): Metadata {
  let meta: PageMetadataConfig;

  if (typeof input === "string") {
    if (!isRouteName(input)) {
      meta = { title: input };
    } else {
      meta = metadataFromRoute(routeRegistry[input] as RouteConfig);
    }
  } else if (isRouteConfig(input)) {
    meta = metadataFromRoute(input);
  } else {
    meta = input;
  }

  const title = meta.title;
  const description = meta.description;

  return {
    title,
    description,
    keywords: meta.keywords,
    applicationName: appConfig.name,
    openGraph: {
      title: meta.openGraph?.title ?? title,
      description: meta.openGraph?.description ?? description,
      images: meta.openGraph?.images,
      siteName: appConfig.name,
    },
  };
}

export function getSeoTitle(name: RouteName): string {
  const route = routeRegistry[name] as RouteConfig;
  return (
    route.seoTitle ?? route.pageTitle ?? route.breadcrumbTitle ?? route.name
  );
}
