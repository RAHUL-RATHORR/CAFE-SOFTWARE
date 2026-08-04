# 4. Spacing System

Spacing creates rhythm and reduces cognitive load. Use a consistent 4px base scale.

## Base Scale (4px)

| Token | Value | Common use |
|-------|-------|------------|
| `space-0` | 0 | Reset |
| `space-1` | 4px | Tight icon gaps |
| `space-2` | 8px | Inline chip/icon padding |
| `space-3` | 12px | Compact control gaps |
| `space-4` | 16px | Default inner padding (sm) |
| `space-5` | 20px | Medium gaps |
| `space-6` | 24px | Section gaps, card padding |
| `space-8` | 32px | Major section separation |
| `space-10` | 40px | Page block separation |
| `space-12` | 48px | Rare large separations |

Map to Tailwind spacing units (`p-4`, `gap-6`, etc.) rather than arbitrary values.

## Layout Rhythm

| Context | Rule |
|---------|------|
| Page padding | `16px` mobile → `24px` tablet → `32px` desktop |
| Stack between page sections | `24px` (`gap-6`) |
| Grid gap between cards | `16px` (`gap-4`) |
| Card internal padding | `16px` default; `12px` compact |
| Form field vertical gap | `16px` |
| Label → control | `6–8px` |
| Navbar / sidebar item padding | Consistent with shell components |

## Rules

1. Prefer scale tokens over one-off values (`p-[13px]` is banned unless unavoidable).
2. Outer page spacing comes from `PageContainer` — features should not re-pad the whole page.
3. Dense operational views (kitchen/orders boards) may use compact spacing, but stay on-scale.
4. Do not mix large empty regions with cramped clusters in the same viewport.
