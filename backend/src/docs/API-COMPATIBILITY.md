# API Compatibility

Phase 2 preserves the existing endpoint paths, HTTP methods, middleware order, request parameters, and response payloads. The compatibility entrypoint remains `backend/index.js`; production starts from `src/app/server.js`.

The assembled application currently registers 77 existing routes, including health and readiness endpoints.
