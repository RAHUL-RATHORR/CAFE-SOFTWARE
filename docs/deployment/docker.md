# Docker Guide

## Images

Multi-stage `Dockerfile`:

1. **deps** — `npm ci --legacy-peer-deps`
2. **builder** — `next build` with `output: "standalone"`
3. **runner** — Alpine, non-root `nextjs` user, `node server.js`

## Commands

```bash
# Production stack
docker compose --env-file .env.production up -d --build

# Development stack (+ optional Mongo Express profile)
docker compose -f docker-compose.dev.yml --env-file .env.development up -d --build
docker compose -f docker-compose.dev.yml --profile tools up -d

# Logs (structured JSON from app logger appears in container stdout)
docker compose logs -f app

# Rebuild app only
docker compose build app --no-cache
```

## Services

| Service | Prod | Dev | Notes |
|---------|------|-----|-------|
| `app` | ✓ | ✓ | Next.js standalone on `:3000` |
| `mongodb` | ✓ | ✓ | Persistent volume |
| `mongo-express` | ✗ | profile `tools` | UI on `:8081` |

## Security practices

- Non-root user (`uid 1001`)
- `no-new-privileges`
- Minimal Alpine base
- Secrets via env / Compose env-file (never baked into layers)
- `.dockerignore` excludes `.env*`, tests, `.git`

## Layer caching

CI uses Buildx GHA cache. Locally, keep `package-lock.json` stable to reuse the deps stage.

## Health

```bash
docker inspect --format='{{.State.Health.Status}}' dineflow-app
curl -fsS http://127.0.0.1:3000/api/health
```
