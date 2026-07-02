// Task & Streak API — syncs to backend with localStorage fallback

import { auth } from './firebase';

const LS_TASKS = 'opd_dashboard_tasks';
const LS_STREAK = 'opd_streak_dates';

const getApiBase = () =>
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || window.location.origin
    : 'http://localhost:3001';

// Helper to get auth header
const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = { ...extraHeaders };
  if (auth.currentUser) {
    headers['X-User-Id'] = auth.currentUser.uid;
  } else {
    headers['X-User-Id'] = 'local';
  }
  return headers;
};

export interface Task {
  id: number;
  text: string;
  done: boolean;
  due_date?: string | null;
  created_at?: string;
}

export interface StreakInfo {
  current: number;
  longest: number;
  total: number;
  dates: string[];
}

// ── Local helpers ────────────────────────────────────────────────────────────

function lsGetTasks(): Task[] {
  try {
    const raw = localStorage.getItem(LS_TASKS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function lsSetTasks(tasks: Task[]) {
  try { localStorage.setItem(LS_TASKS, JSON.stringify(tasks)); } catch {}
}

// ── Tasks API ────────────────────────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/tasks`, { 
      cache: 'no-store',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data: Task[] = await res.json();
      lsSetTasks(data);
      return data;
    }
  } catch {}
  return lsGetTasks();
}

export async function createTask(text: string, due_date?: string): Promise<Task | null> {
  const tempId = Date.now();
  const optimistic: Task = { id: tempId, text, done: false, due_date: due_date || null };
  // Optimistic update
  const current = lsGetTasks();
  lsSetTasks([...current, optimistic]);

  try {
    const res = await fetch(`${getApiBase()}/api/tasks`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ text, due_date: due_date || null }),
    });
    if (res.ok) {
      const data = await res.json();
      // Replace temp id with real id
      const updated = lsGetTasks().map(t => t.id === tempId ? { ...t, id: data.id } : t);
      lsSetTasks(updated);
      return { ...optimistic, id: data.id };
    }
  } catch {}
  return optimistic;
}

export async function updateTask(id: number, patch: Partial<Task>): Promise<void> {
  // Optimistic update locally
  const current = lsGetTasks();
  lsSetTasks(current.map(t => t.id === id ? { ...t, ...patch } : t));

  try {
    await fetch(`${getApiBase()}/api/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(patch),
    });
  } catch {}
}

export async function deleteTask(id: number): Promise<void> {
  const current = lsGetTasks();
  lsSetTasks(current.filter(t => t.id !== id));

  try {
    await fetch(`${getApiBase()}/api/tasks/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  } catch {}
}

// ── Streak API ───────────────────────────────────────────────────────────────

export async function pingStreak(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  // Local cache to avoid duplicate pings in same session
  const cached = sessionStorage.getItem('opd_streak_pinged');
  if (cached === today) return;
  sessionStorage.setItem('opd_streak_pinged', today);

  try {
    await fetch(`${getApiBase()}/api/streak/ping`, { 
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch {}

  // Also update localStorage dates for offline use
  try {
    const raw = localStorage.getItem(LS_STREAK);
    const dates: string[] = raw ? JSON.parse(raw) : [];
    if (!dates.includes(today)) {
      localStorage.setItem(LS_STREAK, JSON.stringify([...dates, today]));
    }
  } catch {}
}

export async function fetchStreak(): Promise<StreakInfo> {
  try {
    const res = await fetch(`${getApiBase()}/api/streak`, { 
      cache: 'no-store',
      headers: getAuthHeaders()
    });
    if (res.ok) return res.json();
  } catch {}

  // Fallback: compute from localStorage dates
  try {
    const raw = localStorage.getItem(LS_STREAK);
    const dates: string[] = raw ? JSON.parse(raw).sort() : [];
    const today = new Date().toISOString().slice(0, 10);

    let current = 0;
    let check = new Date(today);
    for (let i = 0; i < 365; i++) {
      const d = check.toISOString().slice(0, 10);
      if (dates.includes(d)) { current++; check.setDate(check.getDate() - 1); }
      else break;
    }

    let longest = 0, run = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
      if (diff === 1) { run++; longest = Math.max(longest, run); } else run = 1;
    }
    if (dates.length === 1) longest = 1;
    longest = Math.max(longest, current);

    return { current, longest, total: dates.length, dates };
  } catch {}

  return { current: 0, longest: 0, total: 0, dates: [] };
}

// ── Score submission helpers ──────────────────────────────────────────────────

export async function submitTypingScore(wpm: number, accuracy: number, duration: number): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/typing/score`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ wpm, accuracy, duration }),
    });
  } catch {}
}

export async function submitAptitudeScore(category: string, score: number, total: number, time_taken: number): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/aptitude/score`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ category, score, total, time_taken }),
    });
  } catch {}
}
