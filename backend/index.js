require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const _pdfParseModule = require('pdf-parse');
const pdfParse = _pdfParseModule.default || _pdfParseModule;
const mammoth = require('mammoth');
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = 3001;

// ── Supabase client (service_role — bypasses RLS) ───────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Iam1984bc$';

function userAuthMiddleware(req, res, next) {
  req.userId = req.headers['x-user-id'] || 'local';
  req.userEmail = req.headers['x-user-email'] || '';
  next();
}

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/admin')) return next();
  if (req.path.startsWith('/modules') ||
      req.path.startsWith('/notes') ||
      req.path.startsWith('/files')) return next();
  userAuthMiddleware(req, res, next);
});

function adminAuthMiddleware(req, res, next) {
  const pwd = req.headers['x-admin-password'];
  if (pwd !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── Load Central Config ──────────────────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, '..', 'courses.config.json');
const COURSES_CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

const COURSES_DATA = {};
for (const [courseId, cfg] of Object.entries(COURSES_CONFIG)) {
  COURSES_DATA[courseId] = {
    ...cfg,
    contentRoot: path.join(__dirname, '..', cfg.contentDir),
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
        const dir = path.join(__dirname, '..', cfg.contentDir, cfg.dirPattern.replace('{part}', part));
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
      contentRoot: path.join(__dirname, '..', cfg.contentDir),
      dirPattern: (p) => cfg.dirPattern.replace('{part}', p),
    };
  }

  const scriptPath = path.join(__dirname, '..', 'frontend', 'scripts', 'export-data.js');
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

app.get('/api/courses', (req, res) => {
  const courses = Object.keys(COURSES_DATA).map(id => {
    const c = COURSES_DATA[id];
    return {
      id, title: c.title, description: c.description, tagline: c.tagline,
      mascot: c.mascot, eyebrow: c.eyebrow, target: c.target, goal: c.goal,
      author: c.author, authorTitle: c.authorTitle, discordUrl: c.discordUrl,
      channelUrl: c.channelUrl, playlistUrl: c.playlistUrl,
      welcomeParagraphs: c.welcomeParagraphs,
      totalParts: c.modules ? c.modules.reduce((s, m) => s + m.parts.length, 0) : 0,
    };
  });
  res.json(courses);
});

app.get('/api/modules', (req, res) => {
  const courseId = req.query.course || 'python';
  const course = COURSES_DATA[courseId];
  if (!course) return res.status(400).json({ error: 'Invalid course' });

  const result = course.modules.map(mod => ({
    id: mod.id, title: mod.title, parts: mod.parts,
    notes: mod.parts.map(p => {
      const dir = path.join(course.contentRoot, course.dirPattern(p));
      if (!fs.existsSync(dir)) return null;
      const notesPath = path.join(dir, 'notes.md');
      const content = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf-8') : '';
      const titleMatch = content.match(/^#\s+(.+)/m);
      return {
        part: p, title: titleMatch ? titleMatch[1].trim() : `Part ${p}`,
        importance: course.importance[p] || 'medium',
        hasFiles: fs.readdirSync(dir).some(f => f !== 'notes.md'),
        wordCount: content.split(/\s+/).length,
      };
    }).filter(Boolean),
  }));
  res.json(result);
});

app.get('/api/notes/:course/:part', async (req, res) => {
  const partNum = parseFloat(req.params.part);
  if (isNaN(partNum)) return res.status(400).json({ error: 'Invalid part' });
  const data = await readPartData(req.params.course, partNum);
  if (!data) return res.status(404).json({ error: `Part ${partNum} not found` });
  res.json(data);
});

app.get('/api/notes/:part', async (req, res) => {
  const partNum = parseFloat(req.params.part);
  if (isNaN(partNum)) return res.status(400).json({ error: 'Invalid part' });
  const data = await readPartData('python', partNum);
  if (!data) return res.status(404).json({ error: `Part ${partNum} not found` });
  res.json(data);
});

app.get('/api/files/:course/:part/*', (req, res) => {
  const { course, part } = req.params;
  const cfg = COURSES_CONFIG[course];
  if (!cfg) return res.status(404).send('Course not found');
  const absolutePath = path.join(__dirname, '..', cfg.contentDir, cfg.dirPattern.replace('{part}', part), req.params[0]);
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
    res.sendFile(absolutePath);
  } else {
    res.status(404).send('File not found');
  }
});

// ── Progress ─────────────────────────────────────────────────────────────────

app.get('/api/progress', async (req, res) => {
  const courseId = req.query.course || 'python';
  const { data, error } = await supabase
    .from('progress')
    .select('part_id')
    .eq('user_id', req.userId)
    .eq('course_id', courseId)
    .eq('completed', true);
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(r => r.part_id));
});

app.post('/api/progress/:part', async (req, res) => {
  const partId = parseFloat(req.params.part);
  const { completed, courseId = 'python' } = req.body;
  const { error } = await supabase.from('progress').upsert(
    { user_id: req.userId, course_id: courseId, part_id: partId, completed: !!completed, visited_at: new Date().toISOString() },
    { onConflict: 'user_id,course_id,part_id' }
  );
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Bookmarks ────────────────────────────────────────────────────────────────

app.get('/api/bookmarks', async (req, res) => {
  const courseId = req.query.course || 'python';
  const { data, error } = await supabase
    .from('bookmarks')
    .select('part_id')
    .eq('user_id', req.userId)
    .eq('course_id', courseId);
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(r => r.part_id));
});

app.post('/api/bookmarks/:part', async (req, res) => {
  const partId = parseFloat(req.params.part);
  const { pinned, courseId = 'python' } = req.body;
  if (pinned) {
    const { error } = await supabase.from('bookmarks').upsert(
      { user_id: req.userId, course_id: courseId, part_id: partId, pinned_at: new Date().toISOString() },
      { onConflict: 'user_id,course_id,part_id' }
    );
    if (error) return res.status(500).json({ error: error.message });
  } else {
    const { error } = await supabase.from('bookmarks')
      .delete()
      .eq('user_id', req.userId)
      .eq('course_id', courseId)
      .eq('part_id', partId);
    if (error) return res.status(500).json({ error: error.message });
  }
  res.json({ ok: true });
});

// ── Video Timestamps ──────────────────────────────────────────────────────────

app.get('/api/video-timestamp', async (req, res) => {
  const courseId = req.query.course;
  const partId = parseInt(req.query.part);
  if (!courseId || isNaN(partId)) return res.json({ timestamp: 0 });
  const { data } = await supabase
    .from('video_timestamps')
    .select('timestamp')
    .eq('user_id', req.userId)
    .eq('course_id', courseId)
    .eq('part_id', partId)
    .single();
  res.json({ timestamp: data ? data.timestamp : 0 });
});

app.post('/api/video-timestamp', async (req, res) => {
  const { courseId, part, timestamp } = req.body;
  if (!courseId || part == null || timestamp == null) return res.status(400).json({ error: 'Missing fields' });
  const { error } = await supabase.from('video_timestamps').upsert(
    { user_id: req.userId, course_id: courseId, part_id: part, timestamp, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,course_id,part_id' }
  );
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Streak ────────────────────────────────────────────────────────────────────

app.get('/api/streak', async (req, res) => {
  const { data, error } = await supabase
    .from('streak')
    .select('date')
    .eq('user_id', req.userId)
    .order('date', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });

  const dates = (data || []).map(r => r.date);
  const today = new Date().toISOString().slice(0, 10);

  // Current streak
  let current = 0;
  let check = new Date(today);
  for (let i = 0; i < 365; i++) {
    const d = check.toISOString().slice(0, 10);
    if (dates.includes(d)) { current++; check.setDate(check.getDate() - 1); }
    else break;
  }

  // Longest streak
  let longest = 0, run = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
    if (diff === 1) { run++; longest = Math.max(longest, run); } else run = 1;
  }
  if (dates.length === 1) longest = 1;
  longest = Math.max(longest, current);

  res.json({ current, longest, total: dates.length, dates,
    // backward-compat keys used by api.ts
    currentStreak: current, totalActiveDays: dates.length });
});

app.post('/api/streak', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('streak')
    .upsert({ user_id: req.userId, date: today }, { onConflict: 'user_id,date', ignoreDuplicates: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, date: today });
});

app.post('/api/streak/ping', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('streak')
    .upsert({ user_id: req.userId, date: today }, { onConflict: 'user_id,date', ignoreDuplicates: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, date: today });
});

// ── Recent Activity ───────────────────────────────────────────────────────────

app.get('/api/recent-activity', async (req, res) => {
  const [{ data: vt }, { data: pr }] = await Promise.all([
    supabase.from('video_timestamps').select('course_id,part_id,updated_at')
      .eq('user_id', req.userId).order('updated_at', { ascending: false }).limit(1),
    supabase.from('progress').select('course_id,part_id,visited_at')
      .eq('user_id', req.userId).order('visited_at', { ascending: false }).limit(1),
  ]);
  const video = vt?.[0] ? { courseId: vt[0].course_id, partId: vt[0].part_id, date: vt[0].updated_at } : null;
  const prog  = pr?.[0] ? { courseId: pr[0].course_id, partId: pr[0].part_id, date: pr[0].visited_at } : null;
  let winner = null;
  if (video && prog) winner = new Date(video.date) > new Date(prog.date) ? video : prog;
  else winner = video || prog;
  res.json(winner);
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks').select('id,text,done,due_date,created_at')
    .eq('user_id', req.userId).order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/tasks', async (req, res) => {
  const { text, due_date } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Task text required' });
  const { data, error } = await supabase.from('tasks')
    .insert({ user_id: req.userId, text: text.trim(), done: false, due_date: due_date || null })
    .select('id').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, id: data.id });
});

app.put('/api/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid task id' });
  const patch = {};
  if (req.body.text !== undefined) patch.text = req.body.text.trim();
  if (req.body.done !== undefined) patch.done = !!req.body.done;
  if (req.body.due_date !== undefined) patch.due_date = req.body.due_date;
  const { error } = await supabase.from('tasks').update(patch)
    .eq('id', id).eq('user_id', req.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.delete('/api/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid task id' });
  const { error } = await supabase.from('tasks').delete()
    .eq('id', id).eq('user_id', req.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Typing & Aptitude Scores ──────────────────────────────────────────────────

app.post('/api/typing/score', async (req, res) => {
  const { wpm, accuracy, duration } = req.body;
  if (wpm === undefined || accuracy === undefined) return res.status(400).json({ error: 'wpm and accuracy required' });
  const { error } = await supabase.from('typing_scores')
    .insert({ user_id: req.userId, wpm, accuracy, duration: duration || 0 });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.get('/api/typing/scores', async (req, res) => {
  const { data, error } = await supabase.from('typing_scores')
    .select('wpm,accuracy,duration,scored_at')
    .eq('user_id', req.userId).order('scored_at', { ascending: false }).limit(20);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/aptitude/score', async (req, res) => {
  const { category, score, total, time_taken } = req.body;
  if (score === undefined || total === undefined) return res.status(400).json({ error: 'score and total required' });
  const { error } = await supabase.from('aptitude_scores')
    .insert({ user_id: req.userId, category: category || 'general', score, total, time_taken: time_taken || 0 });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.get('/api/aptitude/scores', async (req, res) => {
  const { data, error } = await supabase.from('aptitude_scores')
    .select('category,score,total,time_taken,scored_at')
    .eq('user_id', req.userId).order('scored_at', { ascending: false }).limit(20);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ── Admin Routes ──────────────────────────────────────────────────────────────
app.use('/api/admin', adminAuthMiddleware);

app.get('/api/admin/config', (req, res) => res.json(COURSES_CONFIG));

app.put('/api/admin/config', (req, res) => {
  const newConfig = req.body;
  if (!newConfig || typeof newConfig !== 'object') return res.status(400).json({ error: 'Invalid config' });
  for (const [courseId, cfg] of Object.entries(newConfig)) {
    if (!cfg.title || !cfg.description || !Array.isArray(cfg.modules))
      return res.status(400).json({ error: `Invalid config for course: ${courseId}` });
  }
  try { writeConfig(newConfig); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: 'Failed to write config' }); }
});

app.post('/api/admin/notes/:course/:part', (req, res) => {
  const { course, part } = req.params;
  const { notes } = req.body;
  if (notes === undefined) return res.status(400).json({ error: 'Notes content required' });
  if (!/^\d+(\.\d+)?$/.test(part)) return res.status(400).json({ error: 'Invalid part' });
  const cfg = COURSES_CONFIG[course];
  if (!cfg) return res.status(404).json({ error: 'Course not found' });
  const dir = path.join(__dirname, '..', cfg.contentDir, cfg.dirPattern.replace('{part}', part));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  try {
    fs.writeFileSync(path.join(dir, 'notes.md'), notes, 'utf-8');
    const scriptPath = path.join(__dirname, '..', 'frontend', 'scripts', 'export-data.js');
    exec(`node "${scriptPath}"`, (err) => { if (err) console.error('export failed:', err); });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Failed to write notes' }); }
});

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/admin/import-notes/:course/:part', upload.single('file'), async (req, res) => {
  const { course, part } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  if (!/^\d+(\.\d+)?$/.test(part)) return res.status(400).json({ error: 'Invalid part' });
  const cfg = COURSES_CONFIG[course];
  if (!cfg) return res.status(404).json({ error: 'Course not found' });
  const dir = path.join(__dirname, '..', cfg.contentDir, cfg.dirPattern.replace('{part}', part));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  let text = '';
  try {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf') text = (await pdfParse(file.buffer)).text;
    else if (ext === '.docx') text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
    else if (ext === '.txt' || ext === '.md') text = file.buffer.toString('utf-8');
    else return res.status(400).json({ error: 'Unsupported file type' });
    let finalNotes = text.trim();
    if (!finalNotes.startsWith('# ')) finalNotes = `# Part ${part}\n\n` + finalNotes;
    fs.writeFileSync(path.join(dir, 'notes.md'), finalNotes, 'utf-8');
    const scriptPath = path.join(__dirname, '..', 'frontend', 'scripts', 'export-data.js');
    exec(`node "${scriptPath}"`, (err) => { if (err) console.error('export failed:', err); });
    res.json({ ok: true, text: finalNotes });
  } catch (e) { res.status(500).json({ error: 'Failed to extract text' }); }
});

// ── Cloudinary file upload (replaces local base64 upload) ────────────────────

app.post('/api/admin/upload/:course/:part', upload.single('file'), async (req, res) => {
  const { course, part } = req.params;
  if (!/^\d+(\.\d+)?$/.test(part)) return res.status(400).json({ error: 'Invalid part' });
  const cfg = COURSES_CONFIG[course];
  if (!cfg) return res.status(404).json({ error: 'Course not found' });

  let fileBuffer, filename, mimeType;

  if (req.file) {
    // multipart upload
    fileBuffer = req.file.buffer;
    filename = req.file.originalname;
    mimeType = req.file.mimetype;
  } else if (req.body.content && req.body.filename) {
    // legacy base64 upload
    fileBuffer = Buffer.from(req.body.content, 'base64');
    filename = req.body.filename;
    mimeType = '';
  } else {
    return res.status(400).json({ error: 'No file provided' });
  }

  const safeFilename = path.basename(filename);
  const ext = path.extname(safeFilename).toLowerCase();
  const isPdf = ext === '.pdf';
  const resourceType = isPdf || !isTextFile(safeFilename) ? 'raw' : 'raw';

  try {
    // Upload to Cloudinary via buffer stream
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `academy/${course}/part-${part}`,
          public_id: safeFilename.replace(/\.[^/.]+$/, ''),
          resource_type: 'raw',
          use_filename: true,
          unique_filename: false,
          overwrite: true,
        },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(fileBuffer);
    });

    // Store reference in Supabase
    await supabase.from('course_files').upsert(
      {
        course_id: course,
        part_id: parseFloat(part),
        filename: safeFilename,
        cloudinary_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        resource_type: 'raw',
      },
      { onConflict: 'course_id,part_id,filename' }
    );

    // Run export to refresh static JSON
    const scriptPath = path.join(__dirname, '..', 'frontend', 'scripts', 'export-data.js');
    exec(`node "${scriptPath}"`, (err) => { if (err) console.error('export failed:', err); });

    res.json({ ok: true, url: uploadResult.secure_url });
  } catch (e) {
    console.error('Cloudinary upload failed:', e);
    res.status(500).json({ error: 'Upload failed: ' + e.message });
  }
});

// Delete file from Cloudinary + Supabase
app.delete('/api/admin/files/:course/:part/:filename', async (req, res) => {
  const { course, part, filename } = req.params;
  if (!/^\d+(\.\d+)?$/.test(part)) return res.status(400).json({ error: 'Invalid part' });
  const safeFilename = path.basename(filename);

  // Fetch public_id from Supabase
  const { data } = await supabase.from('course_files')
    .select('public_id').eq('course_id', course)
    .eq('part_id', parseFloat(part)).eq('filename', safeFilename).single();

  if (data?.public_id) {
    try { await cloudinary.uploader.destroy(data.public_id, { resource_type: 'raw' }); } catch {}
  }

  await supabase.from('course_files')
    .delete().eq('course_id', course).eq('part_id', parseFloat(part)).eq('filename', safeFilename);

  // Also delete local file if it exists
  const cfg = COURSES_CONFIG[course];
  if (cfg) {
    const localPath = path.join(__dirname, '..', cfg.contentDir, cfg.dirPattern.replace('{part}', part), safeFilename);
    if (fs.existsSync(localPath)) { try { fs.unlinkSync(localPath); } catch {} }
  }

  const scriptPath = path.join(__dirname, '..', 'frontend', 'scripts', 'export-data.js');
  exec(`node "${scriptPath}"`, (err) => { if (err) console.error('export failed:', err); });
  res.json({ ok: true });
});

// List Cloudinary files for a part
app.get('/api/admin/files/:course/:part', async (req, res) => {
  const { data, error } = await supabase.from('course_files')
    .select('filename,cloudinary_url,uploaded_at')
    .eq('course_id', req.params.course)
    .eq('part_id', parseFloat(req.params.part));
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ═══════════════════════════════════════════════════════════════════════════
// ── Universal Smart Learning Task System ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

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
  const today = new Date().toISOString().slice(0,10);
  const tom   = new Date(Date.now()+86400000).toISOString().slice(0,10);
  const now   = new Date();
  if (timeFilter === 'today') {
    return query.or(`due_date.eq.${today},and(due_date.lt.${today},status.neq.completed,status.neq.skipped)`);
  }
  if (timeFilter === 'tomorrow') return query.eq('due_date', tom);
  if (timeFilter === 'this_week') {
    const mon = new Date(now); mon.setDate(now.getDate()-((now.getDay()+6)%7));
    const sun = new Date(mon); sun.setDate(mon.getDate()+6);
    return query.gte('due_date', mon.toISOString().slice(0,10)).lte('due_date', sun.toISOString().slice(0,10));
  }
  if (timeFilter === 'next_week') {
    const mon = new Date(now); mon.setDate(now.getDate()-((now.getDay()+6)%7)+7);
    const sun = new Date(mon); sun.setDate(mon.getDate()+6);
    return query.gte('due_date', mon.toISOString().slice(0,10)).lte('due_date', sun.toISOString().slice(0,10));
  }
  if (timeFilter === 'this_month') {
    const first = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const last  = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);
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

app.get('/api/notification-preferences', async (req, res) => {
  const { data, error } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', req.userId)
    .maybeSingle();

  if (error) return res.json(normalizeNotificationPreferences({}, req));
  res.json(normalizeNotificationPreferences(data || {}, req));
});

app.put('/api/notification-preferences', async (req, res) => {
  const prefs = normalizeNotificationPreferences(req.body || {}, req);
  const row = {
    user_id: req.userId,
    ...prefs,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_notification_preferences')
    .upsert(row, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(normalizeNotificationPreferences(data, req));
});

app.get('/api/reminders/status', async (req, res) => {
  const { data: prefsRaw } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', req.userId)
    .maybeSingle();
  const prefs = normalizeNotificationPreferences(prefsRaw || {}, req);
  res.json({
    emailConfigured: !!process.env.RESEND_API_KEY && !!process.env.REMINDER_EMAIL_FROM,
    emailFrom: process.env.REMINDER_EMAIL_FROM || '',
    workerConfigured: !!process.env.REMINDER_WORKER_KEY,
    preferencesSaved: !!prefsRaw,
    emailEnabled: prefs.email_enabled,
    emailAddress: prefs.email_address,
    browserEnabled: prefs.browser_enabled,
    dailyDigestEnabled: prefs.daily_digest_enabled,
  });
});

app.get('/api/reminders/history', async (req, res) => {
  const { data, error } = await supabase
    .from('reminder_deliveries')
    .select('id,task_id,channel,scheduled_for,delivered_at,status,provider,error_message')
    .eq('user_id', req.userId)
    .order('delivered_at', { ascending: false })
    .limit(12);
  if (error) return res.json([]);
  res.json(data || []);
});

app.post('/api/reminders/test-email', async (req, res) => {
  const { data: prefsRaw } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', req.userId)
    .maybeSingle();
  const prefs = normalizeNotificationPreferences(req.body || prefsRaw || {}, req);
  const to = sanitizeEmail(req.body?.email_address || prefs.email_address || req.userEmail);
  if (!to) return res.status(400).json({ error: 'Add an email address first.' });

  const testTask = {
    id: null,
    title: 'Test reminder from 1% Dev Academy',
    description: 'Your email reminders are connected.',
    due_date: new Date().toISOString().slice(0, 10),
    due_time: new Date().toTimeString().slice(0, 5),
    internal_link_label: 'Reminder Center',
  };

  try {
    const result = await sendReminderEmail({ to, task: testTask, minutesBefore: 0 });
    const { error: historyError } = await supabase.from('reminder_deliveries').insert({
      user_id: req.userId,
      task_id: null,
      channel: 'email',
      delivery_key: `${req.userId}:test-email:${Date.now()}`,
      scheduled_for: new Date().toISOString(),
      status: result.sent ? 'sent' : 'skipped',
      provider: result.provider,
    });
    res.json({ ok: true, sent: result.sent, provider: result.provider, to, historySaved: !historyError });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reminders/run-due', async (req, res) => {
  const workerKey = process.env.REMINDER_WORKER_KEY;
  if (workerKey && req.headers['x-reminder-worker-key'] !== workerKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

  const { data: tasks, error } = await supabase
    .from('smart_tasks')
    .select('id,user_id,title,description,due_date,due_time,status,is_archived,course_id,internal_link_label')
    .in('due_date', [today, tomorrow])
    .eq('is_archived', false)
    .not('status', 'in', '(completed,skipped,archived)');

  if (error) return res.status(500).json({ error: error.message });

  let checked = 0;
  let sent = 0;
  let digestChecked = 0;
  let digestSent = 0;
  const failures = [];

  for (const task of tasks || []) {
    const dueTime = task.due_time ? String(task.due_time).slice(0, 5) : '09:00';
    const dueAt = new Date(`${task.due_date}T${dueTime}:00`);
    if (Number.isNaN(dueAt.getTime())) continue;

    const { data: prefsRaw } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', task.user_id)
      .maybeSingle();
    const prefs = normalizeNotificationPreferences(prefsRaw || {}, {});
    if (!prefs.email_enabled || !prefs.email_address) continue;

    for (const offset of prefs.reminder_offsets_minutes) {
      const deliveryAt = dueAt.getTime() - offset * 60000;
      const deltaMs = now.getTime() - deliveryAt;
      if (deltaMs < 0 || deltaMs > 10 * 60000) continue;
      checked += 1;

      const deliveryKey = `${task.id}:email:${offset}:${task.due_date}:${dueTime}`;
      const { data: existing } = await supabase
        .from('reminder_deliveries')
        .select('id')
        .eq('delivery_key', deliveryKey)
        .maybeSingle();
      if (existing) continue;

      try {
        const result = await sendReminderEmail({ to: prefs.email_address, task, minutesBefore: offset });
        await supabase.from('reminder_deliveries').insert({
          user_id: task.user_id,
          task_id: task.id,
          channel: 'email',
          delivery_key: deliveryKey,
          scheduled_for: new Date(deliveryAt).toISOString(),
          status: result.sent ? 'sent' : 'skipped',
          provider: result.provider,
        });
        if (result.sent) sent += 1;
      } catch (err) {
        failures.push({ taskId: task.id, error: err.message });
      }
    }
  }

  const currentTime = now.toISOString().slice(11, 16);
  const { data: digestPrefs } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('daily_digest_enabled', true);

  for (const prefsRaw of digestPrefs || []) {
    const prefs = normalizeNotificationPreferences(prefsRaw || {}, {});
    if (!prefs.email_address) continue;
    const digestTime = prefs.daily_digest_time.slice(0, 5);
    const digestAt = new Date(`${today}T${digestTime}:00`);
    const deltaMs = now.getTime() - digestAt.getTime();
    if (currentTime < digestTime || deltaMs < 0 || deltaMs > 10 * 60000) continue;
    digestChecked += 1;

    const deliveryKey = `${prefsRaw.user_id}:daily-digest:${today}`;
    const { data: existing } = await supabase
      .from('reminder_deliveries')
      .select('id')
      .eq('delivery_key', deliveryKey)
      .maybeSingle();
    if (existing) continue;

    const { data: todayTasks } = await supabase
      .from('smart_tasks')
      .select('id,title,due_time,status')
      .eq('user_id', prefsRaw.user_id)
      .eq('due_date', today)
      .eq('is_archived', false)
      .not('status', 'in', '(completed,skipped,archived)')
      .order('due_time', { ascending: true, nullsFirst: false });

    try {
      const result = await sendDigestEmail({ to: prefs.email_address, tasks: todayTasks || [], date: today });
      await supabase.from('reminder_deliveries').insert({
        user_id: prefsRaw.user_id,
        task_id: null,
        channel: 'email',
        delivery_key: deliveryKey,
        scheduled_for: digestAt.toISOString(),
        status: result.sent ? 'sent' : 'skipped',
        provider: result.provider,
      });
      if (result.sent) digestSent += 1;
    } catch (err) {
      failures.push({ userId: prefsRaw.user_id, error: err.message });
    }
  }

  res.json({ ok: true, checked, sent, digestChecked, digestSent, failures });
});

// GET /api/smart-tasks — list with filters & pagination
app.get('/api/smart-tasks', async (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 50));
  const from     = (page - 1) * pageSize;

  let q = supabase.from('smart_tasks')
    .select('*', { count: 'exact' })
    .eq('user_id', req.userId);

  if (!req.query.includeArchived) q = q.eq('is_archived', false);
  if (req.query.status)   q = q.eq('status', req.query.status);
  if (req.query.priority) q = q.eq('priority', req.query.priority);
  if (req.query.course_id) q = q.eq('course_id', req.query.course_id);
  if (req.query.category) q = q.eq('category', req.query.category);
  if (req.query.timeFilter) q = buildDateFilter(q, req.query.timeFilter);
  if (req.query.search) {
    const s = req.query.search.replace(/'/g, "''");
    q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%,personal_notes.ilike.%${s}%`);
  }

  q = q.order('is_pinned', { ascending: false })
       .order('due_date',   { ascending: true,  nullsFirst: false })
       .order('sort_order', { ascending: true })
       .range(from, from + pageSize - 1);

  const { data, error, count } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ tasks: data || [], total: count || 0, page, pageSize, hasMore: (from + pageSize) < (count || 0) });
});

// POST /api/smart-tasks — create
app.post('/api/smart-tasks', async (req, res) => {
  const b = req.body;
  const title = sanitizeText(b.title);
  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (title.length > 255) return res.status(400).json({ error: 'Title must be ≤ 255 characters' });
  if (b.task_type && !VALID_TASK_TYPES.includes(b.task_type))
    return res.status(400).json({ error: `Invalid task_type: ${b.task_type}` });
  if (b.status && !VALID_STATUSES.includes(b.status))
    return res.status(400).json({ error: `Invalid status: ${b.status}` });
  if (b.priority && !VALID_PRIORITIES.includes(b.priority))
    return res.status(400).json({ error: `Invalid priority: ${b.priority}` });
  if (b.link_type && !VALID_LINK_TYPES.includes(b.link_type))
    return res.status(400).json({ error: `Invalid link_type` });
  if (b.internal_link_target && !VALID_INTERNAL_TARGETS.includes(b.internal_link_target))
    return res.status(400).json({ error: `Invalid internal_link_target` });
  if (b.external_url && !validateUrl(b.external_url))
    return res.status(400).json({ error: 'External URL must use http or https' });
  if (b.description && b.description.length > 2000)
    return res.status(400).json({ error: 'Description must be ≤ 2000 characters' });
  if (b.personal_notes && b.personal_notes.length > 5000)
    return res.status(400).json({ error: 'Personal notes must be ≤ 5000 characters' });
  if (b.tags && (!Array.isArray(b.tags) || b.tags.length > 20 || b.tags.some(t => t.length > 50)))
    return res.status(400).json({ error: 'Tags: max 20 tags, each ≤ 50 characters' });

  const urlType = b.external_url ? detectUrlType(b.external_url) : null;

  const row = {
    user_id: req.userId,
    title,
    description:               sanitizeText(b.description) || null,
    task_type:                 b.task_type || 'study',
    status:                    b.status || 'not_started',
    priority:                  b.priority || 'medium',
    due_date:                  b.due_date || null,
    due_time:                  b.due_time || null,
    estimated_duration_minutes: b.estimated_duration_minutes || null,
    recurrence_rule:           b.recurrence_rule || 'none',
    link_type:                 b.link_type || null,
    internal_link_target:      b.internal_link_target || null,
    internal_link_id:          b.internal_link_id || null,
    internal_link_label:       sanitizeText(b.internal_link_label) || null,
    external_url:              b.external_url || null,
    url_resource_type:         urlType,
    course_id:                 b.course_id || null,
    category:                  sanitizeText(b.category) || null,
    personal_notes:            sanitizeText(b.personal_notes) || null,
    tags:                      (b.tags || []).map(sanitizeText),
    is_pinned:                 !!b.is_pinned,
    is_archived:               false,
    sort_order:                b.sort_order || 0,
  };

  const { data, error } = await supabase.from('smart_tasks').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/smart-tasks/:id — update
app.put('/api/smart-tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const b = req.body;

  // Ownership check
  const { data: existing } = await supabase.from('smart_tasks')
    .select('id,user_id,recurrence_rule,due_date,status')
    .eq('id', id).single();
  if (!existing) return res.status(404).json({ error: 'Task not found' });
  if (existing.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  const patch = {};
  if (b.title !== undefined) {
    const t = sanitizeText(b.title);
    if (!t) return res.status(400).json({ error: 'Title cannot be empty' });
    if (t.length > 255) return res.status(400).json({ error: 'Title must be ≤ 255 characters' });
    patch.title = t;
  }
  if (b.description !== undefined) patch.description = sanitizeText(b.description) || null;
  if (b.task_type !== undefined) {
    if (!VALID_TASK_TYPES.includes(b.task_type)) return res.status(400).json({ error: 'Invalid task_type' });
    patch.task_type = b.task_type;
  }
  if (b.status !== undefined) {
    if (!VALID_STATUSES.includes(b.status)) return res.status(400).json({ error: 'Invalid status' });
    patch.status = b.status;
  }
  if (b.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(b.priority)) return res.status(400).json({ error: 'Invalid priority' });
    patch.priority = b.priority;
  }
  if (b.due_date !== undefined)   patch.due_date = b.due_date || null;
  if (b.due_time !== undefined)   patch.due_time = b.due_time || null;
  if (b.estimated_duration_minutes !== undefined) patch.estimated_duration_minutes = b.estimated_duration_minutes || null;
  if (b.recurrence_rule !== undefined) patch.recurrence_rule = b.recurrence_rule || 'none';
  if (b.link_type !== undefined)  patch.link_type = b.link_type || null;
  if (b.internal_link_target !== undefined) patch.internal_link_target = b.internal_link_target || null;
  if (b.internal_link_id !== undefined) patch.internal_link_id = b.internal_link_id || null;
  if (b.internal_link_label !== undefined) patch.internal_link_label = sanitizeText(b.internal_link_label) || null;
  if (b.external_url !== undefined) {
    if (b.external_url && !validateUrl(b.external_url))
      return res.status(400).json({ error: 'External URL must use http or https' });
    patch.external_url = b.external_url || null;
    patch.url_resource_type = b.external_url ? detectUrlType(b.external_url) : null;
    if (!b.external_url) {
      patch.preview_title = null; patch.preview_favicon = null;
      patch.preview_thumbnail = null; patch.preview_domain = null;
    }
  }
  if (b.course_id !== undefined)   patch.course_id = b.course_id || null;
  if (b.category !== undefined)    patch.category = sanitizeText(b.category) || null;
  if (b.personal_notes !== undefined) {
    if (b.personal_notes && b.personal_notes.length > 5000)
      return res.status(400).json({ error: 'Personal notes must be ≤ 5000 characters' });
    patch.personal_notes = sanitizeText(b.personal_notes) || null;
  }
  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags) || b.tags.length > 20 || b.tags.some(t => t.length > 50))
      return res.status(400).json({ error: 'Tags: max 20, each ≤ 50 chars' });
    patch.tags = b.tags.map(sanitizeText);
  }
  if (b.is_pinned !== undefined)   patch.is_pinned = !!b.is_pinned;
  if (b.is_archived !== undefined) patch.is_archived = !!b.is_archived;
  if (b.sort_order !== undefined)  patch.sort_order = b.sort_order;
  if (b.preview_title !== undefined)     patch.preview_title = b.preview_title || null;
  if (b.preview_favicon !== undefined)   patch.preview_favicon = b.preview_favicon || null;
  if (b.preview_thumbnail !== undefined) patch.preview_thumbnail = b.preview_thumbnail || null;
  if (b.preview_domain !== undefined)    patch.preview_domain = b.preview_domain || null;
  if (b.preview_fetched_at !== undefined) patch.preview_fetched_at = b.preview_fetched_at || null;

  // Handle recurring task: when completed, spawn next occurrence
  if (patch.status === 'completed' && existing.status !== 'completed') {
    const rule = existing.recurrence_rule || 'none';
    if (rule !== 'none') {
      const base = existing.due_date ? new Date(existing.due_date) : new Date();
      let next = new Date(base);
      if (rule === 'daily')   next.setDate(next.getDate() + 1);
      else if (rule === 'weekdays') {
        next.setDate(next.getDate() + 1);
        while ([0,6].includes(next.getDay())) next.setDate(next.getDate() + 1);
      }
      else if (rule === 'weekly')  next.setDate(next.getDate() + 7);
      else if (rule === 'monthly') next.setMonth(next.getMonth() + 1);
      else if (rule.startsWith('custom_')) {
        const n = parseInt(rule.split('_')[1]) || 1;
        next.setDate(next.getDate() + n);
      }
      const nextDate = next.toISOString().slice(0,10);
      const { data: full } = await supabase.from('smart_tasks').select('*').eq('id', id).single();
      if (full) {
        const { id: _id, user_id: _uid, created_at: _ca, updated_at: _ua, ...copy } = full;
        await supabase.from('smart_tasks').insert({
          ...copy, ...patch,
          status: 'not_started', due_date: nextDate, is_pinned: false,
        });
      }
    }
  }

  const { data, error } = await supabase.from('smart_tasks')
    .update(patch).eq('id', id).eq('user_id', req.userId).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/smart-tasks/:id
app.delete('/api/smart-tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const { data: existing } = await supabase.from('smart_tasks').select('user_id').eq('id', id).single();
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  const { error } = await supabase.from('smart_tasks').delete().eq('id', id).eq('user_id', req.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// POST /api/smart-tasks/:id/duplicate
app.post('/api/smart-tasks/:id/duplicate', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const { data: src, error: se } = await supabase.from('smart_tasks').select('*').eq('id', id).eq('user_id', req.userId).single();
  if (se || !src) return res.status(404).json({ error: 'Not found' });
  const { id: _id, created_at: _ca, updated_at: _ua, ...copy } = src;
  copy.title = copy.title.length <= 247 ? copy.title + ' (Copy)' : copy.title.slice(0,247) + ' (C)';
  copy.is_pinned = false;
  const { data, error } = await supabase.from('smart_tasks').insert(copy).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// POST /api/smart-tasks/reorder — bulk update sort_order
app.post('/api/smart-tasks/reorder', async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates must be array' });
  await Promise.all(updates.map(({ id, sort_order }) =>
    supabase.from('smart_tasks').update({ sort_order }).eq('id', id).eq('user_id', req.userId)
  ));
  res.json({ ok: true });
});

// GET /api/smart-tasks/analytics
app.get('/api/smart-tasks/analytics', async (req, res) => {
  const uid = req.userId;
  const [{ data: all }, { data: completed }] = await Promise.all([
    supabase.from('smart_tasks').select('id,status,estimated_duration_minutes,course_id,url_resource_type,updated_at').eq('user_id', uid).eq('is_archived', false),
    supabase.from('smart_tasks').select('updated_at,estimated_duration_minutes,course_id,url_resource_type').eq('user_id', uid).eq('status', 'completed'),
  ]);

  const totalTasks     = (all || []).length;
  const completedCount = (completed || []).length;
  const completionPct  = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const studyHours     = (completed || []).reduce((s, t) => s + (t.estimated_duration_minutes || 0), 0) / 60;

  // Daily streak from completed tasks
  const dates = [...new Set((completed || []).map(t => t.updated_at?.slice(0,10)).filter(Boolean))].sort();
  const today = new Date().toISOString().slice(0,10);
  let dailyStreak = 0;
  const check = new Date(today);
  for (let i = 0; i < 365; i++) {
    if (dates.includes(check.toISOString().slice(0,10))) { dailyStreak++; check.setDate(check.getDate()-1); }
    else break;
  }

  // Weekly streak
  const weeks = [...new Set((completed||[]).map(t => {
    const d = new Date(t.updated_at?.slice(0,10)||today);
    const mon = new Date(d); mon.setDate(d.getDate()-((d.getDay()+6)%7));
    return mon.toISOString().slice(0,10);
  }))].sort();
  let weeklyStreak = 0;
  const wCheck = new Date(today);
  wCheck.setDate(wCheck.getDate()-((wCheck.getDay()+6)%7));
  for (let i = 0; i < 52; i++) {
    if (weeks.includes(wCheck.toISOString().slice(0,10))) { weeklyStreak++; wCheck.setDate(wCheck.getDate()-7); }
    else break;
  }

  // Most studied course
  const courseCounts = {};
  (completed||[]).forEach(t => { if (t.course_id) courseCounts[t.course_id] = (courseCounts[t.course_id]||0)+1; });
  const mostCourse = Object.entries(courseCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;

  // Most used external resource type
  const typeCounts = {};
  (completed||[]).forEach(t => { if (t.url_resource_type) typeCounts[t.url_resource_type] = (typeCounts[t.url_resource_type]||0)+1; });
  const mostType = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;

  res.json({
    total_tasks: totalTasks, completed_tasks: completedCount, completion_pct: completionPct,
    daily_streak: dailyStreak, weekly_streak: weeklyStreak,
    study_hours: Math.round(studyHours * 10) / 10,
    most_studied_course: mostCourse, most_used_resource_type: mostType,
  });
});

// GET /api/smart-tasks/tags — all unique tags for the user
app.get('/api/smart-tasks/tags', async (req, res) => {
  const { data } = await supabase.from('smart_tasks').select('tags').eq('user_id', req.userId).eq('is_archived', false);
  const tagSet = new Set();
  (data||[]).forEach(r => (r.tags||[]).forEach(t => tagSet.add(t)));
  res.json([...tagSet].sort());
});

// POST /api/smart-tasks/lms-complete — auto-sync status when LMS lesson/quiz done
app.post('/api/smart-tasks/lms-complete', async (req, res) => {
  const { internal_link_target, internal_link_id } = req.body;
  if (!internal_link_target || !internal_link_id) return res.status(400).json({ error: 'Missing fields' });
  const { error } = await supabase.from('smart_tasks')
    .update({ status: 'completed' })
    .eq('user_id', req.userId)
    .eq('link_type', 'internal')
    .eq('internal_link_target', internal_link_target)
    .eq('internal_link_id', String(internal_link_id))
    .in('status', ['not_started','in_progress']);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// POST /api/link-preview — server-side OG/meta fetch (avoids CORS)
app.post('/api/link-preview', async (req, res) => {
  const { url } = req.body;
  if (!url || !validateUrl(url)) return res.status(400).json({ error: 'Invalid URL' });
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)' },
    });
    clearTimeout(timer);
    const html = await response.text();
    const getMeta = (prop) => {
      const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
               || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
      return m ? m[1] : null;
    };
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const u = new URL(url);
    res.json({
      title:     getMeta('og:title') || getMeta('twitter:title') || (titleMatch ? titleMatch[1].trim() : null),
      favicon:   `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`,
      thumbnail: getMeta('og:image') || getMeta('twitter:image') || null,
      domain:    u.hostname.replace(/^www\./, ''),
    });
  } catch (e) {
    res.status(200).json({ title: null, favicon: null, thumbnail: null, domain: null });
  }
});

// ── Boot ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ● 1% Dev Academy — API Server (Supabase + Cloudinary)`);
  console.log(`  ● http://localhost:${PORT}`);
  console.log(`  ● Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`  ● Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`  ● Courses: ${Object.keys(COURSES_DATA).join(', ')}\n`);
});
