-- AgenticMind Row Level Security Policies
-- Execute this in Supabase SQL Editor after schema.sql

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER_PROFILES POLICIES
-- ============================================================================
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- USER_SETTINGS POLICIES
-- ============================================================================
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- FOLDERS POLICIES
-- ============================================================================
CREATE POLICY "Users can manage own folders"
  ON folders FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- TAGS POLICIES
-- ============================================================================
CREATE POLICY "Users can manage own tags"
  ON tags FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- CONVERSATIONS POLICIES
-- ============================================================================
CREATE POLICY "Users can manage own conversations"
  ON conversations FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- MESSAGES POLICIES
-- ============================================================================
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CONVERSATION_TAGS POLICIES
-- ============================================================================
CREATE POLICY "Users can manage own conversation tags"
  ON conversation_tags FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMPLETED
-- ============================================================================
-- RLS policies created. Next: Execute functions.sql for triggers
