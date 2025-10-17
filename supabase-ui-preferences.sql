-- UI Preferences Table
-- Stores user-specific UI state preferences (e.g., dismissed cards, collapsed sections)

CREATE TABLE IF NOT EXISTS user_ui_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  growth_tracker_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ui_preferences_user ON user_ui_preferences(user_id);

COMMENT ON TABLE user_ui_preferences IS 'Stores user-specific UI state preferences that persist across sessions';
COMMENT ON COLUMN user_ui_preferences.growth_tracker_dismissed IS 'Whether the Growth Tracker card is dismissed/collapsed';
