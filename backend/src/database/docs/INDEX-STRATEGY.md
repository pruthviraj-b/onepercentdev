# Index strategy

- Identity: status and tenant membership indexes support active-user and organization lookups.
- Catalog: status, full-text search, course-to-module ordering, and module-to-lesson ordering are indexed.
- Learning: enrollment status, lesson activity, watch recency, bookmarks, notes, and quiz attempts are indexed by learner.
- Notifications: unread notifications and delivery state use partial/composite indexes.
- Analytics: user, course, event name, and time are indexed for append-heavy retrieval.
- Governance: audit resource and actor/time indexes support incident investigation.

High-volume analytics events should be partitioned by `occurred_at` after production cardinality is measured. Do not add indexes to append-only facts without measuring write amplification.
