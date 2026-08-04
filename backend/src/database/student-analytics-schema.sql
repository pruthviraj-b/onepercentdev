-- ============================================================
-- Student Analytics Schema — Run in Supabase SQL Editor
-- ============================================================

-- ── 1. User Profiles (synced from Firebase on first login) ──────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id      TEXT PRIMARY KEY,
  display_name TEXT,
  email        TEXT,
  photo_url    TEXT,
  provider     TEXT DEFAULT 'google',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_online    BOOLEAN NOT NULL DEFAULT FALSE,
  current_course_id  TEXT,
  current_part_id    NUMERIC,
  current_video_id   TEXT,
  current_session_start TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS user_profiles_email ON user_profiles (email);
CREATE INDEX IF NOT EXISTS user_profiles_online ON user_profiles (is_online);

-- ── 2. Activity Logs ─────────────────────────────────────────────────────────
-- Tracks every meaningful learning event for timeline display
CREATE TABLE IF NOT EXISTS activity_logs (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL,
  event_type   TEXT NOT NULL CHECK (event_type IN (
    'lesson_start','lesson_complete','video_play','video_pause',
    'note_added','bookmark_added','progress_marked',
    'login','logout','course_open','quiz_complete','pomodoro_complete'
  )),
  course_id    TEXT,
  part_id      NUMERIC,
  video_id     TEXT,
  meta         JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_logs_user_date
  ON activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_event
  ON activity_logs (user_id, event_type);

-- ── 3. Course Progress Summary (fast admin queries) ──────────────────────────
CREATE TABLE IF NOT EXISTS course_progress_summary (
  user_id          TEXT NOT NULL,
  course_id        TEXT NOT NULL,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  total_lessons     INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds BIGINT NOT NULL DEFAULT 0,
  last_opened_at   TIMESTAMPTZ,
  first_opened_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS course_progress_user
  ON course_progress_summary (user_id);

-- ── Trigger: update course_progress_summary.updated_at ──────────────────────
CREATE OR REPLACE FUNCTION update_cps_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cps_updated_at ON course_progress_summary;
CREATE TRIGGER cps_updated_at
  BEFORE UPDATE ON course_progress_summary
  FOR EACH ROW EXECUTE FUNCTION update_cps_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE user_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress_summary ENABLE ROW LEVEL SECURITY;
-- Backend uses service_role which bypasses RLS.
