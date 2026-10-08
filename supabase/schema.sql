-- ============================================================
-- 75 Day Hard Challenge Tracker - Supabase Schema
-- Run this ENTIRE file in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS attempts (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  start_date    date NOT NULL,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'failed', 'completed')),
  failed_on_day int NULL,
  fail_reason   text NULL,
  ended_at      timestamptz NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own attempts" ON attempts;
CREATE POLICY "Users can manage their own attempts"
  ON attempts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TABLE: daily_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_logs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  attempt_id      uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  log_date        date NOT NULL,
  day_type        text NOT NULL DEFAULT 'normal' CHECK (day_type IN ('normal', 'match')),
  tasks           jsonb NOT NULL DEFAULT '{}',
  batting_balls   int NOT NULL DEFAULT 0,
  keeping_balls   int NOT NULL DEFAULT 0,
  catching_balls  int NOT NULL DEFAULT 0,
  meals_count     int NOT NULL DEFAULT 0,
  water_ml        int NOT NULL DEFAULT 0,
  sleep_hours     numeric NOT NULL DEFAULT 0,
  journal         text NOT NULL DEFAULT '',
  gym             boolean NOT NULL DEFAULT false,
  match_data      jsonb NOT NULL DEFAULT '{}',
  completed       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_attempt_date ON daily_logs (attempt_id, log_date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs (user_id);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own daily logs" ON daily_logs;
CREATE POLICY "Users can manage their own daily logs"
  ON daily_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TABLE: weekly_checkins
-- ============================================================
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  attempt_id    uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  checkin_date  date NOT NULL,
  weight_kg     numeric NULL,
  photo_path    text NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, checkin_date)
);

ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own weekly checkins" ON weekly_checkins;
CREATE POLICY "Users can manage their own weekly checkins"
  ON weekly_checkins FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TABLE: task_config
-- ============================================================
CREATE TABLE IF NOT EXISTS task_config (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  key                 text NOT NULL,
  label               text NOT NULL,
  enabled             boolean NOT NULL DEFAULT true,
  required_on_match   boolean NOT NULL DEFAULT false,
  is_custom           boolean NOT NULL DEFAULT false,
  sort_order          int NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

ALTER TABLE task_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own task config" ON task_config;
CREATE POLICY "Users can manage their own task config"
  ON task_config FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TABLE: settings
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  start_date          date NOT NULL DEFAULT '2026-10-09',
  timezone            text NOT NULL DEFAULT 'Asia/Kolkata',
  preferences         jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own settings" ON settings;
CREATE POLICY "Users can manage their own settings"
  ON settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- STORAGE: progress-photos bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;
CREATE POLICY "Users can view their own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'progress-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Remove trigger on auth.users if it was previously created to avoid blocking user signup in dashboard
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS insert_default_tasks(uuid);
