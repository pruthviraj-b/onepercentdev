-- RLS defaults for the new UUID-based domains.
-- The service_role backend continues to bypass these policies. Policies are
-- intentionally conservative and can be expanded when auth is migrated.

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users','organizations','organization_members','roles','permissions','role_permissions','user_roles',
    'course_levels','languages','course_categories','courses','course_category_links','course_languages','course_versions','course_instructors','modules',
    'lessons','lesson_sections','videos','video_sources','lesson_assets','course_enrollments','course_progress',
    'module_progress','lesson_progress','learning_watch_history','learning_bookmarks','learning_notes',
    'quizzes','questions','question_options','quiz_attempts','assignment_submissions','certificates',
    'notification_preferences','notifications','notification_deliveries','analytics_events','search_history',
    'audit_logs','feature_flags','system_settings'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS service_role_full_access ON %I', table_name);
    EXECUTE format(
      'CREATE POLICY service_role_full_access ON %I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')',
      table_name
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE VIEW course_catalog AS
SELECT
  c.id,
  c.legacy_course_id,
  c.slug,
  c.title,
  c.description,
  c.status,
  c.level_id,
  c.default_language_id,
  count(DISTINCT m.id)::INTEGER AS module_count,
  count(DISTINCT l.id)::INTEGER AS lesson_count
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id AND m.deleted_at IS NULL
LEFT JOIN lessons l ON l.module_id = m.id AND l.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id;

CREATE OR REPLACE VIEW learner_progress_summary AS
SELECT
  ce.user_id,
  ce.course_id,
  ce.status AS enrollment_status,
  cp.completed_lessons,
  cp.total_lessons,
  cp.percent_complete,
  cp.last_activity_at
FROM course_enrollments ce
LEFT JOIN course_progress cp ON cp.enrollment_id = ce.id;
