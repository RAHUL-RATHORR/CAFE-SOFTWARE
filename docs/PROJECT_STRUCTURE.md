# Project Structure

```
CAFE SOFTWARE/
├── src/
│   ├── app/                 # App Router (auth, dashboard, public, api)
│   ├── actions/             # Server Actions by domain
│   ├── repositories/        # Data access
│   ├── models/              # Mongoose schemas
│   ├── components/          # UI + feature views
│   ├── features/            # Domain barrels
│   ├── lib/                 # Domain + infra utilities
│   ├── hooks/               # React hooks
│   ├── store/               # Zustand
│   ├── providers/           # App providers
│   ├── config/              # Configuration
│   ├── types/               # Shared types
│   ├── tests/               # unit / integration / e2e
│   └── utils/               # Generic helpers (format, string)
├── docs/                    # Architecture, deployment, performance, design
├── scripts/                 # Tooling (bundle analyze)
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── vitest.config.ts
├── playwright.config.ts
└── .github/workflows/
```

## Route groups

| Group | Purpose |
|-------|---------|
| `(auth)` | Login / password flows |
| `(dashboard)` | Authenticated restaurant ops |
| `(public)` | QR self-service menu |
| `(onboarding)` | Tenant onboarding |
| `api` | Auth.js + health |
