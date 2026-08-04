// Advanced YouTube Learning Player — API Client
// All calls go through the same backend as the rest of the app.

import { auth } from './authService';

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

const headers = () => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  h['X-User-Id'] = auth.currentUser?.uid || 'local';
  return h;
};

const API = () => getApiBase();

// ── Types ────────────────────────────────────────────────────────────────────

export interface TimestampNote {
  id: number;
  course_id: string;
  part_id: number;
  video_id: string;
  timestamp_sec: number;
  content: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimestampBookmark {
  id: number;
  course_id: string;
  part_id: number;
  video_id: string;
  timestamp_sec: number;
  label: string;
  category: string;
  color: string;
  created_at: string;
}

export interface BookmarkCategory {
  name: string;
  color: string;
}

export interface WatchHistoryEntry {
  user_id: string;
  course_id: string;
  part_id: number;
  video_id: string;
  course_title: string | null;
  lesson_title: string | null;
  thumbnail_url: string | null;
  last_watched_at: string;
  resume_at: number;
  duration_seconds: number | null;
  percent_watched: number;
  is_completed: boolean;
}

export interface LearningStats {
  today_seconds: number;
  week_seconds: number;
  month_seconds: number;
  total_seconds: number;
  videos_watched: number;
  avg_daily_seconds: number;
  current_streak_days: number;
  active_days: number;
}

export interface PomodoroStats {
  today_sessions: number;
  today_minutes: number;
  today_hours: number;
}

// ── Watch Sessions ───────────────────────────────────────────────────────────

export async function startWatchSession(courseId: string, partId: number, videoId: string, durationSeconds?: number): Promise<number | null> {
  try {
    const res = await fetch(`${API()}/api/watch-session/start`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ courseId, partId, videoId, durationSeconds }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sessionId || null;
  } catch { return null; }
}

export async function endWatchSession(sessionId: number, watchSeconds: number, percentWatched: number, playbackSpeed = 1.0, completed = false): Promise<void> {
  try {
    await fetch(`${API()}/api/watch-session/${sessionId}/end`, {
      method: 'PUT', headers: headers(),
      body: JSON.stringify({ watchSeconds, percentWatched, playbackSpeed, completed }),
    });
  } catch {}
}

// ── Video Completion ─────────────────────────────────────────────────────────

export async function markVideoCompleted(courseId: string, partId: number, videoId: string, method: 'threshold' | 'manual' = 'threshold'): Promise<void> {
  try {
    await fetch(`${API()}/api/video-completion`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ courseId, partId, videoId, method }),
    });
  } catch {}
}

export async function checkVideoCompleted(courseId: string, partId: number): Promise<{ completed: boolean; completedAt: string | null }> {
  try {
    const res = await fetch(`${API()}/api/video-completion/${courseId}/${partId}`, { headers: headers() });
    if (res.ok) return res.json();
  } catch {}
  return { completed: false, completedAt: null };
}

// ── Watch History ─────────────────────────────────────────────────────────────

export async function upsertWatchHistory(entry: {
  courseId: string; partId: number; videoId: string;
  courseTitle?: string; lessonTitle?: string;
  resumeAt?: number; durationSeconds?: number;
  percentWatched?: number; isCompleted?: boolean;
}): Promise<void> {
  try {
    await fetch(`${API()}/api/watch-history`, {
      method: 'PUT', headers: headers(),
      body: JSON.stringify(entry),
    });
  } catch {}
}

export async function fetchWatchHistory(options?: { courseId?: string; search?: string; page?: number }): Promise<{ history: WatchHistoryEntry[]; total: number }> {
  try {
    const params = new URLSearchParams();
    if (options?.courseId) params.set('course_id', options.courseId);
    if (options?.search) params.set('search', options.search);
    if (options?.page) params.set('page', String(options.page));
    const res = await fetch(`${API()}/api/watch-history?${params}`, { headers: headers() });
    if (res.ok) return res.json();
  } catch {}
  return { history: [], total: 0 };
}

export async function deleteWatchHistoryEntry(courseId: string, partId: number): Promise<void> {
  try {
    await fetch(`${API()}/api/watch-history/${courseId}/${partId}`, { method: 'DELETE', headers: headers() });
  } catch {}
}

// ── Learning Stats ────────────────────────────────────────────────────────────

export async function fetchLearningStats(): Promise<LearningStats> {
  try {
    const res = await fetch(`${API()}/api/learning-stats`, { headers: headers() });
    if (res.ok) return res.json();
  } catch {}
  return { today_seconds: 0, week_seconds: 0, month_seconds: 0, total_seconds: 0, videos_watched: 0, avg_daily_seconds: 0, current_streak_days: 0, active_days: 0 };
}

// ── Timestamp Notes ───────────────────────────────────────────────────────────

export async function fetchTimestampNotes(courseId: string, partId: number): Promise<TimestampNote[]> {
  try {
    const res = await fetch(`${API()}/api/timestamp-notes?course=${courseId}&part=${partId}`, { headers: headers() });
    if (res.ok) return res.json();
  } catch {}
  return [];
}

export async function createTimestampNote(data: { courseId: string; partId: number; videoId: string; timestampSec: number; content: string; isDraft?: boolean }): Promise<TimestampNote | null> {
  try {
    const res = await fetch(`${API()}/api/timestamp-notes`, {
      method: 'POST', headers: headers(), body: JSON.stringify(data),
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

export async function updateTimestampNote(id: number, content: string, isDraft = false): Promise<TimestampNote | null> {
  try {
    const res = await fetch(`${API()}/api/timestamp-notes/${id}`, {
      method: 'PUT', headers: headers(), body: JSON.stringify({ content, isDraft }),
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

export async function deleteTimestampNote(id: number): Promise<void> {
  try {
    await fetch(`${API()}/api/timestamp-notes/${id}`, { method: 'DELETE', headers: headers() });
  } catch {}
}

// ── Timestamp Bookmarks ───────────────────────────────────────────────────────

export async function fetchTimestampBookmarks(courseId: string, partId?: number, category?: string): Promise<{ bookmarks: TimestampBookmark[]; categories: BookmarkCategory[] }> {
  try {
    const params = new URLSearchParams({ course: courseId });
    if (partId != null) params.set('part', String(partId));
    if (category) params.set('category', category);
    const res = await fetch(`${API()}/api/timestamp-bookmarks?${params}`, { headers: headers() });
    if (res.ok) return res.json();
  } catch {}
  return { bookmarks: [], categories: [] };
}

export async function createTimestampBookmark(data: { courseId: string; partId: number; videoId: string; timestampSec: number; label: string; category: string }): Promise<TimestampBookmark | null> {
  try {
    const res = await fetch(`${API()}/api/timestamp-bookmarks`, {
      method: 'POST', headers: headers(), body: JSON.stringify(data),
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

export async function updateTimestampBookmark(id: number, label: string, category: string): Promise<TimestampBookmark | null> {
  try {
    const res = await fetch(`${API()}/api/timestamp-bookmarks/${id}`, {
      method: 'PUT', headers: headers(), body: JSON.stringify({ label, category }),
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

export async function deleteTimestampBookmark(id: number): Promise<void> {
  try {
    await fetch(`${API()}/api/timestamp-bookmarks/${id}`, { method: 'DELETE', headers: headers() });
  } catch {}
}

// ── Pomodoro ─────────────────────────────────────────────────────────────────

export async function startPomodoroSession(courseId: string | null, partId: number | null, sessionType: 'work' | 'break', durationMinutes: number): Promise<number | null> {
  try {
    const res = await fetch(`${API()}/api/pomodoro/start`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ courseId, partId, sessionType, durationMinutes }),
    });
    if (res.ok) { const d = await res.json(); return d.sessionId; }
  } catch {}
  return null;
}

export async function completePomodoroSession(id: number, interrupted = false): Promise<void> {
  try {
    await fetch(`${API()}/api/pomodoro/${id}/complete`, {
      method: 'PUT', headers: headers(), body: JSON.stringify({ interrupted }),
    });
  } catch {}
}

export async function fetchPomodoroStats(): Promise<PomodoroStats> {
  try {
    const res = await fetch(`${API()}/api/pomodoro/stats`, { headers: headers() });
    if (res.ok) return res.json();
  } catch {}
  return { today_sessions: 0, today_minutes: 0, today_hours: 0 };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function formatSeconds(sec: number): string {
  if (!sec || sec < 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds/60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
