-- Learning state and assessment model.
-- Legacy progress, bookmarks, watch_history, and task tables remain intact.

CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','withdrawn')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id, organization_id)
);

CREATE TABLE IF NOT EXISTS course_progress (
  enrollment_id UUID PRIMARY KEY REFERENCES course_enrollments(id) ON DELETE CASCADE,
  completed_lessons INTEGER NOT NULL DEFAULT 0 CHECK (completed_lessons >= 0),
  total_lessons INTEGER NOT NULL DEFAULT 0 CHECK (total_lessons >= 0),
  percent_complete NUMERIC(5,2) GENERATED ALWAYS AS
    (CASE WHEN total_lessons = 0 THEN 0 ELSE least(100, completed_lessons::numeric * 100 / total_lessons) END) STORED,
  last_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS module_progress (
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (enrollment_id, module_id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed','skipped')),
  percent_complete NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  first_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (enrollment_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS learning_watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  resume_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  percent_watched NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS learning_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  timestamp_seconds NUMERIC,
  label TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (lesson_id IS NOT NULL OR video_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS learning_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  timestamp_seconds NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (lesson_id IS NOT NULL OR video_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score NUMERIC(5,2) NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single_choice' CHECK (question_type IN ('single_choice','multiple_choice','free_text','code')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  passed BOOLEAN,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_url TEXT,
  submission_text TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft','submitted','reviewed','returned')),
  score NUMERIC(5,2),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  certificate_number TEXT NOT NULL UNIQUE,
  verification_code TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS enrollments_user_status_idx ON course_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS enrollments_course_idx ON course_enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS lesson_progress_user_activity_idx ON lesson_progress(enrollment_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS watch_history_user_date_idx ON learning_watch_history(user_id, last_watched_at DESC);
CREATE INDEX IF NOT EXISTS bookmarks_user_lesson_idx ON learning_bookmarks(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS notes_user_lesson_idx ON learning_notes(user_id, lesson_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS quiz_attempts_user_quiz_idx ON quiz_attempts(user_id, quiz_id, submitted_at DESC);

SELECT lms_touch_updated_at('course_enrollments');
SELECT lms_touch_updated_at('course_progress');
SELECT lms_touch_updated_at('module_progress');
SELECT lms_touch_updated_at('lesson_progress');
SELECT lms_touch_updated_at('learning_watch_history');
SELECT lms_touch_updated_at('learning_notes');
SELECT lms_touch_updated_at('quizzes');
SELECT lms_touch_updated_at('assignment_submissions');

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
