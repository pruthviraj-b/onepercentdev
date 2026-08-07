module.exports = function registerReaderRoutes(ctx) {
  const { app, fs, path, crypto, multer, exec, cloudinary, PORT, IS_PRODUCTION, SUPABASE_URL, SUPABASE_KEY, HAS_SUPABASE_CONFIG, supabase, allowedOrigins, rateBuckets, RATE_WINDOW_MS, RATE_LIMIT, ADMIN_PASSWORD, BACKEND_ROOT, REPO_ROOT, CONFIG_PATH, COURSES_CONFIG, COURSES_DATA, userAuthMiddleware, adminAuthMiddleware, writeConfig, isTextFile, readPartData, VALID_TASK_TYPES, VALID_STATUSES, VALID_PRIORITIES, VALID_LINK_TYPES, VALID_INTERNAL_TARGETS, VALID_URL_TYPES, localDateString, validateTaskSchedule, sanitizeText, validateUrl, detectUrlType, buildDateFilter, DEFAULT_NOTIFICATION_PREFS, sanitizeEmail, normalizeReminderOffsets, normalizeNotificationPreferences, sendReminderEmail, sendDigestEmail } = ctx;
    app.post('/api/watch-session/start', async (req, res) => {
      const { courseId, partId, videoId, durationSeconds } = req.body;
      if (!courseId || partId == null || !videoId) return res.status(400).json({ error: 'Missing fields' });
      const { data, error } = await supabase.from('watch_sessions').insert({
        user_id: req.userId, course_id: courseId, part_id: partId, video_id: videoId,
        duration_seconds: durationSeconds || null, started_at: new Date().toISOString(),
      }).select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true, sessionId: data.id });
    });
    
    // PUT /api/watch-session/:id/end — record when a video stops / pauses
    app.put('/api/watch-session/:id/end', async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const { watchSeconds, percentWatched, playbackSpeed, completed } = req.body;
      const { error } = await supabase.from('watch_sessions').update({
        ended_at: new Date().toISOString(),
        watch_seconds: Math.round(watchSeconds || 0),
        percent_watched: percentWatched || 0,
        playback_speed: playbackSpeed || 1.0,
        completed: !!completed,
      }).eq('id', id).eq('user_id', req.userId);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // GET /api/learning-stats — total watch time stats
    app.get('/api/learning-stats', async (req, res) => {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
      const weekStart  = new Date(now); weekStart.setDate(now.getDate() - ((now.getDay()+6)%7)); weekStart.setHours(0,0,0,0);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
      const [{ data: allSessions }, { data: todaySessions }, { data: weekSessions }, { data: monthSessions }] = await Promise.all([
        supabase.from('watch_sessions').select('watch_seconds,started_at').eq('user_id', req.userId),
        supabase.from('watch_sessions').select('watch_seconds').eq('user_id', req.userId).gte('started_at', todayStart.toISOString()),
        supabase.from('watch_sessions').select('watch_seconds').eq('user_id', req.userId).gte('started_at', weekStart.toISOString()),
        supabase.from('watch_sessions').select('watch_seconds').eq('user_id', req.userId).gte('started_at', monthStart.toISOString()),
      ]);
    
      const sumSecs = (arr) => (arr||[]).reduce((s,r) => s + (r.watch_seconds||0), 0);
      const allSecs   = sumSecs(allSessions);
      const todaySecs = sumSecs(todaySessions);
      const weekSecs  = sumSecs(weekSessions);
      const monthSecs = sumSecs(monthSessions);
    
      // Unique days with any activity
      const activeDays = new Set((allSessions||[]).map(r => r.started_at?.slice(0,10)));
      const avgDailySecs = activeDays.size > 0 ? Math.round(allSecs / activeDays.size) : 0;
    
      // Videos watched (sessions with >10s)
      const videosWatched = (allSessions||[]).filter(r => (r.watch_seconds||0) > 10).length;
    
      // Current streak
      const sortedDays = [...activeDays].sort();
      let streak = 0;
      const check = new Date(now); check.setHours(0,0,0,0);
      for (let i = 0; i < 365; i++) {
        if (activeDays.has(check.toISOString().slice(0,10))) { streak++; check.setDate(check.getDate()-1); }
        else break;
      }
    
      res.json({
        today_seconds: todaySecs,
        week_seconds: weekSecs,
        month_seconds: monthSecs,
        total_seconds: allSecs,
        videos_watched: videosWatched,
        avg_daily_seconds: avgDailySecs,
        current_streak_days: streak,
        active_days: activeDays.size,
      });
    });
    
    // ── Video Completion (Auto-Complete at 90%) ──────────────────────────────────
    
    // POST /api/video-completion — mark a video as auto-completed
    app.post('/api/video-completion', async (req, res) => {
      const { courseId, partId, videoId, method } = req.body;
      if (!courseId || partId == null || !videoId) return res.status(400).json({ error: 'Missing fields' });
      const { error } = await supabase.from('video_completions').upsert({
        user_id: req.userId, course_id: courseId, part_id: partId, video_id: videoId,
        completed_at: new Date().toISOString(), watch_method: method || 'threshold',
      }, { onConflict: 'user_id,course_id,part_id' });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // GET /api/video-completion/:course/:part — check if completed
    app.get('/api/video-completion/:course/:part', async (req, res) => {
      const { data } = await supabase.from('video_completions')
        .select('completed_at,watch_method')
        .eq('user_id', req.userId)
        .eq('course_id', req.params.course)
        .eq('part_id', parseFloat(req.params.part))
        .maybeSingle();
      res.json({ completed: !!data, completedAt: data?.completed_at, method: data?.watch_method });
    });
    
    // ── Watch History ─────────────────────────────────────────────────────────────
    
    // PUT /api/watch-history — upsert watch history entry
    app.put('/api/watch-history', async (req, res) => {
      const { courseId, partId, videoId, courseTitle, lessonTitle, thumbnailUrl, resumeAt, durationSeconds, percentWatched, isCompleted } = req.body;
      if (!courseId || partId == null || !videoId) return res.status(400).json({ error: 'Missing fields' });
      const { error } = await supabase.from('watch_history').upsert({
        user_id: req.userId, course_id: courseId, part_id: partId, video_id: videoId,
        course_title: courseTitle || null, lesson_title: lessonTitle || null,
        thumbnail_url: thumbnailUrl || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        last_watched_at: new Date().toISOString(),
        resume_at: resumeAt || 0, duration_seconds: durationSeconds || null,
        percent_watched: percentWatched || 0, is_completed: !!isCompleted,
      }, { onConflict: 'user_id,course_id,part_id' });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // GET /api/watch-history — paginated history with search/filter
    app.get('/api/watch-history', async (req, res) => {
      const page     = Math.max(1, parseInt(req.query.page) || 1);
      const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
      const from     = (page - 1) * pageSize;
    
      let q = supabase.from('watch_history').select('*', { count: 'exact' }).eq('user_id', req.userId);
      if (req.query.course_id) q = q.eq('course_id', req.query.course_id);
      if (req.query.search) {
        const s = req.query.search.replace(/'/g, "''");
        q = q.or(`lesson_title.ilike.%${s}%,course_title.ilike.%${s}%`);
      }
      q = q.order('last_watched_at', { ascending: false }).range(from, from + pageSize - 1);
    
      const { data, error, count } = await q;
      if (error) return res.status(500).json({ error: error.message });
      res.json({ history: data || [], total: count || 0, page, pageSize, hasMore: (from + pageSize) < (count || 0) });
    });
    
    // DELETE /api/watch-history/:course/:part — remove entry
    app.delete('/api/watch-history/:course/:part', async (req, res) => {
      const { error } = await supabase.from('watch_history')
        .delete().eq('user_id', req.userId).eq('course_id', req.params.course).eq('part_id', parseFloat(req.params.part));
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // ── Timestamp Notes ───────────────────────────────────────────────────────────
    
    // GET /api/timestamp-notes — get notes for a part
    app.get('/api/timestamp-notes', async (req, res) => {
      if (!req.query.course || req.query.part == null) return res.status(400).json({ error: 'course and part required' });
      const { data, error } = await supabase.from('timestamp_notes')
        .select('id,timestamp_sec,content,is_draft,created_at,updated_at')
        .eq('user_id', req.userId).eq('course_id', req.query.course).eq('part_id', parseFloat(req.query.part))
        .order('timestamp_sec', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      res.json(data || []);
    });
    
    // POST /api/timestamp-notes — create a note
    app.post('/api/timestamp-notes', async (req, res) => {
      const { courseId, partId, videoId, timestampSec, content, isDraft } = req.body;
      if (!courseId || partId == null || !videoId || timestampSec == null) return res.status(400).json({ error: 'Missing fields' });
      if (!content?.trim() && !isDraft) return res.status(400).json({ error: 'Content required' });
      const { data, error } = await supabase.from('timestamp_notes').insert({
        user_id: req.userId, course_id: courseId, part_id: partId, video_id: videoId,
        timestamp_sec: timestampSec, content: (content || '').slice(0, 5000), is_draft: !!isDraft,
      }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      res.status(201).json(data);
    });
    
    // PUT /api/timestamp-notes/:id — update a note
    app.put('/api/timestamp-notes/:id', async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const { content, isDraft } = req.body;
      const patch = {};
      if (content !== undefined) patch.content = (content || '').slice(0, 5000);
      if (isDraft !== undefined)  patch.is_draft = !!isDraft;
      const { data, error } = await supabase.from('timestamp_notes')
        .update(patch).eq('id', id).eq('user_id', req.userId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    });
    
    // DELETE /api/timestamp-notes/:id
    app.delete('/api/timestamp-notes/:id', async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const { error } = await supabase.from('timestamp_notes').delete().eq('id', id).eq('user_id', req.userId);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // GET /api/timestamp-notes/all — search all notes
    app.get('/api/timestamp-notes/all', async (req, res) => {
      let q = supabase.from('timestamp_notes').select('*').eq('user_id', req.userId).eq('is_draft', false);
      if (req.query.search) {
        const s = req.query.search.replace(/'/g, "''");
        q = q.ilike('content', `%${s}%`);
      }
      if (req.query.course) q = q.eq('course_id', req.query.course);
      q = q.order('created_at', { ascending: false }).limit(100);
      const { data, error } = await q;
      if (error) return res.status(500).json({ error: error.message });
      res.json(data || []);
    });
    
    // ── Timestamp Bookmarks ───────────────────────────────────────────────────────
    
    const DEFAULT_BOOKMARK_CATEGORIES = [
      { name: 'Interview', color: '#e74c3c' },
      { name: 'Exam', color: '#9b59b6' },
      { name: 'Revision', color: '#3498db' },
      { name: 'Assignment', color: '#e67e22' },
      { name: 'Important', color: '#f1be3e' },
      { name: 'Formula', color: '#2ecc71' },
      { name: 'Common Mistake', color: '#e74c3c' },
      { name: 'Favorite', color: '#e91e63' },
    ];
    
    // GET /api/timestamp-bookmarks — get bookmarks for a part
    app.get('/api/timestamp-bookmarks', async (req, res) => {
      let q = supabase.from('timestamp_bookmarks').select('*').eq('user_id', req.userId);
      if (req.query.course) q = q.eq('course_id', req.query.course);
      if (req.query.part != null) q = q.eq('part_id', parseFloat(req.query.part));
      if (req.query.category) q = q.eq('category', req.query.category);
      if (req.query.search) {
        const s = req.query.search.replace(/'/g, "''");
        q = q.ilike('label', `%${s}%`);
      }
      q = q.order('timestamp_sec', { ascending: true });
      const { data, error } = await q;
      if (error) return res.status(500).json({ error: error.message });
      res.json({ bookmarks: data || [], categories: DEFAULT_BOOKMARK_CATEGORIES });
    });
    
    // POST /api/timestamp-bookmarks — create a bookmark
    app.post('/api/timestamp-bookmarks', async (req, res) => {
      const { courseId, partId, videoId, timestampSec, label, category, color } = req.body;
      if (!courseId || partId == null || !videoId || timestampSec == null) return res.status(400).json({ error: 'Missing fields' });
      const cat = DEFAULT_BOOKMARK_CATEGORIES.find(c => c.name === category) || { name: category || 'Important', color: color || '#f1be3e' };
      const { data, error } = await supabase.from('timestamp_bookmarks').insert({
        user_id: req.userId, course_id: courseId, part_id: partId, video_id: videoId,
        timestamp_sec: timestampSec, label: (label || '').slice(0, 200),
        category: cat.name, color: cat.color,
      }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      res.status(201).json(data);
    });
    
    // PUT /api/timestamp-bookmarks/:id — update label/category
    app.put('/api/timestamp-bookmarks/:id', async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const patch = {};
      if (req.body.label !== undefined)    patch.label = (req.body.label || '').slice(0,200);
      if (req.body.category !== undefined) {
        const cat = DEFAULT_BOOKMARK_CATEGORIES.find(c => c.name === req.body.category);
        patch.category = req.body.category;
        patch.color = cat ? cat.color : (req.body.color || '#f1be3e');
      }
      const { data, error } = await supabase.from('timestamp_bookmarks')
        .update(patch).eq('id', id).eq('user_id', req.userId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    });
    
    // DELETE /api/timestamp-bookmarks/:id
    app.delete('/api/timestamp-bookmarks/:id', async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const { error } = await supabase.from('timestamp_bookmarks').delete().eq('id', id).eq('user_id', req.userId);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // ── Pomodoro Sessions ─────────────────────────────────────────────────────────
    
    // POST /api/pomodoro/start — start a session
    app.post('/api/pomodoro/start', async (req, res) => {
      const { courseId, partId, sessionType, durationMinutes } = req.body;
      const { data, error } = await supabase.from('pomodoro_sessions').insert({
        user_id: req.userId, course_id: courseId || null, part_id: partId || null,
        session_type: ['work','break'].includes(sessionType) ? sessionType : 'work',
        duration_minutes: durationMinutes || 25,
        started_at: new Date().toISOString(),
      }).select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true, sessionId: data.id });
    });
    
    // PUT /api/pomodoro/:id/complete — mark session complete or interrupted
    app.put('/api/pomodoro/:id/complete', async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const { interrupted } = req.body;
      const { error } = await supabase.from('pomodoro_sessions').update({
        completed_at: new Date().toISOString(), interrupted: !!interrupted,
      }).eq('id', id).eq('user_id', req.userId);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // GET /api/pomodoro/stats — daily pomodoro statistics
    app.get('/api/pomodoro/stats', async (req, res) => {
      const today = new Date().toISOString().slice(0,10);
      const { data, error } = await supabase.from('pomodoro_sessions')
        .select('session_type,duration_minutes,completed_at,interrupted')
        .eq('user_id', req.userId)
        .gte('started_at', today + 'T00:00:00Z');
      if (error) return res.status(500).json({ error: error.message });
      const completed = (data||[]).filter(s => s.completed_at && !s.interrupted);
      const workSessions = completed.filter(s => s.session_type === 'work');
      const totalWorkMinutes = workSessions.reduce((s,r) => s + (r.duration_minutes||25), 0);
      res.json({
        today_sessions: workSessions.length,
        today_minutes: totalWorkMinutes,
        today_hours: Math.round(totalWorkMinutes / 60 * 10) / 10,
      });
    });
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ── Admin: Student Analytics APIs ────────────────────────────────────────
    // All routes require X-Admin-Password header (enforced by adminAuthMiddleware)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // ── Upsert user profile (called on login from frontend) ───────────────────
    // This is the ONLY route that does NOT require admin auth — students call it
};
