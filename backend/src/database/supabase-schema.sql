-- ============================================================
-- 1% Developer Academy — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Progress: which parts a user has completed per course
CREATE TABLE IF NOT EXISTS progress (
  user_id    TEXT NOT NULL DEFAULT 'local',
  course_id  TEXT NOT NULL DEFAULT 'python',
  part_id    NUMERIC NOT NULL,
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id, part_id)
);

-- Bookmarks: pinned parts per user per course
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id    TEXT NOT NULL DEFAULT 'local',
  course_id  TEXT NOT NULL DEFAULT 'python',
  part_id    NUMERIC NOT NULL,
  pinned_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id, part_id)
);

-- Tasks: personal to-do list per user
CREATE TABLE IF NOT EXISTS tasks (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL DEFAULT 'local',
  text       TEXT NOT NULL,
  done       BOOLEAN NOT NULL DEFAULT FALSE,
  due_date   DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streak: one row per user per day they were active
CREATE TABLE IF NOT EXISTS streak (
  user_id    TEXT NOT NULL DEFAULT 'local',
  date       DATE NOT NULL,
  logged_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

-- Typing scores
CREATE TABLE IF NOT EXISTS typing_scores (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL DEFAULT 'local',
  wpm        INTEGER NOT NULL,
  accuracy   NUMERIC(5,2) NOT NULL,
  duration   INTEGER DEFAULT 0,
  scored_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Aptitude scores
CREATE TABLE IF NOT EXISTS aptitude_scores (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL DEFAULT 'local',
  category   TEXT DEFAULT 'general',
  score      INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  time_taken INTEGER DEFAULT 0,
  scored_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Video timestamps: resume position per user per part per course
CREATE TABLE IF NOT EXISTS video_timestamps (
  user_id    TEXT NOT NULL DEFAULT 'local',
  course_id  TEXT NOT NULL,
  part_id    NUMERIC NOT NULL,
  timestamp  NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id, part_id)
);

-- Course file assets: Cloudinary URLs for uploaded files
CREATE TABLE IF NOT EXISTS course_files (
  id           BIGSERIAL PRIMARY KEY,
  course_id    TEXT NOT NULL,
  part_id      NUMERIC NOT NULL,
  filename     TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  public_id    TEXT NOT NULL,
  resource_type TEXT DEFAULT 'raw',
  uploaded_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (course_id, part_id, filename)
);

-- ── Row Level Security (RLS) ─────────────────────────────────────────────────
-- We use service_role key on the backend which bypasses RLS.
-- Enable RLS so the anon key cannot be used to read other users' data.

ALTER TABLE progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak          ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_scores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptitude_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_timestamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_files    ENABLE ROW LEVEL SECURITY;

-- course_files is readable by everyone (public content)
CREATE POLICY "Public read course_files"
  ON course_files FOR SELECT USING (true);
