# LMS data verification report

Date: 2026-07-30

Scope: repository source, generated course content, frontend API clients, backend routes, and checked-in Supabase SQL. No production Supabase credentials or test account were available, so database, realtime, authentication-provider, storage, and browser UI results are explicitly marked as not runtime-verifiable.

## Executive result

The LMS is not proven production-correct. Static verification found a healthy course-content inventory and several sound uniqueness constraints, but it also found critical data-integrity and synchronization failures. The most important failures are:

1. Realtime synchronization is absent from the frontend. No `supabase.channel()` or Postgres change subscription exists.
2. Progress, bookmarks, streak, and several task flows use localStorage-first or optimistic writes and swallow network errors. A failed write can be presented as saved.
3. The frontend uses Firebase identity headers while production backend authentication accepts verified Supabase bearer tokens; the end-to-end production identity flow is incompatible.
4. RLS is enabled on most tables, but user-scoped policies are not defined. The backend uses the service-role key, so database RLS is bypassed for all API queries.
5. Core tables have no foreign keys to users/courses/lessons, so orphan and invalid-reference detection cannot be guaranteed.
6. `/api/link-preview` accepts any HTTP(S) host and server-fetches it, leaving an SSRF risk against private/internal addresses.

## Evidence summary

| Area | Result | Evidence | Risk |
|---|---|---|---|
| Course inventory/content | PASS (static) | `backend/verification.test.js` checked 2,020 invariants; every configured part had a notes file and no duplicate part within a course | Medium |
| Course API fetch | PASS (code path) | `backend/index.js:224-291` serves config/content; runtime response and UI rendering not verified | Medium |
| Progress save/fetch | FAIL | `frontend/lib/api.ts:178-214` returns localStorage immediately and fires background writes with `.catch(() => {})`; backend upsert is not acknowledged by the client | High |
| Bookmark save/fetch | FAIL | Same local-first/swallowed-error pattern at `frontend/lib/api.ts:216-247`; contract mismatch was fixed, but consistency is still unproven | High |
| Streak calculations | FAIL | `backend/index.js:379-411` uses UTC dates while user-local day boundaries are not defined; client also provides local fallback defaults | High |
| Tasks | FAIL | `frontend/lib/smartTaskApi.ts:350-426` falls back to local tasks on HTTP failure; this can diverge from the database | High |
| Video/watch data | FAIL | `frontend/lib/learningPlayerApi.ts:1-276` has no realtime or durable retry queue; save/fetch runtime behavior not proven | High |
| Dashboard metrics | FAIL | Dashboard combines local-first progress/streak/recent-activity values with independent APIs; no authoritative aggregate transaction/view was found | High |
| Realtime | FAIL | Repository search found no frontend realtime subscription; `backend/index.js` has no websocket/broadcast implementation | Critical |
| Authentication | FAIL | Frontend sends `X-User-Id` (`frontend/lib/api.ts:16-23`, `frontend/lib/smartTaskApi.ts:12-16`); production backend accepts verified Supabase bearer tokens (`backend/index.js:76-96`) | Critical |
| RLS/policies | FAIL | RLS is enabled across schemas, but only one policy exists in `backend/supabase-schema.sql:101`; most tables have zero policies | Critical |
| Relationships | FAIL | Checked-in table definitions contain primary/unique keys but no foreign-key declarations for user/course/lesson references | High |
| Duplicate prevention | PARTIAL PASS | Composite primary keys protect progress/bookmarks/video state; task/event/history tables can still duplicate logically | Medium |
| API validation | PARTIAL FAIL | Some smart-task validation exists (`backend/index.js:1138-1190`), but many routes only check presence/`parseInt`/`parseFloat` | High |
| File storage | FAIL | Upload uses `multer.memoryStorage()` without a file-size limit and accepts legacy base64 input (`backend/index.js:587-650`) | High |
| Link preview security | FAIL | `validateUrl` only checks `http`/`https` (`backend/index.js:719-725`); link-preview then fetches the supplied URL (`backend/index.js:1421-1435`) | High |
| Build | PASS | `frontend npm run build` completed successfully | Low |
| Backend syntax | PASS | `node --check backend/index.js` completed successfully | Low |
| Runtime API | NOT VERIFIED | Port 3001 already had a running process; production credentials/test users were unavailable | Unknown |
| Database contents | NOT VERIFIED | No live Supabase connection was available for duplicate/orphan/corruption queries | Critical |
| Browser E2E | NOT VERIFIED | No authenticated browser session/test account was available | High |

## Required runtime verification

Verification not possible without runtime testing for:

- save/read/delete persistence against every Supabase table;
- transaction behavior and lost-update races;
- RLS enforcement with anon, authenticated, and service-role identities;
- Supabase Auth/Firebase token compatibility and session refresh;
- storage bucket policies, signed URLs, upload limits, and cleanup;
- realtime event delivery, reconnect, ordering, and duplicate events;
- dashboard numbers versus live database aggregates;
- timezone behavior for streaks and reminders;
- browser rendering and no-refresh synchronization;
- latency, rate limiting under load, retries, and failure recovery.

## Priority remediation

P0:

- Choose one identity provider and send/verify its bearer token end to end. Do not use user-id headers in production.
- Add explicit per-table RLS policies or move all access behind a narrowly scoped trusted service layer with audited authorization.
- Implement realtime subscriptions or an equivalent event stream for progress, tasks, bookmarks, streak, notifications, and metrics.
- Stop treating localStorage as authoritative. Use an outbox/retry state with server acknowledgements and conflict handling.

P1:

- Add foreign keys/check constraints and authoritative SQL views/RPCs for course progress, streak, and dashboard metrics.
- Add request schemas, idempotency keys, bounded upload limits, MIME/content validation, and consistent error envelopes to every write route.
- Block private/link-local IP ranges in link preview and use an egress proxy.
- Add authenticated integration tests and Playwright E2E tests covering two concurrent clients.

P2:

- Add observability around database latency, failed writes, realtime reconnects, queue depth, and metric calculation versions.
- Add retention/cleanup jobs for idempotency, activity, watch sessions, and security events.

## Reproducible checks

Run:

```powershell
node backend/verification.test.js
npm --prefix frontend run build
node --check backend/index.js
```

The static verifier intentionally exits non-zero because the missing frontend realtime subscription is a real failed requirement, not an assumed pass.
