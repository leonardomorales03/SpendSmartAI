-- Add currency and locale to user_settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'COP',
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'es-CO';

-- Add check constraint for supported currencies (optional but good for data integrity)
ALTER TABLE user_settings 
ADD CONSTRAINT user_settings_currency_check 
CHECK (currency IN ('COP', 'USD', 'EUR', 'MXN'));
