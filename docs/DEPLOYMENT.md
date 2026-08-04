# Deployment

Canonical deployment documentation lives in:

→ **[deployment/README.md](./deployment/README.md)**

Quick production path:

```bash
cp .env.production.example .env.production
# set AUTH_SECRET, AUTH_URL, MONGODB_URI
docker compose --env-file .env.production up -d --build
curl http://127.0.0.1:3000/api/health
```
