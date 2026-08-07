module.exports = function registerNotificationRoutes(ctx) {
  const { app, fs, path, crypto, multer, exec, cloudinary, PORT, IS_PRODUCTION, SUPABASE_URL, SUPABASE_KEY, HAS_SUPABASE_CONFIG, supabase, allowedOrigins, rateBuckets, RATE_WINDOW_MS, RATE_LIMIT, ADMIN_PASSWORD, BACKEND_ROOT, REPO_ROOT, CONFIG_PATH, COURSES_CONFIG, COURSES_DATA, userAuthMiddleware, adminAuthMiddleware, writeConfig, isTextFile, readPartData, VALID_TASK_TYPES, VALID_STATUSES, VALID_PRIORITIES, VALID_LINK_TYPES, VALID_INTERNAL_TARGETS, VALID_URL_TYPES, localDateString, validateTaskSchedule, sanitizeText, validateUrl, detectUrlType, buildDateFilter, DEFAULT_NOTIFICATION_PREFS, sanitizeEmail, normalizeReminderOffsets, normalizeNotificationPreferences, sendReminderEmail, sendDigestEmail, DEFAULT_BOOKMARK_CATEGORIES } = ctx;
    app.get('/api/notification-preferences', async (req, res) => {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', req.userId)
        .maybeSingle();
    
      if (error) return res.json(normalizeNotificationPreferences({}, req));
      res.json(normalizeNotificationPreferences(data || {}, req));
    });
    
    app.put('/api/notification-preferences', async (req, res) => {
      const prefs = normalizeNotificationPreferences(req.body || {}, req);
      const row = {
        user_id: req.userId,
        ...prefs,
        updated_at: new Date().toISOString(),
      };
    
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .upsert(row, { onConflict: 'user_id' })
        .select('*')
        .single();
    
      if (error) return res.status(500).json({ error: error.message });
      res.json(normalizeNotificationPreferences(data, req));
    });
    
    app.get('/api/reminders/status', async (req, res) => {
      const { data: prefsRaw } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', req.userId)
        .maybeSingle();
      const prefs = normalizeNotificationPreferences(prefsRaw || {}, req);
      res.json({
        emailConfigured: !!process.env.RESEND_API_KEY && !!process.env.REMINDER_EMAIL_FROM,
        emailFrom: process.env.REMINDER_EMAIL_FROM || '',
        workerConfigured: !!process.env.REMINDER_WORKER_KEY,
        preferencesSaved: !!prefsRaw,
        emailEnabled: prefs.email_enabled,
        emailAddress: prefs.email_address,
        browserEnabled: prefs.browser_enabled,
        dailyDigestEnabled: prefs.daily_digest_enabled,
      });
    });
    
    app.get('/api/reminders/history', async (req, res) => {
      const { data, error } = await supabase
        .from('reminder_deliveries')
        .select('id,task_id,channel,scheduled_for,delivered_at,status,provider,error_message')
        .eq('user_id', req.userId)
        .order('delivered_at', { ascending: false })
        .limit(12);
      if (error) return res.json([]);
      res.json(data || []);
    });
    
    app.post('/api/reminders/test-email', async (req, res) => {
      const { data: prefsRaw } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', req.userId)
        .maybeSingle();
      const prefs = normalizeNotificationPreferences(req.body || prefsRaw || {}, req);
      const to = sanitizeEmail(req.body?.email_address || prefs.email_address || req.userEmail);
      if (!to) return res.status(400).json({ error: 'Add an email address first.' });
    
      const testTask = {
        id: null,
        title: 'Test reminder from 1% Dev Academy',
        description: 'Your email reminders are connected.',
        due_date: new Date().toISOString().slice(0, 10),
        due_time: new Date().toTimeString().slice(0, 5),
        internal_link_label: 'Reminder Center',
      };
    
      try {
        const result = await sendReminderEmail({ to, task: testTask, minutesBefore: 0 });
        const { error: historyError } = await supabase.from('reminder_deliveries').insert({
          user_id: req.userId,
          task_id: null,
          channel: 'email',
          delivery_key: `${req.userId}:test-email:${Date.now()}`,
          scheduled_for: new Date().toISOString(),
          status: result.sent ? 'sent' : 'skipped',
          provider: result.provider,
        });
        res.json({ ok: true, sent: result.sent, provider: result.provider, to, historySaved: !historyError });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    app.post('/api/reminders/run-due', async (req, res) => {
      const workerKey = process.env.REMINDER_WORKER_KEY;
      if (workerKey && req.headers['x-reminder-worker-key'] !== workerKey) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
    
      const { data: tasks, error } = await supabase
        .from('smart_tasks')
        .select('id,user_id,title,description,due_date,due_time,status,is_archived,course_id,internal_link_label')
        .in('due_date', [today, tomorrow])
        .eq('is_archived', false)
        .not('status', 'in', '(completed,skipped,archived)');
    
      if (error) return res.status(500).json({ error: error.message });
    
      let checked = 0;
      let sent = 0;
      let digestChecked = 0;
      let digestSent = 0;
      const failures = [];
    
      for (const task of tasks || []) {
        const dueTime = task.due_time ? String(task.due_time).slice(0, 5) : '09:00';
        const dueAt = new Date(`${task.due_date}T${dueTime}:00`);
        if (Number.isNaN(dueAt.getTime())) continue;
    
        const { data: prefsRaw } = await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', task.user_id)
          .maybeSingle();
        const prefs = normalizeNotificationPreferences(prefsRaw || {}, {});
        if (!prefs.email_enabled || !prefs.email_address) continue;
    
        for (const offset of prefs.reminder_offsets_minutes) {
          const deliveryAt = dueAt.getTime() - offset * 60000;
          const deltaMs = now.getTime() - deliveryAt;
          if (deltaMs < 0 || deltaMs > 10 * 60000) continue;
          checked += 1;
    
          const deliveryKey = `${task.id}:email:${offset}:${task.due_date}:${dueTime}`;
          const { data: existing } = await supabase
            .from('reminder_deliveries')
            .select('id')
            .eq('delivery_key', deliveryKey)
            .maybeSingle();
          if (existing) continue;
    
          try {
            const result = await sendReminderEmail({ to: prefs.email_address, task, minutesBefore: offset });
            await supabase.from('reminder_deliveries').insert({
              user_id: task.user_id,
              task_id: task.id,
              channel: 'email',
              delivery_key: deliveryKey,
              scheduled_for: new Date(deliveryAt).toISOString(),
              status: result.sent ? 'sent' : 'skipped',
              provider: result.provider,
            });
            if (result.sent) sent += 1;
          } catch (err) {
            failures.push({ taskId: task.id, error: err.message });
          }
        }
      }
    
      const currentTime = now.toISOString().slice(11, 16);
      const { data: digestPrefs } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('daily_digest_enabled', true);
    
      for (const prefsRaw of digestPrefs || []) {
        const prefs = normalizeNotificationPreferences(prefsRaw || {}, {});
        if (!prefs.email_address) continue;
        const digestTime = prefs.daily_digest_time.slice(0, 5);
        const digestAt = new Date(`${today}T${digestTime}:00`);
        const deltaMs = now.getTime() - digestAt.getTime();
        if (currentTime < digestTime || deltaMs < 0 || deltaMs > 10 * 60000) continue;
        digestChecked += 1;
    
        const deliveryKey = `${prefsRaw.user_id}:daily-digest:${today}`;
        const { data: existing } = await supabase
          .from('reminder_deliveries')
          .select('id')
          .eq('delivery_key', deliveryKey)
          .maybeSingle();
        if (existing) continue;
    
        const { data: todayTasks } = await supabase
          .from('smart_tasks')
          .select('id,title,due_time,status')
          .eq('user_id', prefsRaw.user_id)
          .eq('due_date', today)
          .eq('is_archived', false)
          .not('status', 'in', '(completed,skipped,archived)')
          .order('due_time', { ascending: true, nullsFirst: false });
    
        try {
          const result = await sendDigestEmail({ to: prefs.email_address, tasks: todayTasks || [], date: today });
          await supabase.from('reminder_deliveries').insert({
            user_id: prefsRaw.user_id,
            task_id: null,
            channel: 'email',
            delivery_key: deliveryKey,
            scheduled_for: digestAt.toISOString(),
            status: result.sent ? 'sent' : 'skipped',
            provider: result.provider,
          });
          if (result.sent) digestSent += 1;
        } catch (err) {
          failures.push({ userId: prefsRaw.user_id, error: err.message });
        }
      }
    
      res.json({ ok: true, checked, sent, digestChecked, digestSent, failures });
    });
    
    // GET /api/smart-tasks — list with filters & pagination
};
