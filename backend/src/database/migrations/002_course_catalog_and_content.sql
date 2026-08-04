-- Normalized course catalog and content model.
-- legacy_* columns provide a non-breaking bridge to courses.config.json and
-- the existing text course/part identifiers.

CREATE TABLE IF NOT EXISTS course_levels (
  id SMALLSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS languages (
  id SMALLSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES course_categories(id) ON DELETE SET NULL,
  slug CITEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  legacy_course_id TEXT UNIQUE,
  slug CITEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','archived')),
  level_id SMALLINT REFERENCES course_levels(id) ON DELETE SET NULL,
  default_language_id SMALLINT REFERENCES languages(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS course_category_links (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES course_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (course_id, category_id)
);

CREATE TABLE IF NOT EXISTS course_languages (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  language_id SMALLINT NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (course_id, language_id)
);

CREATE TABLE IF NOT EXISTS course_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','retired')),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, version_number)
);

CREATE TABLE IF NOT EXISTS course_instructors (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_role TEXT NOT NULL DEFAULT 'instructor',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (course_id, user_id)
);

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  legacy_module_id BIGINT,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (course_id, legacy_module_id)
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  legacy_part_id NUMERIC,
  slug CITEXT NOT NULL,
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL DEFAULT 'reading' CHECK (lesson_type IN ('reading','video','quiz','assignment','coding','mixed')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER CHECK (estimated_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (module_id, slug)
);

CREATE TABLE IF NOT EXISTS lesson_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL DEFAULT 'content',
  title TEXT,
  body TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  source_url TEXT NOT NULL,
  quality TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (video_id, provider, source_url)
);

CREATE TABLE IF NOT EXISTS lesson_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('document','pdf','image','download','attachment','code')),
  storage_provider TEXT NOT NULL DEFAULT 'cloudinary',
  storage_key TEXT NOT NULL,
  public_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lesson_id, storage_provider, storage_key)
);

CREATE INDEX IF NOT EXISTS courses_status_idx ON courses(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS courses_search_idx ON courses USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));
CREATE INDEX IF NOT EXISTS modules_course_sort_idx ON modules(course_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS lessons_module_sort_idx ON lessons(module_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS lesson_assets_lesson_idx ON lesson_assets(lesson_id, asset_type);

SELECT lms_touch_updated_at('course_categories');
SELECT lms_touch_updated_at('courses');
SELECT lms_touch_updated_at('modules');
SELECT lms_touch_updated_at('lessons');
SELECT lms_touch_updated_at('lesson_sections');
SELECT lms_touch_updated_at('videos');

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_assets ENABLE ROW LEVEL SECURITY;
