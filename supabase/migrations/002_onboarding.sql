-- ============================================================
-- WALK DAILY — Onboarding Migration (002)
-- Adds onboarding preference columns to profiles table
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS faith_journey_stage TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS denomination TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_translation TEXT DEFAULT 'ESV';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spiritual_challenges TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS connection_styles TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reading_frequency TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reading_time_of_day TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_reminder_time TIME;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_days TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bible_reading_history TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prayer_style TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_style TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS life_stage TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accountability_preference TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS content_depth INTEGER DEFAULT 3;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_range TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_tone JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_verse TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_plan TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_summary TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;
