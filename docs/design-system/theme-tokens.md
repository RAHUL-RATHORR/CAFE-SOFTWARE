# Theme Tokens

Canonical token plan for DineFlow theming. Implementation should expose these as CSS variables (already seeded in `globals.css`) and Tailwind theme mappings.

## Brand & Action

| Token | Light default | Role |
|-------|---------------|------|
| `--primary` | `#2563EB` | Brand / primary action |
| `--primary-foreground` | `#FFFFFF` | On-primary content |
| `--secondary` | `#F1F5F9` | Secondary surface |
| `--secondary-foreground` | `#0F172A` | On-secondary content |
| `--ring` | `#2563EB` | Focus ring |

## Semantic Status

| Token | Light default | Role |
|-------|---------------|------|
| `--success` | `#16A34A` | Success |
| `--success-foreground` | `#FFFFFF` | On-success |
| `--warning` | `#F59E0B` | Warning |
| `--warning-foreground` | `#FFFFFF` | On-warning |
| `--destructive` | `#DC2626` | Danger / error |
| *(destructive foreground)* | Use light text on solid danger buttons as needed | Danger content |

## Surfaces

| Token | Light default | Role |
|-------|---------------|------|
| `--background` | `#F8FAFC` | App background |
| `--foreground` | `#0F172A` | Primary text |
| `--card` | `#FFFFFF` | Card background |
| `--card-foreground` | `#0F172A` | Card text |
| `--popover` | `#FFFFFF` | Overlay surface |
| `--popover-foreground` | `#0F172A` | Overlay text |
| `--muted` | `#F1F5F9` | Muted surface |
| `--muted-foreground` | `#64748B` | Muted text |
| `--accent` | `#EFF6FF` | Soft highlight |
| `--accent-foreground` | `#1E40AF` | Accent text |

## Borders & Inputs

| Token | Light default | Role |
|-------|---------------|------|
| `--border` | `#E2E8F0` | Borders / dividers |
| `--input` | `#E2E8F0` | Input borders |

## Sidebar

| Token | Light default | Role |
|-------|---------------|------|
| `--sidebar` | `#FFFFFF` | Sidebar background |
| `--sidebar-foreground` | `#0F172A` | Sidebar text |
| `--sidebar-primary` | `#2563EB` | Sidebar brand mark / emphasis |
| `--sidebar-primary-foreground` | `#FFFFFF` | On sidebar primary |
| `--sidebar-accent` | `#EFF6FF` | Active/hover item bg |
| `--sidebar-accent-foreground` | `#1E40AF` | Active/hover item text |
| `--sidebar-border` | `#E2E8F0` | Sidebar border |
| `--sidebar-ring` | `#2563EB` | Sidebar focus |

## Charts

| Token | Light default |
|-------|---------------|
| `--chart-1` | `#2563EB` |
| `--chart-2` | `#16A34A` |
| `--chart-3` | `#F59E0B` |
| `--chart-4` | `#0EA5E9` |
| `--chart-5` | `#8B5CF6` |

## Radius

| Token | Value |
|-------|-------|
| `--radius` | `0.75rem` |
| Derived | `sm` / `md` / `lg` / `xl` / `2xl` via calc multipliers |

## Theming Rules

1. **Token names are API** — do not rename casually; add new tokens if needed.
2. **Components bind to tokens**, not hex literals.
3. **Restaurant white-labeling (future)** may override primary/sidebar tokens per tenant without rewriting components.
4. **Dark mode** overrides the same token names under `.dark`.
5. **App display name** comes from config/env (`NEXT_PUBLIC_APP_NAME` / `appConfig`), not from color tokens.

## Future Extension Tokens (Planned, Not Implemented)

| Token idea | Purpose |
|------------|---------|
| `--info` | Neutral informational callouts |
| `--surface-sunken` | Recessed panels |
| `--overlay-scrim` | Modal backdrop opacity standardization |
| `--table-row-hover` | Explicit table hover surface |

Add only when a real module requires them.
