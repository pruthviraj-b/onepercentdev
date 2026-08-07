const TTSService = require('../services/TTSService');

function validRate(value) { return [0.75, 1, 1.25, 1.5, 2].includes(Number(value)); }

module.exports = function registerTTSController(ctx) {
  const { app, fs, path, crypto, multer, exec, cloudinary, PORT, IS_PRODUCTION, SUPABASE_URL, SUPABASE_KEY, HAS_SUPABASE_CONFIG, supabase, allowedOrigins, rateBuckets, RATE_WINDOW_MS, RATE_LIMIT, ADMIN_PASSWORD, BACKEND_ROOT, REPO_ROOT, CONFIG_PATH, COURSES_CONFIG, COURSES_DATA, userAuthMiddleware, adminAuthMiddleware, writeConfig, isTextFile, readPartData, VALID_TASK_TYPES, VALID_STATUSES, VALID_PRIORITIES, VALID_LINK_TYPES, VALID_INTERNAL_TARGETS, VALID_URL_TYPES, localDateString, validateTaskSchedule, sanitizeText, validateUrl, detectUrlType, buildDateFilter, DEFAULT_NOTIFICATION_PREFS, sanitizeEmail, normalizeReminderOffsets, normalizeNotificationPreferences, sendReminderEmail, sendDigestEmail, DEFAULT_BOOKMARK_CATEGORIES } = ctx;
    app.get('/api/tts/voices', (req, res) => res.json({ provider: TTSService.configuredProvider(), voices: TTSService.listVoices(), browserFallback: true }));

    app.get('/api/tts/preferences', async (req, res) => {
      const { data, error } = await supabase.from('tts_voice_preferences').select('voice_name,locale,playback_rate,volume').eq('user_id', req.userId).maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || { voice_name: '', locale: 'en-US', playback_rate: 1, volume: 1 });
    });

    app.put('/api/tts/preferences', async (req, res) => {
      const { voiceName = '', locale = 'en-US', rate = 1, volume = 1 } = req.body || {};
      if (!validRate(rate) || Number(volume) < 0 || Number(volume) > 1) return res.status(400).json({ error: { code: 'INVALID_PREFERENCES', message: 'Invalid voice, rate, or volume preference.' } });
      const row = { user_id: req.userId, voice_name: String(voiceName).slice(0, 200), locale: String(locale).slice(0, 32), playback_rate: Number(rate), volume: Number(volume), updated_at: new Date().toISOString() };
      const { data, error } = await supabase.from('tts_voice_preferences').upsert(row, { onConflict: 'user_id' }).select('voice_name,locale,playback_rate,volume').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    });

    app.post('/api/tts/synthesize', async (req, res) => {
      const { text, voice, speed, format } = req.body || {};
      if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: { code: 'INVALID_TEXT', message: 'Text is required.' } });
      if (text.length > 4096) return res.status(413).json({ error: { code: 'TEXT_TOO_LONG', message: 'Each neural TTS request must be 4,096 characters or fewer.' } });
      if (speed !== undefined && !validRate(speed)) return res.status(400).json({ error: { code: 'INVALID_SPEED', message: 'Speed must be 0.75, 1, 1.25, 1.5, or 2.' } });
      const result = await TTSService.synthesize({ text: text.trim(), voice, speed, format });
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.setHeader('X-TTS-Provider', TTSService.configuredProvider());
      if (result.body?.pipe) return result.body.pipe(res);
      if (result.body?.getReader) {
        const reader = result.body.getReader();
        res.on('close', () => reader.cancel().catch(() => {}));
        while (true) { const { done, value } = await reader.read(); if (done) break; res.write(Buffer.from(value)); }
        return res.end();
      }
      return res.end(result.body);
    });

    app.get('/api/tts/progress', async (req, res) => {
      const { course, part } = req.query;
      if (!course || part == null) return res.status(400).json({ error: { code: 'INVALID_PROGRESS_QUERY', message: 'course and part are required.' } });
      const { data, error } = await supabase.from('tts_progress').select('*').eq('user_id', req.userId).eq('course_id', course).eq('part_id', Number(part)).maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || { course_id: course, part_id: Number(part), block_index: 0, progress: 0 });
    });

    app.put('/api/tts/progress', async (req, res) => {
      const { courseId, partId, blockIndex = 0, progress = 0 } = req.body || {};
      if (!courseId || partId == null) return res.status(400).json({ error: { code: 'INVALID_PROGRESS', message: 'courseId and partId are required.' } });
      const row = { user_id: req.userId, course_id: String(courseId), part_id: Number(partId), block_index: Math.max(0, Math.floor(Number(blockIndex) || 0)), progress: Math.min(1, Math.max(0, Number(progress) || 0)), updated_at: new Date().toISOString() };
      const { data, error } = await supabase.from('tts_progress').upsert(row, { onConflict: 'user_id,course_id,part_id' }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    });
};
