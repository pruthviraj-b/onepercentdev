-- Text-to-speech preferences and resumable listening state.
CREATE TABLE IF NOT EXISTS tts_voice_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  voice_name TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'en-US',
  playback_rate NUMERIC(3,2) NOT NULL DEFAULT 1 CHECK (playback_rate IN (0.75, 1, 1.25, 1.5, 2)),
  volume NUMERIC(3,2) NOT NULL DEFAULT 1 CHECK (volume BETWEEN 0 AND 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tts_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  part_id INTEGER NOT NULL,
  block_index INTEGER NOT NULL DEFAULT 0 CHECK (block_index >= 0),
  progress NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id, part_id)
);

CREATE INDEX IF NOT EXISTS tts_progress_user_updated_idx ON tts_progress(user_id, updated_at DESC);

ALTER TABLE tts_voice_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tts_progress ENABLE ROW LEVEL SECURITY;
