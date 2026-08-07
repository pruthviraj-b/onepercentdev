const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function keys(prefix) {
  return Object.entries(process.env)
    .filter(([name, value]) => (name === prefix || name.startsWith(`${prefix}_`)) && value)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, value]) => value.trim());
}

async function callGemini(key, prompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) throw new Error(`Gemini ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
}

async function callGrok(key, prompt) {
  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.GROK_MODEL || 'grok-4-1-fast-reasoning', input: [{ role: 'system', content: 'You are a patient senior software engineer and learning mentor.' }, { role: 'user', content: prompt }] }),
  });
  if (!response.ok) throw new Error(`Grok ${response.status}`);
  const data = await response.json();
  return data.output_text || data.output?.flatMap(item => item.content || []).map(item => item.text || '').join('') || '';
}

async function generateLessonAnswer({ question, context, history = [] }) {
  const prompt = `You are the AI Learning Mentor inside an LMS. Answer using the lesson context first. Be concise but useful, with Markdown headings, bullets, examples, and fenced code where helpful. If the question is unrelated, say so briefly and connect it back to the lesson.\n\nLESSON CONTEXT:\n${context.slice(0, 24000)}\n\nRECENT CONVERSATION:\n${history.slice(-8).map(item => `${item.role}: ${item.content}`).join('\n')}\n\nSTUDENT QUESTION:\n${question}`;
  const providers = [
    ...keys('GEMINI_API_KEY').map(key => ({ name: 'Gemini', key, call: callGemini })),
    ...keys('GROK_API_KEY').map(key => ({ name: 'Grok', key, call: callGrok })),
  ];
  if (!providers.length) throw new Error('No AI providers configured');
  const failures = [];
  for (const provider of providers) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const answer = await provider.call(provider.key, prompt);
        if (answer) return { answer, provider: provider.name };
      } catch (error) {
        failures.push(`${provider.name}: ${error.message}`);
        if (attempt === 0) await sleep(350);
      }
    }
  }
  throw new Error(`All AI providers failed (${failures.join(', ')})`);
}

async function generateLessonExplanation({ course, module, title, notes }) {
  const prompt = `You are an expert instructor creating a spoken lesson for an LMS. Rewrite the notes below into a natural tutor explanation for a serious learner.

Teaching requirements:
- Start with the main idea and why it matters.
- Explain terminology in plain language before using it.
- Build from intuition to technical detail.
- Add one concrete example and one practical use case when the notes support it.
- Call out common mistakes and trade-offs when relevant.
- Preserve every important fact, formula, code behavior, and constraint from the source. Never invent APIs, results, or claims.
- Use short spoken paragraphs, natural transitions, and occasional emphasis. Do not use Markdown, bullet symbols, stage directions, or meta commentary.
- Sound like a calm senior engineer teaching one student, not like a narrator reading documentation.

COURSE: ${course || 'Current course'}
MODULE: ${module || 'Current module'}
LESSON: ${title || 'Current lesson'}

SOURCE NOTES:
${String(notes || '').slice(0, 24000)}`;
  const providers = [
    ...keys('GEMINI_API_KEY').map(key => ({ name: 'Gemini', key, call: callGemini })),
    ...keys('GROK_API_KEY').map(key => ({ name: 'Grok', key, call: callGrok })),
  ];
  if (!providers.length) throw new Error('No AI providers configured');
  for (const provider of providers) {
    try {
      const answer = await provider.call(provider.key, prompt);
      if (answer) return { answer, provider: provider.name };
    } catch { /* try the next configured provider */ }
  }
  throw new Error('All explanation providers failed');
}

module.exports = { generateLessonAnswer, generateLessonExplanation };
