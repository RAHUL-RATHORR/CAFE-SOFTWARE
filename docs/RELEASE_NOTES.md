# Release Notes — DineFlow 1.0.0 RC1

**Codename:** Release Candidate 1  
**Date:** 2026-08-04

## What's included

DineFlow 1.0 RC delivers an end-to-end restaurant SaaS foundation:

- Multi-tenant restaurant operations (menu, tables, orders, kitchen, billing)
- CRM, purchases/inventory foundations, staff/shifts, reports
- SaaS subscription + super-admin platform controls
- Guest QR ordering portal
- Auth.js authentication with RBAC scaffolding
- Ops readiness: health checks, Docker, CI, structured logging, Web Vitals

## Upgrade notes

- This is the first RC — treat as production-candidate, not final GA
- Set `APP_ENV=production` and strong `AUTH_SECRET` (≥32) before public deploy
- Disable demo auth credentials in real production

## Known limitations (planned for 1.1)

- Middleware role/tenant enforcement still placeholder (session gate only + dashboard `requireAuth`)
- Redis not integrated (in-memory / Next cache only)
- External APM / payment gateway / SMS / WhatsApp not integrated
- CSP remains report-only pending nonce pipeline
- Table virtualization helpers present; UI virtualization optional follow-up
- Public QR portal payment is placeholder-only

## Support

See [SECURITY.md](./SECURITY.md) and [deployment/README.md](./deployment/README.md).
