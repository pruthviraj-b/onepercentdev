// All API calls go to /api/* on static assets or backend.
// In-Memory & LocalStorage Caching enabled for INSTANT LIGHTNING-FAST 0ms LOAD TIMES.

import { auth } from './firebase';

const LS_PROGRESS  = 'opd_progress';
const LS_BOOKMARKS = 'opd_bookmarks';

// ── In-Memory Fast Caches ───────────────────────────────────────────────────
let cacheCourses: Course[] | null = null;
const cacheModules = new Map<string, Module[]>();
const cacheNotes   = new Map<string, NoteData>();
const cacheStreak  = new Map<string, StreakData>();

// Helper to get auth header
const getAuthHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth.currentUser) {
    headers['X-User-Id'] = auth.currentUser.uid;
  } else {
    headers['X-User-Id'] = 'local';
  }
  return headers;
};

const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:3001';
};
const API_BASE = getApiBase();

const hasBackendApi = () => Boolean(process.env.NEXT_PUBLIC_API_URL);

// ── Types ────────────────────────────────────────────────────────────────────
export interface Course {
  id: string;
  title: string;
  description: string;
  tagline: string;
  mascot: string;
  totalParts: number;
  playlistUrl: string;
  channelUrl: string;
  discordUrl: string;
  author: string;
  authorTitle: string;
  eyebrow: string;
  subtitle: string;
  target: string;
  goal: string;
  welcomeParagraphs: string[];
  children?: string[];
  parentId?: string;
}

export interface PartMeta {
  part: number;
  title: string;
  importance: 'high' | 'medium' | 'low';
  hasFiles: boolean;
  wordCount: number;
}

export interface Module {
  id: number;
  title: string;
  parts: number[];
  notes: PartMeta[];
}

export interface NoteData {
  part: number;
  title: string;
  notes: string;
  files: { path: string; content: string | null; isBinary?: boolean; url?: string }[];
  importance: string;
  module: string;
  module_id: number;
}

// ── Instant Cached Courses Fetcher (0ms response on repeat) ─────────────────
const BASE_PATH = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/onepercentdev' : '';

export async function fetchCourses(): Promise<Course[]> {
  if (cacheCourses) return cacheCourses;
  try {
    const staticRes = await fetch(`${BASE_PATH}/api/courses.json`);
    if (staticRes.ok) {
      const data = await staticRes.json();
      cacheCourses = data;
      return data;
    }
  } catch (err) {
    console.warn('Failed to fetch static courses, trying backend:', err);
  }

  try {
    const res = await fetch(`${API_BASE}/api/courses`);
    if (res.ok) {
      const data = await res.json();
      cacheCourses = data;
      return data;
    }
  } catch {}
  return [];
}

// ── Instant Cached Modules Fetcher ──────────────────────────────────────────
export async function fetchModules(courseId: string): Promise<Module[]> {
  if (cacheModules.has(courseId)) return cacheModules.get(courseId)!;
  try {
    const res = await fetch(`${BASE_PATH}/api/modules-${courseId}.json`);
    if (res.ok) {
      const data = await res.json();
      cacheModules.set(courseId, data);
      return data;
    }
  } catch {}
  return [];
}

// ── Instant Cached Note Fetcher ─────────────────────────────────────────────
export async function fetchNote(courseId: string, part: number): Promise<NoteData> {
  const key = `${courseId}_${part}`;
  if (cacheNotes.has(key)) return cacheNotes.get(key)!;

  // Try static JSON first (fastest)
  try {
    const res = await fetch(`${BASE_PATH}/api/notes/${courseId}/${part}.json`);
    if (res.ok) {
      const data = await res.json();
      cacheNotes.set(key, data);
      return data;
    }
  } catch {}

  // Fall back to live backend
  const res = await fetch(`${API_BASE}/api/notes/${courseId}/${part}`);
  if (!res.ok) throw new Error(`Part ${part} not found in course ${courseId}`);
  const data = await res.json();
  cacheNotes.set(key, data);
  return data;
}

// ── Progress — Instant localStorage return + Async Background Sync ──────────

function lsGet(key: string, courseId: string): number[] {
  try {
    const specificKey = `${key}_${courseId}`;
    let raw = localStorage.getItem(specificKey);
    if (!raw && courseId === 'python') {
      const oldRaw = localStorage.getItem(key);
      if (oldRaw) {
        localStorage.setItem(specificKey, oldRaw);
        raw = oldRaw;
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(Number).filter(n => !isNaN(n));
    }
    return [];
  } catch {
    return [];
  }
}

function lsSet(key: string, courseId: string, value: number[]) {
  try {
    localStorage.setItem(`${key}_${courseId}`, JSON.stringify(value));
  } catch {}
}

export async function fetchProgress(courseId: string): Promise<number[]> {
  // Always return local cached progress INSTANTLY (0ms delay)
  const localProg = lsGet(LS_PROGRESS, courseId);

  // Background sync from backend if configured
  if (hasBackendApi()) {
    fetch(`${API_BASE}/api/progress?course=${courseId}`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data)) {
          const coerced = data.map(Number).filter(n => !isNaN(n));
          lsSet(LS_PROGRESS, courseId, coerced);
        }
      }).catch(() => {});
  }

  return localProg;
}

export async function toggleProgress(courseId: string, part: number, completed: boolean): Promise<void> {
  const current = lsGet(LS_PROGRESS, courseId);
  const next = completed
    ? Array.from(new Set([...current, part]))
    : current.filter(p => p !== part);
  lsSet(LS_PROGRESS, courseId, next);

  logStreakActivity();

  if (!hasBackendApi()) return;

  fetch(`${API_BASE}/api/progress/${part}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ completed, courseId }),
  }).catch(() => {});
}

// ── Bookmarks ──────────────────────────────────────────────────────────────
export async function fetchBookmarks(courseId: string): Promise<number[]> {
  const local = lsGet(LS_BOOKMARKS, courseId);

  if (hasBackendApi()) {
    fetch(`${API_BASE}/api/bookmarks?course=${courseId}`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data)) {
          const coerced = data.map(Number).filter(n => !isNaN(n));
          lsSet(LS_BOOKMARKS, courseId, coerced);
        }
      }).catch(() => {});
  }

  return local;
}

export async function toggleBookmark(courseId: string, part: number, bookmarked: boolean): Promise<void> {
  const current = lsGet(LS_BOOKMARKS, courseId);
  const next = bookmarked
    ? Array.from(new Set([...current, part]))
    : current.filter(p => p !== part);
  lsSet(LS_BOOKMARKS, courseId, next);

  if (!hasBackendApi()) return;

  fetch(`${API_BASE}/api/bookmarks/${part}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ bookmarked, courseId }),
  }).catch(() => {});
}

// ── Streak ─────────────────────────────────────────────────────────────────
export interface StreakData {
  currentStreak: number;
  totalActiveDays: number;
  dates: string[];
  current?: number;
  longest?: number;
  total?: number;
}

export async function fetchStreak(): Promise<StreakData> {
  if (cacheStreak.has('user')) return cacheStreak.get('user')!;

  const defaultStreak: StreakData = {
    currentStreak: 1,
    totalActiveDays: 1,
    dates: [new Date().toISOString().slice(0, 10)],
    current: 1,
    longest: 1,
    total: 1,
  };

  if (hasBackendApi()) {
    fetch(`${API_BASE}/api/streak`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) cacheStreak.set('user', data);
      }).catch(() => {});
  }

  return defaultStreak;
}

let lastStreakPing = 0;
export async function logStreakActivity(): Promise<void> {
  if (!hasBackendApi()) return;
  const now = Date.now();
  if (now - lastStreakPing < 60000) return;
  lastStreakPing = now;
  fetch(`${API_BASE}/api/streak`, { method: 'POST', headers: getAuthHeaders() }).catch(() => {});
}

export async function fetchRecentActivity(): Promise<{ courseId: string; partId: number } | null> {
  try {
    const raw = localStorage.getItem('opd_last_course');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.courseId && parsed?.partId) return parsed;
    }
  } catch {}
  return null;
}

// ── Video Timestamps ────────────────────────────────────────────────────────
export async function fetchVideoTimestamp(courseId: string, part: number): Promise<number> {
  try {
    const raw = localStorage.getItem(`opd_video_ts_${courseId}_${part}`);
    return raw ? parseFloat(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function saveVideoTimestamp(courseId: string, part: number, timestamp: number): Promise<void> {
  try {
    localStorage.setItem(`opd_video_ts_${courseId}_${part}`, String(timestamp));
  } catch {}
}
