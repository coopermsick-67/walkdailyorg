-- ============================================================
-- Walk Daily — AI Features Database Migration
-- Run this in Supabase SQL Editor to create tables for AI features
-- ============================================================

-- 1. AI usage tracking (rate limiting for free users)
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD')::text,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ai_usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_usage"
  ON ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_usage"
  ON ai_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Chat messages (persisted chat history)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat_messages"
  ON chat_messages FOR ALL
  USING (auth.uid() = user_id);

-- 3. Devotionals (cached per-user-per-date)
CREATE TABLE IF NOT EXISTS devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  scripture TEXT NOT NULL DEFAULT '',
  reflection TEXT NOT NULL DEFAULT '',
  prayer_prompt TEXT NOT NULL DEFAULT '',
  action_step TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own devotionals"
  ON devotionals FOR ALL
  USING (auth.uid() = user_id);

-- 4. Verse memory (spaced repetition)
CREATE TABLE IF NOT EXISTS verse_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_reference TEXT NOT NULL,
  verse_text TEXT NOT NULL DEFAULT '',
  exercises JSONB DEFAULT '[]'::jsonb,
  mastery INTEGER NOT NULL DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 100),
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD')::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE verse_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own verse_memory"
  ON verse_memory FOR ALL
  USING (auth.uid() = user_id);
