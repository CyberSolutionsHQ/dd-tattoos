insert into public.services (name, description, price_label, base_price, display_order, is_active)
values
  ('Tooth gems', 'Decorative tooth gem appointments.', null, null, 10, true),
  ('Oddities and rarities', 'Curated oddities and rarity offerings from the guild hall.', null, null, 20, true),
  ('Handmade goods', 'Handmade goods from local makers and studio artists.', null, null, 30, true),
  ('Henna', 'Temporary henna designs for events and appointments.', null, null, 40, true),
  ('Art classes', 'Creative classes and workshops hosted in the studio.', null, null, 50, true),
  ('Paint and sip', 'Guided paint-and-sip gatherings.', null, null, 60, true),
  ('D and D hosting', 'Tabletop campaign and one-shot hosting.', null, null, 70, true),
  ('Game tournaments', 'Community game tournaments and prize nights.', null, null, 80, true),
  ('Table rental (Mon and Sun)', 'Table rental availability for Monday and Sunday.', null, null, 90, true)
on conflict do nothing;

insert into public.artists (
  name,
  slug,
  bio,
  specialty,
  years_experience,
  profile_image_url,
  instagram_url,
  sort_order,
  is_active
)
values
  (
    'Morgan',
    'morgan',
    'Artist bio coming soon. Contact the guild for current booking details and style availability.',
    'Neo-Traditional',
    null,
    'https://www.dungeondwellertattoos.tattoo/assets/artists/morgan.png',
    'morgss',
    10,
    true
  ),
  (
    'Tyler',
    'tyler',
    'Artist bio coming soon. Contact the guild for current booking details and style availability.',
    'Black & Grey',
    null,
    'https://www.dungeondwellertattoos.tattoo/assets/artists/tyler.png',
    'ty tdog',
    20,
    true
  ),
  (
    'Maddison',
    'maddison',
    'Artist bio coming soon. Contact the guild for current booking details and style availability.',
    'Anime, Floral, Neo-trad / Color',
    null,
    'https://www.dungeondwellertattoos.tattoo/assets/artists/maddie.png',
    'maddie',
    30,
    true
  ),
  (
    'Brandon Mitchell',
    'brandon-mitchell',
    'Artist bio coming soon. Contact the guild for current booking details and style availability.',
    'Black & Grey Lettering',
    null,
    'https://www.dungeondwellertattoos.tattoo/assets/artists/brandon.png',
    'big b',
    40,
    true
  ),
  (
    'Kathy Scheeler',
    'kathy-scheeler',
    'Artist bio coming soon. Contact the guild for current booking details and style availability.',
    'Fine Line, Black & Grey, Neo-traditional',
    null,
    'https://www.dungeondwellertattoos.tattoo/assets/artists/kathy-scheeler.png',
    'kat',
    50,
    true
  )
on conflict (slug) do nothing;
