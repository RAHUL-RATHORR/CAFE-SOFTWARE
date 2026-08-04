# Environment Guide

## Files

| File | Purpose |
|------|---------|
| `.env.example` | Shared template (committed) |
| `.env.development.example` | Docker / local development |
| `.env.staging.example` | Staging host |
| `.env.production.example` | Production host |
| `.env.local` | Local Next.js (gitignored) |

Copy examples → real files; never commit filled secrets.

## Required variables

| Variable | Dev | Staging / Prod |
|----------|-----|----------------|
| `MONGODB_URI` | recommended | **required** |
| `AUTH_SECRET` (≥32 chars) | recommended | **required** |
| `APP_ENV` | `development` | `staging` / `production` |
| `AUTH_URL` | localhost | public HTTPS origin |
| `NEXT_PUBLIC_APP_NAME` | yes | yes |

Validation is enforced by `src/config/env.ts` when `APP_ENV` is `staging` or `production`.

## Generating secrets

```bash
openssl rand -base64 48
```

## Docker Compose

```bash
docker compose --env-file .env.production up -d
```

Compose interpolates `${AUTH_SECRET:?...}` — missing production secret fails fast.

## Public vs private

- `NEXT_PUBLIC_*` — inlined at **build** time (pass as Docker build-args).
- `AUTH_SECRET`, `MONGODB_URI` — **runtime** only.

## Logging

| Variable | Effect |
|----------|--------|
| `LOG_LEVEL` | `debug` \| `info` \| `warning` \| `error` \| `critical` |
| `RATE_LIMIT_ENABLED` | `true` / `false` |

Application logs are structured JSON on stdout → Docker `json-file` driver.
