const fs = require('fs');
const path = require('path');

// ── Load central config ──────────────────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, '..', '..', 'courses.config.json');
const COURSES_CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

const CONTENT_ROOT = path.join(__dirname, '..', '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'api');

// Build course data from config
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
  modules: cfg.modules,
  importance: cfg.importance,
  videos: cfg.videos || {},
  getDir: (p) => path.join(cfg.contentDir, cfg.dirPattern.replace('{part}', p)),
}));

// Ensure output directories exist
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log('Exporting courses metadata...');

// 1. Export courses.json (includes link fields for the frontend)
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
  totalParts: course.modules.reduce((sum, m) => sum + m.parts.length, 0),
}));

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'courses.json'),
  JSON.stringify(coursesList, null, 2),
  'utf-8'
);
console.log('Exported courses.json successfully.');

// 2. Export videos.json (for the frontend to load video IDs dynamically)
const videosData = {};
for (const course of COURSES) {
  videosData[course.id] = course.videos;
}
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'videos.json'),
  JSON.stringify(videosData, null, 2),
  'utf-8'
);
console.log('Exported videos.json successfully.');

// 3. Export modules and notes per course
COURSES.forEach(course => {
  const courseNotesDir = path.join(OUTPUT_DIR, 'notes', course.id);
  fs.mkdirSync(courseNotesDir, { recursive: true });

  console.log(`Compiling course: ${course.title}...`);

  const modulesResult = course.modules.map(mod => {
    const notes = mod.parts.map(p => {
      const dirName = course.getDir(p);
      const dir = path.join(CONTENT_ROOT, dirName);
      if (!fs.existsSync(dir)) {
        console.log(`Directory ${dirName} not found. Creating placeholder...`);
        fs.mkdirSync(dir, { recursive: true });
      }
      const notesPath = path.join(dir, 'notes.md');
      if (!fs.existsSync(notesPath)) {
        fs.writeFileSync(notesPath, `# Part ${p}\n\nThis chapter is currently under construction and will be available in a future update.\n`, 'utf-8');
      }
      const content = fs.readFileSync(notesPath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)/m);
      const entries = fs.readdirSync(dir);
      const rawTitle = titleMatch ? titleMatch[1].trim() : `Part ${p}`;
      const cleanTitle = rawTitle.replace(/^Part\s+\d+(\.\d+)?\s*[—–-]+\s*/i, '');
      
      return {
        part: p,
        title: cleanTitle,
        importance: course.importance[p] || 'medium',
        hasFiles: entries.some(f => f !== 'notes.md'),
        wordCount: content.split(/\s+/).length,
      };
    });

    return {
      id: mod.id,
      title: mod.title,
      parts: mod.parts,
      notes: notes,
    };
  });

  // Write modules-[courseId].json
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `modules-${course.id}.json`),
    JSON.stringify(modulesResult, null, 2),
    'utf-8'
  );
  console.log(`Exported modules-${course.id}.json successfully.`);

  // Write individual notes JSON files
  modulesResult.forEach(mod => {
    mod.parts.forEach(p => {
      const dirName = course.getDir(p);
      const dir = path.join(CONTENT_ROOT, dirName);
      if (!fs.existsSync(dir)) return;

      const notesPath = path.join(dir, 'notes.md');
      const notesContent = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf-8') : '';
      const titleMatch = notesContent.match(/^#\s+(.+)/m);
      const title = titleMatch ? titleMatch[1].trim() : `Part ${p}`;

      const files = [];
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry === 'notes.md') continue;
        const filePath = path.join(dir, entry);
        if (fs.statSync(filePath).isFile()) {
          files.push({
            path: entry,
            content: fs.readFileSync(filePath, 'utf-8')
          });
        }
      }

      const partData = {
        part: p,
        title: title,
        notes: notesContent,
        files: files,
        importance: course.importance[p] || 'medium',
        module: mod.title,
        module_id: mod.id,
      };

      fs.writeFileSync(
        path.join(courseNotesDir, `${p}.json`),
        JSON.stringify(partData, null, 2),
        'utf-8'
      );
    });
  });
  console.log(`Exported individual part notes JSON files for ${course.id}.`);
});

console.log('Data export complete!');
