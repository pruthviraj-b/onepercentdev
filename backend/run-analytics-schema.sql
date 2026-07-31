-- ============================================================
-- Run this ONCE in Supabase Dashboard → SQL Editor → New Query
-- Paste entire file → click Run
-- ============================================================

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id               TEXT PRIMARY KEY,
  display_name          TEXT,
  email                 TEXT,
  photo_url             TEXT,
  provider              TEXT DEFAULT 'google',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_online             BOOLEAN NOT NULL DEFAULT FALSE,
  current_course_id     TEXT,
  current_part_id       NUMERIC,
  current_video_id      TEXT,
  current_session_start TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email    ON public.user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_online   ON public.user_profiles (is_online);
CREATE INDEX IF NOT EXISTS idx_user_profiles_lastseen ON public.user_profiles (last_seen_at DESC);

-- 2. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  course_id   TEXT,
  part_id     NUMERIC,
  video_id    TEXT,
  meta        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_user_date  ON public.activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user_event ON public.activity_logs (user_id, event_type);

-- 3. Watch Sessions
CREATE TABLE IF NOT EXISTS public.watch_sessions (
  id               BIGSERIAL PRIMARY KEY,
  user_id          TEXT NOT NULL,
  course_id        TEXT NOT NULL,
  part_id          NUMERIC NOT NULL,
  video_id         TEXT NOT NULL,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  watch_seconds    INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  percent_watched  NUMERIC(5,2) DEFAULT 0,
  playback_speed   NUMERIC(3,1) DEFAULT 1.0,
  completed        BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_watch_user       ON public.watch_sessions (user_id, course_id, part_id);
CREATE INDEX IF NOT EXISTS idx_watch_user_date  ON public.watch_sessions (user_id, started_at DESC);

-- 4. Video Completions
CREATE TABLE IF NOT EXISTS public.video_completions (
  user_id      TEXT NOT NULL,
  course_id    TEXT NOT NULL,
  part_id      NUMERIC NOT NULL,
  video_id     TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  watch_method TEXT DEFAULT 'threshold',
  PRIMARY KEY (user_id, course_id, part_id)
);

-- 5. Timestamp Notes
CREATE TABLE IF NOT EXISTS public.timestamp_notes (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  course_id     TEXT NOT NULL,
  part_id       NUMERIC NOT NULL,
  video_id      TEXT NOT NULL,
  timestamp_sec NUMERIC NOT NULL,
  content       TEXT NOT NULL,
  is_draft      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ts_notes_user ON public.timestamp_notes (user_id, course_id, part_id);

-- 6. Timestamp Bookmarks
CREATE TABLE IF NOT EXISTS public.timestamp_bookmarks (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  course_id     TEXT NOT NULL,
  part_id       NUMERIC NOT NULL,
  video_id      TEXT NOT NULL,
  timestamp_sec NUMERIC NOT NULL,
  label         TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'Important',
  color         TEXT NOT NULL DEFAULT '#f1be3e',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ts_bookmarks_user ON public.timestamp_bookmarks (user_id, course_id, part_id);
CREATE INDEX IF NOT EXISTS idx_ts_bookmarks_cat  ON public.timestamp_bookmarks (user_id, category);

-- 7. Pomodoro Sessions
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id               BIGSERIAL PRIMARY KEY,
  user_id          TEXT NOT NULL,
  course_id        TEXT,
  part_id          NUMERIC,
  session_type     TEXT NOT NULL DEFAULT 'work',
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  interrupted      BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_pomodoro_user ON public.pomodoro_sessions (user_id, started_at DESC);

-- 8. Watch History
CREATE TABLE IF NOT EXISTS public.watch_history (
  user_id          TEXT NOT NULL,
  course_id        TEXT NOT NULL,
  part_id          NUMERIC NOT NULL,
  video_id         TEXT NOT NULL,
  course_title     TEXT,
  lesson_title     TEXT,
  thumbnail_url    TEXT,
  last_watched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resume_at        NUMERIC DEFAULT 0,
  duration_seconds INTEGER,
  percent_watched  NUMERIC(5,2) DEFAULT 0,
  is_completed     BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, course_id, part_id)
);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history (user_id, last_watched_at DESC);

-- 9. Course Progress Summary
CREATE TABLE IF NOT EXISTS public.course_progress_summary (
  user_id            TEXT NOT NULL,
  course_id          TEXT NOT NULL,
  lessons_completed  INTEGER NOT NULL DEFAULT 0,
  total_lessons      INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds BIGINT NOT NULL DEFAULT 0,
  last_opened_at     TIMESTAMPTZ,
  first_opened_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- Enable RLS (service_role bypasses RLS — this protects anon key)
ALTER TABLE public.user_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_completions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timestamp_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timestamp_bookmarks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress_summary ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger for timestamp_notes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_notes_updated_at ON public.timestamp_notes;
CREATE TRIGGER set_timestamp_notes_updated_at
  BEFORE UPDATE ON public.timestamp_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Done. All 9 tables created.
-- ============================================================
