# 5. Border Radius Rules

DineFlow uses a rounded-xl oriented system for a modern enterprise feel without pill-heavy UI.

## Base Token

| Token | Value | Notes |
|-------|-------|-------|
| `--radius` | `0.75rem` (12px) | Base radius |
| `--radius-sm` | calc(base × 0.6) | Small controls |
| `--radius-md` | calc(base × 0.8) | Compact inputs/buttons |
| `--radius-lg` | base | Default controls |
| `--radius-xl` | calc(base × 1.4) | Cards, panels, sidebar items |

## Usage Matrix

| Element | Radius |
|---------|--------|
| Buttons | `lg` / component default |
| Inputs / selects | Match button radius |
| Cards / panels | `xl` |
| Dialogs / sheets | `xl` (desktop); sheet edges follow platform |
| Badges / status chips | Slightly fuller than buttons, not full-pill by default |
| Avatars | `xl` or full circle only for user avatars |
| Tables | Container `xl`; inner cells square |
| Sidebar nav items | `xl` |
| Charts containers | `xl` card radius |

## Rules

1. **Default to xl for containers** — cards, empty states, chart shells.
2. **Avoid `rounded-full` pills** for primary actions and nav items (except toggles/avatars).
3. Keep radius consistent within a component family (button sizes may scale slightly).
4. Nested surfaces: inner radius ≤ outer radius.
