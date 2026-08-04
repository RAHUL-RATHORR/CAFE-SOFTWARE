# Testing

## Stack

- **Vitest** + React Testing Library + MSW — unit/integration
- **Playwright** — e2e smoke
- Coverage via `@vitest/coverage-v8`

## Layout

```
src/tests/
  unit/
  integration/
  e2e/
  fixtures/
  helpers/
  mocks/
```

## Commands

```bash
npm run test
npm run test:unit
npm run test:integration
npm run test:coverage
npm run test:e2e          # requires build or running server on 3100
npm run test:e2e:install  # Playwright browsers
```

## CI

GitHub Actions runs typecheck, lint, unit/integration, production build, Playwright, and Docker image build (no cloud deploy).
