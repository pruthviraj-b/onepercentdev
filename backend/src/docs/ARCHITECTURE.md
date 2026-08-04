# Backend Architecture

The backend is composed in `app/app.js` and booted by `app/server.js`.

- `app/context.js` owns the current runtime composition and shared dependencies.
- `routes/index.js` is the route composition boundary.
- `controllers/` contains the extracted HTTP route handlers, grouped by domain.
- `services/` is the business-service boundary for future extractions.
- `repositories/` is the database-access boundary.
- `middlewares/`, `validators/`, `schemas/`, `utils/`, and `config/` contain cross-cutting concerns.
- `database/` contains SQL and the Supabase adapter.

The current extraction keeps handler bodies unchanged to preserve API contracts. New domain work should move logic from controllers into services and repositories rather than adding logic to route composition.
