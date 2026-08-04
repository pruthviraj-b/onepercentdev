# Enterprise database migrations

Apply these files in lexical order after the existing legacy schemas. They are additive and idempotent. Do not remove or rename the legacy tables used by the current API.

1. `000_extensions_and_helpers.sql` — extensions and shared timestamp trigger.
2. `001_identity_and_organizations.sql` — UUID identities, roles, permissions, and tenant membership.
3. `002_course_catalog_and_content.sql` — normalized catalog, versioning, modules, lessons, videos, and assets.
4. `003_learning_and_assessments.sql` — enrollment, progress, learning state, quizzes, submissions, and certificates.
5. `004_notifications_analytics_admin.sql` — notifications, event analytics, search history, audit logs, and flags.
6. `005_rls_policies_and_views.sql` — conservative RLS policies and read-optimized views.

The migrations do not implement payment gateways, commerce workflows, authentication flows, or marketplace behavior.
