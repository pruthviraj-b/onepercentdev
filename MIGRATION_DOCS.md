# 1% Developer Academy — Supabase + Cloudinary Migration Docs

> Full reference for what changed, how everything connects, how to debug, and what to check when things break.

---

## 1. What Was Migrated & Why

### Before
| Layer | Technology |
|-------|-----------|
| Database | `sql.js` — SQLite running in memory, saved to `academy.db` file |
| File storage | Local filesystem (`/content/` folders) |
| File uploads | Base64 in request body, written to disk |
| Data persistence | Single file on the server — lost on redeploy |

### After
| Layer | Technology |
|-------|-----------|
| Database | **Supabase** PostgreSQL — cloud hosted, persistent, multi-user |
| File storage | **Cloudinary** — 25GB free, CDN-delivered URLs |
| File uploads | Multipart or base64 → streamed to Cloudinary |
| Data persistence | Cloud — survives redeploys, accessible from any device |

---

## 2. All Files Changed

### Backend

| File | Status | What Changed |
|------|--------|-------------|
| `backend/index.js` | **Replaced** | Entire DB layer swapped from sql.js → Supabase. Cloudinary upload route added. Same API surface — all endpoints unchanged. |
| `backend/.env` | **Created** | All secrets stored here. Never committed to git. |
| `backend/.gitignore` | **Updated** | Added `.env` to ignored files |
| `backend/package.json` | **Updated** | Added: `@supabase/supabase-js`, `cloudinary`, `dotenv`, `pg` |
| `backend/supabase-schema.sql` | **Created** | SQL to create all 8 tables. Run once in Supabase SQL Editor. |
| `backend/check-tables.js` | **Created** | Utility — checks if all 8 tables exist in Supabase |
| `backend/run-schema.js` | **Created** | Utility — runs schema automatically if `SUPABASE_DB_URL` is set |
| `backend/setup-supabase.js` | **Created** | Legacy setup attempt — superseded by run-schema.js |
| `backend/academy.db` | **Kept** | Old SQLite file — no longer used, safe to delete |

### Frontend

| File | Status | What Changed |
|------|--------|-------------|
| `frontend/.env.local` | **Updated** | Added `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |
| `frontend/lib/supabase.ts` | **Created** | Supabase client for frontend use (anon key only) |
| `frontend/lib/api.ts` | **Unchanged** | Still calls backend API — no changes needed |
| `frontend/lib/taskApi.ts` | **Unchanged** | Still calls backend API — no changes needed |
| `frontend/lib/firebase.ts` | **Unchanged** | Firebase Auth still used for login |

---

## 3. Environment Variables — Full Reference

### `backend/.env` (never commit this file)
```
ADMIN_PASSWORD=Iam1984bc$

SUPABASE_URL=https://qeujdnrxkcdgkhjtxsly.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← full JWT, bypasses RLS

SUPABASE_DB_URL=                   ← optional, only needed for run-schema.js

CLOUDINARY_CLOUD_NAME=ddwxml58b
CLOUDINARY_API_KEY=379191853693499
CLOUDINARY_API_SECRET=zPQQsM...
```

### `frontend/.env.local`
```
# Firebase Auth — unchanged
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# Supabase — frontend (anon/public key only)
NEXT_PUBLIC_SUPABASE_URL=https://qeujdnrxkcdgkhjtxsly.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Cloudinary — frontend (public, safe to expose)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=ddwxml58b
```

### Key rules
- `SUPABASE_SERVICE_ROLE_KEY` — backend only, never in `NEXT_PUBLIC_*`
- `CLOUDINARY_API_SECRET` — backend only, never in `NEXT_PUBLIC_*`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — frontend safe, RLS protects the data
- Firebase keys — all public by design (Firebase Auth handles security)

---

## 4. Supabase — Tables Reference

All 8 tables live in the `public` schema. RLS is enabled on all of them. The backend uses the `service_role` key which bypasses RLS entirely.

### `progress`
Tracks which parts a user has completed per course.
```sql
user_id    TEXT     -- Firebase UID or 'local'
course_id  TEXT     -- e.g. 'python', 'cloud'
part_id    NUMERIC  -- e.g. 1, 2, 2.5
completed  BOOLEAN
visited_at TIMESTAMPTZ
PRIMARY KEY (user_id, course_id, part_id)
```

### `bookmarks`
Pinned parts per user per course.
```sql
user_id   TEXT
course_id TEXT
part_id   NUMERIC
pinned_at TIMESTAMPTZ
PRIMARY KEY (user_id, course_id, part_id)
```

### `tasks`
Personal to-do items per user.
```sql
id         BIGSERIAL PK
user_id    TEXT
text       TEXT
done       BOOLEAN
due_date   DATE
created_at TIMESTAMPTZ
```

### `streak`
One row per user per day they were active.
```sql
user_id   TEXT
date      DATE       -- YYYY-MM-DD
logged_at TIMESTAMPTZ
PRIMARY KEY (user_id, date)
```

### `typing_scores`
Results from the typing speed tool.
```sql
id        BIGSERIAL PK
user_id   TEXT
wpm       INTEGER
accuracy  NUMERIC(5,2)
duration  INTEGER     -- seconds
scored_at TIMESTAMPTZ
```

### `aptitude_scores`
Results from aptitude quizzes.
```sql
id         BIGSERIAL PK
user_id    TEXT
category   TEXT       -- e.g. 'general', 'math'
score      INTEGER
total      INTEGER
time_taken INTEGER    -- seconds
scored_at  TIMESTAMPTZ
```

### `video_timestamps`
Resume position for videos per user.
```sql
user_id    TEXT
course_id  TEXT
part_id    NUMERIC
timestamp  NUMERIC    -- seconds
updated_at TIMESTAMPTZ
PRIMARY KEY (user_id, course_id, part_id)
```

### `course_files`
Cloudinary file references per course part.
```sql
id             BIGSERIAL PK
course_id      TEXT
part_id        NUMERIC
filename       TEXT
cloudinary_url TEXT      -- full HTTPS CDN URL
public_id      TEXT      -- Cloudinary public_id for deletion
resource_type  TEXT      -- always 'raw'
uploaded_at    TIMESTAMPTZ
UNIQUE (course_id, part_id, filename)
```

---

## 5. Cloudinary — How Files Work

### Upload flow
1. Admin uploads a file via `POST /api/admin/upload/:course/:part`
2. Backend streams the file buffer to Cloudinary using `upload_stream`
3. Cloudinary returns a `secure_url` (HTTPS CDN URL)
4. URL + `public_id` are stored in `course_files` table in Supabase
5. `export-data.js` runs to refresh static JSON files

### Cloudinary folder structure
```
academy/
  python/
    part-1/
      filename.pdf
    part-2/
      notes.pdf
  cloud/
    part-1/
      ...
```

### Delete flow
1. `DELETE /api/admin/files/:course/:part/:filename`
2. Backend fetches `public_id` from Supabase
3. Calls `cloudinary.uploader.destroy(public_id, { resource_type: 'raw' })`
4. Deletes row from `course_files`
5. Also deletes local file if it exists

### Free tier limits
- Storage: 25 GB
- Bandwidth: 25 GB/month
- Transformations: 25,000/month (not used — raw files only)

---

## 6. API Endpoints — Full List

All endpoints are unchanged from before. No frontend code needed updating.

### Public (no auth header needed)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/courses` | List all courses |
| GET | `/api/modules?course=X` | Modules + part list for a course |
| GET | `/api/notes/:course/:part` | Full note data for a part |
| GET | `/api/files/:course/:part/*` | Serve local file asset |

### User (requires `x-user-id` header)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/progress?course=X` | Get completed part IDs |
| POST | `/api/progress/:part` | Mark part complete/incomplete |
| GET | `/api/bookmarks?course=X` | Get bookmarked part IDs |
| POST | `/api/bookmarks/:part` | Pin/unpin a part |
| GET | `/api/video-timestamp?course=X&part=Y` | Get resume position |
| POST | `/api/video-timestamp` | Save resume position |
| GET | `/api/streak` | Get streak stats |
| POST | `/api/streak` | Log today as active |
| POST | `/api/streak/ping` | Same as above (alias) |
| GET | `/api/recent-activity` | Most recently visited part |
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/typing/score` | Submit typing score |
| GET | `/api/typing/scores` | Get last 20 typing scores |
| POST | `/api/aptitude/score` | Submit aptitude score |
| GET | `/api/aptitude/scores` | Get last 20 aptitude scores |

### Admin (requires `x-admin-password` header)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/config` | Get courses config |
| PUT | `/api/admin/config` | Update courses config |
| POST | `/api/admin/notes/:course/:part` | Write notes markdown |
| POST | `/api/admin/import-notes/:course/:part` | Import PDF/DOCX/MD as notes |
| POST | `/api/admin/upload/:course/:part` | Upload file → Cloudinary |
| DELETE | `/api/admin/files/:course/:part/:filename` | Delete file from Cloudinary |
| GET | `/api/admin/files/:course/:part` | List Cloudinary files for a part |

---

## 7. Debugging Guide

### Backend won't start

**Check:** Is `.env` file present?
```
backend/.env   ← must exist with all 6 keys
```
**Check:** Are packages installed?
```bash
cd backend
npm install
```

---

### "Could not find table in schema cache" error

The Supabase tables don't exist yet.

**Fix:** Run the schema:
1. Go to https://supabase.com/dashboard/project/qeujdnrxkcdgkhjtxsly/sql/new
2. Paste contents of `backend/supabase-schema.sql`
3. Click Run

**Verify:**
```bash
node check-tables.js
# All 8 should show OK
```

---

### Progress / bookmarks not saving

1. Check the `x-user-id` header is being sent — open browser DevTools → Network tab → any `/api/progress` request → look for the header
2. Check Supabase dashboard → Table Editor → `progress` — are rows appearing?
3. If rows appear but wrong user, check Firebase Auth is returning a UID: in browser console run `firebase.auth().currentUser.uid`

---

### Cloudinary upload failing

**Check credentials:**
```bash
node -e "
require('dotenv').config();
const c = require('cloudinary').v2;
c.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
c.api.ping().then(r => console.log('OK:', r)).catch(e => console.error('FAIL:', e.message));
"
```
Expected output: `OK: { status: 'ok', ... }`

**Common causes:**
- Wrong API secret (has trailing space or missing characters)
- Cloud name wrong — check Cloudinary Dashboard top-left

---

### Supabase connection failing

**Check credentials:**
```bash
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('tasks').select('count').then(r => console.log('OK:', JSON.stringify(r))).catch(console.error);
"
```
Expected: `OK: { data: [...], error: null, ... }`

**Common causes:**
- Using anon key instead of service_role key in `.env`
- Tables not created yet

---

### Streak not incrementing

The streak `POST /api/streak` and `/api/streak/ping` both do an `upsert` with `ignoreDuplicates: true` — so calling it twice on the same day is safe, it won't double-count.

**Check:** Is today's date in the `streak` table?
- Supabase Dashboard → Table Editor → `streak` → filter by `user_id`

---

### Tasks showing for wrong user / all users

The backend reads `x-user-id` from the request header. If the header is `'local'`, all anonymous users share the same tasks.

**Fix:** Make sure Firebase Auth is initialized before any API calls. The header is set in `getAuthHeaders()` in `frontend/lib/api.ts` and `taskApi.ts`.

---

### Static notes/files not updating after admin edit

The backend runs `node frontend/scripts/export-data.js` after every admin write. If this fails silently:

```bash
cd frontend
node scripts/export-data.js
```

Check for errors in the output. Common cause: missing content directory or bad `courses.config.json`.

---

## 8. Utility Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Check tables | `node check-tables.js` | Verify all 8 Supabase tables exist |
| Run schema | `node run-schema.js` | Auto-create tables (needs `SUPABASE_DB_URL`) |
| Export static data | `node frontend/scripts/export-data.js` | Regenerate all static JSON from markdown |
| Start backend | `npm start` | Production start |
| Dev backend | `npm run dev` | Auto-restart on file changes |

---

## 9. Architecture Diagram

```
Browser (Next.js frontend)
│
├── Firebase Auth ──────────────────────────────► Firebase
│   (login / UID)
│
├── Static content (notes, modules)
│   └── /public/api/*.json  ◄── export-data.js reads /content/**/*.md
│
└── Dynamic data ──► Express Backend (port 3001)
                          │
                          ├── Supabase PostgreSQL ─────────────────────────► Supabase
                          │   progress, bookmarks, tasks,
                          │   streak, scores, video_timestamps, course_files
                          │
                          └── Cloudinary ──────────────────────────────────► Cloudinary
                              (uploaded PDFs, binary assets)
                              Returns secure_url stored in course_files
```

---

## 10. Free Tier Limits Summary

| Service | What's Free | Current Usage |
|---------|------------|---------------|
| Supabase | 500MB PostgreSQL, 50MB file storage | ~0MB (text data only) |
| Cloudinary | 25GB storage, 25GB bandwidth/month | ~0GB |
| Firebase Auth | 10,000 users/month | Active |

At typical academy scale (hundreds of users, text data only), you will not hit any of these limits.

---

## 11. If You Need to Reset / Start Fresh

### Wipe all user data in Supabase (destructive — ask user first)
Run in Supabase SQL Editor:
```sql
TRUNCATE progress, bookmarks, tasks, streak, typing_scores, aptitude_scores, video_timestamps RESTART IDENTITY;
```

### Remove all Cloudinary files for a course
```bash
node -e "
require('dotenv').config();
const c = require('cloudinary').v2;
c.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
c.api.delete_resources_by_prefix('academy/python/', { resource_type: 'raw' }).then(console.log);
"
```

### Drop and recreate all tables
Run in Supabase SQL Editor:
```sql
DROP TABLE IF EXISTS course_files, video_timestamps, aptitude_scores, typing_scores, streak, tasks, bookmarks, progress;
```
Then re-run `supabase-schema.sql`.
