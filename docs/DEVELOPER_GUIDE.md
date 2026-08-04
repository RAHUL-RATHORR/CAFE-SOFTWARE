# Developer Guide

## Prerequisites

- Node.js 20 LTS
- MongoDB 7+
- npm

## Local setup

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

Default demo credentials (if configured): see `AUTH_DEMO_*` in `.env.example`.

## Conventions

1. Prefer **Server Components**; mark client islands with `"use client"`.
2. Put mutations in **Server Actions**; validate with Zod.
3. Persist only through **repositories**.
4. Export domain surfaces via `features/<domain>`.
5. Do not import `mongoose` / `models` from client code.
6. Use design-system / `components/ui` primitives before creating new ones.

## Adding a domain feature

1. Types → model → validator → repository → action → components → routes
2. Wire permissions in `config/permissions`
3. Add loading UI under the route segment
4. Cover helpers with unit tests where pure logic exists

## Useful commands

```bash
npx tsc --noEmit
npm run lint
npm run test
npm run build
npm run analyze
```
