const { generateLessonAnswer } = require('../services/aiProvider');

module.exports = function registerAIController({ app }) {
  app.post('/api/ai/chat', async (req, res) => {
    const { question, lesson, history } = req.body || {};
    if (typeof question !== 'string' || !question.trim()) return res.status(400).json({ error: { message: 'Question is required' } });
    const lessonContext = [
      `Course: ${lesson?.course || 'Current course'}`,
      `Module: ${lesson?.module || 'Current module'}`,
      `Lesson: ${lesson?.title || 'Current lesson'}`,
      `Progress: ${lesson?.progress || 0}%`,
      `Notes:\n${lesson?.notes || ''}`,
    ].join('\n');
    try {
      const result = await generateLessonAnswer({ question: question.trim().slice(0, 4000), context: lessonContext, history: Array.isArray(history) ? history : [] });
      res.json(result);
    } catch (error) {
      console.error('[ai]', error.message);
      res.status(503).json({ error: { message: 'Your mentor is temporarily unavailable. Please try again.' } });
    }
  });
};
