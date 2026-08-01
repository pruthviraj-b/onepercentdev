'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import {
  fetchTasks as fetchLegacyTasks, createTask as createLegacyTask,
  updateTask as updateLegacyTask, deleteTask as deleteLegacyTask,
  fetchStreak, pingStreak,
  Task, StreakInfo,
} from '@/lib/taskApi';
import {
  fetchTasks as fetchSmartTasks, SmartTask,
} from '@/lib/smartTaskApi';
import { fetchProgress, fetchModules, fetchCourses, Course, fetchRecentActivity } from '@/lib/api';

// ── Type system ────────────────────────────────────────────────
const F = {
  display: "'Google Sans Flex', sans-serif",
  body:    "'Google Sans Flex', sans-serif",
  mono:    "'JetBrains Mono', 'Fira Code', monospace",
};

// ── Signal-deck token system (temple bronze / gold relief) ───────
// Kept your original "Monumental Mosaic" palette as the source of truth,
// then ADDED the missing tokens your JSX was already referencing
// (cyan/violet/green/amber/red + Dim variants) so nothing crashes,
// mapped onto colors that live in the same bronze/gold/teal family.
const C = {
  bg:        '#080B10',
  surface:   '#0F141C',
  surfaceHi: '#151B25',
  border:    '#212B38',
  borderHi:  '#2E3B4C',
  text:      '#E8EDF4',
  textDim:   '#7E8CA0',
  textFaint: '#4B5768',
  cyan:      '#4CD8E0',
  cyanDim:   'rgba(76,216,224,0.14)',
  violet:    '#9C8CFF',
  violetDim: 'rgba(156,140,255,0.14)',
  green:     '#3ED598',
  greenDim:  'rgba(62,213,152,0.14)',
  amber:     '#F5B84C',
  red:       '#F0716C',
  onAccent:  '#061012',
  accent:    '#4CD8E0',
  accentHi:  '#7DE8EE',
  accentDim: 'rgba(76,216,224,0.14)',
  bgGrid:    'rgba(76,216,224,0.04)',
  success:   '#3ED598',
  warning:   '#F5B84C',
  error:     '#F0716C',
  info:      '#4CD8E0',
};

const HIDDEN_COURSE_IDS = ['data-analyst', 'data-analyst-en'];

function getCourseLogoUrl(mascot?: string, id?: string): string | null {
  const val = `${mascot || ''} ${id || ''}`.toLowerCase();
  if (val.includes('snake') || val.includes('python')) return '/logos/python.jpg';
  if (val.includes('cloud')) return '/logos/cloud.jpg';
  if (val.includes('excel')) return '/logos/excel.jpg';
  if (val.includes('dashboard')) return '/logos/dashboard.jpg';
  if (val.includes('aptitude') || val.includes('apti')) return '/logos/apti.jpg';
  if (val.includes('typing')) return '/logos/typing-board.jpg';
  if (val.includes('task') || val.includes('taskhub') || val.includes('hub')) return '/logos/completed-task.jpg';
  if (val.includes('data-analyst') || val.includes('data analyst') || val.includes('analyst') || val.includes('chart')) return '/logos/da.jpg';
  if (val.includes('database') || val.includes('sql')) return '/logos/sql.jpg';
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

function CourseLogoImg({ mascot, id, size = 28 }: { mascot?: string; id?: string; size?: number }) {
  const url = getCourseLogoUrl(mascot, id);
  if (url) {
    return <img src={url} alt="" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />;
  }
  return <span style={{ fontSize: size * 0.75 }}>{getCourseEmoji(mascot, id)}</span>;
}

interface CourseProgress { id: string; label: string; icon: string; completed: number; total: number; }
interface DashboardProps { onNavigate: (module: string) => void; onOpenTaskHub?: () => void; }

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [, setSmartTasks] = useState<SmartTask[]>([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar toggle
  const profileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [streak, setStreak] = useState<StreakInfo>({ current: 0, longest: 0, total: 0, dates: [] });
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [displayStreak, setDisplayStreak] = useState(0);
  const [recentActivity, setRecentActivity] = useState<{ courseId: string; partId: number } | null>(null);

  useEffect(() => {
    setTasksLoading(true);
    fetchLegacyTasks().then(d => { setTasks(d); setTasksLoading(false); });
  }, []);

  useEffect(() => {
    fetchSmartTasks({ pageSize: 100 }).then(r => setSmartTasks(r.tasks || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setStatsLoading(true);
    pingStreak();
    Promise.all([fetchStreak(), fetchCourses(), fetchRecentActivity()]).then(async ([sd, courses, recent]) => {
      setStreak(sd); setCoursesList(courses); setRecentActivity(recent);
      const results = await Promise.all(courses.map(c => fetchModulesAndProgress(c.id)));
      setCourseProgress(courses.map((c, i) => ({ id: c.id, label: c.title, icon: getCourseIcon(c.mascot, c.id), ...results[i] })));
      setStatsLoading(false);
    }).catch(() => setStatsLoading(false));
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
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

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
          --radius-sm: 6px;
          --radius-md: 10px;
          --radius-lg: 14px;
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
          box-shadow: 0 8px 28px rgba(0,0,0,0.35);
        }
        .hero-card { box-shadow: inset 0 1px 0 rgba(255,255,255,0.025), 0 14px 40px rgba(0,0,0,0.16); }
        .course-progress-card { position: relative; overflow: hidden; }
        .course-progress-card::after { content: ''; position: absolute; inset: auto -18px -34px auto; width: 84px; height: 84px; border-radius: 50%; background: var(--accent-dim); filter: blur(8px); opacity: .7; pointer-events: none; }

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
            top: 64px !important;
            height: calc(100dvh - 64px) !important;
            padding-top: 0 !important;
            z-index: 500;
            transform: translateX(-100%);
            box-shadow: 0 0 40px rgba(0,0,0,0.5);
          }
          .dash-sidebar.open { transform: translateX(0); }
          .sidebar-scrim.open {
            display: block;
            position: fixed; top: 64px; right: 0; bottom: 0; left: 0; background: rgba(0,0,0,0.6);
            z-index: 490;
          }
          .dash-topbar-date { display: none !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .dash-main { padding: 16px !important; }
          .hero-card { padding: 18px !important; }
          .mobile-menu-btn { display: inline-flex !important; }
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

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: '232px', flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', height: '100dvh', paddingTop: 0, top: 0, left: 0,
      }}>
        <div style={{ flexShrink: 0, height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '8px 12px 16px', boxSizing: 'border-box', borderBottom: `1px solid ${C.border}` }}>
          <img
            src="/logos/logo.svg.png"
            alt="1% Dev Academy logo"
            style={{ width: '240px', height: '240px', objectFit: 'contain', objectPosition: 'center', display: 'block', transform: 'translateY(34px)' }}
          />
          <div style={{ marginTop: '14px', textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.15, letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>1% Dev Academy</div>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
          <SideItem icon="⌂" label="Home" active onClick={() => {}} />
          <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 12px 6px' }}>Courses</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', marginBottom: '4px' }}>
            {visibleCourses.map(c => (
              <SideItemLogo key={c.id} mascot={c.mascot} courseId={c.id} label={c.title} iconOnly onClick={() => onNavigate(`course_${c.id}`)} />
            ))}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 12px 6px' }}>Training</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
            <SideItemLogo mascot="typing" courseId="typing" label="Typing" iconOnly onClick={() => onNavigate('typing')} />
            <SideItemLogo mascot="aptitude" courseId="aptitude" label="Aptitude" iconOnly onClick={() => onNavigate('aptitude')} />
            {onOpenTaskHub && <SideItemLogo mascot="taskhub" courseId="taskhub" label="Task Hub" iconOnly onClick={onOpenTaskHub} />}
          </div>
        </nav>

        <div ref={profileRef} style={{ position: 'relative', borderTop: `1px solid ${C.border}`, padding: '12px' }}>
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
            <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '12px', right: '12px', background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <button onClick={() => { logout(); setProfileMenuOpen(false); }} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: F.body, fontWeight: 600, fontSize: '0.78rem', color: C.red, textAlign: 'left' }}>Sign out</button>
            </div>
          )}
        </div>
      </aside>

      {/* ══════════ MAIN COLUMN ══════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>

        {/* Topbar */}
        <header className="dash-unified-header" style={{
          height: '64px', flexShrink: 0, borderBottom: `1px solid ${C.border}`, background: C.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
          marginLeft: 0, width: 'auto', position: 'relative', zIndex: 10,
        }}>
          <div className="dash-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', transform: 'translateX(-220px)' }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle menu"
              style={{ display: 'none', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '7px', width: '32px', height: '32px', cursor: 'pointer', color: C.text, alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}
            >☰</button>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isActiveToday ? C.green : C.textFaint, animation: isActiveToday ? 'pulseDot 2s ease infinite' : 'none' }} />
            <span className="dash-topbar-date" style={{ fontFamily: F.mono, fontSize: '0.72rem', color: C.textDim }}>{topbarDate()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: '7px', padding: '5px 10px',
            }}>
              <span style={{ fontSize: '0.85rem' }}>🔥</span>
              <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: '0.8rem', color: C.amber }}>{statsLoading ? '—' : streak.current}</span>
              <span style={{ fontFamily: F.mono, fontSize: '0.62rem', color: C.textFaint }}>day streak</span>
            </div>
          </div>
        </header>

        <main className="dash-main" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: '28px 32px 60px' }}>

          {/* Hero: greeting + heatmap */}
          <section className="hero-grid" style={{
            display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '20px', marginBottom: '22px',
            animation: 'fadeUp 0.4s ease',
          }}>
            <div className="hero-card" style={{
              background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceHi})`, border: `1px solid ${C.border}`,
              borderRadius: '14px', padding: '26px 28px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '-40%', right: '-10%', width: '260px', height: '260px', borderRadius: '50%',
                background: `radial-gradient(circle, ${C.cyanDim}, transparent 70%)`, pointerEvents: 'none',
              }} />
              <div style={{ fontFamily: F.mono, fontSize: '0.7rem', color: C.cyan, letterSpacing: '0.06em', marginBottom: '6px' }}>{greeting.toUpperCase()}</div>
              <h1 className="hero-title" style={{ fontFamily: F.display, fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.02em', margin: '0 0 8px', color: C.text }}>
                {firstName}<span style={{ color: C.textFaint }}>.</span>
              </h1>
              <div style={{ background: `linear-gradient(135deg, ${C.surfaceHi}, ${C.surface})`, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px', marginTop: '10px', maxWidth: '540px', boxShadow: `inset 0 1px 0 ${C.borderHi}` }}>
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
              <div style={{ display: 'flex', gap: '22px', marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
                <MiniStat label="Today’s goal" value={tasks.length ? `${completedTasks}/${tasks.length} tasks` : 'Set your first task'} tone={C.text} />
                <MiniStat label="Learning progress" value={statsLoading ? '—' : `${learningPct}% complete`} tone={C.cyan} />
                <MiniStat label="XP earned" value={statsLoading ? '—' : `${streak.total * 25 + completedTasks * 50} XP`} tone={C.amber} />
              </div>
            </div>

            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontFamily: F.mono, fontSize: '0.66rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Activity log</span>
                <span style={{ fontFamily: F.mono, fontSize: '0.66rem', color: C.textDim }}>{statsLoading ? '…' : `${streak.total} active days`}</span>
              </div>
              <ContributionHeatmap dates={streak.dates} loading={statsLoading} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
                <MiniStat label="Best streak" value={statsLoading ? '—' : `${streak.longest}d`} />
                <MiniStat label="Today" value={isActiveToday ? 'Active' : 'Idle'} tone={isActiveToday ? C.green : C.textFaint} />
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

          {/* Stats row */}
          <section className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
            <StatCard label="Day streak" value={statsLoading ? '—' : streak.current} sub={`Best ${streak.longest}`} color={C.amber} icon="🔥" />
            <StatCard label="Active days" value={statsLoading ? '—' : streak.total} sub="all time" color={C.cyan} icon="📆" />
            <StatCard label="Tasks done" value={tasksLoading ? '—' : `${completedTasks}/${tasks.length}`} sub={overdueTasks > 0 ? `${overdueTasks} overdue` : 'on track'} color={C.green} icon="✓" />
            <StatCard label="Today" value={isActiveToday ? 'Active' : 'Idle'} sub={isActiveToday ? 'streak alive' : 'log in to keep it'} color={isActiveToday ? C.green : C.textFaint} icon="⚡" />
          </section>

          {/* Course progress rings */}
          <section style={{ marginBottom: '22px' }}>
            <SectionHeader title="Course progress" action={{ label: 'View all →', onClick: () => onNavigate('academy') }} />
            {statsLoading ? (
              <div style={{ color: C.textDim, fontFamily: F.mono, fontSize: '0.78rem' }}>loading standings…</div>
            ) : (
              <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
                {courseProgress.filter(cp => !HIDDEN_COURSE_IDS.includes(cp.id)).map((cp, idx) => {
                  const pct = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
                  return (
                    <div key={cp.id} onClick={() => onNavigate(`course_${cp.id}`)} className="card card-hover course-progress-card" style={{
                      minWidth: '168px', flexShrink: 0, padding: '16px', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                    }}>
                      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
                        <RingProgress pct={pct} size={72} stroke={6} color={ringColors[idx % ringColors.length]} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CourseLogoImg mascot={undefined} id={cp.id} size={24} />
                        </div>
                      </div>
                      <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: '0.78rem', color: C.text, textAlign: 'center' }}>{cp.label}</div>
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
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: C.red, opacity: 0.7 }} />
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: C.amber, opacity: 0.7 }} />
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: C.green, opacity: 0.7 }} />
                  <span style={{ fontFamily: F.mono, fontSize: '0.72rem', color: C.textDim, marginLeft: '8px' }}>tasks.sh</span>
                </div>
                <button className="btn" onClick={() => setShowAddTask(true)} style={{
                  background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyan}44`,
                  padding: '5px 12px', fontFamily: F.mono, fontWeight: 700, fontSize: '0.68rem',
                }}>+ add</button>
              </div>

              {tasks.length > 0 && (
                <div style={{ padding: '12px 18px 0' }}>
                  <div style={{ height: '4px', background: C.border, borderRadius: '2px', overflow: 'hidden' }}>
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
                    <div key={task.id} onClick={() => handleToggleTask(task.id)} className="nav-item" style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '7px',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHi)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ color: task.done ? C.green : C.textFaint, fontSize: '0.82rem', flexShrink: 0 }}>{task.done ? '[✓]' : '[ ]'}</span>
                      <span style={{ fontSize: '0.82rem', color: task.done ? C.textFaint : C.text, textDecoration: task.done ? 'line-through' : 'none', flex: 1 }}>{task.text}</span>
                      {due && <span style={{ fontSize: '0.66rem', color: due.overdue ? C.red : C.textDim, flexShrink: 0 }}>{due.label}</span>}
                      <button onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textFaint, fontSize: '0.72rem', flexShrink: 0 }}>✕</button>
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
                  <QuickCard title="Typing" icon="⌨" onClick={() => onNavigate('typing')} />
                  <QuickCard title="Aptitude" icon="◆" onClick={() => onNavigate('aptitude')} />
                  <QuickCard title="Courses" icon="▣" onClick={() => onNavigate('academy')} />
                  <QuickCard title="Resources" icon="▤" onClick={() => {}} />
                </div>
              </div>

              <div style={{
                background: `linear-gradient(160deg, ${C.violetDim}, ${C.surface})`, border: `1px solid ${C.border}`,
                borderRadius: '14px', padding: '18px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: F.display, fontStyle: 'italic', fontSize: '0.92rem', color: C.text, lineHeight: 1.5, marginBottom: '8px' }}>
                  "Consistency is the compound interest of learning."
                </div>
                <div style={{ fontFamily: F.mono, fontSize: '0.64rem', color: C.textFaint }}>— 1% Dev Academy</div>
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

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

function QuickCard({ title, icon, onClick }: { title: string; icon: string; onClick: () => void }) {
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

function SideItem({ icon, label, onClick, active = false }: { icon: string; label: string; onClick: () => void; active?: boolean }) {
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

function SideItemLogo({ mascot, courseId, label, iconOnly = false, onClick }: { mascot?: string; courseId: string; label: string; iconOnly?: boolean; onClick: () => void }) {
  const [hover, setHover] = React.useState(false);
  const url = getCourseLogoUrl(mascot, courseId);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className="nav-item"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: iconOnly ? 'center' : 'flex-start', gap: '10px',
        background: hover ? C.surfaceHi : 'transparent', color: C.textDim,
        border: 'none', borderRadius: '8px', padding: iconOnly ? '9px 6px' : '8px 12px', marginBottom: '2px',
        cursor: 'pointer', fontSize: '0.82rem', fontFamily: F.body, fontWeight: 500,
      }}>
      {url
        ? <img src={url} alt={label} style={{ width: iconOnly ? 24 : 18, height: iconOnly ? 24 : 18, objectFit: 'contain', borderRadius: 4 }} />
        : <span>{getCourseEmoji(mascot, courseId)}</span>}
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
