# Dungeon Dweller Tattoos — SVG Asset Pack

A cohesive set of SVG dice, runes, and UI ornaments styled for the Dungeon Dweller Tattoos homepage.

## Files
- `assets/icons.svg` (sprite sheet with symbols)
- `assets/dice/d20.svg`
- `assets/dice/d6.svg`
- `assets/ornaments/rune-divider.svg`
- `assets/ornaments/corner-ornament.svg`
- `assets/ornaments/crest-dragon.svg`

## Sprite usage
Inline the sprite or reference it directly:

```html
<svg class="icon" aria-label="D20">
  <use href="assets/icons.svg#icon-d20"></use>
</svg>
```

## CSS styling
All icons use `currentColor` plus CSS variable fallbacks:

```css
.icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--gold);
}
```

## Accessibility notes
- Standalone SVG files include `<title>` and `<desc>` with `aria-labelledby`.
- For sprite symbols, add `aria-label` on the `<svg>` wrapper or include a `<title>` inside the wrapper when needed.

## Edit tips
- Dice and ornaments are stroke-based for crisp scaling.
- Keep `viewBox` intact; scale via CSS width/height.
- If the d20 number renders inconsistently, convert the `<text>` to outlines in a vector editor.
- Prefer `stroke-width` values between 1.5–3px for consistency at small sizes.
