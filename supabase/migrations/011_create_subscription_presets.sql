create table if not exists subscription_presets (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category_name text not null,
  default_amount decimal(10, 2),
  icon text,
  logo_url text,
  popularity_score integer default 0
);

-- Enable RLS (read-only for authenticated users)
alter table subscription_presets enable row level security;

create policy "Allow read access for all users"
on subscription_presets for select
to authenticated
using (true);

-- Insert initial data
insert into subscription_presets (name, category_name, default_amount, icon, logo_url, popularity_score) values
('Netflix', 'Ocio', 15.00, '🎬', '/subscription-logos/netflix.svg', 100),
('Spotify', 'Ocio', 10.00, '🎵', '/subscription-logos/spotify.svg', 95),
('Disney+', 'Ocio', 13.99, '🏰', '/subscription-logos/disney-plus.svg', 90),
('Amazon Prime', 'Ocio', 14.99, '📦', '/subscription-logos/amazon-prime.svg', 85),
('Max (HBO)', 'Ocio', 12.00, '🎥', '/subscription-logos/hbo-max.svg', 80),
('iCloud', 'Suscripciones', 2.99, '☁️', '/subscription-logos/icloud.svg', 75),
('Google One', 'Suscripciones', 1.99, '💾', '/subscription-logos/google-one.svg', 70),
('YouTube Premium', 'Ocio', 11.99, '▶️', '/subscription-logos/youtube-premium.svg', 65),
('Gimnasio', 'Salud', 30.00, '💪', null, 60),
('Internet', 'Hogar', 40.00, '🌐', '/subscription-logos/internet.svg', 55),
('Microsoft 365', 'Educación', 6.99, '📝', '/subscription-logos/microsoft-365.svg', 50),
('Apple Music', 'Ocio', 10.99, '🍎', '/subscription-logos/apple-music.svg', 45);
