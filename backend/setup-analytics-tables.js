/**
 * Creates all student analytics tables in Supabase.
 * Run: node setup-analytics-tables.js
 *
 * Uses the Supabase SQL HTTP endpoint directly.
 */
require('dotenv').config();
const https = require('https');

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Extract project ref from URL: https://xxxx.supabase.co
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

const TABLES_SQL = `
-- ── User Profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
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

CREATE INDEX IF NOT EXISTS user_profiles_email ON public.user_profiles (email);
CREATE INDEX IF NOT EXISTS user_profiles_online ON public.user_profiles (is_online);
CREATE INDEX IF NOT EXISTS user_profiles_last_seen ON public.user_profiles (last_seen_at DESC);

-- ── Activity Logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  course_id    TEXT,
  part_id      NUMERIC,
  video_id     TEXT,
  meta         JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_logs_user_date
  ON public.activity_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS activity_logs_user_event
  ON public.activity_logs (user_id, event_type);

-- ── Course Progress Summary ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_progress_summary (
  user_id           TEXT NOT NULL,
  course_id         TEXT NOT NULL,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  total_lessons     INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds BIGINT NOT NULL DEFAULT 0,
  last_opened_at    TIMESTAMPTZ,
  first_opened_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS cps_user ON public.course_progress_summary (user_id);

-- ── Watch Sessions (for learning time tracker) ────────────────────────────────
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

CREATE INDEX IF NOT EXISTS watch_sessions_user
  ON public.watch_sessions (user_id, course_id, part_id);

CREATE INDEX IF NOT EXISTS watch_sessions_user_date
  ON public.watch_sessions (user_id, started_at DESC);

-- ── Video Completions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.video_completions (
  user_id      TEXT NOT NULL,
  course_id    TEXT NOT NULL,
  part_id      NUMERIC NOT NULL,
  video_id     TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  watch_method TEXT DEFAULT 'threshold',
  PRIMARY KEY (user_id, course_id, part_id)
);

-- ── Timestamp Notes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.timestamp_notes (
  id             BIGSERIAL PRIMARY KEY,
  user_id        TEXT NOT NULL,
  course_id      TEXT NOT NULL,
  part_id        NUMERIC NOT NULL,
  video_id       TEXT NOT NULL,
  timestamp_sec  NUMERIC NOT NULL,
  content        TEXT NOT NULL,
  is_draft       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timestamp_notes_user_part
  ON public.timestamp_notes (user_id, course_id, part_id);

-- ── Timestamp Bookmarks ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.timestamp_bookmarks (
  id             BIGSERIAL PRIMARY KEY,
  user_id        TEXT NOT NULL,
  course_id      TEXT NOT NULL,
  part_id        NUMERIC NOT NULL,
  video_id       TEXT NOT NULL,
  timestamp_sec  NUMERIC NOT NULL,
  label          TEXT NOT NULL DEFAULT '',
  category       TEXT NOT NULL DEFAULT 'Important',
  color          TEXT NOT NULL DEFAULT '#f1be3e',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timestamp_bookmarks_user
  ON public.timestamp_bookmarks (user_id, course_id, part_id);

-- ── Pomodoro Sessions ─────────────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS pomodoro_user_date
  ON public.pomodoro_sessions (user_id, started_at DESC);

-- ── Watch History ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.watch_history (
  user_id         TEXT NOT NULL,
  course_id       TEXT NOT NULL,
  part_id         NUMERIC NOT NULL,
  video_id        TEXT NOT NULL,
  course_title    TEXT,
  lesson_title    TEXT,
  thumbnail_url   TEXT,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resume_at       NUMERIC DEFAULT 0,
  duration_seconds INTEGER,
  percent_watched NUMERIC(5,2) DEFAULT 0,
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, course_id, part_id)
);

CREATE INDEX IF NOT EXISTS watch_history_user_date
  ON public.watch_history (user_id, last_watched_at DESC);

-- ── Enable Row Level Security ─────────────────────────────────────────────────
ALTER TABLE public.user_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_completions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timestamp_notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timestamp_bookmarks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history          ENABLE ROW LEVEL SECURITY;
`;

function execSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const path = `/rest/v1/rpc/exec`;

    // Use Supabase Management API SQL endpoint
    const mgmtPath = `/v1/projects/${projectRef}/database/query`;
    const mgmtHostname = 'api.supabase.com';

    const options = {
      hostname: mgmtHostname,
      port: 443,
      path: mgmtPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Creating analytics tables in Supabase...\n');
  console.log('Project:', projectRef);
  console.log('Endpoint: api.supabase.com/v1/projects/' + projectRef + '/database/query\n');

  const result = await execSQL(TABLES_SQL);
  
  if (result.status === 200 || result.status === 201) {
    console.log('✅ All analytics tables created successfully!');
    try {
      const parsed = JSON.parse(result.body);
      if (parsed.error) console.warn('Warning:', parsed.error);
    } catch {}
  } else {
    console.error('❌ Failed to create tables. Status:', result.status);
    console.error('Response:', result.body.slice(0, 500));
    console.error('\n📋 MANUAL FALLBACK:');
    console.error('Copy and paste the SQL from backend/student-analytics-schema.sql');
    console.error('into: Supabase Dashboard → SQL Editor → New Query → Run All\n');
  }
}

main().catch(console.error);
