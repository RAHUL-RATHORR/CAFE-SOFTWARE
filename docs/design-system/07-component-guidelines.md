# 7. Component Guidelines

Standards for reusable UI. Prefer composing `src/components/ui` primitives and shared wrappers (`common`, `cards`, `forms`, `tables`, `layout`) over feature-local one-offs.

## Buttons

| Variant | When to use |
|---------|-------------|
| `default` (primary) | Main action on a view/section |
| `secondary` | Supporting action |
| `outline` | Low-emphasis alternative |
| `ghost` | Toolbar / icon actions / nav-adjacent |
| `destructive` | Delete, void, irreversible actions |
| `link` | Inline textual navigation |

Rules:

- One primary button per section maximum.
- Icon + label for important actions; icon-only only with `aria-label`.
- Destructive actions require confirmation dialog when irreversible.
- Disabled state must explain why when possible (tooltip/helper).

## Inputs

- Consistent height with buttons in the same toolbar.
- Always pair with a visible label (or `sr-only` where design requires).
- Error text below field; use danger color + `aria-invalid`.
- Placeholder is hint text — never a substitute for labels.
- Prefer controlled forms via React Hook Form + Zod in feature modules.

## Forms

- Vertical stack with consistent field spacing (`space-4` / 16px).
- Group related fields; use section titles sparingly.
- Primary submit right-aligned on desktop; full-width on mobile when appropriate.
- Validate with shared Zod schemas; map errors to fields.
- Do not mix multiple competing submit buttons without clear hierarchy.

## Cards

- Use shared `AppCard` / shadcn `Card` — do not invent alternate card shells.
- Structure: optional header (title/description/action) → content → optional footer.
- KPI cards: label (muted) → value (emphasized) → trend/meta.
- Avoid nesting cards unless the inner surface is interactive and distinct.

## Tables

- Use shared `DataTable` / shadcn table primitives.
- Sticky header for long lists (when implemented).
- Status via badges with semantic colors.
- Numeric columns aligned consistently.
- Empty table → `EmptyState`, never a blank white box.
- On mobile: horizontal scroll for dense tables, or stacked row cards for critical workflows.

## Dialogs

- Use for confirmations, focused create/edit flows, and blocking decisions.
- Title + short description + actions (cancel secondary, confirm primary/destructive).
- Trap focus; close on Escape; restore focus to trigger.
- Keep content focused — complex multi-step flows prefer full pages or sheets.

## Dropdowns

- For overflow actions and compact filters.
- Menu items: clear labels; destructive items separated and styled with danger.
- Do not hide the only primary action inside a dropdown.

## Sidebar

- Desktop: persistent; collapsible to icon rail.
- Mobile: off-canvas sheet; opens from navbar menu control.
- Active item: accent background + primary indicator.
- Collapsed: icon + tooltip + `sr-only` text.
- Navigation config remains centralized (`src/config/navigation.ts`).

## Navbar

- Sticky top; supports breadcrumb, search (optional), notifications, workspace identity.
- Mobile: menu trigger left; utilities right; breadcrumb may move below.
- Keep height stable (`h-16`) to avoid layout jump.

## Charts

- Live inside cards with title + short description.
- Use chart tokens (`chart-1`…`chart-5`).
- Always include empty and loading treatments.
- Prefer clear axes/legends over ornamental styling.
- Placeholder charts allowed until a chart library is introduced.

## Empty States

- Icon + title + description + optional action.
- Use shared `EmptyState`.
- Copy should explain what will appear and how to proceed.

## Loading States

- Use shared `LoadingState` or skeletons for structured layouts.
- Prefer skeleton mirrors of final layout for dashboards/tables.
- Avoid blocking the entire app shell for local section loads.

## Error States

- Use shared `ErrorState`.
- Provide retry when recovery is possible.
- Keep tone calm and actionable; never expose raw stack traces in UI.

## Composition Rule

```
ui primitives  →  shared wrappers  →  feature components  →  pages
```

Pages assemble features. Features compose shared components. Shared components wrap `ui`. Do not reverse this dependency.
