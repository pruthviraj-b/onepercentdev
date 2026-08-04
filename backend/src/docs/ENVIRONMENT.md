# Environment Variables

Runtime configuration is centralized in `src/config/env.js`.

Supported settings include `NODE_ENV`, `PORT`, `REPO_ROOT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS`, `JSON_BODY_LIMIT`, `RATE_LIMIT_PER_MINUTE`, and `ADMIN_PASSWORD`. Cloudinary and reminder settings continue to be read by the existing compatibility handlers.
