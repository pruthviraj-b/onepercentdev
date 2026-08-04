const json = (body, status = 200, origin = '*') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': origin,
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-allow-methods': 'POST, OPTIONS',
  },
});

function promptFor({ question, lesson, history }) {
  const context = [
    `Course: ${lesson?.course || 'Current course'}`,
    `Module: ${lesson?.module || 'Current module'}`,
    `Lesson: ${lesson?.title || 'Current lesson'}`,
    `Progress: ${lesson?.progress || 0}%`,
    `Notes:\n${lesson?.notes || ''}`,
  ].join('\n');

  return `You are the AI Learning Mentor inside an LMS. Answer using the lesson context first. Be concise but useful, with Markdown headings, bullets, examples, and fenced code where helpful. If the question is unrelated, say so briefly and connect it back to the lesson.

LESSON CONTEXT:
${context.slice(0, 24000)}

RECENT CONVERSATION:
${(Array.isArray(history) ? history : []).slice(-8).map(item => `${item.role}: ${item.content}`).join('\n')}

STUDENT QUESTION:
${question}`;
}

async function callGemini(key, prompt) {
  const model = 'gemini-2.0-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) throw new Error(`Gemini ${response.status}`);
  const data = await response.json();
  const answer = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
  if (!answer) throw new Error('Gemini returned no answer');
  return { answer, provider: 'Gemini' };
}

async function callGrok(key, prompt) {
  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'grok-4-1-fast-reasoning',
      input: [
        { role: 'system', content: 'You are a patient senior software engineer and learning mentor.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Grok ${response.status}`);
  const data = await response.json();
  const answer = data.output_text || data.output?.flatMap(item => item.content || []).map(item => item.text || '').join('') || '';
  if (!answer) throw new Error('Grok returned no answer');
  return { answer, provider: 'Grok' };
}

async function handleMentor(request, env) {
  if (request.method === 'OPTIONS') return json({}, 204);
  if (request.method !== 'POST') return json({ error: { message: 'Method not allowed' } }, 405);

  let body;
  try { body = await request.json(); } catch { return json({ error: { message: 'Invalid JSON' } }, 400); }
  const question = typeof body?.question === 'string' ? body.question.trim().slice(0, 4000) : '';
  if (!question) return json({ error: { message: 'Question is required' } }, 400);

  const prompt = promptFor({ question, lesson: body.lesson, history: body.history });
  const failures = [];
  if (env.GEMINI_API_KEY) {
    try { return json(await callGemini(env.GEMINI_API_KEY, prompt)); } catch (error) { failures.push(error.message); }
  }
  if (env.GROK_API_KEY) {
    try { return json(await callGrok(env.GROK_API_KEY, prompt)); } catch (error) { failures.push(error.message); }
  }
  return json({ error: { message: failures.length ? 'All mentor providers failed.' : 'No mentor API key is configured.' } }, 503);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/ai/chat') return handleMentor(request, env);
    return env.ASSETS.fetch(request);
  },
};
