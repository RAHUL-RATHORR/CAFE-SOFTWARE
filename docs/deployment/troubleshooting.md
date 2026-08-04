# Troubleshooting Guide

## App container unhealthy

```bash
docker compose logs app --tail=200
curl -v http://127.0.0.1:3000/api/health
```

Common causes:

- Missing `AUTH_SECRET` when `APP_ENV=production|staging`
- Wrong `MONGODB_URI` host (`mongodb` service name inside Compose network)
- App started before Mongo ready (Compose waits on `service_healthy`)

## MongoDB not reachable

```bash
docker compose ps mongodb
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

Ensure the app URI uses the Compose service hostname `mongodb`, not `localhost`, when running inside Docker.

## Build fails in Docker

- Confirm `package-lock.json` is present
- Use `--legacy-peer-deps` (already in Dockerfile)
- Check BuildKit logs for OOM on small hosts

## `routesManifest.dataRoutes is not iterable`

Corrupted `.next` output. Rebuild:

```bash
rm -rf .next
npm run build
```

Or rebuild the image with `--no-cache`.

## Port already in use

Change `APP_PORT` / `MONGO_PORT` in the env file.

## CI Docker job slow

GHA cache is enabled via Buildx. First run is cold; subsequent runs reuse layers.

## Structured logs missing

Ensure you are reading container stdout:

```bash
docker compose logs -f app
```

`LOG_LEVEL=debug` increases verbosity in non-production.
