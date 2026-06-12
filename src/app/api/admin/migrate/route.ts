import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// One-time migration endpoint.
// Requires: Authorization: Bearer <ADMIN_SECRET_KEY>
// Feature flag: ADMIN_MIGRATE_ENABLED=true (default false — disable after successful run)
export async function POST(request: Request) {
  if (process.env.ADMIN_MIGRATE_ENABLED !== "true") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const adminSecret = process.env.ADMIN_SECRET_KEY;
  const authHeader = request.headers.get("Authorization");
  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing SUPABASE env vars — check Vercel production env" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Check which tables exist
  const tablesToCheck = [
    "profiles",
    "journal_entries",
    "prayer_requests",
    "prayer_comments",
    "prayer_flags",
    "verse_marks",
    "reading_progress",
    "verse_memory",
    "daily_verses",
    "daily_devotionals",
    "ai_usage",
    "chat_messages",
    "push_subscriptions",
    "reading_plans",
    "reading_plan_days",
    "groups",
    "group_members",
  ];

  const tableStatus: Record<string, string> = {};
  for (const t of tablesToCheck) {
    const { error } = await supabase.from(t).select("*").limit(0);
    if (!error) {
      tableStatus[t] = "EXISTS";
    } else if (error.code === "42P01" || error.message?.includes("does not exist")) {
      tableStatus[t] = "MISSING";
    } else {
      tableStatus[t] = `ERROR: ${error.code} ${error.message}`;
    }
  }

  // 2. Check profile columns
  const profileColChecks: Record<string, boolean> = {};
  const colsToCheck = [
    "has_completed_onboarding",
    "preferred_translation",
    "denomination",
    "current_reading_book",
    "onboarding_step",
    "email",
  ];
  if (tableStatus.profiles === "EXISTS") {
    const { data: sampleRow } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);
    if (sampleRow && sampleRow.length > 0) {
      colsToCheck.forEach((col) => {
        profileColChecks[col] = col in sampleRow[0];
      });
    } else {
      colsToCheck.forEach((col) => { profileColChecks[col] = false; });
    }
  }

  // 3. Try exec_sql — attempt to run full migration
  const migrationSql = getMigrationSql();
  let migrationResult: string;

  try {
    const { error: rpcError } = await supabase.rpc("exec_sql", {
      sql: migrationSql,
    });
    if (rpcError) {
      // exec_sql function doesn't exist yet — try direct HTTP call
      const httpResult = await fetch(
        `${supabaseUrl}/rest/v1/rpc/exec_sql`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
          body: JSON.stringify({ sql: migrationSql }),
        }
      );
      if (httpResult.ok) {
        migrationResult = "APPLIED via HTTP RPC";
      } else {
        const body = await httpResult.text();
        migrationResult = `exec_sql not available: ${rpcError.message}. Manual SQL required. HTTP fallback: ${httpResult.status} ${body.substring(0, 200)}`;
      }
    } else {
      migrationResult = "APPLIED via exec_sql RPC";
    }
  } catch (e) {
    migrationResult = `EXCEPTION: ${String(e)}`;
  }

  // 4. Re-check tables after migration attempt
  const tableStatusAfter: Record<string, string> = {};
  for (const t of tablesToCheck) {
    const { error } = await supabase.from(t).select("*").limit(0);
    if (!error) {
      tableStatusAfter[t] = "EXISTS";
    } else if (error.code === "42P01" || error.message?.includes("does not exist")) {
      tableStatusAfter[t] = "MISSING";
    } else {
      tableStatusAfter[t] = `ERROR: ${error.code}`;
    }
  }

  return NextResponse.json({
    tablesBefore: tableStatus,
    profileColumns: profileColChecks,
    migrationResult,
    tablesAfter: tableStatusAfter,
    manualSqlUrl:
      "https://supabase.com/dashboard/project/opnozaazhkaofjyfigra/sql/new",
    note: migrationResult.includes("Manual SQL required")
      ? "Run supabase/migrations/000_combined_prod_schema.sql in the Supabase SQL editor"
      : "Migration applied — verify tablesAfter shows all EXISTS",
  });
}

function getMigrationSql(): string {
  // Returns the combined idempotent migration SQL inline.
  // This runs inside exec_sql() which expects a single SQL string.
  return `
DO $outer$
BEGIN
  -- Profiles columns
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_reading_book TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_reading_chapter INTEGER; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faith_journey TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faith_journey_stage TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS denomination TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_translation TEXT DEFAULT 'NIV'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spiritual_challenges TEXT[]; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connection_styles TEXT[]; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_frequency TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reading_time_of_day TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_reminder_time TIME; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reminder_days TEXT[]; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bible_reading_history TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prayer_style TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learning_style TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS life_stage TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[]; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accountability_preference TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS content_depth INTEGER DEFAULT 3; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_range TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_tone JSONB; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_verse TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_plan TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_summary TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_reminder_hour INTEGER; EXCEPTION WHEN OTHERS THEN NULL; END;

  -- RLS insert policy for profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  -- verse_marks
  CREATE TABLE IF NOT EXISTS public.verse_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    verse_text TEXT NOT NULL DEFAULT '',
    bible_id TEXT NOT NULL DEFAULT 'de4e12af7f28f599-02',
    mark_type TEXT NOT NULL CHECK (mark_type IN ('bookmark','highlight')),
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  BEGIN CREATE UNIQUE INDEX idx_verse_marks_unique ON public.verse_marks(user_id, reference, mark_type); EXCEPTION WHEN duplicate_table THEN NULL; END;
  ALTER TABLE public.verse_marks ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='verse_marks' AND policyname='Users can manage their own verse marks') THEN
    CREATE POLICY "Users can manage their own verse marks" ON public.verse_marks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- reading_progress
  CREATE TABLE IF NOT EXISTS public.reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  BEGIN ALTER TABLE public.reading_progress ADD CONSTRAINT reading_progress_user_book_chapter_key UNIQUE (user_id, book, chapter); EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TABLE public.reading_progress ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reading_progress' AND policyname='Users can manage their own reading progress') THEN
    CREATE POLICY "Users can manage their own reading progress" ON public.reading_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- mood_type enum migration
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='journal_entries') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='journal_entries' AND column_name='mood' AND udt_name='mood_type') THEN
      ALTER TABLE public.journal_entries ALTER COLUMN mood TYPE TEXT USING mood::TEXT;
    END IF;
  END IF;
  DROP TYPE IF EXISTS public.mood_type;

  -- journal_entries
  CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    body TEXT NOT NULL DEFAULT '',
    mood TEXT,
    verse_tags TEXT[],
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='journal_entries' AND policyname='Users can manage their own journal entries') THEN
    CREATE POLICY "Users can manage their own journal entries" ON public.journal_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- prayer_requests
  CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    is_answered BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at TIMESTAMPTZ,
    pray_count INTEGER NOT NULL DEFAULT 0,
    flag_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  BEGIN ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS title TEXT DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS pray_count INTEGER NOT NULL DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS flag_count INTEGER NOT NULL DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ; EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
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

  -- prayer_comments
  CREATE TABLE IF NOT EXISTS public.prayer_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prayer_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE public.prayer_comments ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_comments' AND policyname='Anyone can read prayer comments') THEN
    CREATE POLICY "Anyone can read prayer comments" ON public.prayer_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_comments' AND policyname='Authenticated users can create prayer comments') THEN
    CREATE POLICY "Authenticated users can create prayer comments" ON public.prayer_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- ai_usage
  CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, date)
  );
  ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_usage' AND policyname='Users can manage their own AI usage') THEN
    CREATE POLICY "Users can manage their own AI usage" ON public.ai_usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- verse_memory
  CREATE TABLE IF NOT EXISTS public.verse_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verse_reference TEXT NOT NULL,
    verse_text TEXT NOT NULL DEFAULT '',
    next_review DATE NOT NULL DEFAULT CURRENT_DATE,
    interval_days INTEGER NOT NULL DEFAULT 1,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    repetitions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  BEGIN ALTER TABLE public.verse_memory ADD COLUMN IF NOT EXISTS verse_reference TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.verse_memory ADD COLUMN IF NOT EXISTS verse_text TEXT DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.verse_memory ADD COLUMN IF NOT EXISTS next_review DATE DEFAULT CURRENT_DATE; EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.verse_memory ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='verse_memory' AND policyname='Users can manage their own verse memory cards') THEN
    CREATE POLICY "Users can manage their own verse memory cards" ON public.verse_memory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- daily_verses
  CREATE TABLE IF NOT EXISTS public.daily_verses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    reference TEXT NOT NULL,
    verse_text TEXT NOT NULL,
    translation TEXT NOT NULL DEFAULT 'KJV',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  BEGIN ALTER TABLE public.daily_verses ADD COLUMN IF NOT EXISTS date DATE; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.daily_verses ADD COLUMN IF NOT EXISTS reference TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.daily_verses ADD COLUMN IF NOT EXISTS verse_text TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_verses' AND policyname='Anyone can read daily verses') THEN
    CREATE POLICY "Anyone can read daily verses" ON public.daily_verses FOR SELECT USING (true);
  END IF;

  -- chat_messages
  CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  BEGIN ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB; EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='Users can manage their own chat messages') THEN
    CREATE POLICY "Users can manage their own chat messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- prayer_flags (replaces direct flag_count mutation)
  CREATE TABLE IF NOT EXISTS public.prayer_flags (
    prayer_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(prayer_id, user_id)
  );
  ALTER TABLE public.prayer_flags ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_flags' AND policyname='Authenticated users can flag prayers') THEN
    CREATE POLICY "Authenticated users can flag prayers" ON public.prayer_flags FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_flags' AND policyname='Users can view own flags') THEN
    CREATE POLICY "Users can view own flags" ON public.prayer_flags FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Lock flag_count to service_role only (authenticated users use flag_prayer RPC instead)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prayer_requests' AND policyname='Service role can update flag_count') THEN
    CREATE POLICY "Service role can update flag_count" ON public.prayer_requests FOR UPDATE USING (auth.role() = 'service_role');
  END IF;

  -- daily_devotionals (Batch B: cache devotionals per day)
  CREATE TABLE IF NOT EXISTS public.daily_devotionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    content TEXT NOT NULL,
    verse_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE public.daily_devotionals ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_devotionals' AND policyname='Anyone can read daily devotionals') THEN
    CREATE POLICY "Anyone can read daily devotionals" ON public.daily_devotionals FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_devotionals' AND policyname='Authenticated users can insert devotionals') THEN
    CREATE POLICY "Authenticated users can insert devotionals" ON public.daily_devotionals FOR INSERT WITH CHECK (true);
  END IF;

  -- push_subscriptions (Feature 1: Web Push)
  CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
  );
  ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='Users can manage their own push subscriptions') THEN
    CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- reading_plans (Feature 2: AI Bible reading plans)
  CREATE TABLE IF NOT EXISTS public.reading_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    total_days INTEGER NOT NULL DEFAULT 7,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reading_plans' AND policyname='Users can manage their own reading plans') THEN
    CREATE POLICY "Users can manage their own reading plans" ON public.reading_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- reading_plan_days
  CREATE TABLE IF NOT EXISTS public.reading_plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    reference TEXT NOT NULL,
    content_snippet TEXT,
    completed_at TIMESTAMPTZ,
    UNIQUE(plan_id, day_number)
  );
  ALTER TABLE public.reading_plan_days ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reading_plan_days' AND policyname='Users can manage plan days through plan ownership') THEN
    CREATE POLICY "Users can manage plan days through plan ownership" ON public.reading_plan_days FOR ALL
      USING (EXISTS (SELECT 1 FROM public.reading_plans rp WHERE rp.id = plan_id AND rp.user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.reading_plans rp WHERE rp.id = plan_id AND rp.user_id = auth.uid()));
  END IF;

  -- groups (Feature 5: Accountability groups)
  CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code TEXT NOT NULL UNIQUE DEFAULT UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='groups' AND policyname='Authenticated users can create groups') THEN
    CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='groups' AND policyname='Owners can update groups') THEN
    CREATE POLICY "Owners can update groups" ON public.groups FOR UPDATE USING (auth.uid() = owner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='groups' AND policyname='Owners can delete groups') THEN
    CREATE POLICY "Owners can delete groups" ON public.groups FOR DELETE USING (auth.uid() = owner_id);
  END IF;

  -- group_members
  CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
  );
  ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
  -- "Members can view their groups" deferred here because it references group_members
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='groups' AND policyname='Members can view their groups') THEN
    CREATE POLICY "Members can view their groups" ON public.groups FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='group_members' AND policyname='Group members can view each other') THEN
    CREATE POLICY "Group members can view each other" ON public.group_members FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.group_members gm2 WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='group_members' AND policyname='Authenticated users can join groups') THEN
    CREATE POLICY "Authenticated users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='group_members' AND policyname='Users can leave groups') THEN
    CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- RPC functions handled outside via CREATE OR REPLACE

END $outer$;

-- reading_plan_days rich content columns
ALTER TABLE public.reading_plan_days ADD COLUMN IF NOT EXISTS title_summary TEXT;
ALTER TABLE public.reading_plan_days ADD COLUMN IF NOT EXISTS verse_text TEXT;
ALTER TABLE public.reading_plan_days ADD COLUMN IF NOT EXISTS reflection TEXT;
ALTER TABLE public.reading_plan_days ADD COLUMN IF NOT EXISTS prayer_prompt TEXT;
ALTER TABLE public.reading_plan_days ADD COLUMN IF NOT EXISTS application TEXT;

CREATE OR REPLACE FUNCTION public.increment_prayer_count(row_id UUID)
RETURNS void AS $$
  UPDATE public.prayer_requests SET pray_count = pray_count + 1 WHERE id = row_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- flag_prayer: inserts into prayer_flags (idempotent) and updates flag_count atomically
CREATE OR REPLACE FUNCTION public.flag_prayer(p_prayer_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.prayer_flags (prayer_id, user_id)
  VALUES (p_prayer_id, auth.uid())
  ON CONFLICT (prayer_id, user_id) DO NOTHING;

  SELECT COUNT(*) INTO v_count FROM public.prayer_flags WHERE prayer_id = p_prayer_id;

  UPDATE public.prayer_requests SET flag_count = v_count WHERE id = p_prayer_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_chat_dates: returns distinct dates with chat messages for a user
CREATE OR REPLACE FUNCTION public.get_chat_dates(p_user_id UUID)
RETURNS TABLE(date TEXT) AS $$
  SELECT DISTINCT created_at::date::text AS date
  FROM public.chat_messages
  WHERE user_id = p_user_id
  ORDER BY 1 DESC;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS void AS $$
BEGIN EXECUTE sql; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_prayer_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.flag_prayer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chat_dates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;
`;
}
