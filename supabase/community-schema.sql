-- ============================================================
-- WALK DAILY — Community Features Schema Additions
-- ============================================================
-- Run this file AFTER schema.sql in the Supabase SQL Editor.
-- Adds subscriptions table, RLS policies, realtime publication,
-- and helper functions for the community features.
-- ============================================================

-- ============================================================
-- 1. SUBSCRIPTIONS TABLE
-- ============================================================
-- Users can subscribe to any prayer request (not just their own)
-- to track updates: new comments, "answered" status changes.

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate subscriptions
  UNIQUE (user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user
  ON public.subscriptions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_request
  ON public.subscriptions(request_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can subscribe"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe"
  ON public.subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. HELPER FUNCTION: increment_prayer_count
-- ============================================================
-- Atomically increments pray_count to avoid race conditions
-- when multiple users click "Pray" simultaneously.

CREATE OR REPLACE FUNCTION public.increment_prayer_count(row_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.prayer_requests
  SET pray_count = pray_count + 1
  WHERE id = row_id;
END;
$$;

-- ============================================================
-- 3. HELPER FUNCTION: increment_flag_count
-- ============================================================
-- Atomically increments flag_count and auto-hides when >= 5.

CREATE OR REPLACE FUNCTION public.increment_flag_count(row_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.prayer_requests
  SET flag_count = flag_count + 1
  WHERE id = row_id;
END;
$$;

-- ============================================================
-- 4. PRAYER REQUESTS — additional columns
-- ============================================================
-- The base schema already has prayer_requests. We add the
-- testimony column for answered prayer stories.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prayer_requests' AND column_name = 'testimony'
  ) THEN
    ALTER TABLE public.prayer_requests
      ADD COLUMN testimony TEXT;
  END IF;
END
$$;

-- ============================================================
-- 5. REALTIME PUBLICATION
-- ============================================================
-- Enable realtime for prayer_requests and prayer_comments
-- so the Prayer Wall updates live without refresh.

DO $$
BEGIN
  -- Add prayer_requests to realtime publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'prayer_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_requests;
  END IF;

  -- Add prayer_comments to realtime publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'prayer_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_comments;
  END IF;

  -- Add subscriptions to realtime publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  END IF;
END
$$;

-- ============================================================
-- 6. GRANTS
-- ============================================================

GRANT SELECT, INSERT, DELETE ON public.subscriptions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================
-- 7. TRIGGER: Update comment count cache (optional optimization)
-- ============================================================
-- Keeps a denormalized comment_count on prayer_requests
-- for faster list queries.

CREATE OR REPLACE FUNCTION public.update_prayer_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.prayer_requests
    SET updated_at = NOW()
    WHERE id = NEW.prayer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.prayer_requests
    SET updated_at = NOW()
    WHERE id = OLD.prayer_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prayer_comments_count_trigger ON public.prayer_comments;
CREATE TRIGGER prayer_comments_count_trigger
  AFTER INSERT OR DELETE ON public.prayer_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_prayer_comment_count();

-- ============================================================
-- 8. ROW-LEVEL SECURITY: Ensure anon can read prayer_requests
-- ============================================================
-- The base schema already has this, but we re-assert for clarity.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'prayer_requests'
      AND policyname = 'Anyone can read prayer requests'
  ) THEN
    CREATE POLICY "Anyone can read prayer requests"
      ON public.prayer_requests FOR SELECT
      USING (true);
  END IF;
END
$$;
