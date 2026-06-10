# Dungeon Dweller Tattoos Website

Static fantasy tavern-inspired website for Dungeon Dweller Tattoos, with a Supabase-backed admin dashboard at `/admin`.

## Local Site

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:4173`.

## Quality Checks

```bash
npm run build
npm run lint
npm test
```

The build script verifies static HTML routes and local asset references. Playwright tests cover the hidden music player, autoplay fallback, and nested-page asset loading.

## Supabase Setup

The schema lives in `supabase/migrations/20260610000000_admin_content.sql`.

Use the real Dungeon Dweller Tattoos Supabase project ref before pushing:

```bash
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
npx supabase db push
```

This creates:

- `profiles`
- `site_settings`
- `services`
- `artists`
- `portfolio_images`
- `content_blocks`
- Storage buckets: `artist-photos`, `portfolio`, `site-assets`

Only the public anon key belongs in the browser. Do not commit access tokens, database passwords, service role keys, or private keys.

## First Admin: Morgan

Create the Auth user in Supabase using:

- Display name: `Morgan`
- Email: `morgan@dungeondwellertattoos.local`
- Password: provided out-of-band for setup only

Do not save the password in this repo.

After the Auth user exists, run `supabase/bootstrap_morgan_admin.sql` in the Supabase SQL editor or with `psql` against the project database. It promotes only that email to:

```text
role = admin
```

## Admin Dashboard

`/admin` supports:

- Supabase URL and public anon key entry
- email/password login
- `profiles.role = admin` gate
- dashboard status cards
- site settings editor
- services and prices manager
- artists manager with profile photo upload/removal
- portfolio image upload, publish, feature, edit, and delete
- content blocks manager

Uploads are limited to JPG, PNG, and WebP files up to 5 MB. Deletes remove linked Storage objects when a stored path exists.

## Public Content

Public pages keep clean checked-in fallback content. When Supabase config is available in the browser, `assets/js/supabase-content.js` hydrates:

- global site settings
- active services
- active artists
- published portfolio images
- active content blocks

## Music

The public site uses a hidden audio instance with volume `0.5`, looping enabled, and a small floating fallback button when autoplay is blocked by the browser.
