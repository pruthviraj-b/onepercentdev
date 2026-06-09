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

// ── Content Root ────────────────────────────────────────────────────────────
const CONTENT_ROOT = path.join(__dirname, '..');

// ── Modules ─────────────────────────────────────────────────────────────────
const MODULES_DATA = [
  { id: 1, title: 'Foundations',          parts: [2, 3, 4, 5, 6] },
  { id: 2, title: 'Core Language',        parts: [7, 8, 9, 10, 11, 12] },
  { id: 3, title: 'Advanced Python',      parts: [13, 14, 15, 16, 17, 18] },
  { id: 4, title: 'Systems & I/O',        parts: [19, 20, 21, 22, 23, 24] },
  { id: 5, title: 'Concurrency',          parts: [25, 26, 27, 28] },
  { id: 6, title: 'Web & APIs',           parts: [29, 30, 31, 32] },
  { id: 7, title: 'Production & Tooling', parts: [33, 34, 35] },
];

const IMPORTANCE_MAP = {
  2: 'high',   3: 'medium', 4: 'medium', 5: 'high',   6: 'high',
  7: 'high',   8: 'high',   9: 'medium', 10: 'medium', 11: 'high',
  12: 'high',  13: 'high',  14: 'high',  15: 'medium', 16: 'medium',
  17: 'high',  18: 'high',  19: 'medium', 20: 'medium', 21: 'high',
  22: 'high',  23: 'medium', 24: 'medium', 25: 'high', 26: 'high',
  27: 'medium', 28: 'medium', 29: 'high', 30: 'high',  31: 'medium',
  32: 'high',  33: 'high',  34: 'medium', 35: 'high',
};

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

  db.run(`
    CREATE TABLE IF NOT EXISTS progress (
      part_id   INTEGER PRIMARY KEY,
      completed INTEGER DEFAULT 0,
      visited_at TEXT
    );
    CREATE TABLE IF NOT EXISTS bookmarks (
      part_id   INTEGER PRIMARY KEY,
      pinned_at TEXT
    );
  `);
  saveDB();
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function readPartData(partNum) {
  const dir = path.join(CONTENT_ROOT, `Part-${partNum}`);
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

  const module = MODULES_DATA.find(m => m.parts.includes(partNum));
  return {
    part: partNum,
    title,
    notes,
    files,
    importance: IMPORTANCE_MAP[partNum] || 'medium',
    module: module ? module.title : 'General',
    module_id: module ? module.id : 0,
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/modules', (req, res) => {
  const result = MODULES_DATA.map(mod => ({
    ...mod,
    notes: mod.parts.map(p => {
      const dir = path.join(CONTENT_ROOT, `Part-${p}`);
      if (!fs.existsSync(dir)) return null;
      const notesPath = path.join(dir, 'notes.md');
      const content = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf-8') : '';
      const titleMatch = content.match(/^#\s+(.+)/m);
      const entries = fs.readdirSync(dir);
      return {
        part: p,
        title: titleMatch ? titleMatch[1].trim() : `Part ${p}`,
        importance: IMPORTANCE_MAP[p] || 'medium',
        hasFiles: entries.some(f => f !== 'notes.md'),
        wordCount: content.split(/\s+/).length,
      };
    }).filter(Boolean),
  }));
  res.json(result);
});

app.get('/api/notes/:part', (req, res) => {
  const partNum = parseInt(req.params.part, 10);
  if (isNaN(partNum)) return res.status(400).json({ error: 'Invalid part' });
  const data = readPartData(partNum);
  if (!data) return res.status(404).json({ error: `Part ${partNum} not found` });
  res.json(data);
});

app.get('/api/progress', (req, res) => {
  const rows = db.exec('SELECT part_id FROM progress WHERE completed = 1');
  const ids = rows.length ? rows[0].values.map(r => r[0]) : [];
  res.json(ids);
});

app.post('/api/progress/:part', (req, res) => {
  const partId = parseInt(req.params.part, 10);
  const { completed } = req.body;
  db.run(
    `INSERT INTO progress (part_id, completed, visited_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(part_id) DO UPDATE SET completed = excluded.completed, visited_at = excluded.visited_at`,
    [partId, completed ? 1 : 0]
  );
  saveDB();
  res.json({ ok: true });
});

app.get('/api/bookmarks', (req, res) => {
  const rows = db.exec('SELECT part_id FROM bookmarks');
  const ids = rows.length ? rows[0].values.map(r => r[0]) : [];
  res.json(ids);
});

app.post('/api/bookmarks/:part', (req, res) => {
  const partId = parseInt(req.params.part, 10);
  const { pinned } = req.body;
  if (pinned) {
    db.run(`INSERT OR IGNORE INTO bookmarks (part_id, pinned_at) VALUES (?, datetime('now'))`, [partId]);
  } else {
    db.run('DELETE FROM bookmarks WHERE part_id = ?', [partId]);
  }
  saveDB();
  res.json({ ok: true });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  ● 1% Dev Academy — API Server`);
    console.log(`  ● http://localhost:${PORT}`);
    console.log(`  ● Content: ${CONTENT_ROOT}\n`);
  });
});
