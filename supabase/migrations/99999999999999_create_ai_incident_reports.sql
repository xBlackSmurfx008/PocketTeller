-- Create AI Incident Reports table for logging off-topic or inappropriate AI usage
-- This table stores incidents when users persistently try to use the AI for non-financial purposes

CREATE TABLE IF NOT EXISTS ai_incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    thread_id TEXT,
    incident_type TEXT NOT NULL, -- 'off_topic_persistent', 'inappropriate_content', 'spam', etc.
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    context JSONB DEFAULT '{}', -- Additional context (conversation history, etc.)
    severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    action_taken TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_incident_reports_user_id ON ai_incident_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_incident_reports_reviewed ON ai_incident_reports(reviewed) WHERE NOT reviewed;
CREATE INDEX IF NOT EXISTS idx_ai_incident_reports_severity ON ai_incident_reports(severity);
CREATE INDEX IF NOT EXISTS idx_ai_incident_reports_created_at ON ai_incident_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_incident_reports_incident_type ON ai_incident_reports(incident_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_incident_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_incident_reports_updated_at
    BEFORE UPDATE ON ai_incident_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_incident_reports_updated_at();

-- Row Level Security Policies
ALTER TABLE ai_incident_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view own incident reports"
    ON ai_incident_reports FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert reports (service role)
CREATE POLICY "System can insert incident reports"
    ON ai_incident_reports FOR INSERT
    WITH CHECK (true);

-- Admins can view all reports (you'll need to implement admin role check)
-- For now, only service role can view all
CREATE POLICY "Service role can view all incident reports"
    ON ai_incident_reports FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Comment on table
COMMENT ON TABLE ai_incident_reports IS 'Logs incidents when users persistently try to use AI for non-financial purposes or inappropriate content';

-- Comment on columns
COMMENT ON COLUMN ai_incident_reports.incident_type IS 'Type of incident: off_topic_persistent, inappropriate_content, spam, abuse, etc.';
COMMENT ON COLUMN ai_incident_reports.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN ai_incident_reports.context IS 'Additional context including conversation history, timezone, etc.';
COMMENT ON COLUMN ai_incident_reports.reviewed IS 'Whether the incident has been reviewed by a human';
COMMENT ON COLUMN ai_incident_reports.action_taken IS 'What action was taken after review (warning sent, account flagged, etc.)';

