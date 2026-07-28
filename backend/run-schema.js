/**
 * One-time Supabase schema setup.
 * 
 * OPTION A (auto): Set SUPABASE_DB_URL in backend/.env then run: node run-schema.js
 *   Format: postgresql://postgres.qeujdnrxkcdgkhjtxsly:[YOUR-DB-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
 *   Get it: Supabase Dashboard → Project Settings → Database → Connection String (URI tab)
 * 
 * OPTION B (manual): Copy supabase-schema.sql → Supabase Dashboard → SQL Editor → Run
 */
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = process.env.SUPABASE_DB_URL;

if (!DB_URL) {
  console.log('\n⚠  SUPABASE_DB_URL not set in backend/.env');
  console.log('\n📋 MANUAL SETUP (takes 30 seconds):');
  console.log('   1. Go to: https://supabase.com/dashboard/project/qeujdnrxkcdgkhjtxsly/sql/new');
  console.log('   2. Copy the contents of: backend/supabase-schema.sql');
  console.log('   3. Paste and click RUN');
  console.log('   4. All 8 tables will be created ✅\n');
  process.exit(0);
}

const sql = fs.readFileSync(path.join(__dirname, 'supabase-schema.sql'), 'utf-8');

(async () => {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to Supabase Postgres ✅');
    await client.query(sql);
    console.log('Schema created successfully ✅');
    console.log('\nAll 8 tables ready: progress, bookmarks, tasks, streak,');
    console.log('typing_scores, aptitude_scores, video_timestamps, course_files\n');
  } catch (e) {
    console.error('Failed:', e.message);
    console.log('\nFall back to manual: paste supabase-schema.sql in Supabase SQL Editor\n');
  } finally {
    await client.end();
  }
})();
