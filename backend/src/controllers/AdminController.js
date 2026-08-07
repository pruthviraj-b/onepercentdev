module.exports = function registerAdminRoutes(ctx) {
  const { app, fs, path, crypto, multer, exec, cloudinary, PORT, IS_PRODUCTION, SUPABASE_URL, SUPABASE_KEY, HAS_SUPABASE_CONFIG, supabase, allowedOrigins, rateBuckets, RATE_WINDOW_MS, RATE_LIMIT, ADMIN_PASSWORD, BACKEND_ROOT, REPO_ROOT, CONFIG_PATH, COURSES_CONFIG, COURSES_DATA, userAuthMiddleware, adminAuthMiddleware, writeConfig, isTextFile, readPartData, VALID_TASK_TYPES, VALID_STATUSES, VALID_PRIORITIES, VALID_LINK_TYPES, VALID_INTERNAL_TARGETS, VALID_URL_TYPES, localDateString, validateTaskSchedule, sanitizeText, validateUrl, detectUrlType, buildDateFilter, DEFAULT_NOTIFICATION_PREFS, sanitizeEmail, normalizeReminderOffsets, normalizeNotificationPreferences, sendReminderEmail, sendDigestEmail, DEFAULT_BOOKMARK_CATEGORIES } = ctx;
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
      const dir = path.join(REPO_ROOT, cfg.contentDir, cfg.dirPattern.replace('{part}', part));
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      try {
        fs.writeFileSync(path.join(dir, 'notes.md'), notes, 'utf-8');
        const scriptPath = path.join(REPO_ROOT, 'frontend', 'scripts', 'export-data.js');
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
      const dir = path.join(REPO_ROOT, cfg.contentDir, cfg.dirPattern.replace('{part}', part));
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let text = '';
      try {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.txt' || ext === '.md') {
          text = file.buffer.toString('utf-8');
        } else {
          return res.status(400).json({ error: 'Unsupported file type. Only .txt and .md are accepted.' });
        }
        let finalNotes = text.trim();
        if (!finalNotes.startsWith('# ')) finalNotes = `# Part ${part}\n\n` + finalNotes;
        fs.writeFileSync(path.join(dir, 'notes.md'), finalNotes, 'utf-8');
        const scriptPath = path.join(REPO_ROOT, 'frontend', 'scripts', 'export-data.js');
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
        const scriptPath = path.join(REPO_ROOT, 'frontend', 'scripts', 'export-data.js');
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
    
      const scriptPath = path.join(REPO_ROOT, 'frontend', 'scripts', 'export-data.js');
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
    
};
