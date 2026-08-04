# DineFlow Performance Guide

Enterprise performance foundations for Core Web Vitals, caching, bundling, and data access.

## Core Web Vitals

`WebVitalsReporter` mounts in the root layout and observes:

- LCP, FCP, CLS, INP, TTFB

Metrics flow into the in-process `monitoring` + structured `logger` (no third-party APM).

Hook: `useWebVitals()` from `@/hooks/performance`.

## Caching

| Layer | API | Notes |
|-------|-----|-------|
| Process memory | `appCache` | Single-instance TTL cache |
| Request memo | `createRequestMemo` | React `cache()` |
| Next data cache | `cachedQuery` | `unstable_cache` + tags |
| Invalidation | `invalidateCacheNamespace` | Tag + memory |
| Redis-ready | `distributedCacheAdapter` | Memory today; Redis later |

Key builders: `dashboardCacheKey`, `menuCacheKey`, `reportsCacheKey`, …

## Images & fonts

- `OptimizedImage` — `next/image` wrapper (lazy, sizes, remote `unoptimized` fallback)
- Root fonts use `display: "swap"`, `preload`, `adjustFontFallback`

## Bundle analysis

```bash
npm run analyze
```

Opens `@next/bundle-analyzer` when `ANALYZE=true`.

## Tables

Virtualization-ready helpers (no library):

- `shouldVirtualize(rowCount)`
- `computeVirtualWindow(...)`
- `sliceWindow(rows, window)`

## Database

Opt-in helpers in `@/lib/database/query`:

- `buildProjection`, `leanQueryOptions`, `clampPageSize`
- `recommendedIndexHints` documentation

## Route UX

- Dashboard + settings `loading.tsx`
- Root `error.tsx` + `global-error.tsx`
