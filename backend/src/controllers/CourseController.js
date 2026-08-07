module.exports = function registerCourseRoutes(ctx) {
  const { app, fs, path, crypto, multer, exec, cloudinary, PORT, IS_PRODUCTION, SUPABASE_URL, SUPABASE_KEY, HAS_SUPABASE_CONFIG, supabase, allowedOrigins, rateBuckets, RATE_WINDOW_MS, RATE_LIMIT, ADMIN_PASSWORD, BACKEND_ROOT, REPO_ROOT, CONFIG_PATH, COURSES_CONFIG, COURSES_DATA, userAuthMiddleware, adminAuthMiddleware, writeConfig, isTextFile, readPartData, VALID_TASK_TYPES, VALID_STATUSES, VALID_PRIORITIES, VALID_LINK_TYPES, VALID_INTERNAL_TARGETS, VALID_URL_TYPES, localDateString, validateTaskSchedule, sanitizeText, validateUrl, detectUrlType, buildDateFilter, DEFAULT_NOTIFICATION_PREFS, sanitizeEmail, normalizeReminderOffsets, normalizeNotificationPreferences, sendReminderEmail, sendDigestEmail, DEFAULT_BOOKMARK_CATEGORIES } = ctx;
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
      const root = path.resolve(REPO_ROOT, cfg.contentDir, cfg.dirPattern.replace('{part}', part));
      const absolutePath = path.resolve(root, req.params[0]);
      if ((absolutePath === root || absolutePath.startsWith(`${root}${path.sep}`)) && fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
        res.sendFile(absolutePath);
      } else {
        res.status(404).send('File not found');
      }
    });
    
    // ── Progress ─────────────────────────────────────────────────────────────────
    
};
