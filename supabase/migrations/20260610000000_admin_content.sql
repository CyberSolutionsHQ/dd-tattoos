create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  site_title text not null default 'Dungeon Dweller Tattoos',
  tagline text not null default 'A fantasy tattoo tavern where ink, emberlight, and legends meet.',
  hero_heading text not null default 'Dungeon Dweller Tattoos',
  hero_subheading text not null default 'A fantasy tattoo tavern where ink, emberlight, and legends meet.',
  about_heading text not null default 'About the Studio',
  about_body text not null default 'Dungeon Dweller Tattoos blends story-driven artistry, welcoming studio rituals, and a tavern-inspired atmosphere for every appointment.',
  phone text,
  email text not null default 'hello@dungeondweller.com',
  address text,
  hours text not null default 'Opening details and studio hours will be announced soon.',
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  booking_link text,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_label text,
  base_price numeric(10, 2),
  display_order integer not null default 0,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text not null default '',
  specialty text,
  years_experience integer check (years_experience is null or years_experience >= 0),
  profile_image_url text,
  profile_image_path text,
  instagram_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artists(id) on delete set null,
  title text,
  caption text,
  category text,
  image_url text not null,
  storage_path text,
  alt_text text not null,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text not null,
  body text not null default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_active_order_idx on public.services (display_order, name) where is_active;
create index if not exists artists_active_order_idx on public.artists (sort_order, name) where is_active;
create index if not exists portfolio_public_order_idx on public.portfolio_images (is_featured desc, sort_order, created_at desc) where is_published;
create index if not exists portfolio_artist_public_idx on public.portfolio_images (artist_id, sort_order, created_at desc) where is_published;
create index if not exists content_blocks_active_order_idx on public.content_blocks (display_order, section_key) where is_active;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists set_artists_updated_at on public.artists;
create trigger set_artists_updated_at
before update on public.artists
for each row execute function public.set_updated_at();

drop trigger if exists set_portfolio_images_updated_at on public.portfolio_images;
create trigger set_portfolio_images_updated_at
before update on public.portfolio_images
for each row execute function public.set_updated_at();

drop trigger if exists set_content_blocks_updated_at on public.content_blocks;
create trigger set_content_blocks_updated_at
before update on public.content_blocks
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name'),
    'editor'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.services enable row level security;
alter table public.artists enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.content_blocks enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services"
on public.services for select
using (is_active);

drop policy if exists "Admins can manage services" on public.services;
create policy "Admins can manage services"
on public.services for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active artists" on public.artists;
create policy "Public can read active artists"
on public.artists for select
using (is_active);

drop policy if exists "Admins can manage artists" on public.artists;
create policy "Admins can manage artists"
on public.artists for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read published portfolio images" on public.portfolio_images;
create policy "Public can read published portfolio images"
on public.portfolio_images for select
using (is_published);

drop policy if exists "Admins can manage portfolio images" on public.portfolio_images;
create policy "Admins can manage portfolio images"
on public.portfolio_images for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active content blocks" on public.content_blocks;
create policy "Public can read active content blocks"
on public.content_blocks for select
using (is_active);

drop policy if exists "Admins can manage content blocks" on public.content_blocks;
create policy "Admins can manage content blocks"
on public.content_blocks for all
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('artist-photos', 'artist-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('portfolio', 'portfolio', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('site-assets', 'site-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read site image buckets" on storage.objects;
create policy "Public can read site image buckets"
on storage.objects for select
using (bucket_id in ('artist-photos', 'portfolio', 'site-assets'));

drop policy if exists "Admins can upload site images" on storage.objects;
create policy "Admins can upload site images"
on storage.objects for insert
with check (bucket_id in ('artist-photos', 'portfolio', 'site-assets') and public.is_admin());

drop policy if exists "Admins can update site images" on storage.objects;
create policy "Admins can update site images"
on storage.objects for update
using (bucket_id in ('artist-photos', 'portfolio', 'site-assets') and public.is_admin())
with check (bucket_id in ('artist-photos', 'portfolio', 'site-assets') and public.is_admin());

drop policy if exists "Admins can delete site images" on storage.objects;
create policy "Admins can delete site images"
on storage.objects for delete
using (bucket_id in ('artist-photos', 'portfolio', 'site-assets') and public.is_admin());

insert into public.site_settings (
  id,
  site_title,
  tagline,
  hero_heading,
  hero_subheading,
  about_heading,
  about_body,
  email,
  hours,
  facebook_url,
  instagram_url,
  tiktok_url,
  booking_link
)
values (
  1,
  'Dungeon Dweller Tattoos',
  'A fantasy tattoo tavern where ink, emberlight, and legends meet.',
  'Dungeon Dweller Tattoos',
  'A fantasy tattoo tavern where ink, emberlight, and legends meet.',
  'About the Studio',
  'Dungeon Dweller Tattoos blends story-driven artistry, welcoming studio rituals, and a tavern-inspired atmosphere for every appointment.',
  'hello@dungeondweller.com',
  'Opening details and studio hours will be announced soon.',
  'mailto:hello@dungeondweller.com?subject=Facebook',
  'mailto:hello@dungeondweller.com?subject=Instagram',
  null,
  'mailto:hello@dungeondweller.com?subject=Booking'
)
on conflict (id) do nothing;

insert into public.content_blocks (section_key, title, body, display_order, is_active)
values
  ('home_intro', 'What Makes Us Different', 'The guild hall blends ritual, artistry, and community under one torchlit roof.', 10, true),
  ('about_shop', 'Origin Story', 'More founder story details will be added as the studio prepares its full client-facing launch.', 20, true),
  ('booking_info', 'Booking Options', 'Email the guild now; social booking channels will be added once they are live.', 30, true),
  ('aftercare_info', 'Aftercare', 'Aftercare guidance will be shared during booking and after each session.', 40, true),
  ('faq_intro', 'FAQ', 'Common questions and studio policies will be added here.', 50, true),
  ('contact_note', 'Contact the Guild', 'Email the guild for booking details while online booking is being connected.', 60, true),
  ('footer_text', 'Footer Note', 'Appointments and event details are opening soon.', 70, true)
on conflict (section_key) do nothing;
