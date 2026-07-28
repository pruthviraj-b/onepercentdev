// Universal Smart Learning Task System — API client
// All data is stored in Supabase via the backend API.
// No localStorage fallback — database is the source of truth.

import { auth } from './firebase';

const getApiBase = () =>
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || window.location.origin
    : 'http://localhost:3001';

const getAuthHeaders = (extra: Record<string, string> = {}): Record<string, string> => ({
  'Content-Type': 'application/json',
  'X-User-Id': auth.currentUser?.uid || 'local',
  ...(auth.currentUser?.email ? { 'X-User-Email': auth.currentUser.email } : {}),
  ...extra,
});

const LOCAL_TASKS_KEY = 'opd_smart_tasks_local';

const emptyAnalytics: TaskAnalytics = {
  total_tasks: 0,
  completed_tasks: 0,
  completion_pct: 0,
  daily_streak: 0,
  weekly_streak: 0,
  study_hours: 0,
  most_studied_course: null,
  most_used_resource_type: null,
};

// ── Types ────────────────────────────────────────────────────────────────────

export type TaskType =
  | 'study' | 'watch_video' | 'read_article' | 'practice_coding'
  | 'complete_lesson' | 'assignment' | 'revision' | 'mock_test'
  | 'interview_prep' | 'build_project' | 'research' | 'custom';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type LinkType = 'internal' | 'external' | null;
export type InternalTarget =
  | 'course' | 'module' | 'lesson' | 'quiz' | 'assignment'
  | 'project' | 'practice_lab' | 'certificate' | 'dashboard' | null;

export type UrlResourceType =
  | 'youtube' | 'github' | 'pdf' | 'google_docs' | 'google_drive'
  | 'notion' | 'kaggle' | 'leetcode' | 'hackerrank' | 'medium'
  | 'website' | null;

export type RecurrenceRule = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | `custom_${number}`;

export interface SmartTask {
  id: number;
  user_id: string;
  title: string;
  description?: string | null;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  due_time?: string | null;
  estimated_duration_minutes?: number | null;
  recurrence_rule: RecurrenceRule;
  link_type?: LinkType;
  internal_link_target?: InternalTarget;
  internal_link_id?: string | null;
  internal_link_label?: string | null;
  external_url?: string | null;
  url_resource_type?: UrlResourceType;
  preview_title?: string | null;
  preview_favicon?: string | null;
  preview_thumbnail?: string | null;
  preview_domain?: string | null;
  preview_fetched_at?: string | null;
  course_id?: string | null;
  category?: string | null;
  personal_notes?: string | null;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type CreateTaskInput = Omit<SmartTask,
  'id' | 'user_id' | 'created_at' | 'updated_at' |
  'preview_title' | 'preview_favicon' | 'preview_thumbnail' | 'preview_domain' | 'preview_fetched_at'
>;

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface TaskAnalytics {
  total_tasks: number;
  completed_tasks: number;
  completion_pct: number;
  daily_streak: number;
  weekly_streak: number;
  study_hours: number;
  most_studied_course: string | null;
  most_used_resource_type: UrlResourceType | null;
}

export interface TasksPage {
  tasks: SmartTask[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type TimeFilter = 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'this_month' | 'all';

export interface FetchTasksParams {
  page?: number;
  pageSize?: number;
  timeFilter?: TimeFilter;
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  course_id?: string;
  category?: string;
  search?: string;
  includeArchived?: boolean;
}

export interface NotificationPreferences {
  browser_enabled: boolean;
  email_enabled: boolean;
  email_address: string;
  reminder_offsets_minutes: number[];
  daily_digest_enabled: boolean;
  daily_digest_time: string;
}

export interface ReminderStatus {
  emailConfigured: boolean;
  emailFrom: string;
  workerConfigured: boolean;
  preferencesSaved: boolean;
  emailEnabled: boolean;
  emailAddress: string;
  browserEnabled: boolean;
  dailyDigestEnabled: boolean;
}

export interface ReminderHistoryItem {
  id: number;
  task_id: number | null;
  channel: 'browser' | 'email' | 'push';
  scheduled_for: string;
  delivered_at: string;
  status: 'sent' | 'skipped' | 'failed';
  provider: string | null;
  error_message: string | null;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  browser_enabled: true,
  email_enabled: false,
  email_address: '',
  reminder_offsets_minutes: [10, 0],
  daily_digest_enabled: false,
  daily_digest_time: '08:00',
};

function canUseLocalTasks() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readLocalTasks(): SmartTask[] {
  if (!canUseLocalTasks()) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalTasks(tasks: SmartTask[]) {
  if (!canUseLocalTasks()) return;
  try {
    window.localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
  } catch {}
}

function getTaskDateTime(task: Pick<SmartTask, 'due_date' | 'due_time'>): Date | null {
  if (!task.due_date) return null;
  const time = task.due_time || '23:59';
  const date = new Date(`${task.due_date}T${time}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function matchesTimeFilter(task: SmartTask, filter: TimeFilter | undefined) {
  if (!filter || filter === 'all') return true;
  if (!task.due_date) return false;

  const today = todayStr();
  const due = new Date(`${task.due_date}T00:00:00`);
  const start = new Date(`${today}T00:00:00`);
  const diff = Math.round((due.getTime() - start.getTime()) / 86400000);

  if (filter === 'today') return diff === 0 || diff < 0;
  if (filter === 'tomorrow') return diff === 1;
  if (filter === 'this_week') return diff >= 0 && diff <= 7;
  if (filter === 'next_week') return diff > 7 && diff <= 14;
  if (filter === 'this_month') return due.getMonth() === start.getMonth() && due.getFullYear() === start.getFullYear();
  return true;
}

function filterLocalTasks(tasks: SmartTask[], params: FetchTasksParams = {}): SmartTask[] {
  const search = params.search?.toLowerCase().trim();
  return tasks
    .filter(t => params.includeArchived || !t.is_archived)
    .filter(t => matchesTimeFilter(t, params.timeFilter))
    .filter(t => !params.status || params.status === 'all' || t.status === params.status)
    .filter(t => !params.priority || params.priority === 'all' || t.priority === params.priority)
    .filter(t => !params.course_id || t.course_id === params.course_id)
    .filter(t => !params.category || t.category === params.category)
    .filter(t => !search || [t.title, t.description, t.personal_notes, ...(t.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(search))
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      const aDate = getTaskDateTime(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDate = getTaskDateTime(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (aDate !== bDate) return aDate - bDate;
      return b.updated_at.localeCompare(a.updated_at);
    });
}

function localTasksPage(params: FetchTasksParams = {}): TasksPage {
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const filtered = filterLocalTasks(readLocalTasks(), params);
  const start = (page - 1) * pageSize;
  return {
    tasks: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
    hasMore: start + pageSize < filtered.length,
  };
}

// ── URL Detection ────────────────────────────────────────────────────────────

export function detectUrlResourceType(url: string): UrlResourceType {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const path = u.pathname.toLowerCase();

    if (host === 'youtube.com' || host === 'youtu.be' || host.endsWith('.youtube.com')) return 'youtube';
    if (host === 'github.com') return 'github';
    if (path.endsWith('.pdf')) return 'pdf';
    if (host === 'docs.google.com') return 'google_docs';
    if (host === 'drive.google.com') return 'google_drive';
    if (host === 'notion.so' || host === 'notion.site' || host.endsWith('.notion.so') || host.endsWith('.notion.site')) return 'notion';
    if (host === 'kaggle.com' || host.endsWith('.kaggle.com')) return 'kaggle';
    if (host === 'leetcode.com') return 'leetcode';
    if (host === 'hackerrank.com') return 'hackerrank';
    if (host === 'medium.com' || host.endsWith('.medium.com')) return 'medium';
    return 'website';
  } catch {
    return 'website';
  }
}

export function getResourceIcon(type: UrlResourceType): string {
  const map: Record<string, string> = {
    youtube:      '▶️',
    github:       '🐙',
    pdf:          '📄',
    google_docs:  '📝',
    google_drive: '📁',
    notion:       '🗒️',
    kaggle:       '📊',
    leetcode:     '💻',
    hackerrank:   '⚡',
    medium:       '✍️',
    website:      '🌐',
  };
  return map[type || 'website'] ?? '🌐';
}

export function getTaskTypeLabel(type: TaskType): string {
  const map: Record<TaskType, string> = {
    study:           '📚 Study',
    watch_video:     '▶️ Watch Video',
    read_article:    '📖 Read Article',
    practice_coding: '💻 Practice Coding',
    complete_lesson: '✅ Complete Lesson',
    assignment:      '📝 Assignment',
    revision:        '🔄 Revision',
    mock_test:       '🧪 Mock Test',
    interview_prep:  '🎯 Interview Prep',
    build_project:   '🏗️ Build Project',
    research:        '🔬 Research',
    custom:          '⚡ Custom',
  };
  return map[type] ?? type;
}

export function getPriorityColor(priority: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    low:      '#888',
    medium:   '#555',
    high:     '#e67e22',
    critical: '#cc0000',
  };
  return map[priority];
}

export function getPriorityBg(priority: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    low:      '#f4f4f4',
    medium:   '#f4f1ea',
    high:     '#fff3e0',
    critical: '#fff0f0',
  };
  return map[priority];
}

// ── Date helpers ─────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function formatDueDate(due: string | null | undefined): { label: string; overdue: boolean; today: boolean } | null {
  if (!due) return null;
  const today = new Date(todayStr());
  const dueDate = new Date(due);
  const diff = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true, today: false };
  if (diff === 0) return { label: 'Due today', overdue: false, today: true };
  if (diff === 1) return { label: 'Due tomorrow', overdue: false, today: false };
  if (diff <= 7) return { label: `${diff}d left`, overdue: false, today: false };
  return { label: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false, today: false };
}

// ── Tasks CRUD ───────────────────────────────────────────────────────────────

export async function fetchTasks(params: FetchTasksParams = {}): Promise<TasksPage> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.timeFilter) qs.set('timeFilter', params.timeFilter);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.priority && params.priority !== 'all') qs.set('priority', params.priority);
  if (params.course_id) qs.set('course_id', params.course_id);
  if (params.category) qs.set('category', params.category);
  if (params.search) qs.set('search', params.search);
  if (params.includeArchived) qs.set('includeArchived', '1');

  try {
    const res = await fetch(`${getApiBase()}/api/smart-tasks?${qs}`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (!res.ok) return localTasksPage(params);
    return res.json();
  } catch {
    return localTasksPage(params);
  }
}

export async function createTask(input: CreateTaskInput): Promise<SmartTask> {
  try {
    const res = await fetch(`${getApiBase()}/api/smart-tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    });
    if (res.ok) return res.json();
    const err = await res.json().catch(() => ({}));
    if (err.error) throw new Error(err.error);
  } catch {
    // Fall through to local fallback.
  }

  const now = new Date().toISOString();
  const task: SmartTask = {
    ...input,
    id: -Date.now(),
    user_id: auth.currentUser?.uid || 'local',
    tags: input.tags || [],
    is_pinned: !!input.is_pinned,
    is_archived: !!input.is_archived,
    sort_order: input.sort_order || 0,
    created_at: now,
    updated_at: now,
  };
  writeLocalTasks([task, ...readLocalTasks()]);
  return task;
}

export async function updateTask(id: number, patch: UpdateTaskInput): Promise<SmartTask> {
  try {
    const res = await fetch(`${getApiBase()}/api/smart-tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(patch),
    });
    if (res.ok) return res.json();
    const err = await res.json().catch(() => ({}));
    if (err.error) throw new Error(err.error);
  } catch {
    // Fall through to local fallback.
  }

  const tasks = readLocalTasks();
  const existing = tasks.find(t => t.id === id);
  if (!existing) throw new Error('Task unavailable offline');
  const updated = { ...existing, ...patch, updated_at: new Date().toISOString() };
  writeLocalTasks(tasks.map(t => t.id === id ? updated : t));
  return updated;
}

export async function deleteTask(id: number): Promise<void> {
  try {
    const res = await fetch(`${getApiBase()}/api/smart-tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) return;
  } catch {}

  writeLocalTasks(readLocalTasks().filter(t => t.id !== id));
}

export async function duplicateTask(id: number): Promise<SmartTask> {
  try {
    const res = await fetch(`${getApiBase()}/api/smart-tasks/${id}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (res.ok) return res.json();
  } catch {}

  const original = readLocalTasks().find(t => t.id === id);
  if (!original) throw new Error('Task unavailable offline');
  const now = new Date().toISOString();
  const copy: SmartTask = { ...original, id: -Date.now(), title: `${original.title} (Copy)`, created_at: now, updated_at: now };
  writeLocalTasks([copy, ...readLocalTasks()]);
  return copy;
}

export async function bulkUpdateSortOrder(updates: { id: number; sort_order: number }[]): Promise<void> {
  try {
    const res = await fetch(`${getApiBase()}/api/smart-tasks/reorder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ updates }),
    });
    if (res.ok) return;
  } catch {}

  const orderMap = new Map(updates.map(u => [u.id, u.sort_order]));
  writeLocalTasks(readLocalTasks().map(t => orderMap.has(t.id) ? { ...t, sort_order: orderMap.get(t.id)!, updated_at: new Date().toISOString() } : t));
}

export async function fetchAnalytics(): Promise<TaskAnalytics> {
  try {
    const res = await fetch(`${getApiBase()}/api/smart-tasks/analytics`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (!res.ok) return emptyAnalytics;
    return res.json();
  } catch {
    const tasks = readLocalTasks();
    const completed = tasks.filter(t => t.status === 'completed').length;
    const studyMinutes = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.estimated_duration_minutes || 0), 0);
    return {
      ...emptyAnalytics,
      total_tasks: tasks.length,
      completed_tasks: completed,
      completion_pct: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      study_hours: Math.round((studyMinutes / 60) * 10) / 10,
    };
  }
}

export async function fetchLinkPreview(url: string): Promise<{
  title: string | null;
  favicon: string | null;
  thumbnail: string | null;
  domain: string | null;
} | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/link-preview`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const LOCAL_PREFS_KEY = 'opd_notification_preferences';

function readLocalNotificationPreferences(): NotificationPreferences {
  try {
    const raw = window.localStorage.getItem(LOCAL_PREFS_KEY);
    if (!raw) return { ...defaultNotificationPreferences, email_address: auth.currentUser?.email || '' };
    return { ...defaultNotificationPreferences, ...JSON.parse(raw) };
  } catch {
    return { ...defaultNotificationPreferences, email_address: auth.currentUser?.email || '' };
  }
}

function writeLocalNotificationPreferences(prefs: NotificationPreferences) {
  try { window.localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const res = await fetch(`${getApiBase()}/api/notification-preferences`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (res.ok) return { ...defaultNotificationPreferences, ...await res.json() };
  } catch {}
  return readLocalNotificationPreferences();
}

export async function saveNotificationPreferences(input: NotificationPreferences): Promise<NotificationPreferences> {
  const clean: NotificationPreferences = {
    ...defaultNotificationPreferences,
    ...input,
    reminder_offsets_minutes: Array.from(new Set(input.reminder_offsets_minutes || []))
      .filter(n => Number.isFinite(n) && n >= 0 && n <= 10080)
      .sort((a, b) => b - a),
  };
  writeLocalNotificationPreferences(clean);
  try {
    const res = await fetch(`${getApiBase()}/api/notification-preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(clean),
    });
    if (res.ok) return { ...defaultNotificationPreferences, ...await res.json() };
  } catch {}
  return clean;
}

export async function fetchReminderStatus(): Promise<ReminderStatus> {
  try {
    const res = await fetch(`${getApiBase()}/api/reminders/status`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (res.ok) return res.json();
  } catch {}
  return {
    emailConfigured: false,
    emailFrom: '',
    workerConfigured: false,
    preferencesSaved: false,
    emailEnabled: false,
    emailAddress: '',
    browserEnabled: false,
    dailyDigestEnabled: false,
  };
}

export async function fetchReminderHistory(): Promise<ReminderHistoryItem[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/reminders/history`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (res.ok) return res.json();
  } catch {}
  return [];
}

export async function sendTestReminderEmail(email_address: string): Promise<{
  ok: boolean;
  sent: boolean;
  provider: string;
  to: string;
  historySaved?: boolean;
}> {
  const res = await fetch(`${getApiBase()}/api/reminders/test-email`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email_address }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not send test email');
  return data;
}

// Notify task system when a lesson/quiz is completed for auto-status sync
export async function notifyLmsComplete(params: {
  internal_link_target: 'lesson' | 'quiz';
  internal_link_id: string;
}): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/smart-tasks/lms-complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
  } catch {}
}

export async function fetchUserTags(): Promise<string[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/smart-tasks/tags`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (!res.ok) return Array.from(new Set(readLocalTasks().flatMap(t => t.tags || []))).sort();
    return res.json();
  } catch {
    return Array.from(new Set(readLocalTasks().flatMap(t => t.tags || []))).sort();
  }
}
