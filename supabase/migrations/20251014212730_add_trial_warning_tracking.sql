-- Add trial warning tracking columns to subscriptions table
-- This allows us to track when trial expiration warnings have been sent

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS trial_warning_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_warning_sent_at TIMESTAMPTZ;

-- Add index for efficient querying of trials expiring soon that haven't been warned
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_warning 
ON subscriptions(status, trial_end, trial_warning_sent) 
WHERE status = 'trialing' AND trial_warning_sent = false;

-- Add comment
COMMENT ON COLUMN subscriptions.trial_warning_sent IS 'Whether a 14-day warning email has been sent for trial expiration';
COMMENT ON COLUMN subscriptions.trial_warning_sent_at IS 'Timestamp when the trial warning was sent';

