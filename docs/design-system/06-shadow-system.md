# 6. Shadow System

Elevation communicates hierarchy. Prefer subtle shadows and soft borders over heavy drop shadows.

## Elevation Levels

| Level | Intent | Typical treatment |
|-------|--------|-------------------|
| `e0` Flat | Background canvas | No shadow |
| `e1` Resting card | Default cards/tables | Soft shadow-sm + subtle ring/border |
| `e2` Raised | Hoverable cards, popovers | Slightly stronger shadow |
| `e3` Overlay | Dialogs, dropdowns, sheets | Clear separation from page |
| `e4` Critical overlay | Rare modal emphasis | Strongest allowed elevation |

## Recommended Pairings

| Component | Elevation |
|-----------|-----------|
| Stat / content cards | `e1`, strengthen to `e2` on hover if interactive |
| Tables (in card) | Rely on card elevation; no extra table shadow |
| Dropdown / popover | `e3` |
| Dialog / sheet | `e3` |
| Sidebar / navbar | Border-based separation; minimal or no shadow |
| Floating action (if ever used) | `e2`–`e3` |

## Rules

1. Prefer `ring-1 ring-foreground/10` + light shadow for cards (matches current shadcn card language).
2. Do not stack multiple heavy shadows.
3. No colored glow shadows for branding.
4. Dark mode: reduce shadow intensity; increase border contrast instead.
5. Motion + shadow: animate opacity/transform, not shadow blur values continuously.
