# Dungeon Dweller Tattoos Homepage

A single-page, fantasy tavern-inspired homepage for Dungeon Dweller Tattoos. Built with HTML, CSS, and vanilla JS. No build tools required.

## Files
- `index.html`
- `styles.css`
- `app.js`
- `README.md`

## How to run
Open `index.html` directly in a browser.

## Where to edit
- Opening date: `app.js` (search for `data-date` or `2026-02-15`)
- Artist list: `index.html` in the "Meet the Party" section
- Booking links: `index.html` in the footer CTA buttons
- Event copy and schedule: `index.html` in the Events & Deals section

## Disable animations
- Global: set `prefers-reduced-motion` at the OS/browser level.
- Manual: remove or comment out the IntersectionObserver and ember canvas code in `app.js`.

## prefers-reduced-motion
When a user has `prefers-reduced-motion: reduce`, scroll reveals, torch flicker, and ember particles are disabled or reduced for accessibility.
