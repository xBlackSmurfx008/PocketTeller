-- Create Subscriptions table for Stripe subscription management
-- Tracks user subscription status, plans, and billing information

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Stripe identifiers
    stripe_customer_id TEXT UNIQUE NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    
    -- Subscription details
    status TEXT NOT NULL DEFAULT 'inactive', -- active, inactive, trialing, past_due, canceled, unpaid
    plan_type TEXT NOT NULL, -- 'monthly', 'yearly', 'lifetime'
    plan_name TEXT NOT NULL, -- 'PocketTeller Pro - Monthly'
    
    -- Billing amounts
    amount_cents INTEGER, -- 499 for $4.99
    currency TEXT DEFAULT 'usd',
    interval TEXT, -- 'month', 'year'
    
    -- Trial and free access
    trial_end TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    free_months_remaining INTEGER DEFAULT 0, -- For referral bonuses
    
    -- Subscription periods
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Metadata
    promo_code_used TEXT,
    referral_credits INTEGER DEFAULT 0, -- Number of referrals made
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create subscription events log (audit trail)
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- Event details
    event_type TEXT NOT NULL, -- subscription.created, subscription.updated, payment.succeeded, etc.
    event_data JSONB NOT NULL,
    stripe_event_id TEXT UNIQUE,
    
    -- Processing
    processed BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- Helper function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM subscriptions
        WHERE user_id = target_user_id
        AND status IN ('active', 'trialing')
        AND (current_period_end IS NULL OR current_period_end > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get subscription status
CREATE OR REPLACE FUNCTION get_subscription_status(target_user_id UUID)
RETURNS TABLE (
    is_active BOOLEAN,
    status TEXT,
    plan_type TEXT,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.status IN ('active', 'trialing') as is_active,
        s.status,
        s.plan_type,
        s.current_period_end,
        s.cancel_at_period_end
    FROM subscriptions s
    WHERE s.user_id = target_user_id
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view their own subscription events
CREATE POLICY "Users can view own subscription events"
    ON subscription_events FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage all subscriptions
CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage subscription events"
    ON subscription_events FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Comments
COMMENT ON TABLE subscriptions IS 'User subscription data from Stripe';
COMMENT ON TABLE subscription_events IS 'Audit log of all subscription-related events';

COMMENT ON COLUMN subscriptions.status IS 'active, inactive, trialing, past_due, canceled, unpaid';
COMMENT ON COLUMN subscriptions.plan_type IS 'monthly, yearly, lifetime';
COMMENT ON COLUMN subscriptions.free_months_remaining IS 'Additional free months from referral bonuses';
COMMENT ON COLUMN subscriptions.referral_credits IS 'Number of successful referrals (3 = 1 free month)';

