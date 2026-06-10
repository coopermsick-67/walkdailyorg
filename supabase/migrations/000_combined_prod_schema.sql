-- ============================================================
-- WALK DAILY — Combined Production Schema Migration
-- Safe to run multiple times (all statements are idempotent).
-- Covers schema.sql + migrations 001, 002, 003 in one pass.
-- Run this in Supabase SQL Editor to bring prod up to date.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT,
  display_name    TEXT,
  avatar_url      TEXT,
  denomination    TEXT,
  preferred_translation TEXT DEFAULT 'NIV',
  streak_days     INTEGER NOT NULL DEFAULT 0,
  last_active_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'public.profiles'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND tgrelid = 'auth.users'::regclass) THEN
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON public.profiles(streak_days DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Profile columns from migrations 001-003
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_reading_book TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_reading_chapter INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faith_journey TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faith_journey_stage TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connection_methods TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connection_styles TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spiritual_challenge TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spiritual_challenges TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_frequency TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_reminder TIME;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_days TEXT[];
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

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(has_completed_onboarding) WHERE has_completed_onboarding = FALSE;

-- ============================================================
-- 2. VERSE MARKS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.verse_marks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference   TEXT NOT NULL,
  verse_text  TEXT NOT NULL DEFAULT '',
  bible_id    TEXT NOT NULL DEFAULT 'de4e12af7f28f599-02',
  mark_type   TEXT NOT NULL CHECK (mark_type IN ('bookmark', 'highlight')),
  color       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verse_marks_unique ON public.verse_marks(user_id, reference, mark_type);
CREATE INDEX IF NOT EXISTS idx_verse_marks_user ON public.verse_marks(user_id);

ALTER TABLE public.verse_marks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='verse_marks' AND policyname='Users can manage their own verse marks') THEN
    CREATE POLICY "Users can manage their own verse marks" ON public.verse_marks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 3. READING PROGRESS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reading_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book          TEXT NOT NULL,
  chapter       INTEGER NOT NULL,
  last_read_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book, chapter)
);

ALTER TABLE public.reading_progress ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_last ON public.reading_progress(user_id, last_read_at DESC);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reading_progress' AND policyname='Users can manage their own reading progress') THEN
    CREATE POLICY "Users can manage their own reading progress" ON public.reading_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 4. JOURNAL ENTRIES (TEXT mood — no ENUM)
-- ============================================================

-- Drop ENUM type if it exists (from old schema) safely
DO $$
BEGIN
  -- Convert mood column if table exists with old enum type
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='journal_entries') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='journal_entries'
        AND column_name='mood' AND udt_name='mood_type'
    ) THEN
      ALTER TABLE public.journal_entries ALTER COLUMN mood TYPE TEXT USING mood::TEXT;
    END IF;
  END IF;
END $$;

DROP TYPE IF EXISTS public.mood_type;

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,
  body        TEXT NOT NULL DEFAULT '',
  mood        TEXT,
  verse_tags  TEXT[],
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_journal' AND tgrelid = 'public.journal_entries'::regclass) THEN
    CREATE TRIGGER set_updated_at_journal BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_journal_user ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_created ON public.journal_entries(user_id, created_at DESC);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='journal_entries' AND policyname='Users can manage their own journal entries') THEN
    CREATE POLICY "Users can manage their own journal entries" ON public.journal_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 5. PRAYER REQUESTS
-- ============================================================

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

CREATE INDEX IF NOT EXISTS idx_prayers_user ON public.prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayers_created ON public.prayer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_answered ON public.prayer_requests(is_answered, created_at DESC);

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

-- ============================================================
-- 6. PRAYER COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prayer_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id       UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer ON public.prayer_comments(prayer_id, created_at);

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

-- ============================================================
-- 7. AI USAGE
-- ============================================================

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

-- ============================================================
-- 8. VERSE MEMORY
-- ============================================================

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

CREATE INDEX IF NOT EXISTS idx_verse_memory_user ON public.verse_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_verse_memory_review ON public.verse_memory(user_id, next_review);

ALTER TABLE public.verse_memory ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='verse_memory' AND policyname='Users can manage their own verse memory cards') THEN
    CREATE POLICY "Users can manage their own verse memory cards" ON public.verse_memory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 9. DAILY VERSES
-- ============================================================

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

CREATE INDEX IF NOT EXISTS idx_daily_verses_date ON public.daily_verses(date);

ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_verses' AND policyname='Anyone can read daily verses') THEN
    CREATE POLICY "Anyone can read daily verses" ON public.daily_verses FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- 10. CHAT MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content    TEXT NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='Users can manage their own chat messages') THEN
    CREATE POLICY "Users can manage their own chat messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 11. RPC HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_prayer_count(row_id UUID)
RETURNS void AS $$
  UPDATE public.prayer_requests SET pray_count = pray_count + 1 WHERE id = row_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- exec_sql helper so future migrations can run programmatically
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 12. GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_prayer_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;
