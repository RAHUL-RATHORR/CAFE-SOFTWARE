# 2. Color System

DineFlow uses a semantic token system. Components consume tokens — never raw hex values in feature UI.

## Brand & Semantic Palette (Default Light)

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Primary | `--primary` | `#2563EB` | Primary actions, active nav, key accents |
| Primary foreground | `--primary-foreground` | `#FFFFFF` | Text/icons on primary |
| Secondary | `--secondary` | `#F1F5F9` | Secondary surfaces / subtle fills |
| Secondary foreground | `--secondary-foreground` | `#0F172A` | Text on secondary |
| Success | `--success` | `#16A34A` | Positive status, completed, available |
| Warning | `--warning` | `#F59E0B` | Attention, pending, capacity risk |
| Danger | `--destructive` | `#DC2626` | Errors, destructive actions, cancelled |
| Background | `--background` | `#F8FAFC` | App canvas |
| Foreground | `--foreground` | `#0F172A` | Primary text |
| Card | `--card` | `#FFFFFF` | Elevated content surfaces |
| Card foreground | `--card-foreground` | `#0F172A` | Text on cards |
| Border | `--border` | `#E2E8F0` | Dividers, outlines |
| Input | `--input` | `#E2E8F0` | Input borders |
| Muted | `--muted` | `#F1F5F9` | Quiet backgrounds |
| Muted foreground | `--muted-foreground` | `#64748B` | Secondary/helper text |
| Accent | `--accent` | `#EFF6FF` | Soft highlight / selected rows |
| Accent foreground | `--accent-foreground` | `#1E40AF` | Text on accent |
| Ring | `--ring` | `#2563EB` | Focus ring |

## Surface Roles

| Surface | Token | Purpose |
|---------|-------|---------|
| App background | `--background` | Page canvas behind content |
| Card / panel | `--card` | Widgets, tables containers, forms |
| Popover / overlay | `--popover` | Dropdowns, menus, floating panels |
| Sidebar | `--sidebar` | Navigation shell |
| Sidebar accent | `--sidebar-accent` | Active/hover nav item |

## Status Mapping (Restaurant Domain)

| Domain status | Color role | Notes |
|---------------|------------|-------|
| Pending | Warning | Awaiting action |
| Preparing | Primary | In progress |
| Ready | Success | Ready to serve / pickup |
| Completed | Muted | Historical / settled |
| Cancelled | Danger | Failed / voided |
| Occupied table | Warning or Primary | Keep consistent across floor map |
| Available table | Success | Keep consistent across floor map |

## Usage Rules

1. **One primary accent per view** — Primary blue is for action and navigation emphasis.
2. **Semantic colors are not decorative** — Success/Warning/Danger communicate meaning.
3. **Text contrast** — Body text uses `--foreground` or `--muted-foreground` only.
4. **Borders stay neutral** — Prefer `--border`; do not colorize borders unless indicating state.
5. **No hard-coded hex in components** — Use CSS variables / Tailwind token classes (`bg-primary`, `text-muted-foreground`, etc.).
6. **Charts** — Use `--chart-1` … `--chart-5` in order; do not invent ad-hoc series colors per page.

## Dark Mode (Planned Token Parity)

Dark theme must map the same semantic roles (primary, success, warning, danger, surfaces, text). Implementation may refine hex values later, but token names remain stable.

See [Theme Tokens](./theme-tokens.md) for the full inventory.
