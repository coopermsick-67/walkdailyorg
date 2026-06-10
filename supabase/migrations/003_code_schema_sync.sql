-- ============================================================
-- WALK DAILY — Migration 003: Sync DB schema with app code
-- Run in Supabase SQL Editor (dashboard.supabase.com → SQL Editor)
-- All statements are idempotent (safe to re-run).
-- ============================================================

-- 1. Profiles — add columns the onboarding + profile page need
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_reading_book TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_reading_chapter INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
-- onboarding (002 may already have these, ADD COLUMN IF NOT EXISTS is safe)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faith_journey_stage TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spiritual_challenges TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connection_styles TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_frequency TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_time_of_day TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_reminder_time TIME;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reminder_days TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bible_reading_history TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prayer_style TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learning_style TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS life_stage TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accountability_preference TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS content_depth INTEGER DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_range TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_tone JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_verse TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_plan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_summary TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_translation TEXT DEFAULT 'NIV';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS denomination TEXT;

-- Allow any auth'd user to insert their own profile (needed for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='profiles' AND policyname='Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 2. Journal entries — change mood from ENUM to TEXT so custom moods work
ALTER TABLE public.journal_entries
  ALTER COLUMN mood TYPE TEXT USING mood::TEXT;

-- Drop the old enum type if it exists and is no longer needed
DROP TYPE IF EXISTS public.mood_type;

-- 3. Prayer requests — ensure all columns exist
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT DEFAULT '',
  body          TEXT NOT NULL DEFAULT '',
  is_anonymous  BOOLEAN NOT NULL DEFAULT FALSE,
  is_answered   BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at   TIMESTAMPTZ,
  pray_count    INTEGER NOT NULL DEFAULT 0,
  flag_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS pray_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS flag_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ;

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_requests' AND policyname='Anyone can read prayer requests') THEN
    CREATE POLICY "Anyone can read prayer requests" ON public.prayer_requests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_requests' AND policyname='Authenticated users can create prayer requests') THEN
    CREATE POLICY "Authenticated users can create prayer requests" ON public.prayer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_requests' AND policyname='Users can update their own prayer requests') THEN
    CREATE POLICY "Users can update their own prayer requests" ON public.prayer_requests FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_requests' AND policyname='Users can delete their own prayer requests') THEN
    CREATE POLICY "Users can delete their own prayer requests" ON public.prayer_requests FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Prayer comments
CREATE TABLE IF NOT EXISTS public.prayer_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id       UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prayer_comments ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_comments' AND policyname='Anyone can read prayer comments') THEN
    CREATE POLICY "Anyone can read prayer comments" ON public.prayer_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_comments' AND policyname='Authenticated users can create prayer comments') THEN
    CREATE POLICY "Authenticated users can create prayer comments" ON public.prayer_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_comments' AND policyname='Users can delete their own prayer comments') THEN
    CREATE POLICY "Users can delete their own prayer comments" ON public.prayer_comments FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. AI usage tracking
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  count      INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_usage' AND policyname='Users can manage their own AI usage') THEN
    CREATE POLICY "Users can manage their own AI usage" ON public.ai_usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Verse memory — add columns the app queries
CREATE TABLE IF NOT EXISTS public.verse_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_reference TEXT NOT NULL,
  verse_text      TEXT NOT NULL DEFAULT '',
  next_review     DATE NOT NULL DEFAULT CURRENT_DATE,
  interval_days   INTEGER NOT NULL DEFAULT 1,
  ease_factor     REAL NOT NULL DEFAULT 2.5,
  repetitions     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.verse_memory ADD COLUMN IF NOT EXISTS verse_reference TEXT;
ALTER TABLE public.verse_memory ADD COLUMN IF NOT EXISTS verse_text TEXT DEFAULT '';
ALTER TABLE public.verse_memory ADD COLUMN IF NOT EXISTS next_review DATE DEFAULT CURRENT_DATE;

ALTER TABLE public.verse_memory ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='verse_memory' AND policyname='Users can manage their own verse memory cards') THEN
    CREATE POLICY "Users can manage their own verse memory cards" ON public.verse_memory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 7. Reading progress — add last_read_at column the app queries
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book          TEXT NOT NULL,
  chapter       INTEGER NOT NULL,
  last_read_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reading_progress ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reading_progress' AND policyname='Users can manage their own reading progress') THEN
    CREATE POLICY "Users can manage their own reading progress" ON public.reading_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 8. Daily verses — add date column (app queries by .eq("date", today))
CREATE TABLE IF NOT EXISTS public.daily_verses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL UNIQUE,
  reference    TEXT NOT NULL,
  verse_text   TEXT NOT NULL,
  translation  TEXT NOT NULL DEFAULT 'KJV',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.daily_verses ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.daily_verses ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE public.daily_verses ADD COLUMN IF NOT EXISTS verse_text TEXT;

ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_verses' AND policyname='Anyone can read daily verses') THEN
    CREATE POLICY "Anyone can read daily verses" ON public.daily_verses FOR SELECT USING (true);
  END IF;
END $$;

-- 9. Chat messages — ensure metadata column exists
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content    TEXT NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='Users can manage their own chat messages') THEN
    CREATE POLICY "Users can manage their own chat messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 10. RPC helper for prayer count increment (used in PrayerWallPage)
CREATE OR REPLACE FUNCTION public.increment_prayer_count(row_id UUID)
RETURNS void AS $$
  UPDATE public.prayer_requests
  SET pray_count = pray_count + 1
  WHERE id = row_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 11. Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_prayer_count(UUID) TO authenticated;
