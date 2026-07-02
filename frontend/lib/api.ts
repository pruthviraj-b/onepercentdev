// All API calls go to /api/* on the same Next.js server.
// No separate backend needed — works on any PC with just `npm run dev`.
// Progress & bookmarks are stored in localStorage (persists per browser).

import { auth } from './firebase';

const LS_PROGRESS  = 'opd_progress';
const LS_BOOKMARKS = 'opd_bookmarks';

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
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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

// ── Courses, Modules & Notes — fetched from static JSON assets ────────────────────────
const BASE_PATH = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/onepercentdev' : '';

export async function fetchCourses(): Promise<Course[]> {
  try {
    const staticRes = await fetch(`${BASE_PATH}/api/courses.json?t=${Date.now()}`, { cache: 'no-store' });
    if (staticRes.ok) return staticRes.json();
  } catch (err) {
    console.warn('Failed to fetch static courses, trying backend:', err);
  }

  const res = await fetch(`${API_BASE}/api/courses`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export async function fetchModules(courseId: string): Promise<Module[]> {
  const res = await fetch(`${BASE_PATH}/api/modules-${courseId}.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch modules for ${courseId}`);
  return res.json();
}

export async function fetchNote(courseId: string, part: number): Promise<NoteData> {
  // Try static JSON first (fast, CDN-cached)
  try {
    const res = await fetch(`${BASE_PATH}/api/notes/${courseId}/${part}.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  // Fall back to live backend (always has latest data including Cloudinary files)
  const res = await fetch(`${API_BASE}/api/notes/${courseId}/${part}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Part ${part} not found in course ${courseId}`);
  return res.json();
}

// ── Progress — localStorage & Backend Sync ─────────────────────────────────────

function lsGet(key: string, courseId: string): number[] {
  try {
    const specificKey = `${key}_${courseId}`;
    let raw = localStorage.getItem(specificKey);
    // Backward compatibility: migration from old generic key for python
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


// ── Streak & Daily Progress ──────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  totalActiveDays: number;
  dates: string[];
}

export async function fetchStreak(): Promise<StreakData> {
  if (!hasBackendApi()) {
    return { currentStreak: 0, totalActiveDays: 0, dates: [] };
  }

  try {
    const res = await fetch(`${API_BASE}/api/streak`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch streak from backend:', err);
  }
  return { currentStreak: 0, totalActiveDays: 0, dates: [] };
}

// Debounce the ping so we don't spam the backend
let lastStreakPing = 0;
export async function logStreakActivity(): Promise<void> {
  if (!hasBackendApi()) return;

  const now = Date.now();
  if (now - lastStreakPing < 60000) return; // Only ping max once per minute
  lastStreakPing = now;

  try {
    await fetch(`${API_BASE}/api/streak`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {}
}

export async function fetchRecentActivity(): Promise<{ courseId: string; partId: number } | null> {
  if (!hasBackendApi()) return null;

  try {
    const res = await fetch(`${API_BASE}/api/recent-activity`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch recent activity from backend:', err);
  }
  return null;
}

export async function fetchProgress(courseId: string): Promise<number[]> {
  if (!hasBackendApi()) {
    return lsGet(LS_PROGRESS, courseId);
  }

  try {
    const res = await fetch(`${API_BASE}/api/progress?course=${courseId}`, { 
      cache: 'no-store',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const coerced = data.map(Number).filter(n => !isNaN(n));
        lsSet(LS_PROGRESS, courseId, coerced);
        return coerced;
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch progress from backend for ${courseId}, using localStorage:`, err);
  }
  return lsGet(LS_PROGRESS, courseId);
}

export async function toggleProgress(courseId: string, part: number, completed: boolean): Promise<void> {
  // Update local state first for instant response
  const current = lsGet(LS_PROGRESS, courseId);
  const next = completed
    ? Array.from(new Set([...current, part]))
    : current.filter(p => p !== part);
  lsSet(LS_PROGRESS, courseId, next);

  // Any progress change counts as activity
  logStreakActivity();

  if (!hasBackendApi()) return;

  // Sync to backend
  try {
    const res = await fetch(`${API_BASE}/api/progress/${part}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ completed, courseId }),
    });
    if (!res.ok) {
      console.warn(`Progress saved locally; backend sync returned ${res.status}.`);
    }
  } catch {
    console.warn(`Progress saved locally; backend sync unavailable for ${courseId}.`);
  }
}

// ── Bookmarks — localStorage & Backend Sync ────────────────────────────────────
export async function fetchBookmarks(courseId: string): Promise<number[]> {
  if (!hasBackendApi()) {
    return lsGet(LS_BOOKMARKS, courseId);
  }

  try {
    const res = await fetch(`${API_BASE}/api/bookmarks?course=${courseId}`, { 
      cache: 'no-store',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const coerced = data.map(Number).filter(n => !isNaN(n));
        lsSet(LS_BOOKMARKS, courseId, coerced);
        return coerced;
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch bookmarks from backend for ${courseId}, using localStorage:`, err);
  }
  return lsGet(LS_BOOKMARKS, courseId);
}

export async function toggleBookmark(courseId: string, part: number, pinned: boolean): Promise<void> {
  const current = lsGet(LS_BOOKMARKS, courseId);
  const next = pinned
    ? Array.from(new Set([...current, part]))
    : current.filter(p => p !== part);
  lsSet(LS_BOOKMARKS, courseId, next);

  // Bookmarking counts as activity
  logStreakActivity();

  if (!hasBackendApi()) return;

  // Sync to backend
  try {
    const res = await fetch(`${API_BASE}/api/bookmarks/${part}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ pinned, courseId }),
    });
    if (!res.ok) {
      console.warn(`Bookmark saved locally; backend sync returned ${res.status}.`);
    }
  } catch {
    console.warn(`Bookmark saved locally; backend sync unavailable for ${courseId}.`);
  }
}

// ── Video Timestamps — localStorage & Backend Sync ──────────────────────────

const LS_VIDEO_TS = 'opd_video_ts';

export async function fetchVideoTimestamp(courseId: string, part: number): Promise<number> {
  // Try backend first
  if (hasBackendApi()) {
    try {
      const res = await fetch(`${API_BASE}/api/video-timestamp?course=${courseId}&part=${part}`, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const ts = parseFloat(data.timestamp) || 0;
        if (ts > 0) {
          // Update localStorage with server value
          try { localStorage.setItem(`${LS_VIDEO_TS}_${courseId}_${part}`, String(ts)); } catch {}
          return ts;
        }
      }
    } catch {}
  }
  // Fallback to localStorage
  try {
    return parseFloat(localStorage.getItem(`${LS_VIDEO_TS}_${courseId}_${part}`) || '0');
  } catch {
    return 0;
  }
}

export async function saveVideoTimestamp(courseId: string, part: number, timestamp: number): Promise<void> {
  // Save to localStorage immediately
  try { localStorage.setItem(`${LS_VIDEO_TS}_${courseId}_${part}`, String(timestamp)); } catch {}

  // Watching video counts as activity (already debounced so it won't spam)
  logStreakActivity();

  if (!hasBackendApi()) return;

  // Sync to backend (fire-and-forget)
  try {
    await fetch(`${API_BASE}/api/video-timestamp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ courseId, part, timestamp }),
    });
  } catch {}
}
