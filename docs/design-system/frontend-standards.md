# Frontend Standards

Engineering conventions for DineFlow UI so the design system stays enforceable in code.

## Component Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `StatCard`, `PageContainer` |
| shadcn primitives | PascalCase, match library | `Button`, `Sheet` |
| Feature views | PascalCase + `View` suffix optional | `DashboardView` |
| Providers | PascalCase + `Provider`/`Providers` | `AppProviders` |
| Hooks | `use` + camelCase | `useMediaQuery`, `useUiStore` |
| Zustand stores | `use` + domain + `Store` | `useUiStore` |

Component names describe **UI role**, not backend entities when shared (`EmptyState`, not `NoRestaurantsFound` in `common`).

## Folder Naming Conventions

| Area | Convention | Example |
|------|------------|---------|
| Top-level src domains | kebab-case or plural nouns as established | `components`, `features`, `hooks` |
| Feature modules | kebab-case | `features/dashboard` |
| Component categories | kebab-case | `components/layout` |
| Route segments | kebab-case | `menu-items`, `customers` |

Do not invent parallel trees (e.g., a second `components` under `app/`).

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case `.tsx` | `stat-card.tsx`, `app-shell.tsx` |
| Hooks | kebab-case | `use-media-query.ts` |
| Stores | kebab-case | `ui-store.ts` |
| Types | kebab-case | `restaurant.ts` |
| Utils | kebab-case | `format.ts` |
| Config | kebab-case | `navigation.ts`, `app.ts` |
| Docs | kebab-case or numbered | `01-design-principles.md` |

Co-locate feature-only UI under `features/<feature>/components`.

## Reusable Component Rules

1. If used in **2+ features**, promote to `src/components/*`.
2. If it wraps a primitive with product defaults, place in `common` / `cards` / `forms` / `tables` / `layout`.
3. Do not duplicate `EmptyState`, `LoadingState`, `ErrorState`, or card shells inside features.
4. Feature components may compose shared pieces; they must not re-implement them.
5. No copy-paste style variants — extend via props / `cva` / `className` slots.

## TypeScript Standards

- `strict` mode remains on.
- Prefer explicit prop types (`type` / `interface`) for public components.
- Avoid `any`; narrow with Zod/inferred types at boundaries.
- Shared domain types live in `src/types`.
- Export prop types when components are part of the public shared API.
- Keep server/client boundaries clear (`"use client"` only when required).

## Props Structure Guidelines

```tsx
// Preferred shape
type ExampleProps = {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
  // variants as explicit unions
  tone?: "default" | "success" | "warning" | "danger";
};
```

Rules:

- Put styling escapes in `className` (merged with `cn`).
- Use children for composition; avoid `renderHeader` unless necessary.
- Boolean props should be positive (`isLoading`, not `notReady`) where practical.
- Event handlers: `onVerb` (`onRetry`, `onOpenChange`).
- Do not pass raw theme hex via props — pass semantic variants.

## No Duplicate UI Code

| Bad | Good |
|-----|------|
| Local “Empty” markup per page | `EmptyState` |
| One-off KPI card styles | `StatCard` |
| Hand-rolled table markup repeatedly | `DataTable` |
| Hard-coded nav lists in multiple layouts | `config/navigation` |
| Copying button styles | `Button` variants |

## Import Boundaries

```
app → features → components → ui/lib/hooks/store/config/types
```

- `ui` never imports from `features`.
- `components/*` should not import feature modules.
- `features` may import shared components, config, types, utils, hooks, store.

## Design System Compliance (Definition of Ready)

A UI task is ready for review when:

- [ ] Uses tokens (no stray hex)
- [ ] Reuses shared components where applicable
- [ ] Matches spacing/radius/typography rules
- [ ] Responsive behavior defined for mobile/tablet/desktop
- [ ] Loading/empty/error states considered
- [ ] Accessibility checklist addressed
- [ ] No new parallel styling system introduced
