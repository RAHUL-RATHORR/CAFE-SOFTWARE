# 10. Animation Guidelines

Motion should communicate hierarchy and continuity — never delay work.

## Principles

1. **Purposeful** — Animate state changes users need to notice (sidebar, overlays, section enter).
2. **Fast** — Most UI transitions: **150–300ms**.
3. **Subtle** — Small opacity/translate; avoid bounce and large spring theatrics.
4. **Interruptible** — Prefer CSS/Framer transitions that can be cut short by user input.
5. **Optional** — Respect `prefers-reduced-motion`.

## Approved Motion Types

| Type | Use | Typical duration |
|------|-----|------------------|
| Fade + slight rise | Card/section mount | 200–350ms |
| Opacity | Overlays, tooltips | 150–200ms |
| Slide | Sheets / mobile sidebar | 200–300ms |
| Layout indicator | Active sidebar marker (`layoutId`) | Soft, short |
| Width transition | Desktop sidebar expand/collapse | ~200ms |
| Progress / spinner | Loading only | Continuous, restrained |

## Disallowed / Avoid

- Continuous decorative looping animations on dashboards
- Parallax and large page transitions between ops routes
- Shadow-blur animation as primary effect
- Staggered animations that delay first interaction significantly
- Confetti / celebratory motion in operational workflows

## Framer Motion Usage

- Allowed for shared/feature UI polish where CSS is insufficient.
- Keep variants reusable; avoid one-off animation objects copied across files.
- Prefer animating `opacity` and `transform` (compositor-friendly).
- Do not animate layout-thrashing properties (`top`/`left`/`width` heavily) except intentional sidebar width.

## Performance

- Limit concurrent animated nodes on data-heavy pages (tables with hundreds of rows should not animate each row).
- Animate containers, not every cell.
- Disable non-essential hover motion on touch-primary devices when it adds no value.

## Pattern Examples (Guidance Only)

- Dashboard KPI cards: light enter transition once.
- Chart bars placeholder: short grow-on-mount.
- Quick actions: light stagger ≤ 50ms per item, total under ~200ms.
- Route changes: no full-page cinematic transitions.
