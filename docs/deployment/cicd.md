# CI/CD Guide

## Workflows

| Workflow | File | Triggers |
|----------|------|----------|
| CI | `.github/workflows/ci.yml` | push / PR to main, master, develop |
| Deploy placeholder | `.github/workflows/deploy-placeholder.yml` | `workflow_dispatch` |

## CI pipeline stages

1. **Checkout**
2. **Install** (`npm ci --legacy-peer-deps`) + dependency cache
3. **Typecheck** (`tsc --noEmit`)
4. **Lint**
5. **Unit + integration tests** (+ coverage artifact)
6. **Production build** (+ standalone artifact placeholder)
7. **Playwright e2e**
8. **Docker image build** (Buildx, no registry push) + image tar artifact
9. **Deployment placeholder** (main/master only — prints plan, no cloud deploy)

## Local parity

```bash
npm ci --legacy-peer-deps
npx tsc --noEmit
npm run lint
npm run test
npm run build
docker build -t dineflow-app:local .
```

## Extending deploy

Wire `deploy-placeholder.yml` to your host, for example:

- SSH + `docker compose pull && up -d`
- Railway / Render CLI
- Push image to GHCR then pull on VPS

Keep secrets in GitHub Environments / Actions secrets — never in the repo.
