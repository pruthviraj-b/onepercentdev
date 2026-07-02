-- ============================================================
-- Universal Smart Learning Task System — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- Adds a new smart_tasks table alongside the legacy tasks table
-- ============================================================

-- Drop legacy tasks table dependency if migrating (optional)
-- We keep the old tasks table intact for backward compatibility
-- and use smart_tasks as the new system.

-- ── Main smart_tasks table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smart_tasks (
  id                    BIGSERIAL PRIMARY KEY,
  user_id               TEXT NOT NULL,

  -- Core fields
  title                 TEXT NOT NULL CHECK (char_length(title) <= 255),
  description           TEXT CHECK (char_length(description) <= 2000),
  task_type             TEXT NOT NULL DEFAULT 'study'
                          CHECK (task_type IN (
                            'study','watch_video','read_article','practice_coding',
                            'complete_lesson','assignment','revision','mock_test',
                            'interview_prep','build_project','research','custom'
                          )),
  status                TEXT NOT NULL DEFAULT 'not_started'
                          CHECK (status IN ('not_started','in_progress','completed','skipped','archived')),
  priority              TEXT NOT NULL DEFAULT 'medium'
                          CHECK (priority IN ('low','medium','high','critical')),

  -- Scheduling
  due_date              DATE,
  due_time              TIME,
  estimated_duration_minutes INTEGER DEFAULT NULL CHECK (estimated_duration_minutes > 0),
  recurrence_rule       TEXT DEFAULT 'none'
                          CHECK (recurrence_rule IN ('none','daily','weekdays','weekly','monthly') OR
                                 recurrence_rule LIKE 'custom_%'),

  -- Link fields
  link_type             TEXT DEFAULT NULL CHECK (link_type IN ('internal','external', NULL)),
  internal_link_target  TEXT DEFAULT NULL
                          CHECK (internal_link_target IN (
                            'course','module','lesson','quiz','assignment',
                            'project','practice_lab','certificate','dashboard', NULL
                          )),
  internal_link_id      TEXT DEFAULT NULL,
  internal_link_label   TEXT DEFAULT NULL,
  external_url          TEXT DEFAULT NULL CHECK (char_length(external_url) <= 2048),
  url_resource_type     TEXT DEFAULT NULL
                          CHECK (url_resource_type IN (
                            'youtube','github','pdf','google_docs','google_drive',
                            'notion','kaggle','leetcode','hackerrank','medium',
                            'website', NULL
                          )),

  -- Link preview (cached metadata)
  preview_title         TEXT DEFAULT NULL CHECK (char_length(preview_title) <= 255),
  preview_favicon       TEXT DEFAULT NULL CHECK (char_length(preview_favicon) <= 2048),
  preview_thumbnail     TEXT DEFAULT NULL CHECK (char_length(preview_thumbnail) <= 2048),
  preview_domain        TEXT DEFAULT NULL CHECK (char_length(preview_domain) <= 253),
  preview_fetched_at    TIMESTAMPTZ DEFAULT NULL,

  -- Context
  course_id             TEXT DEFAULT NULL,
  category              TEXT DEFAULT NULL CHECK (char_length(category) <= 100),
  personal_notes        TEXT DEFAULT NULL CHECK (char_length(personal_notes) <= 5000),
  tags                  TEXT[] DEFAULT '{}',

  -- Organization
  is_pinned             BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived           BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order            INTEGER DEFAULT 0,

  -- Timestamps
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes for fast filtering queries ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS smart_tasks_user_due
  ON smart_tasks (user_id, due_date) WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS smart_tasks_user_status
  ON smart_tasks (user_id, status) WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS smart_tasks_user_pinned
  ON smart_tasks (user_id, is_pinned) WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS smart_tasks_user_archived
  ON smart_tasks (user_id, is_archived);

CREATE INDEX IF NOT EXISTS smart_tasks_user_course
  ON smart_tasks (user_id, course_id) WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS smart_tasks_user_priority
  ON smart_tasks (user_id, priority) WHERE is_archived = FALSE;

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id                  TEXT PRIMARY KEY,
  browser_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  email_address            TEXT DEFAULT NULL,
  reminder_offsets_minutes INTEGER[] NOT NULL DEFAULT ARRAY[10, 0],
  daily_digest_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  daily_digest_time        TIME NOT NULL DEFAULT '08:00',
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminder_deliveries (
  id             BIGSERIAL PRIMARY KEY,
  user_id        TEXT NOT NULL,
  task_id        BIGINT REFERENCES smart_tasks(id) ON DELETE CASCADE,
  channel        TEXT NOT NULL CHECK (channel IN ('browser','email','push')),
  delivery_key   TEXT NOT NULL UNIQUE,
  scheduled_for  TIMESTAMPTZ NOT NULL,
  delivered_at   TIMESTAMPTZ DEFAULT NOW(),
  status         TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','skipped','failed')),
  provider       TEXT DEFAULT NULL,
  provider_id    TEXT DEFAULT NULL,
  error_message  TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS reminder_deliveries_user_task
  ON reminder_deliveries (user_id, task_id, channel);

CREATE INDEX IF NOT EXISTS reminder_deliveries_scheduled
  ON reminder_deliveries (scheduled_for);

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE smart_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_deliveries ENABLE ROW LEVEL SECURITY;

-- Service role key bypasses RLS on the backend.
-- These policies protect the anon key from cross-user access.
-- (The backend uses service_role so these are a safety net only.)

-- ── Updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_smart_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS smart_tasks_updated_at ON smart_tasks;
CREATE TRIGGER smart_tasks_updated_at
  BEFORE UPDATE ON smart_tasks
  FOR EACH ROW EXECUTE FUNCTION update_smart_tasks_updated_at();

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_preferences_updated_at ON user_notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_notification_preferences_updated_at();
