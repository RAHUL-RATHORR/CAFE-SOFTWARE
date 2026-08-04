# 9. Accessibility Guidelines

DineFlow must be operable by keyboard and understandable with assistive tech. Accessibility is part of the design system, not a later audit-only task.

## Baseline Target

- Aim for **WCAG 2.2 AA** for product UI.
- Do not rely on color alone to convey status (pair with text/icon).

## Color & Contrast

- Body text on background/card must meet contrast requirements.
- Muted text is for secondary content only — never critical instructions.
- Focus ring uses `--ring` and must remain visible on all interactive elements.
- Status badges include text labels (`Pending`, `Ready`), not color-only dots.

## Keyboard

- All interactive controls reachable via Tab.
- Logical focus order matching visual order.
- Dialogs/sheets: focus trap + Escape to close + return focus to trigger.
- Dropdowns: arrow key navigation where component supports it.
- Skip-to-content may be added at shell level in a future accessibility pass.

## Semantics

- Use correct landmarks: `nav`, `main`, `header`, complementary regions as needed.
- Page titles via visible `h1` (through `PageContainer`).
- Buttons are buttons; links are links — do not swap roles for styling convenience.
- Icon-only controls require accessible names (`aria-label`).

## Forms

- Labels associated with inputs.
- Errors linked via `aria-describedby` / invalid states.
- Required fields indicated programmatically and visually.

## Motion

- Honor `prefers-reduced-motion`: reduce or disable non-essential animation.
- Do not use motion as the only indicator of state change.

## Loading / Empty / Error

- Loading regions should expose polite status where appropriate (`aria-live` / `role="status"`).
- Error regions use `role="alert"` when they need immediate attention.
- Empty states remain focus-friendly if they contain actions.

## Checklist (Per Feature PR)

- [ ] Keyboard operable
- [ ] Focus visible
- [ ] Labels/names present
- [ ] Contrast acceptable
- [ ] Status not color-only
- [ ] Reduced motion respected
- [ ] Dialogs accessible
