# Security

## Authentication

- Auth.js (NextAuth v5) JWT sessions
- Secure cookies in production
- Demo credentials for local only — disable in production

## Authorization

- Permission registry + role maps (`config/permissions`)
- Server actions should call existing auth/permission helpers
- Middleware enforces **session** gates; role/tenant enforcement remains future hardening

## Public surfaces

- `/menu/**` — guest QR ordering
- `/api/health` — ops health
- All dashboard modules require session (layout + middleware prefixes)

## Defenses in place

- Zod input validation on actions
- Output sanitization / sensitive field masking helpers
- Security headers (CSP report-only, HSTS in prod, COOP/CORP, etc.)
- Rate limiting foundation (auth API + public menu)
- Env secret validation for staging/production

## Reporting

Do not file security issues in public tickets with exploit details. Contact the maintainers privately.
