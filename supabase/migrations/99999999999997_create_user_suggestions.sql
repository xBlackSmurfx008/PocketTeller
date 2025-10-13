-- Create User Suggestions table for referral program
-- Users can submit 3 suggestions to earn 1 free month

CREATE TABLE IF NOT EXISTS user_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Suggestion content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general', -- feature, improvement, bug, general
    
    -- Review status
    status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, implemented, rejected
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Implementation tracking
    implemented BOOLEAN DEFAULT FALSE,
    implemented_at TIMESTAMPTZ,
    implementation_notes TEXT,
    
    -- Metadata
    upvotes INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'normal', -- low, normal, high, critical
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_suggestions_user_id ON user_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_suggestions_status ON user_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_user_suggestions_category ON user_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_user_suggestions_created_at ON user_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_suggestions_implemented ON user_suggestions(implemented) WHERE implemented = true;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_suggestions_updated_at
    BEFORE UPDATE ON user_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_suggestions_updated_at();

-- Row Level Security
ALTER TABLE user_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suggestions
CREATE POLICY "Users can view own suggestions"
    ON user_suggestions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create suggestions
CREATE POLICY "Users can create suggestions"
    ON user_suggestions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role can manage all suggestions
CREATE POLICY "Service role can manage suggestions"
    ON user_suggestions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Comments
COMMENT ON TABLE user_suggestions IS 'User-submitted suggestions for product improvements (3 suggestions = 1 free month)';
COMMENT ON COLUMN user_suggestions.category IS 'feature, improvement, bug, general';
COMMENT ON COLUMN user_suggestions.status IS 'pending, reviewed, implemented, rejected';
COMMENT ON COLUMN user_suggestions.priority IS 'low, normal, high, critical';

