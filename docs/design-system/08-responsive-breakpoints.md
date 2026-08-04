# 8. Responsive Breakpoints

DineFlow targets restaurant operators on desktop POS-adjacent screens, tablets on the floor, and phones for quick checks.

## Breakpoint Scale

Align with Tailwind defaults unless product needs dictate otherwise:

| Name | Min width | Target |
|------|-----------|--------|
| `sm` | 640px | Large phones / small tablets |
| `md` | 768px | Tablet portrait / compact laptop |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Wide desktop |

## Platform Behavior

### Desktop (`lg+`)

- Persistent sidebar (expanded or collapsed icon rail).
- Multi-column dashboards (e.g., 4 KPI cards).
- Tables in full tabular layout.
- Breadcrumbs in navbar row.

### Tablet (`md`–`lg`)

- Sidebar may remain visible when width allows; otherwise follow mobile sheet pattern below `md`.
- KPI grids: 2 columns.
- Charts and quick actions stack as needed (`xl` for 3-column dashboard split).
- Tables: horizontal scroll acceptable.

### Mobile (`< md`)

- Sidebar hidden; opened via sheet/drawer.
- Navbar shows menu button.
- KPI grids: 1–2 columns.
- Page actions stack under titles.
- Prefer stacked sections over multi-column dashboards.
- Critical tables may use card-list alternative in future modules.

## Sidebar Collapse Rules

| Context | Behavior |
|---------|----------|
| Mobile (`< md`) | Hidden by default; sheet overlay when opened; close on navigate |
| Desktop | Visible; user can collapse to icon rail via shell control |
| Collapse state | Stored in UI store; desktop-only concern |
| Active route | Remains visually indicated in both expanded and collapsed modes |

## Grid Layouts

| Pattern | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| KPI stats | 1–2 cols | 2 cols | 4 cols |
| Chart + side panel | Stack | Stack / 2 col | 2/3 + 1/3 |
| Form layouts | 1 col | 1–2 col | 2 col where labels stay clear |
| Settings sections | 1 col | 1 col | Constrained readable width |

## Card Responsiveness

- Cards stretch to grid cell width.
- Internal content wraps; avoid fixed widths that overflow.
- Actions in card headers move below title on narrow widths when cramped.

## Table Responsiveness

1. Keep semantic table markup when possible.
2. Allow horizontal scroll inside rounded container.
3. Hide non-critical columns at smaller breakpoints if a column priority map exists.
4. For highly operational mobile flows (future), provide a dedicated list/card layout rather than forcing dense tables.

## Touch Targets

- Minimum interactive target ≈ 40×40px on touch devices.
- Increase spacing between adjacent icon buttons on mobile.
