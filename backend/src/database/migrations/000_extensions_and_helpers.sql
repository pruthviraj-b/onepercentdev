-- Enterprise LMS database foundation.
-- Additive only: legacy tables are intentionally not altered or removed.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION lms_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION lms_touch_updated_at(table_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', table_name);
  EXECUTE format(
    'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION lms_set_updated_at()',
    table_name
  );
END;
$$;
