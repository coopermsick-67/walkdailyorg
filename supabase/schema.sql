-- ============================================================
-- WALK DAILY — Supabase Database Schema
-- ============================================================
-- Run this file in the Supabase SQL Editor to create all tables,
-- indexes, RLS policies, and triggers.
--
-- After running, execute seed.sql to populate reference data.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES
-- ============================================================
-- Extends auth.users with app-specific profile data.

CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  denomination    TEXT,                          -- e.g. "Baptist", "Catholic", "Non-denominational"
  preferred_translation TEXT DEFAULT 'NIV',      -- e.g. "NIV", "ESV", "KJV", "NLT"
  streak_days     INTEGER NOT NULL DEFAULT 0,
  last_active_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON public.profiles(streak_days DESC);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. WAITLIST
-- ============================================================
-- Email capture before launch / for beta access.

CREATE TABLE IF NOT EXISTS public.waitlist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  source     TEXT DEFAULT 'website',    -- where the signup came from
  invited    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_invited ON public.waitlist(invited) WHERE invited = FALSE;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public signup form)
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- Only admins can read (via service role)
CREATE POLICY "Admin can read waitlist"
  ON public.waitlist FOR SELECT
  USING (auth.role() = 'service_role');

-- ============================================================
-- 3. VERSE MARKS (Bookmarks & Highlights)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.verse_marks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book        TEXT NOT NULL,               -- e.g. "John"
  chapter     INTEGER NOT NULL,
  verse       INTEGER NOT NULL,
  translation TEXT NOT NULL DEFAULT 'NIV',
  note        TEXT,                        -- user's personal note
  color       TEXT DEFAULT 'yellow',       -- highlight color: yellow, green, blue, pink, purple
  is_bookmark BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_verse_marks
  BEFORE UPDATE ON public.verse_marks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_verse_marks_user ON public.verse_marks(user_id);
CREATE INDEX IF NOT EXISTS idx_verse_marks_lookup ON public.verse_marks(book, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_verse_marks_bookmark ON public.verse_marks(user_id) WHERE is_bookmark = TRUE;

ALTER TABLE public.verse_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own verse marks"
  ON public.verse_marks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. READING PROGRESS
-- ============================================================
-- Tracks reading plan progress per user.

CREATE TABLE IF NOT EXISTS public.reading_progress (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id       TEXT NOT NULL,             -- e.g. "through-the-bible", "new-testament-90", "psalms-proverbs"
  book          TEXT NOT NULL,
  chapter       INTEGER NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_plan ON public.reading_progress(user_id, plan_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_completed ON public.reading_progress(user_id, completed_at DESC);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reading progress"
  ON public.reading_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. CHAT MESSAGES (AI Chat History)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id    UUID NOT NULL DEFAULT uuid_generate_v4(),  -- groups messages into conversations
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content       TEXT NOT NULL,
  model         TEXT,                      -- which model was used for assistant messages
  tokens_used   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(user_id, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat messages"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. JOURNAL ENTRIES
-- ============================================================

CREATE TYPE public.mood_type AS ENUM (
  'grateful', 'peaceful', 'joyful', 'hopeful',
  'anxious', 'sad', 'struggling', 'reflective'
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,
  body        TEXT NOT NULL,
  mood        public.mood_type,
  verse_tags  TEXT[],                      -- e.g. {'John 3:16', 'Psalm 23:1'}
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_journal
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_journal_user ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_created ON public.journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_public ON public.journal_entries(is_public, created_at DESC) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_journal_mood ON public.journal_entries(user_id, mood);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own journal entries"
  ON public.journal_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read public journal entries"
  ON public.journal_entries FOR SELECT
  USING (is_public = TRUE);

-- ============================================================
-- 7. PRAYER REQUESTS (Prayer Wall)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT,
  body          TEXT NOT NULL,
  is_anonymous  BOOLEAN NOT NULL DEFAULT FALSE,
  is_answered   BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at   TIMESTAMPTZ,
  pray_count    INTEGER NOT NULL DEFAULT 0,
  flag_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_prayers
  BEFORE UPDATE ON public.prayer_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_prayers_user ON public.prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayers_created ON public.prayer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_answered ON public.prayer_requests(is_answered, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_pray_count ON public.prayer_requests(pray_count DESC);

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prayer requests"
  ON public.prayer_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create prayer requests"
  ON public.prayer_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prayer requests"
  ON public.prayer_requests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prayer requests"
  ON public.prayer_requests FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 8. PRAYER COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prayer_comments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prayer_id       UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer ON public.prayer_comments(prayer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_user ON public.prayer_comments(user_id);

ALTER TABLE public.prayer_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prayer comments"
  ON public.prayer_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create prayer comments"
  ON public.prayer_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prayer comments"
  ON public.prayer_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 9. VERSE MEMORY (Spaced Repetition)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.verse_memory (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book            TEXT NOT NULL,
  chapter         INTEGER NOT NULL,
  verse           INTEGER NOT NULL,
  translation     TEXT NOT NULL DEFAULT 'NIV',
  interval_days   INTEGER NOT NULL DEFAULT 1,   -- current spacing interval
  ease_factor     REAL NOT NULL DEFAULT 2.5,     -- SM-2 ease factor
  repetitions     INTEGER NOT NULL DEFAULT 0,    -- how many times reviewed
  next_review_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verse_memory_user ON public.verse_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_verse_memory_review ON public.verse_memory(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_verse_memory_lookup ON public.verse_memory(user_id, book, chapter, verse);

ALTER TABLE public.verse_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own verse memory cards"
  ON public.verse_memory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 10. READING PLANS (Reference Data)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reading_plans (
  id          TEXT PRIMARY KEY,           -- e.g. "through-the-bible"
  name        TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reading plans"
  ON public.reading_plans FOR SELECT
  USING (true);

-- ============================================================
-- 11. DAILY VERSES (Reference Data)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_verses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_year   INTEGER NOT NULL UNIQUE CHECK (day_of_year BETWEEN 1 AND 366),
  book          TEXT NOT NULL,
  chapter       INTEGER NOT NULL,
  verse         INTEGER NOT NULL,
  translation   TEXT NOT NULL DEFAULT 'NIV',
  theme         TEXT,                      -- optional theme tag
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_verses_day ON public.daily_verses(day_of_year);

ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily verses"
  ON public.daily_verses FOR SELECT
  USING (true);

-- ============================================================
-- GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================
-- MIGRATION: Remove user-managed API key (2026-06-09)
-- ============================================================
-- The app now uses a single admin-managed OpenRouter API key
-- configured via the OPENROUTER_API_KEY environment variable.
-- Users can no longer provide their own API keys.

ALTER TABLE public.profiles DROP COLUMN IF EXISTS openrouter_api_key;
