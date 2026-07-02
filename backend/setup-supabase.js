/**
 * One-time setup script — creates all tables in Supabase.
 * Run: node setup-supabase.js
 */
require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SQL = `
-- Progress
CREATE TABLE IF NOT EXISTS progress (
  user_id    TEXT NOT NULL DEFAULT 'local',
  course_id  TEXT NOT NULL DEFAULT 'python',
  part_id    NUMERIC NOT NULL,
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id, part_id)
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id    TEXT NOT NULL DEFAULT 'local',
  course_id  TEXT NOT NULL DEFAULT 'python',
  part_id    NUMERIC NOT NULL,
  pinned_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id, part_id)
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL DEFAULT 'local',
  text       TEXT NOT NULL,
  done       BOOLEAN NOT NULL DEFAULT FALSE,
  due_date   DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streak
CREATE TABLE IF NOT EXISTS streak (
  user_id    TEXT NOT NULL DEFAULT 'local',
  date       DATE NOT NULL,
  logged_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

-- Typing scores
CREATE TABLE IF NOT EXISTS typing_scores (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL DEFAULT 'local',
  wpm        INTEGER NOT NULL,
  accuracy   NUMERIC(5,2) NOT NULL,
  duration   INTEGER DEFAULT 0,
  scored_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Aptitude scores
CREATE TABLE IF NOT EXISTS aptitude_scores (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL DEFAULT 'local',
  category   TEXT DEFAULT 'general',
  score      INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  time_taken INTEGER DEFAULT 0,
  scored_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Video timestamps
CREATE TABLE IF NOT EXISTS video_timestamps (
  user_id    TEXT NOT NULL DEFAULT 'local',
  course_id  TEXT NOT NULL,
  part_id    NUMERIC NOT NULL,
  timestamp  NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id, part_id)
);

-- Course file assets (Cloudinary URLs)
CREATE TABLE IF NOT EXISTS course_files (
  id             BIGSERIAL PRIMARY KEY,
  course_id      TEXT NOT NULL,
  part_id        NUMERIC NOT NULL,
  filename       TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  public_id      TEXT NOT NULL,
  resource_type  TEXT DEFAULT 'raw',
  uploaded_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (course_id, part_id, filename)
);

-- Enable RLS on all tables
ALTER TABLE progress         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak           ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptitude_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_timestamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_files     ENABLE ROW LEVEL SECURITY;

-- Public read policy for course_files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_files' AND policyname = 'Public read course_files'
  ) THEN
    CREATE POLICY "Public read course_files" ON course_files FOR SELECT USING (true);
  END IF;
END$$;
`;

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
    // Use the pg endpoint for raw SQL
    const body = JSON.stringify({ query: sql });

    const options = {
      hostname: url.hostname,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Use the Supabase management API instead — direct SQL via pg connection
// Actually we'll use the supabase-js with rpc or direct fetch to the SQL endpoint
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log('Setting up Supabase tables...\n');

  // Split into individual statements and run each
  const statements = SQL.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let ok = 0, fail = 0;
  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' }).single();
      if (error && !error.message.includes('already exists') && !error.message.includes('exec_sql')) {
        console.warn('  ⚠', stmt.slice(0, 60) + '...', '->', error.message);
        fail++;
      } else {
        ok++;
      }
    } catch (e) {
      fail++;
    }
  }

  console.log(`\nDone. ${ok} statements processed.`);
  console.log('\n⚠  If tables were not created, paste supabase-schema.sql into:');
  console.log('   Supabase Dashboard → SQL Editor → New Query → Run\n');
}

main();
