// Student Analytics API — Admin only
import { auth } from './firebase';

const getApiBase = () => typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || window.location.origin)
  : 'http://localhost:3001';

const adminHeaders = (pwd: string) => ({
  'Content-Type': 'application/json',
  'X-Admin-Password': pwd,
});

const userHeaders = () => ({
  'Content-Type': 'application/json',
  'X-User-Id': auth.currentUser?.uid || 'local',
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StudentProfile {
  userId: string;
  displayName: string;
  email: string;
  photoUrl: string | null;
  joinedAt: string | null;
  lastSeenAt: string | null;
  isOnline: boolean;
  currentCourseId: string | null;
  currentPartId: number | null;
  currentVideoId: string | null;
  currentSessionSeconds: number;
}

export interface LearningTime {
  todaySecs: number;
  weekSecs: number;
  monthSecs: number;
  totalSecs: number;
}

export interface CourseProgressItem {
  courseId: string;
  courseTitle: string;
  thumbnail: string | null;
  lessonsCompleted: number;
  totalLessons: number;
  progressPct: number;
  timeSpentSeconds: number;
  lastOpenedAt: string | null;
}

export interface StudentStats {
  videosCompleted: number;
  lessonsCompleted: number;
  notesAdded: number;
  bookmarksAdded: number;
  currentStreak: number;
  totalActiveDays: number;
  pomodoroSessions: number;
}

export interface ActivityLogEntry {
  id: number;
  eventType: string;
  courseId: string | null;
  partId: number | null;
  meta: Record<string, any>;
  createdAt: string;
}

export interface StudentAnalytics {
  profile: StudentProfile;
  learningTime: LearningTime;
  courseProgress: CourseProgressItem[];
  stats: StudentStats;
  activityLogs: ActivityLogEntry[];
}

export interface StudentListItem {
  user_id: string;
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  last_seen_at: string | null;
  is_online: boolean;
  current_course_id: string | null;
  created_at: string | null;
  total_seconds?: number;
}

// ── Admin APIs ────────────────────────────────────────────────────────────────

export async function searchStudents(pwd: string, options?: {
  search?: string; filter?: string; page?: number;
}): Promise<{ students: StudentListItem[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.search) params.set('search', options.search);
  if (options?.filter) params.set('filter', options.filter);
  if (options?.page) params.set('page', String(options.page));
  try {
    const res = await fetch(`${getApiBase()}/api/admin/students?${params}`, {
      headers: adminHeaders(pwd),
    });
    if (res.ok) return res.json();
  } catch {}
  return { students: [], total: 0 };
}

export async function fetchStudentAnalytics(pwd: string, userId: string): Promise<StudentAnalytics | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/admin/students/${userId}/analytics`, {
      headers: adminHeaders(pwd),
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

export async function fetchStudentActivity(pwd: string, userId: string, page = 1): Promise<{ logs: ActivityLogEntry[]; total: number }> {
  try {
    const res = await fetch(`${getApiBase()}/api/admin/students/${userId}/activity?page=${page}`, {
      headers: adminHeaders(pwd),
    });
    if (res.ok) return res.json();
  } catch {}
  return { logs: [], total: 0 };
}

// ── Student-side: sync profile & activity on login ────────────────────────────

export async function syncUserProfile(userId: string, displayName: string, email: string, photoUrl: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/user-profile`, {
      method: 'POST',
      headers: userHeaders(),
      body: JSON.stringify({ userId, displayName, email, photoUrl }),
    });
  } catch {}
}

export async function logActivity(eventType: string, courseId?: string, partId?: number, videoId?: string, meta?: Record<string, any>): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/activity-log`, {
      method: 'POST',
      headers: userHeaders(),
      body: JSON.stringify({ eventType, courseId, partId, videoId, meta }),
    });
  } catch {}
}

export async function sendHeartbeat(courseId?: string, partId?: number, videoId?: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/user-heartbeat`, {
      method: 'POST',
      headers: userHeaders(),
      body: JSON.stringify({ courseId, partId, videoId, sessionStart: sessionStorage.getItem('session_start') }),
    });
  } catch {}
}

export async function markOffline(): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/user-offline`, { method: 'POST', headers: userHeaders() });
  } catch {}
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function formatSecs(sec: number): string {
  if (!sec || sec < 0) return '0m';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function relativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function eventLabel(eventType: string): string {
  const map: Record<string, string> = {
    lesson_start: 'Started lesson',
    lesson_complete: 'Completed lesson',
    video_play: 'Played video',
    video_pause: 'Paused video',
    note_added: 'Added timestamp note',
    bookmark_added: 'Bookmarked moment',
    progress_marked: 'Marked progress',
    login: 'Logged in',
    logout: 'Logged out',
    course_open: 'Opened course',
    quiz_complete: 'Completed quiz',
    pomodoro_complete: 'Finished Pomodoro',
  };
  return map[eventType] || eventType;
}

export function eventIcon(eventType: string): string {
  const map: Record<string, string> = {
    lesson_start: '▶',
    lesson_complete: '✅',
    video_play: '▶',
    video_pause: '⏸',
    note_added: '📝',
    bookmark_added: '🔖',
    progress_marked: '✓',
    login: '🔑',
    logout: '🚪',
    course_open: '📚',
    quiz_complete: '🧠',
    pomodoro_complete: '🍅',
  };
  return map[eventType] || '•';
}
