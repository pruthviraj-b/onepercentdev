'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/authentication/AuthProvider';
import {
  fetchTasks as fetchLegacyTasks, createTask as createLegacyTask,
  updateTask as updateLegacyTask, deleteTask as deleteLegacyTask,
  fetchStreak, pingStreak,
  Task, StreakInfo,
} from '@/services/learningService';
import { fetchProgress, fetchModules, fetchCourses, Course, fetchRecentActivity } from '@/services/courseService';
import { initVideos } from '@/features/video/videos';

// ── Type system ────────────────────────────────────────────────
const F = {
  display: "'Google Sans Flex', sans-serif",
  body:    "'Google Sans Flex', sans-serif",
  mono:    "'Google Sans Flex', sans-serif",
};

// ── Signal-deck token system (temple bronze / gold relief) ───────
// Kept your original "Monumental Mosaic" palette as the source of truth,
// then ADDED the missing tokens your JSX was already referencing
// (cyan/violet/green/amber/red + Dim variants) so nothing crashes,
// mapped onto colors that live in the same bronze/gold/teal family.
const C = {
  bg:        '#F7F8FB',
  surface:   '#FFFFFF',
  surfaceHi: '#FBFCFE',
  border:    '#E5E7EB',
  borderHi:  '#D1D5DB',
  text:      '#1F2937',
  textDim:   '#6B7280',
  textFaint: '#9CA3AF',
  cyan:      '#F98012',
  cyanDim:   'rgba(249,128,18,0.13)',
  violet:    '#3B82F6',
  violetDim: 'rgba(59,130,246,0.12)',
  green:     '#22C55E',
  greenDim:  'rgba(34,197,94,0.12)',
  amber:     '#F59E0B',
  red:       '#EF4444',
  onAccent:  '#FFFFFF',
  accent:    '#F98012',
  accentHi:  '#D96B0A',
  accentDim: 'rgba(249,128,18,0.13)',
  bgGrid:    'rgba(249,128,18,0.04)',
  success:   '#22C55E',
  warning:   '#F59E0B',
  error:     '#EF4444',
  info:      '#3B82F6',
};

const HIDDEN_COURSE_IDS = ['data-analyst', 'data-analyst-en'];

function getCourseLogoUrl(mascot?: string, id?: string): string | null {
  const val = `${mascot || ''} ${id || ''}`.toLowerCase();
  if (val.includes('snake') || val.includes('python')) return '/logos/python-neo.svg';
  if (val.includes('cloud')) return '/logos/cloud-neo.svg';
  if (val.includes('excel')) return '/logos/excel-neo.svg';
  if (val.includes('dashboard')) return '/logos/dashboard-neo.svg';
  if (val.includes('aptitude') || val.includes('apti')) return '/logos/aptitude-neo.svg';
  if (val.includes('typing')) return '/logos/typing-neo.svg';
  if (val.includes('task') || val.includes('taskhub') || val.includes('hub')) return '/logos/tasks-neo.svg';
  if (val.includes('data-analyst') || val.includes('data analyst') || val.includes('analyst') || val.includes('chart')) return '/logos/analytics-neo.svg';
  if (val.includes('database') || val.includes('sql')) return '/logos/sql-neo.svg';
  return null;
}

function getCourseEmoji(mascot?: string, id?: string): string {
  if (!mascot && !id) return '📘';
  const val = (mascot || id || '').toLowerCase();
  if (val.includes('snake') || val.includes('python')) return '🐍';
  if (val.includes('cloud')) return '☁️';
  if (val.includes('excel')) return '📊';
  if (val.includes('database') || val.includes('sql')) return '🗄️';
  if (val.includes('chart') || val.includes('analyst') || val.includes('data')) return '📈';
  if (mascot && mascot.length <= 4 && !/^[a-z]+$/i.test(mascot)) return mascot;
  return '📘';
}

function getCourseIcon(mascot?: string, id?: string): string {
  return getCourseEmoji(mascot, id);
}

type IconName = 'home' | 'keyboard' | 'spark' | 'book' | 'resource' | 'menu' | 'check' | 'arrow' | 'close';

function Icon({ name, size = 16, stroke = 1.8 }: { name: IconName; size?: number; stroke?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></>,
    keyboard: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h.01M10 9h.01M13 9h.01M16 9h.01M7 13h.01M10 13h.01M13 13h.01M16 13h.01" /><path d="M7 16h10" /></>,
    spark: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></>,
    resource: <><path d="M5 4h10l4 4v12H5z" /><path d="M15 4v5h4M8 13h8M8 17h6" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function CourseLogoImg({ mascot, id, size = 28 }: { mascot?: string; id?: string; size?: number }) {
  const url = getCourseLogoUrl(mascot, id);
  if (url) {
    return <img src={url} alt="" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />;
  }
  return <Icon name={id?.includes('typing') ? 'keyboard' : id?.includes('task') ? 'check' : 'book'} size={size * 0.72} />;
}

interface CourseProgress { id: string; label: string; icon: string; completed: number; total: number; }
interface DashboardProps { onNavigate: (module: string) => void; onOpenTaskHub?: () => void; }

const BRAND_TITLE = '1% Dev Academy';

export interface DashboardBootstrapData {
  tasks: Task[];
  streak: StreakInfo;
  courses: Course[];
  recentActivity: { courseId: string; partId: number } | null;
  courseProgress: CourseProgress[];
}

let dashboardBootstrapPromise: Promise<DashboardBootstrapData> | null = null;
let dashboardBootstrapSnapshot: DashboardBootstrapData | null = null;

/**
 * Starts every dashboard read together and shares the result between the
 * authenticated shell and the Dashboard component. This prevents the splash
 * screen and the dashboard from creating two sequential loading phases.
 */
export function preloadDashboardData(): Promise<DashboardBootstrapData> {
  if (dashboardBootstrapPromise) return dashboardBootstrapPromise;

  dashboardBootstrapPromise = (async () => {
    // Start every request that does not depend on the course list immediately.
    // Progress requests begin as soon as the course list resolves instead of
    // waiting for the other dashboard requests to finish first.
    const tasksPromise = fetchLegacyTasks();
    const streakPromise = fetchStreak();
    const coursesPromise = fetchCourses();
    const recentActivityPromise = fetchRecentActivity();
    const videosPromise = Promise.resolve(initVideos()).catch(() => undefined);
    const progressPromise = coursesPromise.then(courses => {
      const dashboardCourses = courses.filter(course => !HIDDEN_COURSE_IDS.includes(course.id));
      return Promise.all(dashboardCourses.map(course => fetchModulesAndProgress(course.id)));
    });

    const [tasks, streak, courses, recentActivity, progressResults] = await Promise.all([
      tasksPromise,
      streakPromise,
      coursesPromise,
      recentActivityPromise,
      progressPromise,
      videosPromise,
    ]);

    const dashboardCourses = courses.filter(course => !HIDDEN_COURSE_IDS.includes(course.id));
    const courseProgress = dashboardCourses.map((course, index) => ({
      id: course.id,
      label: course.title,
      icon: getCourseIcon(course.mascot, course.id),
      ...progressResults[index],
    }));

    const data = { tasks, streak, courses, recentActivity, courseProgress };
    dashboardBootstrapSnapshot = data;
    return data;
  })().catch(() => {
    const fallback: DashboardBootstrapData = {
      tasks: [],
      streak: { current: 0, longest: 0, total: 0, dates: [] },
      courses: [],
      recentActivity: null,
      courseProgress: [],
    };
    dashboardBootstrapSnapshot = fallback;
    return fallback;
  });

  return dashboardBootstrapPromise;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function formatDue(due: string | null | undefined): { label: string; overdue: boolean } | null {
  if (!due) return null;
  const today = new Date(todayStr());
  const dueDate = new Date(due);
  const diff = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: 'Due today', overdue: false };
  if (diff === 1) return { label: 'Due tomorrow', overdue: false };
  return { label: `Due in ${diff}d`, overdue: false };
}

function topbarDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function Dashboard({ onNavigate, onOpenTaskHub }: DashboardProps) {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => dashboardBootstrapSnapshot?.tasks ?? []);
  const [tasksLoading, setTasksLoading] = useState(() => !dashboardBootstrapSnapshot);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePopoverPosition, setProfilePopoverPosition] = useState<{ left: number; top?: number; bottom?: number }>({ left: 12, bottom: 84 });
  const [imgError, setImgError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar toggle
  const profileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const heroLogoRef = useRef<HTMLVideoElement>(null);
  const [streak, setStreak] = useState<StreakInfo>(() => dashboardBootstrapSnapshot?.streak ?? { current: 0, longest: 0, total: 0, dates: [] });
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>(() => dashboardBootstrapSnapshot?.courseProgress ?? []);
  const [coursesList, setCoursesList] = useState<Course[]>(() => dashboardBootstrapSnapshot?.courses ?? []);
  const [statsLoading, setStatsLoading] = useState(() => !dashboardBootstrapSnapshot);
  const [displayStreak, setDisplayStreak] = useState(0);
  const [recentActivity, setRecentActivity] = useState<{ courseId: string; partId: number } | null>(() => dashboardBootstrapSnapshot?.recentActivity ?? null);

  useEffect(() => {
    const video = heroLogoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    const keepPlaying = () => { void video.play().catch(() => undefined); };
    keepPlaying();
    video.addEventListener('loadeddata', keepPlaying);
    video.addEventListener('canplay', keepPlaying);
    document.addEventListener('visibilitychange', keepPlaying);
    return () => {
      video.removeEventListener('loadeddata', keepPlaying);
      video.removeEventListener('canplay', keepPlaying);
      document.removeEventListener('visibilitychange', keepPlaying);
    };
  }, []);

  useEffect(() => {
    let active = true;
    void preloadDashboardData().then(data => {
      if (!active) return;
      setTasks(data.tasks);
      setStreak(data.streak);
      setCoursesList(data.courses);
      setRecentActivity(data.recentActivity);
      setCourseProgress(data.courseProgress);
      setTasksLoading(false);
      setStatsLoading(false);
      pingStreak();
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (statsLoading) return;
    const target = Math.max(0, streak.current);
    let current = 0;
    const increment = target > 0 ? Math.max(1, Math.ceil(target / 16)) : 1;
    const intervalId = window.setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayStreak(target);
        window.clearInterval(intervalId);
      } else {
        setDisplayStreak(current);
      }
    }, 45);
    return () => window.clearInterval(intervalId);
  }, [statsLoading, streak.current]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const updatePopoverPosition = () => {
      const anchor = profileRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const estimatedHeight = 300;
      const gap = 8;
      const left = Math.max(8, Math.min(anchor.left + 12, window.innerWidth - 252));
      if (anchor.bottom + estimatedHeight + gap <= window.innerHeight) {
        setProfilePopoverPosition({ left, top: anchor.bottom + gap });
      } else {
        setProfilePopoverPosition({ left, bottom: Math.max(8, window.innerHeight - anchor.top + gap) });
      }
    };
    updatePopoverPosition();
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    return () => {
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [profileMenuOpen]);

  useEffect(() => { if (showAddTask && inputRef.current) inputRef.current.focus(); }, [showAddTask]);

  const handleToggleTask = useCallback(async (id: number) => {
    const task = tasks.find(t => t.id === id); if (!task) return;
    const newDone = !task.done;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t));
    await updateLegacyTask(id, { done: newDone });
    if (newDone) pingStreak();
  }, [tasks]);

  const handleDeleteTask = useCallback(async (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteLegacyTask(id);
  }, []);

  const handleAddTask = useCallback(async () => {
    const text = newTaskText.trim(); if (!text) return;
    const task = await createLegacyTask(text, newTaskDue || undefined);
    if (task) setTasks(prev => [...prev, task]);
    setNewTaskText(''); setNewTaskDue(''); setShowAddTask(false); pingStreak();
  }, [newTaskText, newTaskDue]);

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTask();
    if (e.key === 'Escape') { setShowAddTask(false); setNewTaskText(''); setNewTaskDue(''); }
  };

  const completedTasks = tasks.filter(t => t.done).length;
  const progressPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const overdueTasks = tasks.filter(t => !t.done && t.due_date && new Date(t.due_date) < new Date(todayStr())).length;
  const displayName = user?.displayName || '1%';
  const firstName = displayName.split(' ')[0];
  const photoURL = user?.photoURL && !imgError ? user.photoURL : null;
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '1%';
  const greeting = (() => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; })();
  const isActiveToday = streak.dates.includes(todayStr());

  const visibleCourses = coursesList.filter(c => !c.parentId && !HIDDEN_COURSE_IDS.includes(c.id));
  const ringColors = [C.cyan, C.violet, C.green, C.amber];
  const visibleProgress = courseProgress.filter(cp => !HIDDEN_COURSE_IDS.includes(cp.id));
  const totalLessons = visibleProgress.reduce((sum, course) => sum + course.total, 0);
  const completedLessons = visibleProgress.reduce((sum, course) => sum + course.completed, 0);
  const learningPct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const activeCourse = recentActivity
    ? coursesList.find(course => course.id === recentActivity.courseId)
    : coursesList.find(course => !course.parentId && !HIDDEN_COURSE_IDS.includes(course.id));
  const activeCourseProgress = activeCourse ? courseProgress.find(course => course.id === activeCourse.id) : undefined;
  const nextLessonLabel = recentActivity ? `Part ${recentActivity.partId}` : activeCourseProgress ? `Lesson ${activeCourseProgress.completed + 1}` : 'Choose a course';

  return (
    <div className="dash-root" style={{ height: '100dvh', minHeight: 0, overflow: 'hidden', background: C.bg, fontFamily: F.body, display: 'flex', color: C.text }}>
      <style>{`
:root {
          /* ── Global CSS variable mirror of the C token object ──
             Use these anywhere in your app's plain CSS/Tailwind config
             so JS and CSS stay in sync. */
          --bg: ${C.bg};
          --bg-grid: ${C.bgGrid};
          --surface: ${C.surface};
          --surface-hi: ${C.surfaceHi};
          --border: ${C.border};
          --border-hi: ${C.borderHi};
          --text: ${C.text};
          --text-dim: ${C.textDim};
          --text-faint: ${C.textFaint};
          --accent: ${C.accent};
          --accent-hi: ${C.accentHi};
          --accent-dim: ${C.accentDim};
          --on-accent: ${C.onAccent};
          --success: ${C.success};
          --warning: ${C.warning};
          --error: ${C.error};
          --info: ${C.info};
          --cyan: ${C.cyan};
          --violet: ${C.violet};
          --green: ${C.green};
          --amber: ${C.amber};
          --red: ${C.red};
          --font-display: ${F.display};
          --font-body: ${F.body};
          --font-mono: ${F.mono};
          --radius-sm: 9px;
          --radius-md: 12px;
          --radius-lg: 18px;
        }

        * { box-sizing: border-box; }
        button:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
        button { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.borderHi}; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }

        @keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 0 0 var(--accent-dim); } 50% { box-shadow: 0 0 0 6px transparent; } }

        /* ── Buttons ───────────────────────────────────────── */
        .btn {
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 0.78rem;
          border-radius: var(--radius-sm);
          padding: 9px 18px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease, border-color 120ms ease;
        }
        .btn:active { transform: scale(0.97); }
        .btn-primary {
          background: var(--accent);
          color: var(--on-accent);
        }
        .btn-primary:hover { background: var(--accent-hi); box-shadow: 0 4px 16px var(--accent-dim); }
        .btn-ghost {
          background: transparent;
          color: var(--text);
          border-color: var(--border-hi);
        }
        .btn-ghost:hover { background: var(--surface-hi); border-color: var(--accent); }

        /* Keep dashboard actions on the signal-deck palette even when the
           legacy global button styles are loaded after this component. */
        .dash-root .btn-primary {
          background: var(--accent) !important;
          color: var(--on-accent) !important;
          border-color: var(--accent) !important;
        }
        .dash-root .btn-primary:hover {
          background: var(--accent-hi) !important;
          box-shadow: 0 4px 16px var(--accent-dim) !important;
        }
        .dash-root .btn-ghost {
          background: var(--surface-hi) !important;
          color: var(--text) !important;
          border-color: var(--border-hi) !important;
        }
        .dash-root .btn-ghost:hover {
          background: var(--surface) !important;
          border-color: var(--accent) !important;
        }

        /* ── Cards ─────────────────────────────────────────── */
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }
        .card-hover:hover {
          border-color: var(--border-hi);
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(31,41,55,0.09);
        }
        .hero-card { box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 18px 44px rgba(31,41,55,0.08); }
        .course-progress-card { position: relative; overflow: hidden; }
        .course-progress-card::after { content: ''; position: absolute; inset: auto -18px -34px auto; width: 84px; height: 84px; border-radius: 50%; background: var(--accent-dim); filter: blur(8px); opacity: .7; pointer-events: none; }
        .course-progress-aurora { position: relative; isolation: isolate; }
        .course-progress-aurora::before { content: ''; position: absolute; inset: -80px 4% auto; height: 160px; border-radius: 50%; background: radial-gradient(circle, rgba(249,128,18,.13), rgba(113,92,255,.08) 42%, transparent 72%); filter: blur(22px); pointer-events: none; }
        .course-progress-aurora-card { background: linear-gradient(145deg, rgba(255,255,255,.94), rgba(248,250,255,.78)) !important; border-color: rgba(255,255,255,.92) !important; box-shadow: 0 12px 28px rgba(31,41,55,.07), inset 0 1px 0 rgba(255,255,255,.92) !important; backdrop-filter: blur(16px); }
        .course-progress-aurora-card:hover { border-color: rgba(249,128,18,.42) !important; box-shadow: 0 18px 36px rgba(31,41,55,.12), 0 0 0 4px rgba(249,128,18,.06) !important; }
        .course-progress-aurora-ring { display: grid; place-items: center; border-radius: 50%; background: radial-gradient(circle at 35% 25%, rgba(255,255,255,.95), rgba(245,247,252,.72)); box-shadow: 0 8px 18px rgba(83,96,128,.12), inset 0 1px 2px rgba(255,255,255,.95); }
        .course-progress-aurora-icon { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid rgba(255,255,255,.9); border-radius: 50%; background: rgba(255,255,255,.74); box-shadow: 0 4px 12px rgba(31,41,55,.08); }
        .course-progress-bar-track { height: 10px; padding: 1px; overflow: hidden; border: 1px solid ${C.border}; border-radius: 4px; background: ${C.surface}; box-sizing: border-box; }
        .course-progress-bar-fill { height: 100%; min-width: 0; border-radius: 2px; transition: width .35s ease; }
        .course-progress-card > div:nth-child(n+3) { display: none !important; }
        .profile-popover { position: fixed; z-index: 1000; width: 236px; max-width: calc(100vw - 16px); max-height: calc(100dvh - 16px); overflow-y: auto; padding: 10px; box-sizing: border-box; border: 1px solid rgba(255,255,255,.95); border-radius: 18px; background: rgba(255,255,255,.96); box-shadow: 0 18px 48px rgba(31,41,55,.16), 0 0 0 4px rgba(249,128,18,.04); backdrop-filter: blur(20px); animation: profilePopoverIn 180ms var(--ease); }
        .profile-popover-head { display: flex; align-items: center; gap: 10px; padding: 8px; }
        .profile-popover-head img, .profile-popover-avatar { width: 42px; height: 42px; flex: 0 0 42px; border-radius: 13px; object-fit: cover; }
        .profile-popover-avatar { display: grid; place-items: center; background: var(--accent-dim); color: var(--accent); font-weight: 800; }
        .profile-popover-head strong, .profile-popover-head span, .profile-popover-head em { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .profile-popover-head strong { color: var(--text); font-size: .82rem; }
        .profile-popover-head span { margin-top: 2px; color: var(--text-dim); font-size: .65rem; }
        .profile-popover-head em { margin-top: 5px; color: var(--success); font-size: .61rem; font-style: normal; }
        .profile-popover-head em i { display: inline-block; width: 6px; height: 6px; margin-right: 4px; border-radius: 50%; background: var(--success); }
        .profile-popover-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin: 6px 0; padding: 8px 4px; border-block: 1px solid var(--border); }
        .profile-popover-stats div { text-align: center; }
        .profile-popover-stats strong, .profile-popover-stats span { display: block; }
        .profile-popover-stats strong { color: var(--text); font-size: .82rem; }
        .profile-popover-stats span { margin-top: 2px; color: var(--text-faint); font-size: .55rem; text-transform: uppercase; letter-spacing: .06em; }
        .profile-menu-action, .profile-menu-grid button { display: flex; align-items: center; gap: 8px; width: 100%; border: 0; border-radius: 10px; cursor: pointer; font: 600 .69rem var(--font-body); text-align: left; }
        .profile-menu-action { padding: 10px; }
        .profile-menu-action-primary { justify-content: flex-start; background: var(--accent-dim); color: var(--accent); }
        .profile-menu-action-primary svg:last-child { margin-left: auto; }
        .profile-menu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin: 5px 0; }
        .profile-menu-grid button { padding: 8px 7px; background: transparent; color: var(--text-dim); }
        .profile-menu-grid button:hover { background: var(--surface-soft); color: var(--text); }
        .profile-menu-signout { color: var(--error); border-top: 1px solid var(--border); border-radius: 0; padding-top: 11px; }
        @keyframes profilePopoverIn { from { opacity: 0; transform: translateY(5px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .profile-page { position: fixed; inset: 0; z-index: 700; overflow: auto; background: rgba(247,248,251,.96); backdrop-filter: blur(18px); animation: profilePageIn 220ms var(--ease); }
        .profile-page-inner { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 28px 0 56px; }
        .profile-page-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
        .profile-back { display: inline-flex; align-items: center; gap: 8px; border: 0; background: transparent; color: var(--text-dim); cursor: pointer; font-weight: 700; }
        .profile-close { display: inline-grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--border); border-radius: 11px; background: #fff; color: var(--text-dim); cursor: pointer; }
        .profile-hero { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 28px; border: 1px solid rgba(255,255,255,.95); border-radius: 24px; background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(245,247,255,.82)); box-shadow: 0 18px 44px rgba(31,41,55,.08); }
        .profile-hero::after { content: ''; position: absolute; width: 260px; height: 260px; right: -80px; top: -130px; border-radius: 50%; background: radial-gradient(circle, rgba(249,128,18,.18), transparent 68%); pointer-events: none; }
        .profile-identity { position: relative; z-index: 1; display: flex; align-items: center; gap: 18px; min-width: 0; }
        .profile-identity img, .profile-avatar-large { width: 88px; height: 88px; flex: 0 0 88px; border-radius: 24px; object-fit: cover; box-shadow: 0 10px 24px rgba(31,41,55,.12); }
        .profile-avatar-large { display: grid; place-items: center; background: linear-gradient(135deg, var(--accent), #ffb15c); color: #fff; font-size: 1.5rem; font-weight: 800; }
        .profile-kicker { color: var(--accent); font: 700 .62rem var(--font-mono); letter-spacing: .12em; text-transform: uppercase; }
        .profile-name { margin-top: 5px; color: var(--text); font-size: clamp(1.5rem, 4vw, 2.35rem); letter-spacing: -.05em; }
        .profile-email { margin-top: 4px; color: var(--text-dim); font-size: .83rem; }
        .profile-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 11px; }
        .profile-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 8px; border-radius: 99px; background: var(--accent-dim); color: var(--accent); font-size: .62rem; font-weight: 700; }
        .profile-badge-success { background: var(--green-dim); color: var(--green); }
        .profile-hero-actions { position: relative; z-index: 1; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
        .profile-section-title { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin: 28px 0 12px; }
        .profile-section-title h2 { font-size: 1rem; }
        .profile-section-title span { color: var(--text-faint); font-size: .68rem; }
        .profile-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .profile-metric { padding: 16px; border: 1px solid var(--border); border-radius: 16px; background: #fff; box-shadow: var(--shadow-sm); }
        .profile-metric-label { color: var(--text-faint); font-size: .63rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
        .profile-metric-value { margin-top: 8px; color: var(--text); font-size: 1.35rem; font-weight: 800; letter-spacing: -.04em; }
        .profile-metric-detail { margin-top: 3px; color: var(--text-dim); font-size: .68rem; }
        .profile-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(280px, .8fr); gap: 14px; }
        .profile-card { padding: 18px; border: 1px solid var(--border); border-radius: 18px; background: #fff; box-shadow: var(--shadow-sm); }
        .profile-card h3 { font-size: .88rem; }
        .profile-card-subtitle { margin-top: 3px; color: var(--text-faint); font-size: .7rem; }
        .profile-course-row { display: flex; align-items: center; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--border); }
        .profile-course-row:last-child { border-bottom: 0; padding-bottom: 0; }
        .profile-course-icon { display: grid; place-items: center; width: 38px; height: 38px; flex: 0 0 38px; border-radius: 12px; background: var(--accent-dim); color: var(--accent); }
        .profile-course-copy { min-width: 0; flex: 1; }
        .profile-course-copy strong, .profile-course-copy span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .profile-course-copy strong { color: var(--text); font-size: .78rem; }
        .profile-course-copy span { margin-top: 3px; color: var(--text-dim); font-size: .66rem; }
        .profile-course-progress { width: 110px; flex: 0 0 110px; }
        .profile-course-progress-track { height: 6px; overflow: hidden; border-radius: 99px; background: var(--surface-soft); }
        .profile-course-progress-track i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent), #ffb15c); }
        .profile-course-progress small { display: block; margin-top: 4px; color: var(--text-faint); font-size: .6rem; text-align: right; }
        .profile-activity { display: grid; gap: 13px; margin-top: 15px; }
        .profile-activity-item { display: flex; gap: 10px; align-items: flex-start; color: var(--text-dim); font-size: .72rem; }
        .profile-activity-dot { width: 8px; height: 8px; margin-top: 4px; flex: 0 0 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px var(--accent-dim); }
        @keyframes profilePageIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 820px) { .profile-hero { align-items: flex-start; flex-direction: column; } .profile-hero-actions { justify-content: flex-start; } .profile-metrics { grid-template-columns: repeat(2, 1fr); } .profile-grid { grid-template-columns: 1fr; } }
        @media (max-width: 520px) { .profile-page-inner { width: min(100% - 24px, 1120px); padding-top: 16px; } .profile-identity { align-items: flex-start; flex-direction: column; } .profile-identity img, .profile-avatar-large { width: 72px; height: 72px; flex-basis: 72px; } .profile-course-row { align-items: flex-start; flex-wrap: wrap; } .profile-course-progress { width: calc(100% - 50px); margin-left: 50px; flex-basis: calc(100% - 50px); } }

        /* ── Nav / sidebar items ───────────────────────────── */
        .nav-item {
          position: relative;
          transition: background 120ms ease, color 120ms ease, padding-left 120ms ease;
        }
        .nav-item:hover { padding-left: 16px; }
        .nav-item.active::before {
          content: '';
          position: absolute; left: -10px; top: 50%; transform: translateY(-50%);
          width: 3px; height: 60%; border-radius: 2px; background: var(--accent);
        }

        /* ── Mobile sidebar drawer ─────────────────────────── */
        .dash-sidebar {
          transition: transform 220ms ease;
        }
        .sidebar-scrim {
          display: none;
        }

        /* ── Responsive breakpoints ────────────────────────── */
        @media (max-width: 1080px) {
          .dash-main { padding: 22px !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tasks-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 768px) {
          .dash-unified-header { margin-left: 0 !important; width: 100% !important; }
          .dash-topbar-left { transform: none !important; }
          .dash-sidebar {
            position: fixed !important;
            top: 46px !important;
            height: calc(100dvh - 46px) !important;
            margin: 0 !important;
            border-radius: 0 !important;
            border: 0 !important;
            padding-top: 0 !important;
            z-index: 500;
            transform: translateX(-100%);
            box-shadow: 0 0 40px rgba(0,0,0,0.5) !important;
          }
          .dash-sidebar.open { transform: translateX(0); }
          .sidebar-scrim.open {
            display: block;
            position: fixed; top: 46px; right: 0; bottom: 0; left: 0; background: rgba(0,0,0,0.6);
            z-index: 490;
          }
          .dash-topbar-date { display: none !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .dash-main { padding: 16px !important; }
          .hero-card { padding: 18px !important; }
          .mobile-menu-btn { display: inline-flex !important; }
          .dash-workspace { margin: 0 !important; border-radius: 0 !important; border: 0 !important; }
        }

        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }

        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          h1.hero-title { font-size: 1.6rem !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
        }
      `}</style>

      <div className={`sidebar-scrim ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ══════════ MERGED PANEL WRAPPER ══════════ */}
      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: '260px', flexShrink: 0, background: C.bg,
        margin: 0, borderRadius: 0, border: 'none', borderRight: `1px solid ${C.border}`, boxShadow: 'none',
        display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 0, top: 0, left: 0, overflow: 'hidden'
      }}>
        <div className="dash-brand-panel" style={{ flexShrink: 0, height: '18px', padding: 0, boxSizing: 'border-box' }} />
        <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
          <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 12px 6px' }}>Courses</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', marginBottom: '4px' }}>
            {visibleCourses.map(c => (
              <SideItemLogo key={c.id} mascot={c.mascot} courseId={c.id} label={c.title} iconOnly onClick={() => onNavigate(`course_${c.id}`)} />
            ))}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 12px 6px' }}>Training</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
            <SideItemLogo mascot="typing" courseId="typing" label="Typing" iconOnly iconName="keyboard" onClick={() => onNavigate('typing')} />
            <SideItemLogo mascot="aptitude" courseId="aptitude" label="Aptitude" iconOnly iconName="spark" onClick={() => onNavigate('aptitude')} />
            {onOpenTaskHub && <SideItemLogo mascot="taskhub" courseId="taskhub" label="Task Hub" iconOnly iconName="check" onClick={onOpenTaskHub} />}
          </div>
        </nav>

        <div ref={profileRef} style={{ position: 'relative', padding: '12px' }}>
          <button onClick={() => setProfileMenuOpen(o => !o)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            background: profileMenuOpen ? C.surfaceHi : 'transparent', border: 'none', borderRadius: '8px',
            padding: '8px 8px', cursor: 'pointer', textAlign: 'left',
          }}>
            {photoURL
              ? <img src={photoURL} alt="" onError={() => setImgError(true)} style={{ width: '30px', height: '30px', borderRadius: '7px', objectFit: 'cover' }} />
              : <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: C.cyanDim, color: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.68rem', fontFamily: F.display, flexShrink: 0 }}>{initials}</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: '0.8rem', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontFamily: F.mono, fontSize: '0.62rem', color: C.textFaint }}>{isActiveToday ? 'online' : 'offline'}</div>
            </div>
          </button>
          {profileMenuOpen && (
            <div className="profile-popover" role="menu" style={profilePopoverPosition}>
              <div className="profile-popover-head">
                {photoURL ? <img src={photoURL} alt="" /> : <div className="profile-popover-avatar">{initials}</div>}
                <div style={{ minWidth: 0 }}>
                  <strong>{displayName}</strong>
                  <span>{user?.email || 'Student account'}</span>
                  <em><i /> {isActiveToday ? 'Online now' : 'Ready to learn'}</em>
                </div>
              </div>
              <div className="profile-popover-stats">
                <div><strong>{learningPct}%</strong><span>Progress</span></div>
                <div><strong>{streak.current}d</strong><span>Streak</span></div>
                <div><strong>{visibleCourses.length}</strong><span>Courses</span></div>
              </div>
              <button className="profile-menu-action profile-menu-action-primary" onClick={() => { setProfileOpen(true); setProfileMenuOpen(false); }}><Icon name="spark" size={15} /> View full profile <Icon name="arrow" size={14} /></button>
              <div className="profile-menu-grid">
                <button onClick={() => onNavigate('academy')}><Icon name="book" size={15} /> Continue learning</button>
                <button onClick={() => {}}><Icon name="resource" size={15} /> My notes</button>
                <button onClick={() => {}}><Icon name="check" size={15} /> Certificates</button>
                <button onClick={() => {}}><Icon name="spark" size={15} /> Settings</button>
              </div>
              <button className="profile-menu-action profile-menu-signout" onClick={() => { logout(); setProfileMenuOpen(false); }}><Icon name="close" size={15} /> Sign out</button>
            </div>
          )}
        </div>
      </aside>

      {/* ══════════ MAIN COLUMN ══════════ */}
      {/* ══════════ MAIN COLUMN ══════════ */}
      <div className="dash-workspace" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, background: C.bg, margin: 0, borderRadius: 0, border: 'none', overflow: 'hidden' }}>


        <main className="dash-main" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: '18px 32px 44px' }}>

          {/* Hero: greeting + heatmap */}
          <section className="hero-grid" style={{
            display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '18px', marginBottom: '16px',
            animation: 'fadeUp 0.4s ease',
          }}>
            <div className="hero-card" style={{
              background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceHi})`, border: `1px solid ${C.border}`,
              borderRadius: '14px', padding: '26px 28px', position: 'relative', overflow: 'hidden',
            }}>
              <div className="dash-hero-brand">1% DEV ACADEMY</div>
              <div style={{
                position: 'absolute', top: '-40%', right: '-10%', width: '260px', height: '260px', borderRadius: '50%',
                background: `radial-gradient(circle, ${C.cyanDim}, transparent 70%)`, pointerEvents: 'none',
              }} />
              <video
                ref={heroLogoRef}
                className="dash-hero-logo"
                src="/logos/applogo.webm"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onCanPlay={event => { void event.currentTarget.play().catch(() => undefined); }}
                aria-label="1% Dev Academy logo"
              />
              <div style={{ fontFamily: F.mono, fontSize: '0.7rem', color: C.cyan, letterSpacing: '0.06em', marginBottom: '6px' }}>{greeting.toUpperCase()}</div>
              <h1 className="hero-title" style={{ fontFamily: F.display, fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.02em', margin: '0 0 8px', color: C.text }}>
                {firstName}<span style={{ color: C.textFaint }}>.</span>
              </h1>
              <div className="hero-message" style={{ background: `linear-gradient(135deg, ${C.surfaceHi}, ${C.surface})`, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px', marginTop: '10px', maxWidth: '540px', boxShadow: `inset 0 1px 0 ${C.borderHi}` }}>
                <p style={{ fontFamily: F.body, fontSize: '0.85rem', color: C.textDim, margin: '0 0 14px', maxWidth: '440px' }}>
                  {tasksLoading ? 'Loading today\u2019s board…' : tasks.length === 0
                    ? 'No tasks logged yet — set today\u2019s target and start the streak.'
                    : `${completedTasks} of ${tasks.length} tasks cleared today. ${overdueTasks > 0 ? `${overdueTasks} overdue.` : 'On pace.'}`}
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {recentActivity && <button className="btn btn-primary" onClick={() => onNavigate(`resume_${recentActivity.courseId}_${recentActivity.partId}`)}>Continue {nextLessonLabel} →</button>}
                  {!recentActivity && <button className="btn btn-primary" onClick={() => onNavigate('academy')}>Explore courses →</button>}
                  <button className="btn btn-ghost" onClick={() => setShowAddTask(true)}>Plan today</button>
                  {onOpenTaskHub && (
                    <button className="btn btn-ghost" onClick={onOpenTaskHub}>Open Task Hub →</button>
                  )}
                  <button className="btn btn-ghost" onClick={() => onNavigate('targetroom')}>Target</button>
                </div>
              </div>
              <div className="hero-metrics" style={{ display: 'flex', gap: '22px', marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
                <MiniStat label="Today’s goal" value={tasks.length ? `${completedTasks}/${tasks.length} tasks` : 'Set your first task'} tone={C.text} />
                <MiniStat label="Learning progress" value={statsLoading ? '—' : `${learningPct}% complete`} tone={C.cyan} />
                <MiniStat label="XP earned" value={statsLoading ? '—' : `${streak.total * 25 + completedTasks * 50} XP`} tone={C.amber} />
              </div>
            </div>

            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontFamily: F.mono, fontSize: '0.66rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Activity log</span>
                <span className="dash-date-widget" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px 9px', flexShrink: 0 }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isActiveToday ? C.green : C.textFaint, animation: isActiveToday ? 'pulseDot 2s ease infinite' : 'none' }} />
                  <span className="dash-topbar-date" style={{ fontFamily: F.mono, fontSize: '0.64rem', color: C.textDim }}>{topbarDate()}</span>
                </span>
              </div>
              <ContributionHeatmap dates={streak.dates} loading={statsLoading} />
              <div className="calendar-stat-grid">
                <div className="calendar-stat-item">
                  <span>🔥 Day streak</span>
                  <strong style={{ color: C.amber }}>{statsLoading ? '—' : `${streak.current}d`}</strong>
                  <small>Best {statsLoading ? '—' : streak.longest}</small>
                </div>
                <div className="calendar-stat-item">
                  <span>◫ Active days</span>
                  <strong style={{ color: C.cyan }}>{statsLoading ? '—' : streak.total}</strong>
                  <small>All time</small>
                </div>
                <div className="calendar-stat-item">
                  <span>✓ Quests done</span>
                  <strong style={{ color: C.green }}>{tasksLoading ? '—' : `${completedTasks}/${tasks.length}`}</strong>
                  <small>{overdueTasks > 0 ? `${overdueTasks} overdue` : 'On track'}</small>
                </div>
                <div className="calendar-stat-item">
                  <span>⚡ Today</span>
                  <strong style={{ color: isActiveToday ? C.green : C.textFaint }}>{isActiveToday ? 'Active' : 'Idle'}</strong>
                  <small>{isActiveToday ? 'Streak alive' : 'Log a quest'}</small>
                </div>
              </div>
            </div>
          </section>

          {/* Continue where left off */}
          {recentActivity && (() => {
            const course = coursesList.find(c => c.id === recentActivity.courseId);
            if (!course) return null;
            return (
              <section
                onClick={() => onNavigate(`resume_${recentActivity.courseId}_${recentActivity.partId}`)}
                className="card-hover"
                style={{
                  marginBottom: '22px', cursor: 'pointer', borderRadius: '14px', padding: '1px',
                  background: `linear-gradient(90deg, ${C.cyan}55, ${C.violet}55)`,
                }}>
                <div style={{
                  background: C.surface, borderRadius: '13px', padding: '16px 22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <CourseLogoImg mascot={course.mascot} id={course.id} size={38} />
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.cyan, letterSpacing: '0.1em', marginBottom: '3px' }}>CONTINUE</div>
                      <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: '1.05rem', color: C.text }}>{course.title} · Part {recentActivity.partId}</div>
                    </div>
                  </div>
                  <span style={{ fontFamily: F.body, fontWeight: 700, fontSize: '0.78rem', color: C.cyan }}>Resume →</span>
                </div>
              </section>
            );
          })()}

          {/* Course progress bars */}
          <section className="course-progress-aurora" style={{ marginBottom: '22px' }}>
            <SectionHeader title="Course progress" action={{ label: 'View all →', onClick: () => onNavigate('academy') }} />
            {statsLoading ? (
              <div style={{ color: C.textDim, fontFamily: F.mono, fontSize: '0.78rem' }}>loading standings…</div>
            ) : (
              <div className="course-progress-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '12px', overflow: 'visible', paddingBottom: 0 }}>
                {courseProgress.filter(cp => !HIDDEN_COURSE_IDS.includes(cp.id)).map((cp, idx) => {
                  const pct = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
                  return (
                    <div key={cp.id} onClick={() => onNavigate(`course_${cp.id}`)} className="card card-hover course-progress-card course-progress-aurora-card" style={{
                      minWidth: 0, padding: '14px', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                        <div style={{ display: 'grid', placeItems: 'center', width: '34px', height: '34px', flex: '0 0 34px', border: `2px solid ${C.border}`, borderRadius: '8px', background: C.surfaceHi }}>
                          <CourseLogoImg mascot={undefined} id={cp.id} size={21} />
                        </div>
                        <div style={{ minWidth: 0, overflow: 'hidden', fontFamily: F.body, fontWeight: 700, fontSize: '0.78rem', color: C.text, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cp.label}</div>
                      </div>
                      <div className="course-progress-bar-track" aria-label={`${cp.label} progress`}>
                        <div className="course-progress-bar-fill" style={{ width: `${pct}%`, background: ringColors[idx % ringColors.length] }} />
                      </div>
                      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: '0.8rem', color: ringColors[idx % ringColors.length] }}>{pct}% · {cp.completed}/{cp.total}</div>
                      <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.textFaint }}>Next: lesson {Math.min(cp.total, cp.completed + 1) || 1}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Tracker */}
          <section style={{ marginBottom: '22px' }}>
            <SectionHeader title="Tracker" />
            <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                {activeCourse && <CourseLogoImg mascot={activeCourse.mascot} id={activeCourse.id} size={42} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: F.mono, fontSize: '0.62rem', color: C.cyan, letterSpacing: '0.1em', marginBottom: '4px' }}>CURRENT COURSE</div>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.05rem', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeCourse ? activeCourse.title : 'No course started'}
                  </div>
                  <div style={{ fontFamily: F.mono, fontSize: '0.72rem', color: C.textDim, marginTop: '3px' }}>
                    {activeCourseProgress
                      ? `${activeCourseProgress.completed} / ${activeCourseProgress.total} lessons complete · ${activeCourseProgress.total > 0 ? Math.round((activeCourseProgress.completed / activeCourseProgress.total) * 100) : 0}%`
                      : 'Pick a course to begin tracking'}
                  </div>
                </div>
              </div>
              {activeCourseProgress && (
                <div style={{ width: '180px', flexShrink: 0 }}>
                  <div style={{ height: '6px', background: C.border, borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{
                      height: '100%',
                      width: `${activeCourseProgress.total > 0 ? Math.round((activeCourseProgress.completed / activeCourseProgress.total) * 100) : 0}%`,
                      background: C.cyan,
                      borderRadius: '3px',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              )}
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (recentActivity) {
                    onNavigate(`resume_${recentActivity.courseId}_${recentActivity.partId}`);
                  } else if (activeCourse) {
                    onNavigate(`course_${activeCourse.id}`);
                  } else {
                    onNavigate('academy');
                  }
                }}
                style={{ flexShrink: 0, fontSize: '0.82rem', padding: '10px 22px' }}
              >
                Next →
              </button>
            </div>
          </section>

          {/* Tasks + Quick access */}
          <section className="tasks-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: '20px' }}>

            {/* Task terminal */}
            <div className="card task-terminal" style={{ overflow: 'hidden' }}>
              <div className="task-list-heading" style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: F.mono, fontSize: '0.72rem', color: C.textDim, marginLeft: '8px' }}>tasks.sh</span>
                </div>
                <button className="btn task-add-button" onClick={() => setShowAddTask(true)} style={{
                  background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyan}44`,
                  padding: '5px 12px', fontFamily: F.mono, fontWeight: 700, fontSize: '0.68rem',
                }}>Add task</button>
              </div>

              {tasks.length > 0 && (
                <div style={{ padding: '12px 18px 0' }}>
                  <div className="task-progress-track" style={{ height: '4px', background: C.border, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? C.green : C.cyan, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )}

              <div style={{ padding: '12px 8px 16px', fontFamily: F.mono }}>
                {tasksLoading && <div style={{ padding: '30px 0', textAlign: 'center', color: C.textFaint, fontSize: '0.78rem' }}>$ loading tasks…</div>}
                {!tasksLoading && tasks.length === 0 && (
                  <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                    <div style={{ color: C.textDim, fontSize: '0.8rem', marginBottom: '14px' }}>$ no tasks found</div>
                    <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>+ Add first task</button>
                  </div>
                )}
                {tasks.map(task => {
                  const due = formatDue(task.due_date);
                  return (
                    <div key={task.id} onClick={() => handleToggleTask(task.id)} className="nav-item task-row" style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '7px',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHi)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span className={`task-check ${task.done ? 'is-done' : ''}`} aria-hidden="true">{task.done ? '[✓]' : '[ ]'}</span>
                      <span className={`task-label ${task.done ? 'is-done' : ''}`}>{task.text}</span>
                      {due && <span className={`task-due ${due.overdue ? 'is-overdue' : ''}`}>{due.label}</span>}
                      <button className="task-delete" onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }} aria-label={`Delete ${task.text}`}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right rail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontFamily: F.mono, fontSize: '0.66rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Quick access</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <QuickCard title="Typing" icon={<CourseLogoImg mascot="typing" id="typing" size={30} />} onClick={() => onNavigate('typing')} />
                  <QuickCard title="Aptitude" icon={<CourseLogoImg mascot="aptitude" id="aptitude" size={30} />} onClick={() => onNavigate('aptitude')} />
                  <QuickCard title="Courses" icon={<CourseLogoImg mascot="dashboard" id="dashboard" size={30} />} onClick={() => onNavigate('academy')} />
                  <QuickCard title="Resources" icon={<CourseLogoImg mascot="taskhub" id="taskhub" size={30} />} onClick={() => {}} />
                </div>
              </div>

              <div style={{
                background: `linear-gradient(160deg, ${C.violetDim}, ${C.surface})`, border: `1px solid ${C.border}`,
                borderRadius: '14px', padding: '18px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: F.display, fontStyle: 'italic', fontSize: '0.92rem', color: C.text, lineHeight: 1.5, marginBottom: '8px' }}>
                  "Consistency is the compound interest of learning."
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ══════════ ADD TASK MODAL ══════════ */}
      {showAddTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,6,9,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowAddTask(false); setNewTaskText(''); setNewTaskDue(''); } }}>
          <div style={{ background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: '14px', width: '440px', maxWidth: '94vw', overflow: 'hidden', boxShadow: `0 20px 60px rgba(0,0,0,0.5)` }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1rem', color: C.text }}>New task</span>
              <button onClick={() => { setShowAddTask(false); setNewTaskText(''); setNewTaskDue(''); }} style={{ background: 'transparent', border: `1px solid ${C.borderHi}`, borderRadius: '6px', color: C.textDim, width: '26px', height: '26px', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: F.mono, fontWeight: 600, fontSize: '0.66rem', marginBottom: '6px', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
                <input ref={inputRef} type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={handleAddKeyDown}
                  placeholder="e.g. Watch 2 Cloud videos…" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '0.86rem', outline: 'none', background: C.bg, color: C.text, boxSizing: 'border-box', fontFamily: F.body }} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: F.mono, fontWeight: 600, fontSize: '0.66rem', marginBottom: '6px', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Due date</label>
                <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} min={todayStr()} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '0.86rem', outline: 'none', background: C.bg, color: C.text, boxSizing: 'border-box', fontFamily: F.body }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button className="btn btn-ghost" onClick={() => { setShowAddTask(false); setNewTaskText(''); setNewTaskDue(''); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddTask} disabled={!newTaskText.trim()} style={{ opacity: newTaskText.trim() ? 1 : 0.5, cursor: newTaskText.trim() ? 'pointer' : 'not-allowed' }}>Add task</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {profileOpen && (
        <ProfilePanel
          user={user}
          displayName={displayName}
          initials={initials}
          photoURL={photoURL}
          learningPct={learningPct}
          visibleCourses={visibleCourses}
          visibleProgress={visibleProgress}
          streak={streak}
          recentActivity={recentActivity}
          onClose={() => setProfileOpen(false)}
          onNavigate={onNavigate}
          onLogout={logout}
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ProfilePanel({
  user, displayName, initials, photoURL, learningPct, visibleCourses, visibleProgress, streak, recentActivity, onClose, onNavigate, onLogout,
}: {
  user: { email?: string | null } | null; displayName: string; initials: string; photoURL: string | null; learningPct: number;
  visibleCourses: Course[]; visibleProgress: CourseProgress[]; streak: StreakInfo; recentActivity: { courseId: string; partId: number } | null;
  onClose: () => void; onNavigate: (module: string) => void; onLogout: () => void;
}) {
  const completedCourses = visibleProgress.filter(course => course.total > 0 && course.completed >= course.total).length;
  const completedLessons = visibleProgress.reduce((sum, course) => sum + course.completed, 0);
  const totalLessons = visibleProgress.reduce((sum, course) => sum + course.total, 0);
  const xp = streak.total * 25 + completedLessons * 50;
  return (
    <div className="profile-page" role="dialog" aria-modal="true" aria-label="Your profile">
      <div className="profile-page-inner">
        <div className="profile-page-top"><button className="profile-back" onClick={onClose}><Icon name="arrow" size={15} /> Back to dashboard</button><button className="profile-close" onClick={onClose} aria-label="Close profile"><Icon name="close" size={17} /></button></div>
        <header className="profile-hero">
          <div className="profile-identity">{photoURL ? <img src={photoURL} alt="" /> : <div className="profile-avatar-large">{initials}</div>}<div><div className="profile-kicker">Student profile</div><h1 className="profile-name">{displayName}</h1><div className="profile-email">{user?.email || 'Personal learning workspace'}</div><div className="profile-badges"><span className="profile-badge">1% Member</span><span className="profile-badge profile-badge-success"><i /> Active learner</span></div></div></div>
          <div className="profile-hero-actions"><button className="btn btn-ghost" onClick={() => {}}><Icon name="spark" size={15} /> Edit profile</button><button className="btn btn-primary" onClick={() => onNavigate('academy')}>Continue learning <Icon name="arrow" size={14} /></button></div>
        </header>
        <div className="profile-section-title"><h2>Learning overview</h2><span>Updated just now</span></div>
        <section className="profile-metrics"><ProfileMetric label="Overall progress" value={`${learningPct}%`} detail={`${completedLessons} of ${totalLessons || 0} lessons`} /><ProfileMetric label="Courses enrolled" value={visibleCourses.length} detail={`${completedCourses} completed`} /><ProfileMetric label="Current streak" value={`${streak.current}d`} detail={`Best: ${streak.longest} days`} /><ProfileMetric label="XP points" value={xp} detail={`${streak.total} active learning days`} /></section>
        <section className="profile-grid">
          <div className="profile-card"><h3>Continue learning</h3><div className="profile-card-subtitle">Your active courses and next steps</div><div style={{ marginTop: 8 }}>{visibleProgress.length === 0 ? <div className="profile-card-subtitle" style={{ padding: '20px 0' }}>Your course progress will appear here.</div> : visibleProgress.slice(0, 5).map(course => { const pct = course.total ? Math.round((course.completed / course.total) * 100) : 0; return <div className="profile-course-row" key={course.id}><div className="profile-course-icon"><CourseLogoImg mascot={undefined} id={course.id} size={20} /></div><div className="profile-course-copy"><strong>{course.label}</strong><span>{course.completed >= course.total && course.total > 0 ? 'Course complete' : `Next lesson ${Math.min(course.total, course.completed + 1) || 1}`}</span></div><div className="profile-course-progress"><div className="profile-course-progress-track"><i style={{ width: `${pct}%` }} /></div><small>{pct}% complete</small></div></div>; })}</div></div>
          <div className="profile-card"><h3>Recent activity</h3><div className="profile-card-subtitle">A lightweight record of your momentum</div><div className="profile-activity">{recentActivity && <div className="profile-activity-item"><i className="profile-activity-dot" /><span>Last opened <strong>{recentActivity.courseId}</strong>, lesson {recentActivity.partId}</span></div>}<div className="profile-activity-item"><i className="profile-activity-dot" /><span>{completedLessons} lessons completed across your learning library</span></div><div className="profile-activity-item"><i className="profile-activity-dot" /><span>{streak.current ? `${streak.current} day streak active` : 'Start a lesson to begin your streak'}</span></div><div className="profile-activity-item"><i className="profile-activity-dot" /><span>{streak.total} total active learning days</span></div></div></div>
        </section>
        <div className="profile-section-title"><h2>Your learning hub</h2><span>Quick access</span></div>
        <section className="profile-metrics"><ProfileMetric label="Certificates" value="0" detail="Keep learning to earn one" /><ProfileMetric label="Bookmarks" value="—" detail="Saved lessons and notes" /><ProfileMetric label="Notes" value="—" detail="Your reader workspace" /><button className="profile-metric" style={{ border: 0, cursor: 'pointer', textAlign: 'left' }} onClick={onLogout}><div className="profile-metric-label" style={{ color: C.red }}>Account</div><div className="profile-metric-value" style={{ color: C.red, fontSize: '1rem' }}>Sign out</div><div className="profile-metric-detail">End this session securely</div></button></section>
      </div>
    </div>
  );
}

function ProfileMetric({ label, value, detail }: { label: string; value: string | number; detail: string }) { return <div className="profile-metric"><div className="profile-metric-label">{label}</div><div className="profile-metric-value">{value}</div><div className="profile-metric-detail">{detail}</div></div>; }

function SectionHeader({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: '0.95rem', color: C.text }}>{title}</span>
      {action && <button onClick={action.onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.body, fontWeight: 600, fontSize: '0.76rem', color: C.cyan }}>{action.label}</button>}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub: string; color: string; icon: string }) {
  return (
    <div className="card card-hover" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontFamily: F.mono, fontSize: '0.64rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontSize: '0.9rem' }}>{icon}</span>
      </div>
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.6rem', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: F.mono, fontSize: '0.66rem', color: C.textDim, marginTop: '4px' }}>{sub}</div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div style={{ fontFamily: F.mono, fontSize: '0.62rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: '0.9rem', color: tone || C.text }}>{value}</div>
    </div>
  );
}

function QuickCard({ title, icon, onClick }: { title: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card card-hover" style={{
      padding: '12px 6px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      gap: '5px', fontFamily: 'inherit', background: C.bg,
    }}>
      <span style={{ fontSize: '1.15rem', color: C.accent }}>{icon}</span>
      <span style={{ fontFamily: F.body, fontSize: '0.66rem', fontWeight: 600, color: C.textDim }}>{title}</span>
    </button>
  );
}

function SideItem({ icon, label, onClick, active = false }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className={`nav-item ${active ? 'active' : ''}`}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        background: active ? C.cyanDim : hover ? C.surfaceHi : 'transparent',
        color: active ? C.cyan : C.textDim,
        border: 'none', borderRadius: '8px', padding: '9px 12px', marginBottom: '2px',
        cursor: 'pointer', fontSize: '0.82rem', fontFamily: F.body, fontWeight: active ? 700 : 500,
      }}>
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function SideItemLogo({ mascot, courseId, label, iconOnly = false, showImage = true, iconName, onClick }: { mascot?: string; courseId: string; label: string; iconOnly?: boolean; showImage?: boolean; iconName?: IconName; onClick: () => void }) {
  const [hover, setHover] = React.useState(false);
  const url = getCourseLogoUrl(mascot, courseId);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className={`nav-item ${iconOnly ? 'nav-icon-only' : 'nav-course-card'}`}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: iconOnly ? 'center' : 'flex-start', gap: '10px',
        background: hover ? C.surfaceHi : 'transparent', color: C.textDim,
        border: 'none', borderRadius: '8px', padding: iconOnly ? '9px 6px' : '8px 12px', marginBottom: '2px',
        cursor: 'pointer', fontSize: '0.82rem', fontFamily: F.body, fontWeight: 500,
      }}>
      {showImage && url
        ? <img src={url} alt={label} style={{ width: iconOnly ? 24 : 18, height: iconOnly ? 24 : 18, objectFit: 'contain', borderRadius: 4 }} />
        : <Icon name={iconName || (courseId.includes('typing') ? 'keyboard' : courseId.includes('task') ? 'check' : 'book')} size={iconOnly ? 20 : 16} />}
      {!iconOnly && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
    </button>
  );
}

function RingProgress({ pct, size = 64, stroke = 6, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle stroke={C.border} fill="none" strokeWidth={stroke} cx={size / 2} cy={size / 2} r={r} />
      <circle
        stroke={color} fill="none" strokeWidth={stroke} strokeLinecap="round"
        cx={size / 2} cy={size / 2} r={r}
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

function ContributionHeatmap({ dates, loading }: { dates: string[]; loading: boolean }) {
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  if (loading) {
    return <div style={{ height: '96px', display: 'flex', alignItems: 'center', color: C.textFaint, fontFamily: F.mono, fontSize: '0.72rem' }}>loading log…</div>;
  }
  const dateSet = new Set(dates);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const start = new Date(monthStart);
  start.setDate(1 - monthStart.getDay());
  const end = new Date(monthEnd);
  end.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

  const days: { iso: string; active: boolean; isFuture: boolean; isToday: boolean; inMonth: boolean }[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10);
    days.push({ iso, active: dateSet.has(iso), isFuture: cursor > today, isToday: iso === todayStr(), inMonth: cursor.getMonth() === today.getMonth() });
    cursor.setDate(cursor.getDate() + 1);
  }

  const selectedDay = days.find(day => day.iso === selectedIso);
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(monthStart);
  const selectedLabel = selectedDay
    ? new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${selectedDay.iso}T00:00:00`))
    : null;

  return (
    <div style={{ width: '178px', maxWidth: '100%' }}>
      <div style={{ fontFamily: F.mono, fontSize: '0.68rem', color: C.textDim, marginBottom: '8px' }}>{monthLabel}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '4px', color: C.textFaint, fontFamily: F.mono, fontSize: '0.5rem', textAlign: 'center' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <span key={`${day}-${i}`}>{day}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {days.map(cell => cell.inMonth ? (
          <button
            key={cell.iso}
            type="button"
            aria-label={`${cell.iso}${cell.active ? ', active' : ', no activity'}`}
            onClick={() => setSelectedIso(cell.iso)}
            style={{ width: '21px', height: '21px', padding: 0, borderRadius: '4px', border: cell.isToday ? `1px solid ${C.cyan}` : `1px solid ${cell.active ? C.cyan : C.border}`, background: cell.isFuture ? 'transparent' : cell.active ? C.cyan : C.surface, color: cell.active ? C.bg : C.textFaint, fontFamily: F.mono, fontSize: '0.48rem', cursor: 'pointer', opacity: cell.isFuture ? 0.35 : 1, boxShadow: selectedIso === cell.iso ? `0 0 0 2px ${C.amber}` : 'none' }}
          >{Number(cell.iso.slice(-2))}</button>
        ) : (
          <span key={cell.iso} style={{ width: '21px', height: '21px' }} />
        ))}
      </div>
      <div style={{ minHeight: '24px', marginTop: '9px', color: selectedDay?.active ? C.cyan : C.textFaint, fontFamily: F.mono, fontSize: '0.55rem', lineHeight: 1.4 }}>
        {selectedDay ? <>{selectedLabel}<br />{selectedDay.active ? 'Active learning day' : 'No activity logged'}</> : 'Click a date to view details'}
      </div>
    </div>
  );
}

async function fetchModulesAndProgress(courseId: string) {
  try {
    const [mods, prog] = await Promise.all([fetchModules(courseId), fetchProgress(courseId)]);
    return { total: mods.reduce((s, m) => s + m.notes.length, 0), completed: prog.length };
  } catch { return { completed: 0, total: 0 }; }
}
