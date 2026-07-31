const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Load Supabase credentials from backend/.env ──────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', 'backend', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fetch all Cloudinary files from Supabase
// Returns Map: "courseId:partId" -> [{ filename, cloudinary_url }]
async function fetchCloudinaryFiles() {
  const map = new Map();
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('  (Supabase not configured — skipping Cloudinary file merge)');
    return map;
  }
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/course_files?select=course_id,part_id,filename,cloudinary_url`);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept': 'application/json',
      },
    };
    https.get(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const rows = JSON.parse(data);
          if (Array.isArray(rows)) {
            for (const row of rows) {
              const key = `${row.course_id}:${row.part_id}`;
              if (!map.has(key)) map.set(key, []);
              map.get(key).push({ filename: row.filename, cloudinary_url: row.cloudinary_url });
            }
            console.log(`  Loaded ${rows.length} Cloudinary file(s) from Supabase.`);
          }
        } catch {}
        resolve(map);
      });
    }).on('error', () => resolve(map));
  });
}

// ── Load central config ──────────────────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, '..', '..', 'courses.config.json');
const COURSES_CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

const CONTENT_ROOT = path.join(__dirname, '..', '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'api');

const COURSES = Object.entries(COURSES_CONFIG).map(([id, cfg]) => ({
  id,
  title: cfg.title,
  description: cfg.description,
  tagline: cfg.tagline,
  mascot: cfg.mascot,
  playlistUrl: cfg.playlistUrl || '',
  channelUrl: cfg.channelUrl || '',
  discordUrl: cfg.discordUrl || '',
  author: cfg.author || '',
  authorTitle: cfg.authorTitle || '',
  eyebrow: cfg.eyebrow || '',
  subtitle: cfg.subtitle || '',
  target: cfg.target || '',
  goal: cfg.goal || '',
  welcomeParagraphs: cfg.welcomeParagraphs || [],
  modules: cfg.modules || [],
  importance: cfg.importance || {},
  videos: cfg.videos || {},
  metadata: cfg.metadata || {},
  children: cfg.children,
  parentId: cfg.parentId,
  getDir: (p) => cfg.contentDir && cfg.dirPattern
    ? path.join(cfg.contentDir, cfg.dirPattern.replace('{part}', p))
    : '',
}));

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function isTextFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ['.txt','.md','.js','.jsx','.ts','.tsx','.json','.html','.css','.py','.sh','.yaml','.yml','.csv','.xml'].includes(ext);
}

async function main() {
  console.log('Exporting courses metadata...');

  // ── 1. courses.json ────────────────────────────────────────────────────────
  const coursesList = COURSES.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description,
    tagline: course.tagline,
    mascot: course.mascot,
    playlistUrl: course.playlistUrl,
    channelUrl: course.channelUrl,
    discordUrl: course.discordUrl,
    author: course.author,
    authorTitle: course.authorTitle,
    eyebrow: course.eyebrow,
    subtitle: course.subtitle,
    target: course.target,
    goal: course.goal,
    welcomeParagraphs: course.welcomeParagraphs,
    totalParts: course.modules.reduce((s, m) => s + (m.parts ? m.parts.length : 0), 0),
    children: course.children,
    parentId: course.parentId,
  }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'courses.json'), JSON.stringify(coursesList, null, 2), 'utf-8');
  console.log('Exported courses.json successfully.');

  // ── 2. videos.json ─────────────────────────────────────────────────────────
  const videosData = {};
  for (const course of COURSES) videosData[course.id] = course.videos;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'videos.json'), JSON.stringify(videosData, null, 2), 'utf-8');
  console.log('Exported videos.json successfully.');

  // ── 3. Fetch Cloudinary files from Supabase ────────────────────────────────
  const cloudMap = await fetchCloudinaryFiles();

  // ── 4. Per-course modules + notes ─────────────────────────────────────────
  for (const course of COURSES) {
    if (course.children && course.children.length > 0 && course.modules.length === 0) continue;

    const courseNotesDir = path.join(OUTPUT_DIR, 'notes', course.id);
    fs.mkdirSync(courseNotesDir, { recursive: true });
    console.log(`Compiling course: ${course.title}...`);

    const modulesResult = course.modules.map(mod => {
      const notes = mod.parts.map(p => {
        const dirName = course.getDir(p);
        const dir = path.join(CONTENT_ROOT, dirName);
        if (!fs.existsSync(dir)) {
          console.log(`  Creating placeholder: ${dirName}`);
          fs.mkdirSync(dir, { recursive: true });
        }
        const notesPath = path.join(dir, 'notes.md');
        if (!fs.existsSync(notesPath)) {
          fs.writeFileSync(notesPath, `# Part ${p}\n\nThis chapter is currently under construction.\n`, 'utf-8');
        }
        const content = fs.readFileSync(notesPath, 'utf-8');
        const titleMatch = content.match(/^#\s+(.+)/m);
        const entries = fs.readdirSync(dir);
        const rawTitle = titleMatch ? titleMatch[1].trim() : `Part ${p}`;
        const cleanTitle = rawTitle.replace(/^Part\s+\d+(\.\d+)?\s*[—–-]+\s*/i, '');
        // Check if cloudinary has files for this part too
        const hasCloudFiles = (cloudMap.get(`${course.id}:${p}`) || []).length > 0;
        return {
          part: p,
          title: cleanTitle,
          importance: course.importance[p] || 'medium',
          hasFiles: entries.some(f => f !== 'notes.md') || hasCloudFiles,
          wordCount: content.split(/\s+/).length,
        };
      });
      return { id: mod.id, title: mod.title, parts: mod.parts, notes };
    });

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `modules-${course.id}.json`),
      JSON.stringify(modulesResult, null, 2),
      'utf-8'
    );
    console.log(`  Exported modules-${course.id}.json`);

    // Individual part JSON files
    for (const mod of modulesResult) {
      for (const p of mod.parts) {
        const dirName = course.getDir(p);
        const dir = path.join(CONTENT_ROOT, dirName);
        if (!fs.existsSync(dir)) continue;

        const notesPath = path.join(dir, 'notes.md');
        const notesContent = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf-8') : '';
        const titleMatch = notesContent.match(/^#\s+(.+)/m);
        const title = titleMatch ? titleMatch[1].trim() : `Part ${p}`;

        const publicFilesDir = path.join(OUTPUT_DIR, 'files', course.id, String(p));
        fs.mkdirSync(publicFilesDir, { recursive: true });

        const files = [];

        // Local filesystem files
        function getFilesRecursively(currentDir, baseDir) {
          if (!fs.existsSync(currentDir)) return;
          for (const entry of fs.readdirSync(currentDir)) {
            const filePath = path.join(currentDir, entry);
            if (fs.statSync(filePath).isDirectory()) { getFilesRecursively(filePath, baseDir); continue; }
            if (entry === 'notes.md' && currentDir === baseDir) continue;
            const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
            const isBinary = !isTextFile(entry);
            // Copy to public/api/files/
            const targetPath = path.join(publicFilesDir, relativePath);
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.copyFileSync(filePath, targetPath);
            files.push({
              path: relativePath,
              content: isBinary ? null : fs.readFileSync(filePath, 'utf-8'),
              isBinary,
              url: `/api/files/${course.id}/${p}/${relativePath}`,
            });
          }
        }
        getFilesRecursively(dir, dir);

        // ── Merge Cloudinary files ─────────────────────────────────────────
        const cloudFiles = cloudMap.get(`${course.id}:${p}`) || [];
        for (const cf of cloudFiles) {
          if (!files.find(f => f.path === cf.filename)) {
            files.push({
              path: cf.filename,
              content: null,
              isBinary: true,
              url: cf.cloudinary_url,
            });
          }
        }

        fs.writeFileSync(
          path.join(courseNotesDir, `${p}.json`),
          JSON.stringify({
            part: p,
            title,
            notes: notesContent,
            files,
            importance: course.importance[p] || 'medium',
            module: mod.title,
            module_id: mod.id,
            metadata: course.metadata ? (course.metadata[p] || null) : null,
          }, null, 2),
          'utf-8'
        );
      }
    }
    console.log(`  Exported part notes for ${course.id}.`);
  }

  console.log('\nData export complete!');
}

main().catch(e => { console.error('Export failed:', e); process.exit(1); });
