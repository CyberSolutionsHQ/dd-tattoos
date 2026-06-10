-- Run this only after creating the Supabase Auth user for Morgan.
-- Do not store Morgan's password in the repository or in this SQL file.

update public.profiles
set
  display_name = 'Morgan',
  role = 'admin',
  updated_at = now()
where email = 'morgan@dungeondwellertattoos.local';

-- If the Auth trigger did not create the profile yet, inspect auth.users first:
-- select id, email from auth.users where email = 'morgan@dungeondwellertattoos.local';
--
-- Then insert the matching id manually:
-- insert into public.profiles (id, email, display_name, role)
-- values ('AUTH_USER_UUID_HERE', 'morgan@dungeondwellertattoos.local', 'Morgan', 'admin')
-- on conflict (id) do update
-- set display_name = excluded.display_name,
--     role = excluded.role,
--     updated_at = now();
