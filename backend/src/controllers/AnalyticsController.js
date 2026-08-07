module.exports = function registerAnalyticsRoutes(ctx) {
  const { app, fs, path, crypto, multer, exec, cloudinary, PORT, IS_PRODUCTION, SUPABASE_URL, SUPABASE_KEY, HAS_SUPABASE_CONFIG, supabase, allowedOrigins, rateBuckets, RATE_WINDOW_MS, RATE_LIMIT, ADMIN_PASSWORD, BACKEND_ROOT, REPO_ROOT, CONFIG_PATH, COURSES_CONFIG, COURSES_DATA, userAuthMiddleware, adminAuthMiddleware, writeConfig, isTextFile, readPartData, VALID_TASK_TYPES, VALID_STATUSES, VALID_PRIORITIES, VALID_LINK_TYPES, VALID_INTERNAL_TARGETS, VALID_URL_TYPES, localDateString, validateTaskSchedule, sanitizeText, validateUrl, detectUrlType, buildDateFilter, DEFAULT_NOTIFICATION_PREFS, sanitizeEmail, normalizeReminderOffsets, normalizeNotificationPreferences, sendReminderEmail, sendDigestEmail, DEFAULT_BOOKMARK_CATEGORIES } = ctx;
    app.post('/api/user-profile', async (req, res) => {
      const { userId, displayName, email, photoUrl } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const { error } = await supabase.from('user_profiles').upsert({
        user_id: userId,
        display_name: displayName || null,
        email: email || null,
        photo_url: photoUrl || null,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // ── Update online status + current lesson (heartbeat from frontend) ────────
    app.post('/api/user-heartbeat', async (req, res) => {
      const { courseId, partId, videoId } = req.body;
      const { error } = await supabase.from('user_profiles').upsert({
        user_id: req.userId,
        is_online: true,
        last_seen_at: new Date().toISOString(),
        current_course_id: courseId || null,
        current_part_id: partId || null,
        current_video_id: videoId || null,
        current_session_start: req.body.sessionStart || new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // ── Mark user offline ───────────────────────────────────────────────────────
    app.post('/api/user-offline', async (req, res) => {
      const { error } = await supabase.from('user_profiles').update({
        is_online: false, last_seen_at: new Date().toISOString(),
        current_course_id: null, current_part_id: null, current_video_id: null,
      }).eq('user_id', req.userId);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // ── Log activity event ──────────────────────────────────────────────────────
    app.post('/api/activity-log', async (req, res) => {
      const { eventType, courseId, partId, videoId, meta } = req.body;
      if (!eventType) return res.status(400).json({ error: 'eventType required' });
      const { error } = await supabase.from('activity_logs').insert({
        user_id: req.userId, event_type: eventType,
        course_id: courseId || null, part_id: partId || null,
        video_id: videoId || null, meta: meta || {},
      });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // ── Admin: Search students ──────────────────────────────────────────────────
};
