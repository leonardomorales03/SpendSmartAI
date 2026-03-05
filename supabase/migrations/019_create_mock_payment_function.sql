-- Function to process a mock payment (for testing/MVP)
CREATE OR REPLACE FUNCTION process_mock_payment(
    p_plan_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/service_role)
AS $$
DECLARE
    v_user_id UUID;
    v_subscription_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Update user_settings
    UPDATE user_settings
    SET 
        plan = CASE WHEN p_plan_id = 'free' THEN 'free' ELSE 'pro' END,
        pro_until = CASE WHEN p_plan_id = 'free' THEN NULL ELSE (now() + interval '1 month') END,
        billing_status = 'active',
        billing_provider = 'wompi', -- Mocking Wompi
        billing_customer_id = 'mock_cust_' || substr(v_user_id::text, 1, 8)
    WHERE user_id = v_user_id;

    -- Create subscription record
    INSERT INTO billing_subscriptions (
        user_id,
        provider,
        provider_customer_id,
        provider_subscription_id,
        status,
        current_period_start,
        current_period_end
    ) VALUES (
        v_user_id,
        'wompi',
        'mock_cust_' || substr(v_user_id::text, 1, 8),
        'mock_sub_' || substr(md5(random()::text), 1, 12),
        'active',
        now(),
        (now() + interval '1 month')
    )
    RETURNING id INTO v_subscription_id;

    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', v_subscription_id
    );
END;
$$;
