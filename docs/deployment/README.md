# DineFlow Deployment Guide

Cloud-agnostic production deployment for DineFlow (Next.js 15 + MongoDB).

## Recommended path (Docker Host / VPS)

1. Provision a Linux VM (Ubuntu 22.04+ recommended) with Docker Engine + Compose plugin.
2. Clone the repository onto the host.
3. Copy env template and fill secrets:

```bash
cp .env.production.example .env.production
# edit AUTH_SECRET, AUTH_URL, MONGODB_URI, NEXT_PUBLIC_BUILD_ID
openssl rand -base64 48   # generate AUTH_SECRET
```

4. Build and start:

```bash
docker compose --env-file .env.production up -d --build
```

5. Verify:

```bash
curl -fsS http://127.0.0.1:3000/api/health
docker compose ps
docker compose logs -f app
```

6. Put a reverse proxy (Caddy / Nginx / Traefik) in front with TLS.

## Platform notes (manual — no automation in-repo)

| Platform | Approach |
|----------|----------|
| **VPS / Docker Host** | Use `docker-compose.yml` as above |
| **Railway** | Deploy from GitHub; set env vars in dashboard; attach MongoDB plugin or external URI |
| **Render** | Web Service from Dockerfile; set env; managed Mongo or Atlas URI |
| **DigitalOcean** | Droplet + Docker, or App Platform Dockerfile deploy |
| **AWS EC2** | EC2 + Docker Engine; optional ALB health check → `/api/health` |
| **Azure VM** | Same as VPS; NSG allow 80/443 |
| **Google Cloud VM** | Same as VPS; firewall allow health checks |

Do **not** commit secrets. Prefer platform secret stores / host env files with `0600` permissions.

## Health checks

- Application: `GET /api/health`
- Container: Docker `HEALTHCHECK` in `Dockerfile` and Compose
- Database: MongoDB `mongosh` ping in Compose

## Rollback

```bash
docker compose --env-file .env.production down
# redeploy previous image tag
IMAGE_TAG=<previous> docker compose --env-file .env.production up -d
```

## Related docs

- [Docker Guide](./docker.md)
- [Environment Guide](./environment.md)
- [CI/CD Guide](./cicd.md)
- [Troubleshooting](./troubleshooting.md)
- [Production Checklist](./production-checklist.md)
