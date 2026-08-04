require('dotenv').config();
// Patch Express 4 so rejected async handlers reach the central error handler.
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
const createRequireAuth = require('../modules/auth/middleware/requireAuth');
const createRequireAdmin = require('../modules/auth/middleware/requireAdmin');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ── Supabase client (service_role — bypasses RLS) ───────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'local-development-key';
const HAS_SUPABASE_CONFIG = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
if (IS_PRODUCTION && (!SUPABASE_URL || !SUPABASE_KEY)) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const userAuthMiddleware = createRequireAuth({ supabase, hasSupabaseConfig: HAS_SUPABASE_CONFIG, isProduction: IS_PRODUCTION });

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://onepercentdev.pruthviraj-b-in.workers.dev,http://localhost:3005,http://localhost:3000')
  .split(',').map(value => value.trim().replace(/\/+$/, '')).filter(Boolean);
app.use(cors({ origin(origin, callback) {
  const normalizedOrigin = String(origin || '').replace(/\/+$/, '');
  if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
  return callback(new Error('CORS origin denied'));
}, credentials: true }));
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = String(requestId);
  res.setHeader('x-request-id', req.requestId);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'same-origin');
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));

// Bounded per-process limiter. Put a shared Redis/Supabase limiter in front of
// the service when horizontally scaling; this still protects a single instance.
const rateBuckets = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_MINUTE || 120);
app.use('/api', (req, res, next) => {
  const key = `${req.ip}:${req.path.split('/').slice(0, 3).join('/')}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT) {
    res.setHeader('retry-after', '60');
    return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests', requestId: req.requestId } });
  }
  next();
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const adminAuthMiddleware = createRequireAdmin(ADMIN_PASSWORD);

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/admin')) return next();
  if (req.path.startsWith('/modules') ||
      req.path.startsWith('/notes') ||
      req.path.startsWith('/files')) return next();
  userAuthMiddleware(req, res, next);
});

// ── Load Central Config ──────────────────────────────────────────────────────
// REPO_ROOT can be set by the Vercel build to point to the repo root so the
// backend service can find shared files without the static file tracer
// following '..' paths into the entire content/ tree.
const BACKEND_ROOT = path.join(__dirname, '..', '..');
const REPO_ROOT = process.env.REPO_ROOT || path.join(BACKEND_ROOT, '..');

// On Vercel the file is copied into the backend root via the build script.
// Locally it lives one level up in the repo root.
const CONFIG_PATH = fs.existsSync(path.join(BACKEND_ROOT, 'courses.config.json'))
  ? path.join(BACKEND_ROOT, 'courses.config.json')
  : path.join(REPO_ROOT, 'courses.config.json');
const COURSES_CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

const COURSES_DATA = {};
for (const [courseId, cfg] of Object.entries(COURSES_CONFIG)) {
  COURSES_DATA[courseId] = {
    ...cfg,
    contentRoot: path.join(REPO_ROOT, cfg.contentDir),
    dirPattern: (p) => cfg.dirPattern.replace('{part}', p),
  };
}

// ── Config helpers ───────────────────────────────────────────────────────────
function writeConfig(newConfig) {
  const tmpPath = CONFIG_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(newConfig, null, 2), 'utf-8');
  fs.renameSync(tmpPath, CONFIG_PATH);
  Object.assign(COURSES_CONFIG, newConfig);

  for (const [, cfg] of Object.entries(COURSES_CONFIG)) {
    for (const mod of cfg.modules || []) {
      for (const part of mod.parts || []) {
        const dir = path.join(REPO_ROOT, cfg.contentDir, cfg.dirPattern.replace('{part}', part));
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const notesPath = path.join(dir, 'notes.md');
        if (!fs.existsSync(notesPath)) {
          fs.writeFileSync(notesPath, `# Part ${part}\n\nThis chapter is currently under construction.\n`, 'utf-8');
        }
      }
    }
  }

  for (const [courseId, cfg] of Object.entries(COURSES_CONFIG)) {
    COURSES_DATA[courseId] = {
      ...cfg,
      contentRoot: path.join(REPO_ROOT, cfg.contentDir),
      dirPattern: (p) => cfg.dirPattern.replace('{part}', p),
    };
  }

  const scriptPath = path.join(REPO_ROOT, 'frontend', 'scripts', 'export-data.js');
  exec(`node "${scriptPath}"`, (err, stdout) => {
    if (err) console.error('Failed to run export-data.js:', err);
    else console.log('Static course data exported:', stdout);
  });
}

// ── File helpers ─────────────────────────────────────────────────────────────
function isTextFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ['.txt','.md','.js','.jsx','.ts','.tsx','.json','.html','.css','.py','.sh','.yaml','.yml','.csv','.xml'].includes(ext);
}

async function readPartData(courseId, partNum) {
  const course = COURSES_DATA[courseId];
  if (!course) return null;

  const dirName = course.dirPattern(partNum);
  const dir = path.join(course.contentRoot, dirName);
  if (!fs.existsSync(dir)) return null;

  const notesPath = path.join(dir, 'notes.md');
  const notes = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf-8') : '';
  const titleMatch = notes.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : `Part ${partNum}`;

  // Fetch Cloudinary files for this part
  const { data: cloudFiles } = await supabase
    .from('course_files')
    .select('filename, cloudinary_url, resource_type')
    .eq('course_id', courseId)
    .eq('part_id', partNum);

  // Also include local text files
  const files = [];
  function getFilesRecursively(currentDir, baseDir) {
    if (!fs.existsSync(currentDir)) return;
    for (const entry of fs.readdirSync(currentDir)) {
      const filePath = path.join(currentDir, entry);
      if (fs.statSync(filePath).isDirectory()) { getFilesRecursively(filePath, baseDir); continue; }
      if (entry === 'notes.md' && currentDir === baseDir) continue;
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
      const isBinary = !isTextFile(entry);
      files.push({
        path: relativePath,
        content: isBinary ? null : fs.readFileSync(filePath, 'utf-8'),
        isBinary,
        url: `/api/files/${courseId}/${partNum}/${relativePath}`,
      });
    }
  }
  getFilesRecursively(dir, dir);

  // Merge Cloudinary files
  if (cloudFiles) {
    for (const cf of cloudFiles) {
      if (!files.find(f => f.path === cf.filename)) {
        files.push({ path: cf.filename, content: null, isBinary: true, url: cf.cloudinary_url });
      }
    }
  }

  const module = course.modules.find(m => m.parts.includes(partNum));
  return { part: partNum, title, notes, files, importance: course.importance[partNum] || 'medium',
    module: module ? module.title : 'General', module_id: module ? module.id : 0 };
}

// ── Courses & Modules ────────────────────────────────────────────────────────


const VALID_TASK_TYPES = [
  'study','watch_video','read_article','practice_coding','complete_lesson',
  'assignment','revision','mock_test','interview_prep','build_project','research','custom'
];
const VALID_STATUSES  = ['not_started','in_progress','completed','skipped','archived'];
const VALID_PRIORITIES = ['low','medium','high','critical'];
const VALID_LINK_TYPES = ['internal','external'];
const VALID_INTERNAL_TARGETS = [
  'course','module','lesson','quiz','assignment','project','practice_lab','certificate','dashboard'
];
const VALID_URL_TYPES = [
  'youtube','github','pdf','google_docs','google_drive','notion',
  'kaggle','leetcode','hackerrank','medium','website'
];

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function validateTaskSchedule(body) {
  if (body.due_date !== undefined && body.due_date !== null && body.due_date !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) {
    return 'Due date must use YYYY-MM-DD';
  }
  if (body.due_time !== undefined && body.due_time !== null && body.due_time !== '' && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(body.due_time)) {
    return 'Due time must use HH:MM';
  }
  if (body.estimated_duration_minutes !== undefined && body.estimated_duration_minutes !== null && body.estimated_duration_minutes !== '') {
    const minutes = Number(body.estimated_duration_minutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) return 'Estimated duration must be 1-600 minutes';
  }
  if (body.recurrence_rule !== undefined) {
    const rule = body.recurrence_rule || 'none';
    if (!['none', 'daily', 'weekdays', 'weekly', 'monthly'].includes(rule) && !/^custom_[1-9]\d{0,2}$/.test(rule)) {
      return 'Invalid recurrence rule';
    }
  }
  return null;
}

function sanitizeText(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
}

function validateUrl(url) {
  if (!url) return true;
  try {
    const u = new URL(url);
    return ['http:','https:'].includes(u.protocol);
  } catch { return false; }
}

function detectUrlType(url) {
  if (!url) return 'website';
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./,'').toLowerCase();
    const p = u.pathname.toLowerCase();
    if (host === 'youtube.com' || host === 'youtu.be') return 'youtube';
    if (host === 'github.com') return 'github';
    if (p.endsWith('.pdf')) return 'pdf';
    if (host === 'docs.google.com') return 'google_docs';
    if (host === 'drive.google.com') return 'google_drive';
    if (host === 'notion.so' || host === 'notion.site') return 'notion';
    if (host === 'kaggle.com') return 'kaggle';
    if (host === 'leetcode.com') return 'leetcode';
    if (host === 'hackerrank.com') return 'hackerrank';
    if (host === 'medium.com' || host.endsWith('.medium.com')) return 'medium';
    return 'website';
  } catch { return 'website'; }
}

function buildDateFilter(query, timeFilter) {
  const today = localDateString();
  const tom   = localDateString(new Date(Date.now()+86400000));
  const now   = new Date();
  if (timeFilter === 'today') {
    return query.or(`due_date.eq.${today},and(due_date.lt.${today},status.neq.completed,status.neq.skipped)`);
  }
  if (timeFilter === 'tomorrow') return query.eq('due_date', tom);
  if (timeFilter === 'this_week') {
    const mon = new Date(now); mon.setDate(now.getDate()-((now.getDay()+6)%7));
    const sun = new Date(mon); sun.setDate(mon.getDate()+6);
    return query.gte('due_date', localDateString(mon)).lte('due_date', localDateString(sun));
  }
  if (timeFilter === 'next_week') {
    const mon = new Date(now); mon.setDate(now.getDate()-((now.getDay()+6)%7)+7);
    const sun = new Date(mon); sun.setDate(mon.getDate()+6);
    return query.gte('due_date', localDateString(mon)).lte('due_date', localDateString(sun));
  }
  if (timeFilter === 'this_month') {
    const first = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const last  = localDateString(new Date(now.getFullYear(), now.getMonth()+1, 0));
    return query.gte('due_date', first).lte('due_date', last);
  }
  return query;
}

const DEFAULT_NOTIFICATION_PREFS = {
  browser_enabled: true,
  email_enabled: false,
  email_address: '',
  reminder_offsets_minutes: [10, 0],
  daily_digest_enabled: false,
  daily_digest_time: '08:00',
};

function sanitizeEmail(email) {
  const value = sanitizeText(email || '').toLowerCase();
  if (!value) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : '';
}

function normalizeReminderOffsets(offsets) {
  const source = Array.isArray(offsets) ? offsets : DEFAULT_NOTIFICATION_PREFS.reminder_offsets_minutes;
  return [...new Set(source.map(n => parseInt(n, 10)).filter(n => Number.isFinite(n) && n >= 0 && n <= 10080))]
    .sort((a, b) => b - a)
    .slice(0, 8);
}

function normalizeNotificationPreferences(input = {}, req = {}) {
  return {
    browser_enabled: input.browser_enabled !== false,
    email_enabled: !!input.email_enabled,
    email_address: sanitizeEmail(input.email_address || req.userEmail || ''),
    reminder_offsets_minutes: normalizeReminderOffsets(input.reminder_offsets_minutes),
    daily_digest_enabled: !!input.daily_digest_enabled,
    daily_digest_time: /^([01]\d|2[0-3]):[0-5]\d$/.test(input.daily_digest_time || '')
      ? input.daily_digest_time
      : DEFAULT_NOTIFICATION_PREFS.daily_digest_time,
  };
}

async function sendReminderEmail({ to, task, minutesBefore }) {
  if (!process.env.RESEND_API_KEY || !process.env.REMINDER_EMAIL_FROM) {
    console.log('[reminders] Email skipped; set RESEND_API_KEY and REMINDER_EMAIL_FROM to send.', {
      to, taskId: task.id, minutesBefore,
    });
    return { sent: false, provider: 'disabled' };
  }

  const dueLabel = task.due_time ? `${task.due_date} at ${task.due_time}` : task.due_date;
  const timing = minutesBefore === 0 ? 'now' : `in ${minutesBefore} minute${minutesBefore === 1 ? '' : 's'}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px">Task reminder</h2>
      <p><strong>${task.title}</strong> is due ${timing}.</p>
      <p>Due: ${dueLabel}</p>
      ${task.description ? `<p>${task.description}</p>` : ''}
      ${task.internal_link_label ? `<p>Course: ${task.internal_link_label}</p>` : ''}
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.REMINDER_EMAIL_FROM,
      to,
      subject: minutesBefore === 0 ? `Due now: ${task.title}` : `Upcoming: ${task.title}`,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend failed: ${response.status} ${body}`);
  }
  return { sent: true, provider: 'resend' };
}

async function sendDigestEmail({ to, tasks, date }) {
  if (!process.env.RESEND_API_KEY || !process.env.REMINDER_EMAIL_FROM) {
    console.log('[reminders] Daily digest skipped; set RESEND_API_KEY and REMINDER_EMAIL_FROM to send.', {
      to, taskCount: tasks.length, date,
    });
    return { sent: false, provider: 'disabled' };
  }

  const items = tasks.length
    ? tasks.map(t => `<li><strong>${t.title}</strong>${t.due_time ? ` at ${String(t.due_time).slice(0, 5)}` : ''}</li>`).join('')
    : '<li>No scheduled tasks today. Nice clean slate.</li>';
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px">Today&apos;s study plan</h2>
      <p>Here is what is waiting for ${date}.</p>
      <ul>${items}</ul>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.REMINDER_EMAIL_FROM,
      to,
      subject: 'Today\'s study plan',
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend failed: ${response.status} ${body}`);
  }
  return { sent: true, provider: 'resend' };
}


const DEFAULT_BOOKMARK_CATEGORIES = [
  { name: 'Interview', color: '#e74c3c' },
  { name: 'Exam', color: '#9b59b6' },
  { name: 'Revision', color: '#3498db' },
  { name: 'Assignment', color: '#e67e22' },
  { name: 'Important', color: '#f1be3e' },
  { name: 'Formula', color: '#2ecc71' },
  { name: 'Common Mistake', color: '#e74c3c' },
  { name: 'Favorite', color: '#e91e63' },
];

// GET /api/timestamp-bookmarks — get bookmarks for a part
module.exports = {
  app, fs, path, crypto, multer, exec, cloudinary,
  PORT, IS_PRODUCTION, SUPABASE_URL, SUPABASE_KEY, HAS_SUPABASE_CONFIG, supabase,
  allowedOrigins, rateBuckets, RATE_WINDOW_MS, RATE_LIMIT, ADMIN_PASSWORD,
  BACKEND_ROOT, REPO_ROOT, CONFIG_PATH, COURSES_CONFIG, COURSES_DATA,
  userAuthMiddleware, adminAuthMiddleware, writeConfig, isTextFile, readPartData,
  VALID_TASK_TYPES, VALID_STATUSES, VALID_PRIORITIES, VALID_LINK_TYPES,
  VALID_INTERNAL_TARGETS, VALID_URL_TYPES, localDateString, validateTaskSchedule,
  sanitizeText, validateUrl, detectUrlType, buildDateFilter,
  DEFAULT_NOTIFICATION_PREFS, sanitizeEmail, normalizeReminderOffsets,
  normalizeNotificationPreferences, sendReminderEmail, sendDigestEmail,
  DEFAULT_BOOKMARK_CATEGORIES,
};
