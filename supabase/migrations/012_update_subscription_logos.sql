-- Add logo_url column to subscription_presets if it doesn't exist
alter table subscription_presets add column if not exists logo_url text;

-- Update Presets with local SVG paths
update subscription_presets set logo_url = '/subscription-logos/netflix.svg' where name = 'Netflix';
update subscription_presets set logo_url = '/subscription-logos/spotify.svg' where name = 'Spotify';
update subscription_presets set logo_url = '/subscription-logos/disney-plus.svg' where name = 'Disney+';
update subscription_presets set logo_url = '/subscription-logos/amazon-prime.svg' where name = 'Amazon Prime';
update subscription_presets set logo_url = '/subscription-logos/hbo-max.svg' where name = 'Max (HBO)';
update subscription_presets set logo_url = '/subscription-logos/icloud.svg' where name = 'iCloud';
update subscription_presets set logo_url = '/subscription-logos/google-one.svg' where name = 'Google One';
update subscription_presets set logo_url = '/subscription-logos/youtube-premium.svg' where name = 'YouTube Premium';
update subscription_presets set logo_url = '/subscription-logos/internet.svg' where name = 'Internet';
update subscription_presets set logo_url = '/subscription-logos/microsoft-365.svg' where name = 'Microsoft 365';
update subscription_presets set logo_url = '/subscription-logos/apple-music.svg' where name = 'Apple Music';

-- Also update existing user subscriptions to use the new local icons
-- This fixes broken images for users who already have these subscriptions
update subscriptions set logo_url = '/subscription-logos/netflix.svg' where lower(name) = 'netflix';
update subscriptions set logo_url = '/subscription-logos/spotify.svg' where lower(name) = 'spotify';
update subscriptions set logo_url = '/subscription-logos/disney-plus.svg' where lower(name) = 'disney+';
update subscriptions set logo_url = '/subscription-logos/amazon-prime.svg' where lower(name) = 'amazon prime';
update subscriptions set logo_url = '/subscription-logos/hbo-max.svg' where lower(name) = 'max (hbo)' or lower(name) = 'hbo max';
update subscriptions set logo_url = '/subscription-logos/icloud.svg' where lower(name) = 'icloud';
update subscriptions set logo_url = '/subscription-logos/google-one.svg' where lower(name) = 'google one';
update subscriptions set logo_url = '/subscription-logos/youtube-premium.svg' where lower(name) = 'youtube premium';
update subscriptions set logo_url = '/subscription-logos/internet.svg' where lower(name) = 'internet';
update subscriptions set logo_url = '/subscription-logos/microsoft-365.svg' where lower(name) = 'microsoft 365';
update subscriptions set logo_url = '/subscription-logos/apple-music.svg' where lower(name) = 'apple music';
