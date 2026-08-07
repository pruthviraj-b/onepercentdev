export type TtsSpeed = 0.75 | 1 | 1.25 | 1.5 | 2;

export type TtsPreferences = {
  voiceName: string;
  rate: TtsSpeed;
  pitch: number;
  volume: number;
};

export type TtsPosition = {
  blockIndex: number;
  progress: number;
};

export type TtsBlock = {
  id: string;
  text: string;
};

export const TTS_SPEEDS: TtsSpeed[] = [0.75, 1, 1.25, 1.5, 2];
const PREFS_KEY = 'lms_tts_preferences_v1';
const POSITION_PREFIX = 'lms_tts_position_v1';
export const DEFAULT_TTS_PREFERENCES: TtsPreferences = { voiceName: '', rate: 1, pitch: 1, volume: 1 };

function tableToSpeech(lines: string[]) {
  const rows = lines.map(line => line.split('|').map(cell => cell.trim()).filter(Boolean)).filter(row => row.length && !row.every(cell => /^:?-{2,}:?$/.test(cell)));
  if (rows.length < 2) return rows.flat().join('. ');
  const headers = rows[0];
  return rows.slice(1).map(row => `Table row: ${headers.map((header, index) => `${header} is ${row[index] || 'not specified'}`).join('; ')}.`).join(' ');
}

function markdownToSpeech(markdown: string) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const output: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) tableLines.push(lines[index++].trim());
      output.push(tableToSpeech(tableLines));
      continue;
    }
    if (line.startsWith('```')) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) code.push(lines[index++]);
      if (index < lines.length) index += 1;
      output.push(`Code example. ${code.join(' ').replace(/[{}()[\];]/g, ' ').replace(/\s+/g, ' ').trim()}`);
      continue;
    }
    output.push(line
      .replace(/^#{1,6}\s+/, 'Section: ')
      .replace(/^[-*+]\s+/, 'Point: ')
      .replace(/^\d+[.)]\s+/, 'Step: ')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/[*_~]/g, '')
      .replace(/=>/g, ' becomes ')
      .replace(/!=/g, ' is not equal to ')
      .replace(/==/g, ' equals ')
      .replace(/\s+/g, ' ')
      .trim());
    index += 1;
  }
  return output.filter(Boolean).join(' ');
}

function sentenceSegments(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
    return Array.from(segmenter.segment(text), segment => segment.segment.trim()).filter(Boolean);
  }
  return text.match(/[^.!?。！？]+[.!?。！？]+(?:["')\]]+)?|[^.!?。！？]+$/g)?.map(sentence => sentence.trim()).filter(Boolean) || [text];
}

export function splitTtsBlocks(markdown: string): TtsBlock[] {
  const paragraphs = markdownToSpeech(markdown)
    .split(/\n\s*\n|(?<=\.)\s+(?=Section:)/)
    .map(text => text.replace(/\s+/g, ' ').trim())
    .filter(text => text.length > 0);
  const blocks: TtsBlock[] = [];
  paragraphs.forEach(paragraph => {
    sentenceSegments(paragraph).forEach(text => blocks.push({ id: `tts-${blocks.length}`, text }));
  });
  return blocks;
}

export function estimateDurationSeconds(text: string, rate: number): number {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round((words / 155) * 60 / rate));
}

export function loadTtsPreferences(): TtsPreferences {
  if (typeof window === 'undefined') return DEFAULT_TTS_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      voiceName: typeof parsed.voiceName === 'string' ? parsed.voiceName : '',
      rate: TTS_SPEEDS.includes(parsed.rate) ? parsed.rate : 1,
      pitch: typeof parsed.pitch === 'number' ? Math.min(1.15, Math.max(0.85, parsed.pitch)) : 1,
      volume: typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : 1,
    };
  } catch { return DEFAULT_TTS_PREFERENCES; }
}

export function saveTtsPreferences(preferences: TtsPreferences) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(preferences)); } catch { /* storage is optional */ }
}

export function resetTtsPreferences() {
  try { localStorage.removeItem(PREFS_KEY); } catch { /* storage is optional */ }
  return DEFAULT_TTS_PREFERENCES;
}

function positionKey(courseId: string, part: number) { return `${POSITION_PREFIX}_${courseId}_${part}`; }

export function loadTtsPosition(courseId: string, part: number): TtsPosition {
  if (typeof window === 'undefined') return { blockIndex: 0, progress: 0 };
  try {
    const raw = localStorage.getItem(positionKey(courseId, part));
    const parsed = raw ? JSON.parse(raw) : {};
    return { blockIndex: Math.max(0, Number(parsed.blockIndex) || 0), progress: Math.min(1, Math.max(0, Number(parsed.progress) || 0)) };
  } catch { return { blockIndex: 0, progress: 0 }; }
}

export function saveTtsPosition(courseId: string, part: number, position: TtsPosition) {
  try { localStorage.setItem(positionKey(courseId, part), JSON.stringify(position)); } catch { /* storage is optional */ }
}

export function getSpeechVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
}

function apiHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try { headers['X-User-Id'] = localStorage.getItem('user_id') || 'local'; } catch { headers['X-User-Id'] = 'local'; }
  return headers;
}

function apiBase() {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  return process.env.NEXT_PUBLIC_API_URL || window.location.origin;
}

export async function syncTtsProgress(courseId: string, part: number, position: TtsPosition) {
  try { await fetch(`${apiBase()}/api/tts/progress`, { method: 'PUT', headers: apiHeaders(), body: JSON.stringify({ courseId, partId: part, blockIndex: position.blockIndex, progress: position.progress }), keepalive: true }); } catch { /* local storage remains the offline fallback */ }
}

export async function syncTtsPreferences(preferences: Pick<TtsPreferences, 'voiceName' | 'rate' | 'volume'>) {
  try { await fetch(`${apiBase()}/api/tts/preferences`, { method: 'PUT', headers: apiHeaders(), body: JSON.stringify({ voiceName: preferences.voiceName, rate: preferences.rate, volume: preferences.volume }), keepalive: true }); } catch { /* local storage remains the offline fallback */ }
}
