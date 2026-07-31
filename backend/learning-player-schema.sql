-- ============================================================
-- Advanced YouTube Learning Player — Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Video Watch Sessions (for Learning Time Tracker) ─────────────────────
CREATE TABLE IF NOT EXISTS watch_sessions (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL,
  course_id    TEXT NOT NULL,
  part_id      NUMERIC NOT NULL,
  video_id     TEXT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  watch_seconds INTEGER NOT NULL DEFAULT 0,  -- actual watched seconds (not idle)
  duration_seconds INTEGER,                   -- total video duration
  percent_watched  NUMERIC(5,2) DEFAULT 0,
  playback_speed   NUMERIC(3,1) DEFAULT 1.0,
  completed    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS watch_sessions_user
  ON watch_sessions (user_id, course_id, part_id);
CREATE INDEX IF NOT EXISTS watch_sessions_date
  ON watch_sessions (user_id, started_at);

-- ── 2. Video Completion (auto-complete at 90%) ──────────────────────────────
CREATE TABLE IF NOT EXISTS video_completions (
  user_id      TEXT NOT NULL,
  course_id    TEXT NOT NULL,
  part_id      NUMERIC NOT NULL,
  video_id     TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  watch_method TEXT DEFAULT 'threshold',  -- 'threshold' | 'manual'
  PRIMARY KEY (user_id, course_id, part_id)
);

-- ── 3. Timestamp Notes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timestamp_notes (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL,
  course_id    TEXT NOT NULL,
  part_id      NUMERIC NOT NULL,
  video_id     TEXT NOT NULL,
  timestamp_sec  NUMERIC NOT NULL,          -- video timestamp in seconds
  content      TEXT NOT NULL CHECK (char_length(content) <= 5000),
  is_draft     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timestamp_notes_user_part
  ON timestamp_notes (user_id, course_id, part_id);

-- ── 4. Timestamp Bookmarks ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timestamp_bookmarks (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL,
  course_id    TEXT NOT NULL,
  part_id      NUMERIC NOT NULL,
  video_id     TEXT NOT NULL,
  timestamp_sec  NUMERIC NOT NULL,
  label        TEXT NOT NULL DEFAULT '' CHECK (char_length(label) <= 200),
  category     TEXT NOT NULL DEFAULT 'Important',
  color        TEXT NOT NULL DEFAULT '#f1be3e',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timestamp_bookmarks_user
  ON timestamp_bookmarks (user_id, course_id, part_id);
CREATE INDEX IF NOT EXISTS timestamp_bookmarks_category
  ON timestamp_bookmarks (user_id, category);

-- ── 5. Pomodoro Sessions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL,
  course_id    TEXT,
  part_id      NUMERIC,
  session_type TEXT NOT NULL DEFAULT 'work'  -- 'work' | 'break'
    CHECK (session_type IN ('work','break')),
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  interrupted  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS pomodoro_sessions_user_date
  ON pomodoro_sessions (user_id, started_at);

-- ── 6. Watch History (denormalized for fast queries) ─────────────────────────
-- We can derive this from watch_sessions but a dedicated table gives faster lookups
CREATE TABLE IF NOT EXISTS watch_history (
  user_id      TEXT NOT NULL,
  course_id    TEXT NOT NULL,
  part_id      NUMERIC NOT NULL,
  video_id     TEXT NOT NULL,
  course_title TEXT,
  lesson_title TEXT,
  thumbnail_url TEXT,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resume_at    NUMERIC DEFAULT 0,   -- seconds to resume from
  duration_seconds INTEGER,
  percent_watched NUMERIC(5,2) DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, course_id, part_id)
);

CREATE INDEX IF NOT EXISTS watch_history_user_date
  ON watch_history (user_id, last_watched_at DESC);

-- ── Triggers: updated_at ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_timestamp_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS timestamp_notes_updated_at ON timestamp_notes;
CREATE TRIGGER timestamp_notes_updated_at
  BEFORE UPDATE ON timestamp_notes
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_notes_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE watch_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_completions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE timestamp_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE timestamp_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history       ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS. These protect the anon key.
-- Backend uses service_role so RLS is a safety net only.
