# Yogstra — Planned Color Palette

**Status:** Saved for a future redesign. **Do not apply to the app yet.**

Reference image: [`color-palette-reference.png`](./color-palette-reference.png)

## Tokens

| Name       | Hex       | Suggested use (when we redesign)        |
|------------|-----------|----------------------------------------|
| Navy       | `#2F4156` | Sidebar, headers, primary dark surfaces |
| Teal       | `#567C8D` | Primary actions, links, accents         |
| Sky Blue   | `#C8D9E6` | Soft backgrounds, highlights, badges    |
| Beige      | `#F5EFEB` | Main page background, cards             |
| White      | `#FFFFFF` | Inputs, cards, contrast surfaces        |

## Tailwind mapping (future)

When ready to implement, map in `src/index.css` `@theme`:

```css
--color-navy: #2F4156;
--color-teal: #567C8D;
--color-sky: #C8D9E6;
--color-beige: #F5EFEB;
--color-white: #FFFFFF;
```

## Current vs planned

| Current token   | Current hex | Planned replacement |
|-----------------|-------------|---------------------|
| `charcoal`      | `#1c1c1c`   | Navy `#2F4156`      |
| `teal`          | `#5bb8c4`   | Teal `#567C8D`      |
| `cream`         | `#f5ecd7`   | Beige `#F5EFEB`     |
| `cream-dark`    | `#ebe0c8`   | Sky Blue `#C8D9E6`  |
| `teal-soft`     | `#d4eef2`   | Sky Blue `#C8D9E6`  |

## Notes

- Palette is muted and professional — fits yoga/wellness without feeling generic.
- Pair with the **frontend-design** skill in `design/frontend-design/SKILL.md` when starting the visual refresh.
