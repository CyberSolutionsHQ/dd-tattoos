create schema if not exists private;

create or replace function private.is_admin()
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

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

create or replace function private.handle_new_user()
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

revoke all on function private.handle_new_user() from public;

alter function public.set_updated_at() set search_path = public;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = id or private.is_admin());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Admins can manage services" on public.services;
create policy "Admins can manage services"
on public.services for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Admins can manage artists" on public.artists;
create policy "Admins can manage artists"
on public.artists for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Admins can manage portfolio images" on public.portfolio_images;
create policy "Admins can manage portfolio images"
on public.portfolio_images for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Admins can manage content blocks" on public.content_blocks;
create policy "Admins can manage content blocks"
on public.content_blocks for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Admins can upload site images" on storage.objects;
create policy "Admins can upload site images"
on storage.objects for insert
with check (bucket_id in ('artist-photos', 'portfolio', 'site-assets') and private.is_admin());

drop policy if exists "Admins can update site images" on storage.objects;
create policy "Admins can update site images"
on storage.objects for update
using (bucket_id in ('artist-photos', 'portfolio', 'site-assets') and private.is_admin())
with check (bucket_id in ('artist-photos', 'portfolio', 'site-assets') and private.is_admin());

drop policy if exists "Admins can delete site images" on storage.objects;
create policy "Admins can delete site images"
on storage.objects for delete
using (bucket_id in ('artist-photos', 'portfolio', 'site-assets') and private.is_admin());

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop function if exists public.handle_new_user();
drop function if exists public.is_admin();
