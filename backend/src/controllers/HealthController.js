module.exports = function registerHealthRoutes(ctx) {
  with (ctx) {
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
  }
};