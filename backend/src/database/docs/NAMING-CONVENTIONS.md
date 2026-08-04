# Naming conventions

- Tables and columns use lowercase `snake_case`.
- Primary keys are UUIDs for new domains.
- Legacy text identifiers are retained only in explicitly named `legacy_*` columns.
- Join tables use both foreign-key names as a composite primary key.
- Mutable entities expose `created_at`, `updated_at`, and `deleted_at` where soft deletion is meaningful.
- JSONB is reserved for provider metadata, settings, and extensible event payloads.
- Facts such as analytics events are append-only; summaries and views are separate read models.
