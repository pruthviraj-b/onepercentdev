// All API calls go to /api/* on the same Next.js server.
// No separate backend needed — works on any PC with just `npm run dev`.
// Progress & bookmarks are stored in localStorage (persists per browser).

const LS_PROGRESS  = 'opd_progress';
const LS_BOOKMARKS = 'opd_bookmarks';

// ── Types ────────────────────────────────────────────────────────────────────
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

// ── Modules & Notes — fetched from Next.js API routes ────────────────────────
export async function fetchModules(): Promise<Module[]> {
  const res = await fetch('/api/modules');
  if (!res.ok) throw new Error('Failed to fetch modules');
  return res.json();
}

export async function fetchNote(part: number): Promise<NoteData> {
  const res = await fetch(`/api/notes/${part}`);
  if (!res.ok) throw new Error(`Part ${part} not found`);
  return res.json();
}

// ── Progress — localStorage & Backend Sync ─────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function lsGet(key: string): number[] {
  try {
    const raw = localStorage.getItem(key);
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

function lsSet(key: string, value: number[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function fetchProgress(): Promise<number[]> {
  try {
    const res = await fetch(`${API_BASE}/api/progress`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const coerced = data.map(Number).filter(n => !isNaN(n));
        lsSet(LS_PROGRESS, coerced);
        return coerced;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch progress from backend, using localStorage:', err);
  }
  return lsGet(LS_PROGRESS);
}

export async function toggleProgress(part: number, completed: boolean): Promise<void> {
  // Update local state first for instant response
  const current = lsGet(LS_PROGRESS);
  const next = completed
    ? Array.from(new Set([...current, part]))
    : current.filter(p => p !== part);
  lsSet(LS_PROGRESS, next);

  // Sync to backend
  try {
    await fetch(`${API_BASE}/api/progress/${part}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
  } catch (err) {
    console.error('Failed to sync progress to backend:', err);
  }
}

// ── Bookmarks — localStorage & Backend Sync ────────────────────────────────────
export async function fetchBookmarks(): Promise<number[]> {
  try {
    const res = await fetch(`${API_BASE}/api/bookmarks`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const coerced = data.map(Number).filter(n => !isNaN(n));
        lsSet(LS_BOOKMARKS, coerced);
        return coerced;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch bookmarks from backend, using localStorage:', err);
  }
  return lsGet(LS_BOOKMARKS);
}

export async function toggleBookmark(part: number, pinned: boolean): Promise<void> {
  const current = lsGet(LS_BOOKMARKS);
  const next = pinned
    ? Array.from(new Set([...current, part]))
    : current.filter(p => p !== part);
  lsSet(LS_BOOKMARKS, next);

  // Sync to backend
  try {
    await fetch(`${API_BASE}/api/bookmarks/${part}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned }),
    });
  } catch (err) {
    console.error('Failed to sync bookmark to backend:', err);
  }
}
