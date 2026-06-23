// All API calls go to /api/* on the same Next.js server.
// No separate backend needed — works on any PC with just `npm run dev`.
// Progress & bookmarks are stored in localStorage (persists per browser).

const LS_PROGRESS  = 'opd_progress';
const LS_BOOKMARKS = 'opd_bookmarks';

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
  files: { path: string; content: string }[];
  importance: string;
  module: string;
  module_id: number;
}

// ── Courses, Modules & Notes — fetched from static JSON assets ────────────────────────
const BASE_PATH = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/onepercentdev' : '';

export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch(`${BASE_PATH}/api/courses.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export async function fetchModules(courseId: string): Promise<Module[]> {
  const res = await fetch(`${BASE_PATH}/api/modules-${courseId}.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch modules for ${courseId}`);
  return res.json();
}

export async function fetchNote(courseId: string, part: number): Promise<NoteData> {
  const res = await fetch(`${BASE_PATH}/api/notes/${courseId}/${part}.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Part ${part} not found in course ${courseId}`);
  return res.json();
}

// ── Progress — localStorage & Backend Sync ─────────────────────────────────────
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};
const API_BASE = getApiBase();

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

export async function fetchProgress(courseId: string): Promise<number[]> {
  try {
    const res = await fetch(`${API_BASE}/api/progress?course=${courseId}`, { cache: 'no-store' });
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

  // Sync to backend
  try {
    await fetch(`${API_BASE}/api/progress/${part}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed, courseId }),
    });
  } catch (err) {
    console.error(`Failed to sync progress to backend for ${courseId}:`, err);
  }
}

// ── Bookmarks — localStorage & Backend Sync ────────────────────────────────────
export async function fetchBookmarks(courseId: string): Promise<number[]> {
  try {
    const res = await fetch(`${API_BASE}/api/bookmarks?course=${courseId}`, { cache: 'no-store' });
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

  // Sync to backend
  try {
    await fetch(`${API_BASE}/api/bookmarks/${part}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned, courseId }),
    });
  } catch (err) {
    console.error(`Failed to sync bookmark to backend for ${courseId}:`, err);
  }
}
