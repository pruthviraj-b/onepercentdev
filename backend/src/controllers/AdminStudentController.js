module.exports = function registerAdminStudentRoutes(ctx) {
  const { app, fs, path, crypto, multer, exec, cloudinary, PORT, IS_PRODUCTION, SUPABASE_URL, SUPABASE_KEY, HAS_SUPABASE_CONFIG, supabase, allowedOrigins, rateBuckets, RATE_WINDOW_MS, RATE_LIMIT, ADMIN_PASSWORD, BACKEND_ROOT, REPO_ROOT, CONFIG_PATH, COURSES_CONFIG, COURSES_DATA, userAuthMiddleware, adminAuthMiddleware, writeConfig, isTextFile, readPartData, VALID_TASK_TYPES, VALID_STATUSES, VALID_PRIORITIES, VALID_LINK_TYPES, VALID_INTERNAL_TARGETS, VALID_URL_TYPES, localDateString, validateTaskSchedule, sanitizeText, validateUrl, detectUrlType, buildDateFilter, DEFAULT_NOTIFICATION_PREFS, sanitizeEmail, normalizeReminderOffsets, normalizeNotificationPreferences, sendReminderEmail, sendDigestEmail, DEFAULT_BOOKMARK_CATEGORIES } = ctx;
    app.get('/api/admin/students', adminAuthMiddleware, async (req, res) => {
      const { search, filter, page = 1, pageSize = 20 } = req.query;
      const from = (parseInt(page) - 1) * parseInt(pageSize);
    
      let q = supabase.from('user_profiles').select('*', { count: 'exact' });
    
      if (search) {
        const s = String(search).replace(/'/g, "''");
        q = q.or(`display_name.ilike.%${s}%,email.ilike.%${s}%,user_id.ilike.%${s}%`);
      }
      if (filter === 'online')   q = q.eq('is_online', true);
      if (filter === 'today') {
        const today = new Date(); today.setHours(0,0,0,0);
        q = q.gte('last_seen_at', today.toISOString());
      }
    
      q = q.order('last_seen_at', { ascending: false }).range(from, from + parseInt(pageSize) - 1);
    
      const { data, error, count } = await q;
      if (error) return res.status(500).json({ error: error.message });
    
      // Enrich with watch time if sorting by study time
      let students = data || [];
      if (filter === 'highest_time' || filter === 'lowest_time') {
        const times = await Promise.all(students.map(async s => {
          const { data: ws } = await supabase.from('watch_sessions')
            .select('watch_seconds').eq('user_id', s.user_id);
          return { ...s, total_seconds: (ws || []).reduce((sum, r) => sum + (r.watch_seconds||0), 0) };
        }));
        times.sort((a,b) => filter === 'highest_time' ? b.total_seconds - a.total_seconds : a.total_seconds - b.total_seconds);
        students = times;
      }
    
      res.json({ students, total: count || 0, page: parseInt(page), pageSize: parseInt(pageSize) });
    });
    
    // ── Admin: Full student analytics ──────────────────────────────────────────
    app.get('/api/admin/students/:userId/analytics', adminAuthMiddleware, async (req, res) => {
      const { userId } = req.params;
    
      const [
        { data: profile },
        { data: allSessions },
        { data: completedParts },
        { data: notes },
        { data: bookmarks },
        { data: pomodoroSessions },
        { data: streakDates },
        { data: activityLogs },
        { data: courseSummaries },
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('watch_sessions').select('watch_seconds,started_at,course_id,part_id').eq('user_id', userId),
        supabase.from('progress').select('course_id,part_id,visited_at').eq('user_id', userId).eq('completed', true),
        supabase.from('timestamp_notes').select('id,created_at,course_id,part_id').eq('user_id', userId),
        supabase.from('timestamp_bookmarks').select('id,created_at,course_id').eq('user_id', userId),
        supabase.from('pomodoro_sessions').select('duration_minutes,started_at,completed_at').eq('user_id', userId).not('completed_at', 'is', null),
        supabase.from('streak').select('date').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('activity_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('course_progress_summary').select('*').eq('user_id', userId),
      ]);
    
      // ── Learning time ──
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
      const weekStart  = new Date(now); weekStart.setDate(now.getDate()-((now.getDay()+6)%7)); weekStart.setHours(0,0,0,0);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
      const sumSecs = (arr, since) => (arr||[]).filter(r => new Date(r.started_at) >= since)
        .reduce((s,r) => s + (r.watch_seconds||0), 0);
    
      const todaySecs  = sumSecs(allSessions, todayStart);
      const weekSecs   = sumSecs(allSessions, weekStart);
      const monthSecs  = sumSecs(allSessions, monthStart);
      const totalSecs  = (allSessions||[]).reduce((s,r) => s + (r.watch_seconds||0), 0);
    
      // ── Course progress per course ──
      const courseIds = [...new Set([
        ...(allSessions||[]).map(s => s.course_id).filter(Boolean),
        ...(completedParts||[]).map(p => p.course_id).filter(Boolean),
      ])];
    
      const courseProgress = courseIds.map(cid => {
        const completed = (completedParts||[]).filter(p => p.course_id === cid).length;
        const timeSpent = (allSessions||[]).filter(s => s.course_id === cid)
          .reduce((s,r) => s + (r.watch_seconds||0), 0);
        const lastOpened = (allSessions||[]).filter(s => s.course_id === cid)
          .sort((a,b) => new Date(b.started_at) - new Date(a.started_at))[0]?.started_at;
        const cfg = COURSES_DATA[cid];
        const totalLessons = cfg?.modules?.reduce((s,m) => s + m.parts.length, 0) || 0;
        const progressPct  = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
        return {
          courseId: cid,
          courseTitle: cfg?.title || cid,
          thumbnail: cfg ? `https://img.youtube.com/vi/${Object.values(cfg.videos||{})[0]||''}/mqdefault.jpg` : null,
          lessonsCompleted: completed,
          totalLessons,
          progressPct,
          timeSpentSeconds: timeSpent,
          lastOpenedAt: lastOpened || null,
        };
      }).sort((a,b) => b.timeSpentSeconds - a.timeSpentSeconds);
    
      // ── Streak ──
      const dates = (streakDates||[]).map(r => r.date);
      const today2 = new Date().toISOString().slice(0,10);
      let streak = 0;
      const check = new Date(today2);
      for (let i = 0; i < 365; i++) {
        if (dates.includes(check.toISOString().slice(0,10))) { streak++; check.setDate(check.getDate()-1); }
        else break;
      }
    
      // ── Current status ──
      const isOnline = profile?.is_online && profile?.last_seen_at
        && (Date.now() - new Date(profile.last_seen_at).getTime()) < 5 * 60 * 1000; // 5 min threshold
    
      const currentSessionSecs = isOnline && profile?.current_session_start
        ? Math.floor((Date.now() - new Date(profile.current_session_start).getTime()) / 1000) : 0;
    
      res.json({
        profile: {
          userId,
          displayName: profile?.display_name || 'Unknown',
          email: profile?.email || '',
          photoUrl: profile?.photo_url || null,
          joinedAt: profile?.created_at || null,
          lastSeenAt: profile?.last_seen_at || null,
          isOnline,
          currentCourseId: profile?.current_course_id || null,
          currentPartId:   profile?.current_part_id   || null,
          currentVideoId:  profile?.current_video_id   || null,
          currentSessionSeconds: currentSessionSecs,
        },
        learningTime: { todaySecs, weekSecs, monthSecs, totalSecs },
        courseProgress,
        stats: {
          videosCompleted: (allSessions||[]).filter(s => s.watch_seconds > 30).length,
          lessonsCompleted: (completedParts||[]).length,
          notesAdded: (notes||[]).length,
          bookmarksAdded: (bookmarks||[]).length,
          currentStreak: streak,
          totalActiveDays: (dates||[]).length,
          pomodoroSessions: (pomodoroSessions||[]).length,
        },
        activityLogs: (activityLogs||[]).map(log => ({
          id: log.id,
          eventType: log.event_type,
          courseId: log.course_id,
          partId: log.part_id,
          meta: log.meta,
          createdAt: log.created_at,
        })),
      });
    });
    
    // ── Admin: Student learning time (quick endpoint) ──────────────────────────
    app.get('/api/admin/students/:userId/learning-time', adminAuthMiddleware, async (req, res) => {
      const { userId } = req.params;
      const { data } = await supabase.from('watch_sessions')
        .select('watch_seconds,started_at').eq('user_id', userId);
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
      const weekStart  = new Date(now); weekStart.setDate(now.getDate()-((now.getDay()+6)%7)); weekStart.setHours(0,0,0,0);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const sum = (since) => (data||[]).filter(r => new Date(r.started_at) >= since).reduce((s,r) => s+(r.watch_seconds||0),0);
      res.json({ today: sum(todayStart), week: sum(weekStart), month: sum(monthStart), total: (data||[]).reduce((s,r)=>s+(r.watch_seconds||0),0) });
    });
    
    // ── Admin: Student activity timeline ──────────────────────────────────────
    app.get('/api/admin/students/:userId/activity', adminAuthMiddleware, async (req, res) => {
      const { userId } = req.params;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const pageSize = Math.min(100, parseInt(req.query.pageSize) || 30);
      const from = (page-1)*pageSize;
      const { data, count, error } = await supabase.from('activity_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, from+pageSize-1);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ logs: data||[], total: count||0, page, pageSize });
    });
    
    // ── Admin: Check analytics tables status + return setup SQL ──────────────────
    app.get('/api/admin/analytics-setup', adminAuthMiddleware, async (req, res) => {
      const tables = [
        'user_profiles','activity_logs','watch_sessions','video_completions',
        'timestamp_notes','timestamp_bookmarks','pomodoro_sessions','watch_history','course_progress_summary'
      ];
      const results = await Promise.all(tables.map(async t => {
        const { error } = await supabase.from(t).select('*').limit(0);
        return { table: t, exists: !error || !error.message.includes('schema cache') };
      }));
      const allOk = results.every(r => r.exists);
      const sql = require('fs').readFileSync(require('path').join(__dirname, 'run-analytics-schema.sql'), 'utf-8');
      res.json({ allOk, tables: results, sql });
    });
    
};
