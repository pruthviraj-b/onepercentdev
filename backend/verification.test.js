/* Evidence-based static verification checks. Runtime/Supabase checks are intentionally
 * separate because they require deployed credentials and a live database. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'courses.config.json'), 'utf8'));
const api = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const frontendApi = fs.readFileSync(path.join(root, 'frontend/lib/api.ts'), 'utf8');
const schemas = fs.readdirSync(__dirname).filter(file => file.endsWith('.sql'))
  .map(file => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');

let checks = 0;
const failures = [];
function check(name, condition) {
  checks += 1;
  if (condition) console.log(`PASS ${name}`);
  else { failures.push(name); console.log(`FAIL ${name}`); }
}

const seenCourses = new Set();
for (const [courseId, course] of Object.entries(config)) {
  check(`${courseId}: unique course id`, !seenCourses.has(courseId));
  seenCourses.add(courseId);
  const seenParts = new Set();
  for (const module of course.modules || []) {
    for (const part of module.parts || []) {
      check(`${courseId}: part ${part} is not duplicated`, !seenParts.has(part));
      seenParts.add(part);
      const notes = path.join(root, course.contentDir, course.dirPattern.replace('{part}', part), 'notes.md');
      check(`${courseId}: part ${part} has notes`, fs.existsSync(notes));
    }
  }
}

check('backend has central error handler', api.includes("app.use((err, req, res, next)"));
check('production rejects unauthenticated requests', api.includes("'UNAUTHENTICATED'"));
check('file serving resolves and constrains paths', api.includes('path.resolve(root, req.params[0])'));
check('bookmark API uses pinned contract', api.includes('pinned_at') && frontendApi.includes('pinned: bookmarked'));
check('database has uniqueness for core user state', /PRIMARY KEY \(user_id, course_id, part_id\)/.test(schemas));
check('database has RLS enabled', /ENABLE ROW LEVEL SECURITY/.test(schemas));
check('frontend declares realtime subscriptions', /\.channel\(|\.on\(['"]postgres_changes/.test(frontendApi));

console.log(`Verified ${checks} static invariants; failures=${failures.length}.`);
if (failures.length) process.exitCode = 1;
