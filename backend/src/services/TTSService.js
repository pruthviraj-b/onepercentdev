const crypto = require('crypto');

const cache = new Map();
const MAX_CACHE_ENTRIES = 100;

function cacheKey({ text, voice, speed, format }) {
  return crypto.createHash('sha256').update(JSON.stringify({ text, voice, speed, format })).digest('hex');
}

function configuredProvider() {
  return process.env.TTS_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : 'browser');
}

async function synthesizeWithOpenAI({ text, voice = 'marin', speed = 1, format = 'mp3' }) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('Neural TTS is not configured; use browser speech or set OPENAI_API_KEY.');
    error.statusCode = 503;
    error.code = 'TTS_PROVIDER_UNAVAILABLE';
    throw error;
  }
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      input: text,
      voice,
      speed,
      response_format: format,
      instructions: process.env.OPENAI_TTS_INSTRUCTIONS || 'Speak as a warm, patient human tutor. Use natural conversational pacing, gentle emphasis on important ideas, clear pronunciation, and short realistic pauses after sentences. Avoid sounding like an announcer or reading a script.',
    }),
  });
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    const error = new Error(`TTS provider failed (${response.status})`);
    error.statusCode = response.status >= 500 ? 502 : response.status;
    error.code = 'TTS_PROVIDER_ERROR';
    error.details = details.slice(0, 500);
    throw error;
  }
  return { body: response.body, contentType: response.headers.get('content-type') || 'audio/mpeg', cacheKey: null };
}

async function synthesize(input) {
  const normalized = { ...input, speed: Number(input.speed || 1), format: input.format || 'mp3' };
  const key = cacheKey(normalized);
  const cached = cache.get(key);
  if (cached) return { body: ReadableStream.from([cached]), contentType: 'audio/mpeg', cached: true };
  if (configuredProvider() !== 'openai') {
    const error = new Error('No server TTS provider is configured. Browser speech is available in the reader.');
    error.statusCode = 503;
    error.code = 'TTS_PROVIDER_UNAVAILABLE';
    throw error;
  }
  const result = await synthesizeWithOpenAI(normalized);
  // Streaming responses are passed through immediately; the browser fallback remains the low-latency path.
  return { ...result, cached: false };
}

function listVoices() {
  return [
    { id: 'marin', label: 'Marin — recommended', gender: 'neutral', languages: ['en'] },
    { id: 'cedar', label: 'Cedar — recommended', gender: 'neutral', languages: ['en'] },
    { id: 'coral', label: 'Coral', gender: 'neutral', languages: ['en'] },
    { id: 'sage', label: 'Sage', gender: 'neutral', languages: ['en'] },
    { id: 'nova', label: 'Nova', gender: 'neutral', languages: ['en'] },
  ];
}

module.exports = { synthesize, listVoices, configuredProvider, cache, MAX_CACHE_ENTRIES };
