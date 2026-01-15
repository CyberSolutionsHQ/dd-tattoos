# Wall FX Notes

## Steps taken
- Located `assets/wall.png` as the hero background image.
- Ran HSV-based flame detection (warm hue range, higher saturation/value) and percentile-trimmed the mask by 2% per axis to avoid glow spill.
- Wrote the percent-based map to `assets/fx/wall_fx_map.json`.
- Authored CSS-only flame flicker + smoke overlays in `assets/fx/wall_fx.css`.
- Added a mount snippet in `assets/fx/wall_fx.html`.
- Integrated the overlay markup into `index.html` and loaded `assets/fx/wall_fx.css`.

## Detected bboxes (px + %)
Image size: 1024 x 1536

Left flame bbox (px): x0=16, y0=428, x1=231, y1=622
Left flame bbox (%): x0=0.015625, y0=0.2786458333, x1=0.2255859375, y1=0.4049479167
Left anchor (%): cx=0.1206054688, cy=0.341796875

Right flame bbox (px): x0=807, y0=424, x1=1009, y1=620
Right flame bbox (%): x0=0.7880859375, y0=0.2760416667, x1=0.9853515625, y1=0.4036458333
Right anchor (%): cx=0.88671875, cy=0.33984375

## Deviation from provided targets
- Left bbox: slight expansion in width (+0.00195 x0, +0.00879 x1) and a small vertical shift (+0.00456 y0, -0.00456 y1). This reflects the trimmed bright-core detection vs. full glow.
- Right bbox: shifted slightly right and down (+0.01758 x0, +0.02083 y0) due to stronger highlight clustering on the right flame. Width/height remain close to target.

## Files created/modified
- Created `assets/fx/wall_fx_map.json`
- Created `assets/fx/wall_fx.css`
- Created `assets/fx/wall_fx.html`
- Modified `index.html`
- Created `context_logs/agent_notes/wall_fx_notes.md`

## Quick enable/disable
- Disable: remove the four overlay divs from `index.html` or remove the `assets/fx/wall_fx.css` link.
- Enable: restore the overlay divs and the CSS link.
