# Migration and compatibility guide

1. Keep the existing SQL files as the legacy compatibility layer.
2. Apply the new migrations in lexical order in a staging Supabase project.
3. Backfill UUID users using `users.legacy_user_id` from existing Firebase/text identifiers.
4. Backfill catalog records using `courses.legacy_course_id`, `modules.legacy_module_id`, and `lessons.legacy_part_id`.
5. Backfill new learning facts only after validating row counts against `progress`, `bookmarks`, `watch_sessions`, and `watch_history`.
6. Switch one repository at a time; keep legacy writes until dual-read comparisons are stable.
7. No legacy table is dropped by these migrations.

The current API remains pointed at the existing tables, so applying the migrations alone does not alter API behavior.
