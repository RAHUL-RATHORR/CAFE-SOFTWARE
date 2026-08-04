# Environment

See also [deployment/environment.md](./deployment/environment.md).

## Templates

| File | Use |
|------|-----|
| `.env.example` | Shared baseline |
| `.env.development.example` | Docker / local compose |
| `.env.staging.example` | Staging host |
| `.env.production.example` | Production host |

## Critical variables

| Variable | Notes |
|----------|-------|
| `APP_ENV` | `development` \| `staging` \| `production` |
| `MONGODB_URI` | Required for staging/production validation |
| `AUTH_SECRET` | ≥32 chars when staging/production |
| `AUTH_URL` / `NEXT_PUBLIC_APP_URL` | Public origin for SEO + Auth.js |

Validation lives in `src/config/env.ts`.

## Never commit

Real `.env`, `.env.local`, `.env.production`, or any secret material.
