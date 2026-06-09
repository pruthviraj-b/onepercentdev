const fs = require('fs');
const path = require('path');

const CONTENT_ROOT = path.join(__dirname, '..', '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'api');

const MODULES_DATA = [
  {
    id: 1,
    title: 'Foundations',
    parts: [2, 3, 4, 5, 6],
  },
  {
    id: 2,
    title: 'Core Primitives',
    parts: [7, 8, 9, 10, 11, 12],
  },
  {
    id: 3,
    title: 'Control Flow & Logic',
    parts: [13, 14, 15, 16],
  },
  {
    id: 4,
    title: 'Data Structures',
    parts: [17, 18, 19, 20, 21, 22, 23],
  },
  {
    id: 5,
    title: 'Functions & Functional',
    parts: [24, 25, 26, 27, 28],
  },
  {
    id: 6,
    title: 'Modules & Packages',
    parts: [29, 30, 31, 32],
  },
  {
    id: 7,
    title: 'Error Handling',
    parts: [33, 34, 35],
  },
];

const IMPORTANCE = {
  2:'high',  3:'medium', 4:'medium', 5:'high',   6:'high',
  7:'high',  8:'high',   9:'medium', 10:'high',  11:'high',
  12:'high', 13:'high',  14:'high',  15:'high',  16:'high',
  17:'high', 18:'high',  19:'medium',20:'medium',21:'high',
  22:'high', 23:'high',  24:'high',  25:'high',  26:'high',
  27:'medium',28:'medium',29:'high', 30:'high',  31:'high',
  32:'medium',33:'high', 34:'high',  35:'high',
};

// Ensure output directories exist
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(path.join(OUTPUT_DIR, 'notes'), { recursive: true });

console.log('Exporting modules and notes data...');

// 1. Export modules.json
const modulesResult = MODULES_DATA.map(mod => {
  const notes = mod.parts.map(p => {
    const dir = path.join(CONTENT_ROOT, `Part-${p}`);
    if (!fs.existsSync(dir)) {
      console.warn(`Warning: Directory Part-${p} not found.`);
      return null;
    }
    const notesPath = path.join(dir, 'notes.md');
    const content = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf-8') : '';
    const titleMatch = content.match(/^#\s+(.+)/m);
    const entries = fs.readdirSync(dir);
    const rawTitle = titleMatch ? titleMatch[1].trim() : `Part ${p}`;
    const cleanTitle = rawTitle.replace(/^Part\s+\d+\s*[—–-]+\s*/, '');
    
    return {
      part: p,
      title: cleanTitle,
      importance: IMPORTANCE[p] || 'medium',
      hasFiles: entries.some(f => f !== 'notes.md'),
      wordCount: content.split(/\s+/).length,
    };
  }).filter(Boolean);

  return {
    id: mod.id,
    title: mod.title,
    parts: mod.parts,
    notes: notes,
  };
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'modules.json'),
  JSON.stringify(modulesResult, null, 2),
  'utf-8'
);
console.log('Exported modules.json successfully.');

// 2. Export each part's details under notes/[part].json
modulesResult.forEach(mod => {
  mod.parts.forEach(p => {
    const dir = path.join(CONTENT_ROOT, `Part-${p}`);
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
      importance: IMPORTANCE[p] || 'medium',
      module: mod.title,
      module_id: mod.id
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'notes', `${p}.json`),
      JSON.stringify(partData, null, 2),
      'utf-8'
    );
  });
});
console.log('Exported individual part notes JSON files.');
console.log('Data export complete!');
