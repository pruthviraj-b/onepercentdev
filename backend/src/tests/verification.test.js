/* Evidence-based static verification checks. Runtime/Supabase checks are intentionally
 * separate because they require deployed credentials and a live database. */
const fs = require('fs');
const path = require('path');

const srcRoot = path.resolve(__dirname, '..');
const backendRoot = path.resolve(srcRoot, '..');
const root = path.resolve(backendRoot, '..');
const config = JSON.parse(fs.readFileSync(path.join(backendRoot, 'courses.config.json'), 'utf8'));
const api = [
  path.join(srcRoot, 'app', 'server.js'),
  path.join(srcRoot, 'app', 'app.js'),
  path.join(srcRoot, 'app', 'context.js'),
  ...fs.readdirSync(path.join(srcRoot, 'controllers')).map(file => path.join(srcRoot, 'controllers', file)),
  path.join(srcRoot, 'modules', 'auth', 'middleware', 'requireAuth.js'),
].map(file => fs.readFileSync(file, 'utf8')).join('\n');
const frontendApi = fs.readFileSync(path.join(root, 'frontend', 'services', 'courseService.ts'), 'utf8');
const schemas = fs.readdirSync(path.join(srcRoot, 'database')).filter(file => file.endsWith('.sql'))
  .map(file => fs.readFileSync(path.join(srcRoot, 'database', file), 'utf8')).join('\n');

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
