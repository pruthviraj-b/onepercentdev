module.exports = function registerTaskRoutes(ctx) {
  with (ctx) {
    const localTasks = require('../services/LocalTaskStore');

    app.get('/api/tasks', async (req, res) => {
      if (!HAS_SUPABASE_CONFIG) return res.json(localTasks.list(req.userId));
      const { data, error } = await supabase
        .from('tasks').select('id,text,done,due_date,created_at')
        .eq('user_id', req.userId).order('created_at', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      res.json(data || []);
    });
    
    app.post('/api/tasks', async (req, res) => {
      const { text, due_date } = req.body;
      if (!text?.trim()) return res.status(400).json({ error: 'Task text required' });
      if (!HAS_SUPABASE_CONFIG) {
        const task = localTasks.create(req.userId, text.trim(), due_date);
        return res.json({ ok: true, id: task.id, task });
      }
      const { data, error } = await supabase.from('tasks')
        .insert({ user_id: req.userId, text: text.trim(), done: false, due_date: due_date || null })
        .select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true, id: data.id });
    });
    
    app.put('/api/tasks/:id', async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid task id' });
      const patch = {};
      if (req.body.text !== undefined) patch.text = req.body.text.trim();
      if (req.body.done !== undefined) patch.done = !!req.body.done;
      if (req.body.due_date !== undefined) patch.due_date = req.body.due_date;
      if (!Object.keys(patch).length) return res.status(400).json({ error: 'No task changes provided' });
      if (!HAS_SUPABASE_CONFIG) {
        if (!localTasks.update(req.userId, id, patch)) return res.status(404).json({ error: 'Task not found' });
        return res.json({ ok: true });
      }
      const { error } = await supabase.from('tasks').update(patch)
        .eq('id', id).eq('user_id', req.userId);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    app.delete('/api/tasks/:id', async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid task id' });
      if (!HAS_SUPABASE_CONFIG) {
        if (!localTasks.remove(req.userId, id)) return res.status(404).json({ error: 'Task not found' });
        return res.json({ ok: true });
      }
      const { error } = await supabase.from('tasks').delete()
        .eq('id', id).eq('user_id', req.userId);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    // ── Typing & Aptitude Scores ──────────────────────────────────────────────────
    
    app.post('/api/typing/score', async (req, res) => {
      const { wpm, accuracy, duration } = req.body;
      if (wpm === undefined || accuracy === undefined) return res.status(400).json({ error: 'wpm and accuracy required' });
      const { error } = await supabase.from('typing_scores')
        .insert({ user_id: req.userId, wpm, accuracy, duration: duration || 0 });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    app.get('/api/typing/scores', async (req, res) => {
      const { data, error } = await supabase.from('typing_scores')
        .select('wpm,accuracy,duration,scored_at')
        .eq('user_id', req.userId).order('scored_at', { ascending: false }).limit(20);
      if (error) return res.status(500).json({ error: error.message });
      res.json(data || []);
    });
    
    app.post('/api/aptitude/score', async (req, res) => {
      const { category, score, total, time_taken } = req.body;
      if (score === undefined || total === undefined) return res.status(400).json({ error: 'score and total required' });
      const { error } = await supabase.from('aptitude_scores')
        .insert({ user_id: req.userId, category: category || 'general', score, total, time_taken: time_taken || 0 });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
    
    app.get('/api/aptitude/scores', async (req, res) => {
      const { data, error } = await supabase.from('aptitude_scores')
        .select('category,score,total,time_taken,scored_at')
        .eq('user_id', req.userId).order('scored_at', { ascending: false }).limit(20);
      if (error) return res.status(500).json({ error: error.message });
      res.json(data || []);
    });
    
    // ── Admin Routes ──────────────────────────────────────────────────────────────
  }
};
