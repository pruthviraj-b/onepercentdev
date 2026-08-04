module.exports = function registerLearningRoutes(ctx) {
  with (ctx) {
    app.get('/api/progress', async (req, res) => {
      const courseId = req.query.course || 'python';
      const { data, error } = await supabase
        .from('progress')
        .select('part_id')
        .eq('user_id', req.userId)
        .eq('course_id', courseId)
        .eq('completed', true);
      if (error) return res.status(500).json({ error: error.message });
      res.json((data || []).map(r => r.part_id));
    });
    
    app.post('/api/progress/:part', async (req, res) => {
      const partId = parseFloat(req.params.part);
      const { completed, courseId = 'python' } = req.body;
      const { error } = await supabase.from('progress').upsert(
        { user_id: req.userId, course_id: courseId, part_id: partId, completed: !!completed, visited_at: new Date().toISOString() },
        { onConflict: 'user_id,course_id,part_id' }
      );
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // ── Bookmarks ────────────────────────────────────────────────────────────────
    
    app.get('/api/bookmarks', async (req, res) => {
      const courseId = req.query.course || 'python';
      const { data, error } = await supabase
        .from('bookmarks')
        .select('part_id')
        .eq('user_id', req.userId)
        .eq('course_id', courseId);
      if (error) return res.status(500).json({ error: error.message });
      res.json((data || []).map(r => r.part_id));
    });
    
    app.post('/api/bookmarks/:part', async (req, res) => {
      const partId = parseFloat(req.params.part);
      const { pinned, courseId = 'python' } = req.body;
      if (pinned) {
        const { error } = await supabase.from('bookmarks').upsert(
          { user_id: req.userId, course_id: courseId, part_id: partId, pinned_at: new Date().toISOString() },
          { onConflict: 'user_id,course_id,part_id' }
        );
        if (error) return res.status(500).json({ error: error.message });
      } else {
        const { error } = await supabase.from('bookmarks')
          .delete()
          .eq('user_id', req.userId)
          .eq('course_id', courseId)
          .eq('part_id', partId);
        if (error) return res.status(500).json({ error: error.message });
      }
      res.json({ ok: true });
    });
    
    // ── Video Timestamps ──────────────────────────────────────────────────────────
    
    app.get('/api/video-timestamp', async (req, res) => {
      const courseId = req.query.course;
      const partId = parseInt(req.query.part);
      if (!courseId || isNaN(partId)) return res.json({ timestamp: 0 });
      const { data } = await supabase
        .from('video_timestamps')
        .select('timestamp')
        .eq('user_id', req.userId)
        .eq('course_id', courseId)
        .eq('part_id', partId)
        .single();
      res.json({ timestamp: data ? data.timestamp : 0 });
    });
    
    app.post('/api/video-timestamp', async (req, res) => {
      const { courseId, part, timestamp } = req.body;
      if (!courseId || part == null || timestamp == null) return res.status(400).json({ error: 'Missing fields' });
      const { error } = await supabase.from('video_timestamps').upsert(
        { user_id: req.userId, course_id: courseId, part_id: part, timestamp, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,course_id,part_id' }
      );
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // ── Streak ────────────────────────────────────────────────────────────────────
    
    app.get('/api/streak', async (req, res) => {
      const { data, error } = await supabase
        .from('streak')
        .select('date')
        .eq('user_id', req.userId)
        .order('date', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
    
      const dates = (data || []).map(r => r.date);
      const today = new Date().toISOString().slice(0, 10);
    
      // Current streak
      let current = 0;
      let check = new Date(today);
      for (let i = 0; i < 365; i++) {
        const d = check.toISOString().slice(0, 10);
        if (dates.includes(d)) { current++; check.setDate(check.getDate() - 1); }
        else break;
      }
    
      // Longest streak
      let longest = 0, run = 1;
      for (let i = 1; i < dates.length; i++) {
        const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
        if (diff === 1) { run++; longest = Math.max(longest, run); } else run = 1;
      }
      if (dates.length === 1) longest = 1;
      longest = Math.max(longest, current);
    
      res.json({ current, longest, total: dates.length, dates,
        // backward-compat keys used by api.ts
        currentStreak: current, totalActiveDays: dates.length });
    });
    
    app.post('/api/streak', async (req, res) => {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from('streak')
        .upsert({ user_id: req.userId, date: today }, { onConflict: 'user_id,date', ignoreDuplicates: true });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true, date: today });
    });
    
    app.post('/api/streak/ping', async (req, res) => {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from('streak')
        .upsert({ user_id: req.userId, date: today }, { onConflict: 'user_id,date', ignoreDuplicates: true });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true, date: today });
    });
    
    // ── Recent Activity ───────────────────────────────────────────────────────────
    
    app.get('/api/recent-activity', async (req, res) => {
      const [{ data: vt }, { data: pr }] = await Promise.all([
        supabase.from('video_timestamps').select('course_id,part_id,updated_at')
          .eq('user_id', req.userId).order('updated_at', { ascending: false }).limit(1),
        supabase.from('progress').select('course_id,part_id,visited_at')
          .eq('user_id', req.userId).order('visited_at', { ascending: false }).limit(1),
      ]);
      const video = vt?.[0] ? { courseId: vt[0].course_id, partId: vt[0].part_id, date: vt[0].updated_at } : null;
      const prog  = pr?.[0] ? { courseId: pr[0].course_id, partId: pr[0].part_id, date: pr[0].visited_at } : null;
      let winner = null;
      if (video && prog) winner = new Date(video.date) > new Date(prog.date) ? video : prog;
      else winner = video || prog;
      res.json(winner);
    });
    
    // ── Tasks ─────────────────────────────────────────────────────────────────────
    
  }
};
