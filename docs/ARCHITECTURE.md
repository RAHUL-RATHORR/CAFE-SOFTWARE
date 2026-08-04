# Architecture

DineFlow follows Clean Architecture with clear module boundaries.

## Layers

```
app/            → Routes, layouts, loading/error boundaries (thin)
actions/        → Server Actions (authz + validation + orchestration)
repositories/   → Data access (Mongoose)
models/         → Schemas
lib/            → Domain helpers, validators, infra (cache, auth, security)
features/       → Public barrels re-exporting domain surfaces
components/     → UI (design system + feature views)
store/          → Zustand client state
config/         → Typed configuration
```

## Patterns

- **Repository Pattern** for all persistence
- **Server Actions** for mutations/queries from the UI
- **Zod** validation at action boundaries
- **RBAC** via permission registry + role maps
- **Tenant isolation** helpers under `lib/tenant`
- **Result helpers** per domain (`*Success` / `*Failure`)

## Dependency direction

```
UI → Actions → Repositories → Models → MongoDB
       ↘ Validators / RBAC / Auth
```

Client components must not import `models/` or Mongoose.

## Infra foundations (v1.0)

- Logging, tracing, rate limiting, health (`/api/health`)
- In-memory cache + Next.js `unstable_cache` wrappers
- Security headers + CSP report-only
- Production Docker / CI / Web Vitals reporting
