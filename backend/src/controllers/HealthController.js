module.exports = function registerHealthRoutes(ctx) {
  const { app, fs, path, crypto, multer, exec, cloudinary, PORT, IS_PRODUCTION, SUPABASE_URL, SUPABASE_KEY, HAS_SUPABASE_CONFIG, supabase, allowedOrigins, rateBuckets, RATE_WINDOW_MS, RATE_LIMIT, ADMIN_PASSWORD, BACKEND_ROOT, REPO_ROOT, CONFIG_PATH, COURSES_CONFIG, COURSES_DATA, userAuthMiddleware, adminAuthMiddleware, writeConfig, isTextFile, readPartData, VALID_TASK_TYPES, VALID_STATUSES, VALID_PRIORITIES, VALID_LINK_TYPES, VALID_INTERNAL_TARGETS, VALID_URL_TYPES, localDateString, validateTaskSchedule, sanitizeText, validateUrl, detectUrlType, buildDateFilter, DEFAULT_NOTIFICATION_PREFS, sanitizeEmail, normalizeReminderOffsets, normalizeNotificationPreferences, sendReminderEmail, sendDigestEmail, DEFAULT_BOOKMARK_CATEGORIES } = ctx;
    // Liveness/readiness endpoints are intentionally cheap and do not touch user data.
    app.get('/healthz', (req, res) => res.json({ ok: true, service: 'academy-api', requestId: req.requestId }));
    app.get('/readyz', async (req, res) => {
      const { error } = await supabase.from('user_profiles').select('user_id').limit(1);
      if (error && IS_PRODUCTION) return res.status(503).json({ ok: false, error: { code: 'DEPENDENCY_UNAVAILABLE', requestId: req.requestId } });
      res.json({ ok: true, requestId: req.requestId });
    });

    app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found', requestId: req.requestId } }));
    app.use((err, req, res, next) => {
      console.error(JSON.stringify({ level: 'error', requestId: req.requestId, method: req.method, path: req.path, message: err.message, stack: IS_PRODUCTION ? undefined : err.stack }));
      if (res.headersSent) return next(err);
      const status = err.message === 'CORS origin denied' ? 403 : (err.statusCode || 500);
      res.status(status).json({ error: { code: status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR', message: status === 500 ? 'Unexpected server error' : err.message, requestId: req.requestId } });
    });
};
