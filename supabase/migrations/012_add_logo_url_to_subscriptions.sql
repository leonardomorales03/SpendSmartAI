-- Agregar columna logo_url a subscription_presets
alter table subscription_presets add column logo_url text;

-- Agregar columna logo_url a subscriptions
alter table subscriptions add column logo_url text;

-- Actualizar los presets con logos reales (usando clearbit logo API o similar como referencia)
update subscription_presets set logo_url = 'https://logo.clearbit.com/netflix.com' where name = 'Netflix';
update subscription_presets set logo_url = 'https://logo.clearbit.com/spotify.com' where name = 'Spotify';
update subscription_presets set logo_url = 'https://logo.clearbit.com/disneyplus.com' where name = 'Disney+';
update subscription_presets set logo_url = 'https://logo.clearbit.com/amazon.com' where name = 'Amazon Prime';
update subscription_presets set logo_url = 'https://logo.clearbit.com/hbomax.com' where name = 'Max (HBO)';
update subscription_presets set logo_url = 'https://logo.clearbit.com/icloud.com' where name = 'iCloud';
update subscription_presets set logo_url = 'https://logo.clearbit.com/google.com' where name = 'Google One';
update subscription_presets set logo_url = 'https://logo.clearbit.com/youtube.com' where name = 'YouTube Premium';
update subscription_presets set logo_url = 'https://logo.clearbit.com/microsoft.com' where name = 'Microsoft 365';
update subscription_presets set logo_url = 'https://logo.clearbit.com/music.apple.com' where name = 'Apple Music';

-- Para gimnasio e internet, podemos usar iconos genéricos o dejar null y usar el emoji
-- update subscription_presets set logo_url = '...' where name = 'Gimnasio';
-- update subscription_presets set logo_url = '...' where name = 'Internet';
