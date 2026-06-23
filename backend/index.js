const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'academy.db');

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Iam1984bc$';

// Admin authentication middleware
function adminAuthMiddleware(req, res, next) {
  const pwd = req.headers['x-admin-password'];
  if (pwd !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Helper to write config atomically
const { exec } = require('child_process');

function writeConfig(newConfig) {
  const tmpPath = CONFIG_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(newConfig, null, 2), 'utf-8');
  fs.renameSync(tmpPath, CONFIG_PATH);
  // Reload in-memory config
  Object.assign(COURSES_CONFIG, newConfig);

  // Pre-create any missing part folders and placeholder notes.md files
  for (const [courseId, cfg] of Object.entries(COURSES_CONFIG)) {
    const contentDir = cfg.contentDir;
    const dirPattern = cfg.dirPattern;
    for (const mod of cfg.modules || []) {
      for (const part of mod.parts || []) {
        const dirName = dirPattern.replace('{part}', part);
        const dir = path.join(__dirname, '..', contentDir, dirName);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const notesPath = path.join(dir, 'notes.md');
        if (!fs.existsSync(notesPath)) {
          fs.writeFileSync(notesPath, `# Part ${part}\n\nThis chapter is currently under construction and will be available in a future update.\n`, 'utf-8');
        }
      }
    }
  }

  // Rebuild COURSES_DATA
  for (const [courseId, cfg] of Object.entries(COURSES_CONFIG)) {
    const contentRoot = path.join(__dirname, '..', cfg.contentDir);
    COURSES_DATA[courseId] = {
      modules: cfg.modules,
      importance: cfg.importance,
      contentRoot,
      dirPattern: (p) => cfg.dirPattern.replace('{part}', p),
    };
  }
  // Run export script to update static JSON files for frontend immediately
  const scriptPath = path.join(__dirname, '..', 'frontend', 'scripts', 'export-data.js');
  exec(`node "${scriptPath}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('Failed to run export-data.js:', err);
    } else {
      console.log('Static course data exported successfully:\n', stdout);
    }
  });
}

// ── Load Central Config ────────────────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, '..', 'courses.config.json');
const COURSES_CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// Build COURSES_DATA from the central config
const COURSES_DATA = {};
for (const [courseId, cfg] of Object.entries(COURSES_CONFIG)) {
  const contentRoot = path.join(__dirname, '..', cfg.contentDir);
  COURSES_DATA[courseId] = {
    modules: cfg.modules,
    importance: cfg.importance,
    contentRoot,
    dirPattern: (p) => cfg.dirPattern.replace('{part}', p),
  };
}

// ── SQLite (sql.js) ──────────────────────────────────────────────────────────
let db;

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // 1. Initialize tables if they don't exist, or migrate if they do
  let hasProgress = false;
  let hasBookmarks = false;
  try {
    const checkProgress = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='progress'");
    hasProgress = checkProgress.length > 0 && checkProgress[0].values.length > 0;
  } catch (e) {}

  try {
    const checkBookmarks = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='bookmarks'");
    hasBookmarks = checkBookmarks.length > 0 && checkBookmarks[0].values.length > 0;
  } catch (e) {}

  if (!hasProgress) {
    console.log('Creating new progress table...');
    db.run(`
      CREATE TABLE progress (
        course_id TEXT DEFAULT 'python',
        part_id   INTEGER,
        completed INTEGER DEFAULT 0,
        visited_at TEXT
      );
    `);
  } else {
    // Check if migration is needed
    try {
      const progressInfo = db.exec("PRAGMA table_info(progress)");
      const progressCols = progressInfo.length ? progressInfo[0].values.map(v => v[1]) : [];
      if (!progressCols.includes('course_id')) {
        console.log('Migrating progress table...');
        db.run(`
          CREATE TABLE progress_new (
            course_id TEXT DEFAULT 'python',
            part_id   INTEGER,
            completed INTEGER DEFAULT 0,
            visited_at TEXT
          );
          INSERT INTO progress_new (course_id, part_id, completed, visited_at)
          SELECT 'python', part_id, completed, visited_at FROM progress;
          DROP TABLE progress;
          ALTER TABLE progress_new RENAME TO progress;
        `);
        console.log('Progress table migration successful.');
      }
    } catch (err) {
      console.error("Migration for progress table failed:", err);
    }
  }

  if (!hasBookmarks) {
    console.log('Creating new bookmarks table...');
    db.run(`
      CREATE TABLE bookmarks (
        course_id TEXT DEFAULT 'python',
        part_id   INTEGER,
        pinned_at TEXT
      );
    `);
  } else {
    // Check if migration is needed
    try {
      const bookmarksInfo = db.exec("PRAGMA table_info(bookmarks)");
      const bookmarksCols = bookmarksInfo.length ? bookmarksInfo[0].values.map(v => v[1]) : [];
      if (!bookmarksCols.includes('course_id')) {
        console.log('Migrating bookmarks table...');
        db.run(`
          CREATE TABLE bookmarks_new (
            course_id TEXT DEFAULT 'python',
            part_id   INTEGER,
            pinned_at TEXT
          );
          INSERT INTO bookmarks_new (course_id, part_id, pinned_at)
          SELECT 'python', part_id, pinned_at FROM bookmarks;
          DROP TABLE bookmarks;
          ALTER TABLE bookmarks_new RENAME TO bookmarks;
        `);
        console.log('Bookmarks table migration successful.');
      }
    } catch (err) {
      console.error("Migration for bookmarks table failed:", err);
    }
  }

  // 3. Create the unique indexes (now that we're guaranteed to have course_id in both)
  try {
    db.run("DELETE FROM progress WHERE rowid NOT IN (SELECT MIN(rowid) FROM progress GROUP BY course_id, part_id)");
    db.run("DELETE FROM bookmarks WHERE rowid NOT IN (SELECT MIN(rowid) FROM bookmarks GROUP BY course_id, part_id)");
  } catch (e) {
    console.error("Deduplication failed:", e);
  }
  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_course_part ON progress(course_id, part_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_course_part ON bookmarks(course_id, part_id);
  `);

  // 4. Tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      text      TEXT NOT NULL,
      done      INTEGER DEFAULT 0,
      due_date  TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 5. Streak table
  db.run(`
    CREATE TABLE IF NOT EXISTS streak (
      date      TEXT PRIMARY KEY,
      logged_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 6. Typing scores
  db.run(`
    CREATE TABLE IF NOT EXISTS typing_scores (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      wpm        INTEGER,
      accuracy   REAL,
      duration   INTEGER,
      scored_at  TEXT DEFAULT (datetime('now'))
    );
  `);

  // 7. Aptitude scores
  db.run(`
    CREATE TABLE IF NOT EXISTS aptitude_scores (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category    TEXT,
      score       INTEGER,
      total       INTEGER,
      time_taken  INTEGER,
      scored_at   TEXT DEFAULT (datetime('now'))
    );
  `);

  saveDB();
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function readPartData(courseId, partNum) {
  const course = COURSES_DATA[courseId];
  if (!course) return null;

  const dirName = course.dirPattern(partNum);
  const dir = path.join(course.contentRoot, dirName);
  if (!fs.existsSync(dir)) return null;

  const notesPath = path.join(dir, 'notes.md');
  const notes = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf-8') : '';
  const titleMatch = notes.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : `Part ${partNum}`;

  const files = [];
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'notes.md') continue;
    const filePath = path.join(dir, entry);
    if (fs.statSync(filePath).isFile()) {
      files.push({ path: entry, content: fs.readFileSync(filePath, 'utf-8') });
    }
  }

  const module = course.modules.find(m => m.parts.includes(partNum));
  return {
    part: partNum,
    title,
    notes,
    files,
    importance: course.importance[partNum] || 'medium',
    module: module ? module.title : 'General',
    module_id: module ? module.id : 0,
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/modules', (req, res) => {
  const courseId = req.query.course || 'python';
  const course = COURSES_DATA[courseId];
  if (!course) return res.status(400).json({ error: 'Invalid course' });

  const result = course.modules.map(mod => ({
    id: mod.id,
    title: mod.title,
    parts: mod.parts,
    notes: mod.parts.map(p => {
      const dirName = course.dirPattern(p);
      const dir = path.join(course.contentRoot, dirName);
      if (!fs.existsSync(dir)) return null;
      const notesPath = path.join(dir, 'notes.md');
      const content = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf-8') : '';
      const titleMatch = content.match(/^#\s+(.+)/m);
      const entries = fs.readdirSync(dir);
      return {
        part: p,
        title: titleMatch ? titleMatch[1].trim() : `Part ${p}`,
        importance: course.importance[p] || 'medium',
        hasFiles: entries.some(f => f !== 'notes.md'),
        wordCount: content.split(/\s+/).length,
      };
    }).filter(Boolean),
  }));
  res.json(result);
});

app.get('/api/notes/:course/:part', (req, res) => {
  const courseId = req.params.course;
  const partNum = parseFloat(req.params.part);
  if (isNaN(partNum)) return res.status(400).json({ error: 'Invalid part' });
  const data = readPartData(courseId, partNum);
  if (!data) return res.status(404).json({ error: `Part ${partNum} not found in ${courseId}` });
  res.json(data);
});

// Backwards compatibility endpoint for old requests
app.get('/api/notes/:part', (req, res) => {
  const partNum = parseFloat(req.params.part);
  if (isNaN(partNum)) return res.status(400).json({ error: 'Invalid part' });
  const data = readPartData('python', partNum);
  if (!data) return res.status(404).json({ error: `Part ${partNum} not found` });
  res.json(data);
});

app.get('/api/progress', (req, res) => {
  const courseId = req.query.course || 'python';
  const stmt = db.prepare('SELECT part_id FROM progress WHERE course_id = ? AND completed = 1');
  stmt.bind([courseId]);
  const ids = [];
  while (stmt.step()) {
    ids.push(stmt.get()[0]);
  }
  stmt.free();
  res.json(ids);
});

app.post('/api/progress/:part', (req, res) => {
  const partId = parseFloat(req.params.part);
  const { completed, courseId = 'python' } = req.body;
  db.run(
    `INSERT INTO progress (course_id, part_id, completed, visited_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(course_id, part_id) DO UPDATE SET completed = excluded.completed, visited_at = excluded.visited_at`,
    [courseId, partId, completed ? 1 : 0]
  );
  saveDB();
  res.json({ ok: true });
});

app.get('/api/bookmarks', (req, res) => {
  const courseId = req.query.course || 'python';
  const stmt = db.prepare('SELECT part_id FROM bookmarks WHERE course_id = ?');
  stmt.bind([courseId]);
  const ids = [];
  while (stmt.step()) {
    ids.push(stmt.get()[0]);
  }
  stmt.free();
  res.json(ids);
});

app.post('/api/bookmarks/:part', (req, res) => {
  const partId = parseFloat(req.params.part);
  const { pinned, courseId = 'python' } = req.body;
  if (pinned) {
    db.run(
      `INSERT OR IGNORE INTO bookmarks (course_id, part_id, pinned_at) VALUES (?, ?, datetime('now'))`,
      [courseId, partId]
    );
  } else {
    db.run(
      'DELETE FROM bookmarks WHERE course_id = ? AND part_id = ?',
      [courseId, partId]
    );
  }
  saveDB();
  res.json({ ok: true });
});

// ── Tasks ────────────────────────────────────────────────────────────────────

app.get('/api/tasks', (req, res) => {
  try {
    const result = db.exec('SELECT id, text, done, due_date, created_at FROM tasks ORDER BY created_at ASC');
    if (!result.length) return res.json([]);
    const [{ columns, values }] = result;
    const tasks = values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      obj.done = obj.done === 1;
      return obj;
    });
    res.json(tasks);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', (req, res) => {
  const { text, due_date } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Task text required' });
  try {
    db.run('INSERT INTO tasks (text, done, due_date) VALUES (?, 0, ?)', [text.trim(), due_date || null]);
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    saveDB();
    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { text, done, due_date } = req.body;
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid task id' });
  try {
    db.run(
      'UPDATE tasks SET text = COALESCE(?, text), done = COALESCE(?, done), due_date = COALESCE(?, due_date) WHERE id = ?',
      [text !== undefined ? text.trim() : null, done !== undefined ? (done ? 1 : 0) : null, due_date !== undefined ? due_date : null, id]
    );
    saveDB();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid task id' });
  try {
    db.run('DELETE FROM tasks WHERE id = ?', [id]);
    saveDB();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ── Streak ────────────────────────────────────────────────────────────────────

// Record today's activity (call on login or task completion)
app.post('/api/streak/ping', (req, res) => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  try {
    db.run('INSERT OR IGNORE INTO streak (date) VALUES (?)', [today]);
    saveDB();
    res.json({ ok: true, date: today });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to record streak' });
  }
});

// Get streak info: current streak, longest streak, total active days, all dates
app.get('/api/streak', (req, res) => {
  try {
    const result = db.exec('SELECT date FROM streak ORDER BY date ASC');
    if (!result.length) return res.json({ current: 0, longest: 0, total: 0, dates: [] });
    const dates = result[0].values.map(r => r[0]);
    const today = new Date().toISOString().slice(0, 10);

    // Calculate current streak (consecutive days ending today or yesterday)
    let current = 0;
    let check = new Date(today);
    for (let i = 0; i < 365; i++) {
      const d = check.toISOString().slice(0, 10);
      if (dates.includes(d)) {
        current++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longest = 0;
    let run = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        run++;
        longest = Math.max(longest, run);
      } else {
        run = 1;
      }
    }
    if (dates.length === 1) longest = 1;
    longest = Math.max(longest, current);

    res.json({ current, longest, total: dates.length, dates });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch streak' });
  }
});

// ── Typing Scores ─────────────────────────────────────────────────────────────

app.post('/api/typing/score', (req, res) => {
  const { wpm, accuracy, duration } = req.body;
  if (wpm === undefined || accuracy === undefined) return res.status(400).json({ error: 'wpm and accuracy required' });
  try {
    db.run('INSERT INTO typing_scores (wpm, accuracy, duration) VALUES (?, ?, ?)', [wpm, accuracy, duration || 0]);
    saveDB();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save typing score' });
  }
});

app.get('/api/typing/scores', (req, res) => {
  try {
    const result = db.exec('SELECT wpm, accuracy, duration, scored_at FROM typing_scores ORDER BY scored_at DESC LIMIT 20');
    if (!result.length) return res.json([]);
    const [{ columns, values }] = result;
    res.json(values.map(row => { const o = {}; columns.forEach((c, i) => o[c] = row[i]); return o; }));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch typing scores' });
  }
});

// ── Aptitude Scores ───────────────────────────────────────────────────────────

app.post('/api/aptitude/score', (req, res) => {
  const { category, score, total, time_taken } = req.body;
  if (score === undefined || total === undefined) return res.status(400).json({ error: 'score and total required' });
  try {
    db.run('INSERT INTO aptitude_scores (category, score, total, time_taken) VALUES (?, ?, ?, ?)',
      [category || 'general', score, total, time_taken || 0]);
    saveDB();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save aptitude score' });
  }
});

app.get('/api/aptitude/scores', (req, res) => {
  try {
    const result = db.exec('SELECT category, score, total, time_taken, scored_at FROM aptitude_scores ORDER BY scored_at DESC LIMIT 20');
    if (!result.length) return res.json([]);
    const [{ columns, values }] = result;
    res.json(values.map(row => { const o = {}; columns.forEach((c, i) => o[c] = row[i]); return o; }));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch aptitude scores' });
  }
});

// ── Admin Routes ─────────────────────────────────────────────────────────────
app.use('/api/admin', adminAuthMiddleware);

// Get full config
app.get('/api/admin/config', (req, res) => {
  res.json(COURSES_CONFIG);
});

// Update full config (replace) – body should be the entire config object
app.put('/api/admin/config', (req, res) => {
  const newConfig = req.body;
  if (!newConfig || typeof newConfig !== 'object') {
    return res.status(400).json({ error: 'Invalid config payload' });
  }
  for (const [courseId, cfg] of Object.entries(newConfig)) {
    if (!cfg.title || !cfg.description || !Array.isArray(cfg.modules)) {
      return res.status(400).json({ error: `Invalid configuration for course: ${courseId}` });
    }
  }
  try {
    writeConfig(newConfig);
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to write config:', e);
    res.status(500).json({ error: 'Failed to write config' });
  }
});

// Write notes Markdown file for a part
app.post('/api/admin/notes/:course/:part', (req, res) => {
  const { course, part } = req.params;
  const { notes } = req.body;
  if (notes === undefined) return res.status(400).json({ error: 'Notes content required' });

  if (!/^\d+(\.\d+)?$/.test(part)) {
    return res.status(400).json({ error: 'Invalid part parameter' });
  }

  const cfg = COURSES_CONFIG[course];
  if (!cfg) return res.status(404).json({ error: 'Course not found' });

  const dirName = cfg.dirPattern.replace('{part}', part);
  const dir = path.join(__dirname, '..', cfg.contentDir, dirName);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    fs.writeFileSync(path.join(dir, 'notes.md'), notes, 'utf-8');
    // Run export script to update static assets
    const scriptPath = path.join(__dirname, '..', 'frontend', 'scripts', 'export-data.js');
    exec(`node "${scriptPath}"`, (err, stdout) => {
      if (err) console.error('Failed to auto-export after notes write:', err);
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to write notes file' });
  }
});

// Upload and write file asset for a part (base64 payload)
app.post('/api/admin/upload/:course/:part', (req, res) => {
  const { course, part } = req.params;
  const { filename, content } = req.body;
  if (!filename || !content) return res.status(400).json({ error: 'Filename and base64 content required' });

  if (!/^\d+(\.\d+)?$/.test(part)) {
    return res.status(400).json({ error: 'Invalid part parameter' });
  }

  const cfg = COURSES_CONFIG[course];
  if (!cfg) return res.status(404).json({ error: 'Course not found' });

  const safeFilename = path.basename(filename);
  const dirName = cfg.dirPattern.replace('{part}', part);
  const dir = path.join(__dirname, '..', cfg.contentDir, dirName);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    const buffer = Buffer.from(content, 'base64');
    fs.writeFileSync(path.join(dir, safeFilename), buffer);
    // Run export script to update static assets
    const scriptPath = path.join(__dirname, '..', 'frontend', 'scripts', 'export-data.js');
    exec(`node "${scriptPath}"`, (err, stdout) => {
      if (err) console.error('Failed to auto-export after upload:', err);
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to write uploaded file' });
  }
});

// Delete file asset from a part
app.delete('/api/admin/files/:course/:part/:filename', (req, res) => {
  const { course, part, filename } = req.params;

  if (!/^\d+(\.\d+)?$/.test(part)) {
    return res.status(400).json({ error: 'Invalid part parameter' });
  }

  const cfg = COURSES_CONFIG[course];
  if (!cfg) return res.status(404).json({ error: 'Course not found' });

  const safeFilename = path.basename(filename);
  const dirName = cfg.dirPattern.replace('{part}', part);
  const filePath = path.join(__dirname, '..', cfg.contentDir, dirName, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    fs.unlinkSync(filePath);
    // Run export script to update static assets
    const scriptPath = path.join(__dirname, '..', 'frontend', 'scripts', 'export-data.js');
    exec(`node "${scriptPath}"`, (err, stdout) => {
      if (err) console.error('Failed to auto-export after delete:', err);
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete file asset' });
  }
});

// ── Boot ─────────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  ● 1% Dev Academy — API Server`);
    console.log(`  ● http://localhost:${PORT}`);
    console.log(`  ● Courses loaded: ${Object.keys(COURSES_DATA).join(', ')}\n`);
  });
});
