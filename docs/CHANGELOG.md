# Changelog

All notable changes for DineFlow releases.

## [1.0.0-rc.1] — 2026-08-04

### Added

- Full restaurant ops modules: Orders, Kitchen, Billing, CRM, Inventory/Purchases, Staff, Reports, Settings
- Subscription + Super Admin control plane
- QR Ordering public portal
- Notification center foundation
- Production hardening (logging, tracing, health, rate limit, security headers)
- Docker + Compose + CI/CD workflows
- Testing foundation (Vitest, Playwright, MSW)
- Performance foundations (Web Vitals, cache helpers, bundle analyze)
- SEO foundations (metadata OG/Twitter, robots, sitemap)

### Changed

- Expanded protected route prefixes for vendors/purchases/staff/shifts/subscription
- Root README aligned to DineFlow v1.0 RC

### Security

- Env validation for staging/production secrets
- CSP report-only + security headers
- Public routes limited to `/menu` and `/api/health`
