-- ============================================================
-- WALK DAILY — Onboarding Migration
-- ============================================================
-- Adds onboarding-related columns to the profiles table.
-- Run this after the initial schema.sql has been applied.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS faith_journey TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS connection_methods TEXT[];

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS spiritual_challenge TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reading_frequency TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reading_reminder TIME;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reading_days TEXT[];

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding
  ON public.profiles(has_completed_onboarding)
  WHERE has_completed_onboarding = FALSE;
