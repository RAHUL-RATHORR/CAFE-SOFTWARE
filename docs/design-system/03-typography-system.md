# 3. Typography System

Typography must maximize scanability for dashboards used under time pressure.

## Font Families

| Role | Token / Variable | Recommended | Notes |
|------|------------------|-------------|-------|
| UI / Body | `--font-sans` | Geist Sans (current) | Default interface typeface |
| Headings | `--font-heading` | Same as sans | Keep unified; avoid decorative display fonts |
| Mono | `--font-geist-mono` | Geist Mono | Order IDs, SKUs, codes, amounts when tabular |

## Type Scale

Use a restrained scale. Prefer Tailwind text utilities mapped to this intent:

| Token intent | Approx. size | Weight | Use |
|--------------|--------------|--------|-----|
| `display` | 30–36px | 600 | Rare marketing/hero only (not ops dashboards) |
| `page-title` | 24–30px | 600 | Page headers (`PageContainer` title) |
| `section-title` | 16–18px | 500–600 | Card titles, section heads |
| `body` | 14px | 400–500 | Default UI text |
| `body-sm` | 12–13px | 400 | Meta, timestamps, helper text |
| `label` | 12–14px | 500 | Form labels, table headers |
| `numeric` | 14–24px | 600 | KPI values (prefer tabular nums) |

## Hierarchy Rules

1. **One page title** per view.
2. **Card titles** stay smaller than the page title.
3. **KPI numbers** may be large; labels above them stay muted and small.
4. **Helper text** always uses muted foreground — never compete with body text.
5. **Do not** mix more than two weights in a single dense component unless needed for status.

## Readability Standards

- Line length for descriptive copy: aim ≤ 70–80 characters where possible.
- Table text: single-line preferred; truncate with tooltip when needed.
- Avoid all-caps except short badges/status labels.
- Maintain minimum 14px for interactive control labels.

## Alignment

- Text left-aligned by default (LTR).
- Numeric columns in tables: right-align or tabular lining figures.
- Page headers: title + description stacked; actions right-aligned on desktop.
