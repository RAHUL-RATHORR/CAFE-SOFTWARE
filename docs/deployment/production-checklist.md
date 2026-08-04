# Production Checklist

## Before first deploy

- [ ] `APP_ENV=production`
- [ ] Strong `AUTH_SECRET` (≥32 chars, unique per environment)
- [ ] `AUTH_URL` set to public HTTPS origin
- [ ] `MONGODB_URI` points to durable Mongo (prefer auth + backups)
- [ ] Demo auth credentials disabled / rotated
- [ ] TLS reverse proxy configured
- [ ] `/api/health` monitored by load balancer
- [ ] Docker / host firewall restricts Mongo port from public internet
- [ ] Log retention configured (`json-file` max-size/max-file or central logging)
- [ ] Backups scheduled for Mongo volume / managed DB
- [ ] `NEXT_PUBLIC_BUILD_ID` set for release traceability

## Security

- [ ] Non-root container verified (`docker compose exec app id`)
- [ ] Secrets not in git history
- [ ] Rate limiting enabled (`RATE_LIMIT_ENABLED=true`)
- [ ] Security headers present (Next config + middleware)
- [ ] `no-new-privileges` active in Compose

## Validation commands

```bash
npm run build
docker compose --env-file .env.production config
docker compose --env-file .env.production up -d --build
curl -fsS https://app.example.com/api/health
```

## Post-deploy

- [ ] Login works
- [ ] Health returns `ok: true` (or degraded with clear DB message)
- [ ] Container health = `healthy`
- [ ] Rollback plan documented with previous `IMAGE_TAG`
