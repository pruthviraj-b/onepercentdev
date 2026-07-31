-- Production hardening migration for the learning data plane.
-- Apply after the existing schema files. All statements are idempotent.

-- Prevent invalid numeric values from entering the scoring/progress tables.
DO $$ BEGIN
  ALTER TABLE progress ADD CONSTRAINT progress_part_id_positive CHECK (part_id > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_part_id_positive CHECK (part_id > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE video_timestamps ADD CONSTRAINT video_timestamps_non_negative CHECK (timestamp >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE typing_scores ADD CONSTRAINT typing_scores_valid CHECK (wpm >= 0 AND accuracy >= 0 AND accuracy <= 100 AND duration >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE aptitude_scores ADD CONSTRAINT aptitude_scores_valid CHECK (score >= 0 AND total > 0 AND score <= total AND time_taken >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Query patterns used by dashboard, progress, activity and admin views.
CREATE INDEX IF NOT EXISTS progress_user_course_visited
  ON progress (user_id, course_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS bookmarks_user_course_pinned
  ON bookmarks (user_id, course_id, pinned_at DESC);
CREATE INDEX IF NOT EXISTS tasks_user_due_open
  ON tasks (user_id, due_date) WHERE done = false;
CREATE INDEX IF NOT EXISTS streak_user_date_desc
  ON streak (user_id, date DESC);
CREATE INDEX IF NOT EXISTS video_timestamps_user_updated
  ON video_timestamps (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS course_files_course_part
  ON course_files (course_id, part_id);

-- Durable idempotency keys for retry-safe write endpoints.
CREATE TABLE IF NOT EXISTS api_idempotency_keys (
  user_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status_code INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  PRIMARY KEY (user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS api_idempotency_expiry ON api_idempotency_keys (expires_at);
ALTER TABLE api_idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Operational audit trail for security and support investigations.
CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  request_id TEXT,
  ip INET,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_events_user_date ON security_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_type_date ON security_events (event_type, created_at DESC);
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Keep operational tables bounded by policy/retention jobs outside the request path.
COMMENT ON TABLE api_idempotency_keys IS 'Retry deduplication records; retain for 24 hours.';
COMMENT ON TABLE security_events IS 'Append-only security and authentication audit events.';
