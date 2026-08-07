module.exports = function registerSmartTaskRoutes(ctx) {
  const { app, fs, path, crypto, multer, exec, cloudinary, PORT, IS_PRODUCTION, SUPABASE_URL, SUPABASE_KEY, HAS_SUPABASE_CONFIG, supabase, allowedOrigins, rateBuckets, RATE_WINDOW_MS, RATE_LIMIT, ADMIN_PASSWORD, BACKEND_ROOT, REPO_ROOT, CONFIG_PATH, COURSES_CONFIG, COURSES_DATA, userAuthMiddleware, adminAuthMiddleware, writeConfig, isTextFile, readPartData, VALID_TASK_TYPES, VALID_STATUSES, VALID_PRIORITIES, VALID_LINK_TYPES, VALID_INTERNAL_TARGETS, VALID_URL_TYPES, localDateString, validateTaskSchedule, sanitizeText, validateUrl, detectUrlType, buildDateFilter, DEFAULT_NOTIFICATION_PREFS, sanitizeEmail, normalizeReminderOffsets, normalizeNotificationPreferences, sendReminderEmail, sendDigestEmail, DEFAULT_BOOKMARK_CATEGORIES } = ctx;
    app.get('/api/smart-tasks', async (req, res) => {
      const page     = Math.max(1, parseInt(req.query.page) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 50));
      const from     = (page - 1) * pageSize;
    
      let q = supabase.from('smart_tasks')
        .select('*', { count: 'exact' })
        .eq('user_id', req.userId);
    
      if (!req.query.includeArchived) q = q.eq('is_archived', false);
      if (req.query.status)   q = q.eq('status', req.query.status);
      if (req.query.priority) q = q.eq('priority', req.query.priority);
      if (req.query.course_id) q = q.eq('course_id', req.query.course_id);
      if (req.query.category) q = q.eq('category', req.query.category);
      if (req.query.timeFilter) q = buildDateFilter(q, req.query.timeFilter);
      if (req.query.search) {
        const s = req.query.search.replace(/'/g, "''");
        q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%,personal_notes.ilike.%${s}%`);
      }
    
      q = q.order('is_pinned', { ascending: false })
           .order('due_date',   { ascending: true,  nullsFirst: false })
           .order('sort_order', { ascending: true })
           .range(from, from + pageSize - 1);
    
      const { data, error, count } = await q;
      if (error) return res.status(500).json({ error: error.message });
      res.json({ tasks: data || [], total: count || 0, page, pageSize, hasMore: (from + pageSize) < (count || 0) });
    });
    
    // POST /api/smart-tasks — create
    app.post('/api/smart-tasks', async (req, res) => {
      const b = req.body;
      const scheduleError = validateTaskSchedule(b);
      if (scheduleError) return res.status(400).json({ error: scheduleError });
      const title = sanitizeText(b.title);
      if (!title) return res.status(400).json({ error: 'Title is required' });
      if (title.length > 255) return res.status(400).json({ error: 'Title must be ≤ 255 characters' });
      if (b.task_type && !VALID_TASK_TYPES.includes(b.task_type))
        return res.status(400).json({ error: `Invalid task_type: ${b.task_type}` });
      if (b.status && !VALID_STATUSES.includes(b.status))
        return res.status(400).json({ error: `Invalid status: ${b.status}` });
      if (b.priority && !VALID_PRIORITIES.includes(b.priority))
        return res.status(400).json({ error: `Invalid priority: ${b.priority}` });
      if (b.link_type && !VALID_LINK_TYPES.includes(b.link_type))
        return res.status(400).json({ error: `Invalid link_type` });
      if (b.internal_link_target && !VALID_INTERNAL_TARGETS.includes(b.internal_link_target))
        return res.status(400).json({ error: `Invalid internal_link_target` });
      if (b.external_url && !validateUrl(b.external_url))
        return res.status(400).json({ error: 'External URL must use http or https' });
      if (b.description && b.description.length > 2000)
        return res.status(400).json({ error: 'Description must be ≤ 2000 characters' });
      if (b.personal_notes && b.personal_notes.length > 5000)
        return res.status(400).json({ error: 'Personal notes must be ≤ 5000 characters' });
      if (b.tags && (!Array.isArray(b.tags) || b.tags.length > 20 || b.tags.some(t => t.length > 50)))
        return res.status(400).json({ error: 'Tags: max 20 tags, each ≤ 50 characters' });
    
      const urlType = b.external_url ? detectUrlType(b.external_url) : null;
    
      const row = {
        user_id: req.userId,
        title,
        description:               sanitizeText(b.description) || null,
        task_type:                 b.task_type || 'study',
        status:                    b.status || 'not_started',
        priority:                  b.priority || 'medium',
        due_date:                  b.due_date || null,
        due_time:                  b.due_time || null,
        estimated_duration_minutes: b.estimated_duration_minutes || null,
        recurrence_rule:           b.recurrence_rule || 'none',
        link_type:                 b.link_type || null,
        internal_link_target:      b.internal_link_target || null,
        internal_link_id:          b.internal_link_id || null,
        internal_link_label:       sanitizeText(b.internal_link_label) || null,
        external_url:              b.external_url || null,
        url_resource_type:         urlType,
        course_id:                 b.course_id || null,
        category:                  sanitizeText(b.category) || null,
        personal_notes:            sanitizeText(b.personal_notes) || null,
        tags:                      (b.tags || []).map(sanitizeText),
        is_pinned:                 !!b.is_pinned,
        is_archived:               false,
        sort_order:                b.sort_order || 0,
      };
    
      const { data, error } = await supabase.from('smart_tasks').insert(row).select().single();
      if (error) return res.status(500).json({ error: error.message });
      res.status(201).json(data);
    });
    
    // PUT /api/smart-tasks/:id — update
    app.put('/api/smart-tasks/:id', async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const b = req.body;
      const scheduleError = validateTaskSchedule(b);
      if (scheduleError) return res.status(400).json({ error: scheduleError });
    
      // Ownership check
      const { data: existing } = await supabase.from('smart_tasks')
        .select('id,user_id,recurrence_rule,due_date,status')
        .eq('id', id).single();
      if (!existing) return res.status(404).json({ error: 'Task not found' });
      if (existing.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    
      const patch = {};
      if (b.title !== undefined) {
        const t = sanitizeText(b.title);
        if (!t) return res.status(400).json({ error: 'Title cannot be empty' });
        if (t.length > 255) return res.status(400).json({ error: 'Title must be ≤ 255 characters' });
        patch.title = t;
      }
      if (b.description !== undefined) patch.description = sanitizeText(b.description) || null;
      if (b.task_type !== undefined) {
        if (!VALID_TASK_TYPES.includes(b.task_type)) return res.status(400).json({ error: 'Invalid task_type' });
        patch.task_type = b.task_type;
      }
      if (b.status !== undefined) {
        if (!VALID_STATUSES.includes(b.status)) return res.status(400).json({ error: 'Invalid status' });
        patch.status = b.status;
      }
      if (b.priority !== undefined) {
        if (!VALID_PRIORITIES.includes(b.priority)) return res.status(400).json({ error: 'Invalid priority' });
        patch.priority = b.priority;
      }
      if (b.due_date !== undefined)   patch.due_date = b.due_date || null;
      if (b.due_time !== undefined)   patch.due_time = b.due_time || null;
      if (b.estimated_duration_minutes !== undefined) patch.estimated_duration_minutes = b.estimated_duration_minutes || null;
      if (b.recurrence_rule !== undefined) patch.recurrence_rule = b.recurrence_rule || 'none';
      if (b.link_type !== undefined)  patch.link_type = b.link_type || null;
      if (b.internal_link_target !== undefined) patch.internal_link_target = b.internal_link_target || null;
      if (b.internal_link_id !== undefined) patch.internal_link_id = b.internal_link_id || null;
      if (b.internal_link_label !== undefined) patch.internal_link_label = sanitizeText(b.internal_link_label) || null;
      if (b.external_url !== undefined) {
        if (b.external_url && !validateUrl(b.external_url))
          return res.status(400).json({ error: 'External URL must use http or https' });
        patch.external_url = b.external_url || null;
        patch.url_resource_type = b.external_url ? detectUrlType(b.external_url) : null;
        if (!b.external_url) {
          patch.preview_title = null; patch.preview_favicon = null;
          patch.preview_thumbnail = null; patch.preview_domain = null;
        }
      }
      if (b.course_id !== undefined)   patch.course_id = b.course_id || null;
      if (b.category !== undefined)    patch.category = sanitizeText(b.category) || null;
      if (b.personal_notes !== undefined) {
        if (b.personal_notes && b.personal_notes.length > 5000)
          return res.status(400).json({ error: 'Personal notes must be ≤ 5000 characters' });
        patch.personal_notes = sanitizeText(b.personal_notes) || null;
      }
      if (b.tags !== undefined) {
        if (!Array.isArray(b.tags) || b.tags.length > 20 || b.tags.some(t => t.length > 50))
          return res.status(400).json({ error: 'Tags: max 20, each ≤ 50 chars' });
        patch.tags = b.tags.map(sanitizeText);
      }
      if (b.is_pinned !== undefined)   patch.is_pinned = !!b.is_pinned;
      if (b.is_archived !== undefined) patch.is_archived = !!b.is_archived;
      if (b.sort_order !== undefined)  patch.sort_order = b.sort_order;
      if (b.preview_title !== undefined)     patch.preview_title = b.preview_title || null;
      if (b.preview_favicon !== undefined)   patch.preview_favicon = b.preview_favicon || null;
      if (b.preview_thumbnail !== undefined) patch.preview_thumbnail = b.preview_thumbnail || null;
      if (b.preview_domain !== undefined)    patch.preview_domain = b.preview_domain || null;
      if (b.preview_fetched_at !== undefined) patch.preview_fetched_at = b.preview_fetched_at || null;
    
      // Handle recurring task: when completed, spawn next occurrence
      if (patch.status === 'completed' && existing.status !== 'completed') {
        const rule = existing.recurrence_rule || 'none';
        if (rule !== 'none') {
          const base = existing.due_date ? new Date(existing.due_date) : new Date();
          let next = new Date(base);
          if (rule === 'daily')   next.setDate(next.getDate() + 1);
          else if (rule === 'weekdays') {
            next.setDate(next.getDate() + 1);
            while ([0,6].includes(next.getDay())) next.setDate(next.getDate() + 1);
          }
          else if (rule === 'weekly')  next.setDate(next.getDate() + 7);
          else if (rule === 'monthly') next.setMonth(next.getMonth() + 1);
          else if (rule.startsWith('custom_')) {
            const n = parseInt(rule.split('_')[1]) || 1;
            next.setDate(next.getDate() + n);
          }
          const nextDate = next.toISOString().slice(0,10);
          const { data: full } = await supabase.from('smart_tasks').select('*').eq('id', id).single();
          if (full) {
            const { id: _id, user_id: _uid, created_at: _ca, updated_at: _ua, ...copy } = full;
            await supabase.from('smart_tasks').insert({
              ...copy, ...patch,
              status: 'not_started', due_date: nextDate, is_pinned: false,
            });
          }
        }
      }
    
      const { data, error } = await supabase.from('smart_tasks')
        .update(patch).eq('id', id).eq('user_id', req.userId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    });
    
    // DELETE /api/smart-tasks/:id
    app.delete('/api/smart-tasks/:id', async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const { data: existing } = await supabase.from('smart_tasks').select('user_id').eq('id', id).single();
      if (!existing) return res.status(404).json({ error: 'Not found' });
      if (existing.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
      const { error } = await supabase.from('smart_tasks').delete().eq('id', id).eq('user_id', req.userId);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // POST /api/smart-tasks/:id/duplicate
    app.post('/api/smart-tasks/:id/duplicate', async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const { data: src, error: se } = await supabase.from('smart_tasks').select('*').eq('id', id).eq('user_id', req.userId).single();
      if (se || !src) return res.status(404).json({ error: 'Not found' });
      const { id: _id, created_at: _ca, updated_at: _ua, ...copy } = src;
      copy.title = copy.title.length <= 247 ? copy.title + ' (Copy)' : copy.title.slice(0,247) + ' (C)';
      copy.is_pinned = false;
      const { data, error } = await supabase.from('smart_tasks').insert(copy).select().single();
      if (error) return res.status(500).json({ error: error.message });
      res.status(201).json(data);
    });
    
    // POST /api/smart-tasks/reorder — bulk update sort_order
    app.post('/api/smart-tasks/reorder', async (req, res) => {
      const { updates } = req.body;
      if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates must be array' });
      if (updates.length > 500 || updates.some(item => !item || !Number.isInteger(Number(item.id)) || !Number.isInteger(Number(item.sort_order)) || Number(item.sort_order) < 0)) {
        return res.status(400).json({ error: 'Invalid reorder payload' });
      }
      const ids = updates.map(item => Number(item.id));
      if (new Set(ids).size !== ids.length) return res.status(400).json({ error: 'Duplicate task ids' });
      const results = await Promise.all(updates.map(({ id, sort_order }) =>
        supabase.from('smart_tasks').update({ sort_order: Number(sort_order) }).eq('id', Number(id)).eq('user_id', req.userId)
      ));
      const failed = results.find(result => result.error);
      if (failed) return res.status(500).json({ error: failed.error.message });
      res.json({ ok: true });
    });
    
    // GET /api/smart-tasks/analytics
    app.get('/api/smart-tasks/analytics', async (req, res) => {
      const uid = req.userId;
      const [{ data: all, error: allError }, { data: completed, error: completedError }] = await Promise.all([
        supabase.from('smart_tasks').select('id,status,estimated_duration_minutes,course_id,url_resource_type,updated_at').eq('user_id', uid).eq('is_archived', false),
        supabase.from('smart_tasks').select('updated_at,estimated_duration_minutes,course_id,url_resource_type').eq('user_id', uid).eq('status', 'completed'),
      ]);
      if (allError || completedError) return res.status(500).json({ error: (allError || completedError).message });
    
      const totalTasks     = (all || []).length;
      const completedCount = (completed || []).length;
      const completionPct  = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      const studyHours     = (completed || []).reduce((s, t) => s + (t.estimated_duration_minutes || 0), 0) / 60;
    
      // Daily streak from completed tasks
      const dates = [...new Set((completed || []).map(t => t.updated_at?.slice(0,10)).filter(Boolean))].sort();
      const today = localDateString();
      let dailyStreak = 0;
      const check = new Date(today);
      for (let i = 0; i < 365; i++) {
        if (dates.includes(localDateString(check))) { dailyStreak++; check.setDate(check.getDate()-1); }
        else break;
      }
    
      // Weekly streak
      const weeks = [...new Set((completed||[]).map(t => {
        const d = new Date(t.updated_at?.slice(0,10)||today);
        const mon = new Date(d); mon.setDate(d.getDate()-((d.getDay()+6)%7));
        return localDateString(mon);
      }))].sort();
      let weeklyStreak = 0;
      const wCheck = new Date(today);
      wCheck.setDate(wCheck.getDate()-((wCheck.getDay()+6)%7));
      for (let i = 0; i < 52; i++) {
        if (weeks.includes(localDateString(wCheck))) { weeklyStreak++; wCheck.setDate(wCheck.getDate()-7); }
        else break;
      }
    
      // Most studied course
      const courseCounts = {};
      (completed||[]).forEach(t => { if (t.course_id) courseCounts[t.course_id] = (courseCounts[t.course_id]||0)+1; });
      const mostCourse = Object.entries(courseCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
    
      // Most used external resource type
      const typeCounts = {};
      (completed||[]).forEach(t => { if (t.url_resource_type) typeCounts[t.url_resource_type] = (typeCounts[t.url_resource_type]||0)+1; });
      const mostType = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
    
      res.json({
        total_tasks: totalTasks, completed_tasks: completedCount, completion_pct: completionPct,
        daily_streak: dailyStreak, weekly_streak: weeklyStreak,
        study_hours: Math.round(studyHours * 10) / 10,
        most_studied_course: mostCourse, most_used_resource_type: mostType,
      });
    });
    
    // GET /api/smart-tasks/tags — all unique tags for the user
    app.get('/api/smart-tasks/tags', async (req, res) => {
      const { data } = await supabase.from('smart_tasks').select('tags').eq('user_id', req.userId).eq('is_archived', false);
      const tagSet = new Set();
      (data||[]).forEach(r => (r.tags||[]).forEach(t => tagSet.add(t)));
      res.json([...tagSet].sort());
    });
    
    // POST /api/smart-tasks/lms-complete — auto-sync status when LMS lesson/quiz done
    app.post('/api/smart-tasks/lms-complete', async (req, res) => {
      const { internal_link_target, internal_link_id } = req.body;
      if (!internal_link_target || !internal_link_id) return res.status(400).json({ error: 'Missing fields' });
      const { error } = await supabase.from('smart_tasks')
        .update({ status: 'completed' })
        .eq('user_id', req.userId)
        .eq('link_type', 'internal')
        .eq('internal_link_target', internal_link_target)
        .eq('internal_link_id', String(internal_link_id))
        .in('status', ['not_started','in_progress']);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // POST /api/link-preview — server-side OG/meta fetch (avoids CORS)
    app.post('/api/link-preview', async (req, res) => {
      const { url } = req.body;
      if (!url || !validateUrl(url)) return res.status(400).json({ error: 'Invalid URL' });
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)' },
        });
        clearTimeout(timer);
        const html = await response.text();
        const getMeta = (prop) => {
          const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
                   || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
          return m ? m[1] : null;
        };
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const u = new URL(url);
        res.json({
          title:     getMeta('og:title') || getMeta('twitter:title') || (titleMatch ? titleMatch[1].trim() : null),
          favicon:   `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`,
          thumbnail: getMeta('og:image') || getMeta('twitter:image') || null,
          domain:    u.hostname.replace(/^www\./, ''),
        });
      } catch (e) {
        res.status(200).json({ title: null, favicon: null, thumbnail: null, domain: null });
      }
    });
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ── Advanced YouTube Learning Player APIs ────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════════════
    
    // ── Watch Sessions (Learning Time Tracker) ───────────────────────────────────
    
    // POST /api/watch-session/start — record when a video starts playing
};
