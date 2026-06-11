-- ============================================================
-- 004 — Devotionals table
-- Safe to run multiple times (idempotent).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.devotionals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  scripture      TEXT NOT NULL DEFAULT '',
  reflection     TEXT NOT NULL DEFAULT '',
  prayer_prompt  TEXT NOT NULL DEFAULT '',
  action_step    TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_devotionals' AND tgrelid = 'public.devotionals'::regclass) THEN
    CREATE TRIGGER set_updated_at_devotionals
      BEFORE UPDATE ON public.devotionals
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_devotionals_user ON public.devotionals(user_id);
CREATE INDEX IF NOT EXISTS idx_devotionals_user_date ON public.devotionals(user_id, date DESC);

ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'devotionals'
      AND policyname = 'Users can manage their own devotionals'
  ) THEN
    CREATE POLICY "Users can manage their own devotionals"
      ON public.devotionals FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.devotionals TO authenticated;
