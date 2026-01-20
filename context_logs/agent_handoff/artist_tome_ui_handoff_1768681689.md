# Artist Tome UI Handoff

## DOM Selectors Confirmed
Present on every artist page under `artists/<slug>/index.html`:
- Profile panel: `#artist-profile`, `img.artist-portrait`, `.artist-meta`, `h1#artist-name`, `div#artist-handle`, `div#artist-role`, `ul#artist-styles`, `.artist-bio`, `p#artist-bio-text`.
- Tome placeholder: `#tome-gallery`, `.tome-shell`, `.tome-controls`, `button#tome-prev`, `span#tome-page-indicator`, `button#tome-next`, `.tome-spread`, `.tome-page.left`, `.tome-page.right`, `.tome-slot` (two per page).

## Where To Add Tome UI JS/CSS
- JS: `app.js` is already loaded site-wide; safest path is to add tome logic there with guards for `#tome-gallery`.
- CSS: `styles.css` already contains base tome styles; extend there for animations or active states.
- Optional: add `tome.js` / `tome.css` at repo root and include via `<script defer src="../../tome.js"></script>` and `<link rel="stylesheet" href="../../tome.css" />` on each artist page if you want isolation.

## Data Shape Expectation (Supabase)
- `artistSlug` (string)
- `images[]` objects with:
  - `image_url` (string)
  - `caption` (string)
  - `sort_order` (number)

## Mobile Behavior Expectations
- Single-page mode recommended on narrow viewports.
- CSS currently collapses `.tome-spread` to one column below 900px; plan JS to respect that when paginating.

## Constraints Noted
- GitHub Pages serves `index.html` files as entry points; all links are explicit to avoid directory listing issues.

```json
{
  "schema_version": "1.0",
  "agent": "artist_pages_scaffold_and_menu_update",
  "timestamp_unix": 1768681689,
  "inputs_read": [
    "artists/morgan/index.html",
    "artists/tyler/index.html",
    "artists/maddison/index.html",
    "artists/brandon-mitchell/index.html",
    "artists/kathy-scheeler/index.html",
    "styles.css",
    "app.js"
  ],
  "context7_sources": [
    "/github/docs"
  ],
  "files_created": [
    "context_logs/agent_handoff/artist_tome_ui_handoff_1768681689.md"
  ],
  "files_modified": [],
  "routes_added": [],
  "links_fixed": [],
  "local_verification": {
    "server_command": "python -m http.server 8000",
    "paths_tested": [
      "/artists/morgan/index.html",
      "/artists/tyler/index.html",
      "/artists/maddison/index.html",
      "/artists/brandon-mitchell/index.html",
      "/artists/kathy-scheeler/index.html"
    ],
    "result": "pass"
  },
  "outputs_written": [
    "context_logs/agent_handoff/artist_tome_ui_handoff_1768681689.md"
  ],
  "handoff_written": "context_logs/agent_handoff/artist_tome_ui_handoff_1768681689.md",
  "notes": "Tome placeholders are wired with required IDs/classes; expand styles in styles.css and JS in app.js or a dedicated tome file."
}
```
