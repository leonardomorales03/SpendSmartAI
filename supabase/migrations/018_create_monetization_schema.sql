-- 1. Extend user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS pro_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS billing_status TEXT CHECK (billing_status IN ('none', 'active', 'past_due', 'canceled', 'expired')),
ADD COLUMN IF NOT EXISTS billing_provider TEXT CHECK (billing_provider IN ('wompi', 'epayco', 'stripe')),
ADD COLUMN IF NOT EXISTS billing_customer_id TEXT;

-- 2. Create billing_subscriptions table
CREATE TABLE IF NOT EXISTS billing_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('wompi', 'epayco', 'stripe')),
    provider_customer_id TEXT,
    provider_subscription_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    last_event_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Users can view their own subscription details
CREATE POLICY "Users can view their own billing subscription"
    ON billing_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role or specific flows should modify this table.
-- For now, we restrict standard user modifications.
-- (No INSERT/UPDATE/DELETE policies for authenticated users implies they cannot modify it directly)

-- 5. Add indices for performance
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user_id ON billing_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_provider_sub_id ON billing_subscriptions(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_plan ON user_settings(plan);
