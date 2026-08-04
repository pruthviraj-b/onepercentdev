# Table groups

| Domain | Primary tables |
| --- | --- |
| Identity and organizations | `users`, `organizations`, `organization_members`, `roles`, `permissions`, `user_roles` |
| Courses and content | `courses`, `course_versions`, `modules`, `lessons`, `lesson_sections`, `videos`, `video_sources`, `lesson_assets` |
| Learning and assessment | `course_enrollments`, `course_progress`, `module_progress`, `lesson_progress`, `learning_watch_history`, `learning_bookmarks`, `learning_notes`, `quizzes`, `questions`, `question_options`, `quiz_attempts`, `assignment_submissions` |
| Certificates | `certificates` |
| Notifications | `notification_preferences`, `notifications`, `notification_deliveries` |
| Analytics and administration | `analytics_events`, `search_history`, `audit_logs`, `feature_flags`, `system_settings` |
| Compatibility | Existing legacy schemas under `src/database/*.sql` |

Commerce, marketplace, AI, career, and community are reserved domains for later database phases and are not activated by this migration set.
