"use client";

import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { performanceConfig } from "@/config/performance";

type OptimizedImageProps = Omit<ImageProps, "alt"> & {
  alt: string;
  /** Prefer for LCP hero imagery */
  priority?: boolean;
  className?: string;
};

/**
 * next/image wrapper with responsive defaults, lazy loading, and blur-ready sizing.
 * External absolute URLs fall back to unoptimized to avoid remotePatterns breakage.
 */
export function OptimizedImage({
  alt,
  className,
  priority = false,
  quality = performanceConfig.images.quality,
  sizes,
  src,
  ...props
}: OptimizedImageProps) {
  const srcString = typeof src === "string" ? src : null;
  const isRemote =
    Boolean(srcString) &&
    (srcString!.startsWith("http://") || srcString!.startsWith("https://"));

  return (
    <Image
      alt={alt}
      src={src}
      className={cn(className)}
      quality={quality}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      sizes={sizes ?? performanceConfig.images.sizes.card}
      unoptimized={isRemote}
      {...props}
    />
  );
}
