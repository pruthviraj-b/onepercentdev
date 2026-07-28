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

// ── Newspaper Editorial Fonts ─────────────────────────────────────────────────
// manufacturing → 'Manufacturing Consent' (blackletter masthead — DEV ACADEMY + 1%)
// editorial → 'Playfair Display' (bold broadsheet headlines)
// deck      → 'Cormorant Garamond' (subheads, bylines, pull-quotes)
// body      → 'DM Sans' (all UI body text, labels)
const F = {
  manufacturing: "'Manufacturing Consent', 'Playfair Display', serif",
  editorial: "'Playfair Display', 'Georgia', serif",
  deck:      "'Cormorant Garamond', 'Georgia', serif",
  body:      "'DM Sans', 'Inter', sans-serif",
  times:     "'Times New Roman', 'Georgia', serif",
  tapestry:  "'Tapestry', cursive",
  // keep legacy aliases so sub-components still work
  coldiac:   "'Cormorant Garamond', 'Georgia', serif",
  roxie:     "'Cormorant', 'Palatino Linotype', serif",
  molani:    "'DM Sans', 'Inter', sans-serif",
  jimNightshade: "'Jim Nightshade', cursive",
};

// ── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  ink:       '#0f0e0c',       // near-black — primary text / borders
  paper:     '#faf7f2',       // warm cream — page background
  rule:      '#1a1a1a',       // thick rule lines
  accent:    '#f1be3e',       // mustard yellow — highlight / ink marker
  accentDk:  '#c9952a',       // dark gold for sub-accent
  column:    '#ffffff',       // white — card surface
  muted:     '#6b6560',       // muted body copy
  hairline:  '#d8d3ca',       // light rule / dividers inside cards
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
    return <img src={url} alt="" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 3, flexShrink: 0 }} />;
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

// ── Formatted date for the masthead dateline ────────────────────────────────
function mastheadDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
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
  const greeting = (() => { const h = new Date().getHours(); if (h < 12) return 'GOOD MORNING'; if (h < 17) return 'GOOD AFTERNOON'; return 'GOOD EVENING'; })();
  const isActiveToday = streak.dates.includes(todayStr());

  return (
    <div style={{ minHeight: '100vh', background: C.paper, fontFamily: F.body, display: 'flex', flexDirection: 'column' }}>

      {/* ══════════ MASTHEAD ══════════ */}
      <header style={{ background: C.paper, borderBottom: `3px solid ${C.rule}` }}>

        {/* Top strip: dateline + user controls */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 24px', borderBottom: `1px solid ${C.rule}`,
          fontFamily: F.times, fontSize: '0.68rem', color: C.muted,
          letterSpacing: '0.07em', textTransform: 'uppercase',
        }}>
          <span style={{ fontFamily: F.times }}>{mastheadDate()}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: C.muted, fontFamily: F.times }}>VOL. I &nbsp;·&nbsp; DAILY EDITION</span>
            {/* Notification */}
            <button aria-label="Notifications" style={{ background: 'none', border: `1.5px solid ${C.rule}`, borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</button>
            {/* Profile */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button onClick={() => setProfileMenuOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: profileMenuOpen ? C.rule : 'transparent',
                color: profileMenuOpen ? C.accent : C.ink,
                border: `1.5px solid ${C.rule}`, borderRadius: '4px',
                padding: '3px 10px 3px 4px', cursor: 'pointer', fontFamily: F.body, fontSize: '0.72rem', fontWeight: 600,
              }}>
                {photoURL
                  ? <img src={photoURL} alt="" onError={() => setImgError(true)} style={{ width: '20px', height: '20px', borderRadius: '2px', objectFit: 'cover' }} />
                  : <div style={{ width: '20px', height: '20px', background: profileMenuOpen ? C.accent : C.ink, color: profileMenuOpen ? C.ink : C.accent, borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.55rem' }}>{initials}</div>}
                <span style={{ fontFamily: "'Geologica', sans-serif" }}>{firstName}</span>
              </button>
              {profileMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: C.column, border: `2px solid ${C.rule}`, boxShadow: `3px 3px 0 ${C.rule}`, minWidth: '160px', zIndex: 400 }}>
                  <button onClick={() => { logout(); setProfileMenuOpen(false); }} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: F.body, fontWeight: 700, fontSize: '0.78rem', color: '#c0392b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main masthead title */}
        <div style={{ textAlign: 'center', padding: '14px 24px 10px', borderBottom: `1px solid ${C.rule}`, background: C.paper }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '4px' }}>
            <div style={{ height: '1px', flex: 1, background: C.rule }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', fontFamily: "'Tapestry', cursive" }}>
              <span style={{ fontFamily: "'Tapestry', cursive", fontWeight: 900, fontSize: '0.7rem', padding: '3px 9px', background: C.accent, color: C.ink, letterSpacing: '0.1em', textTransform: 'uppercase' }}>1%</span>
              <h1 style={{ fontFamily: "'Tapestry', cursive", fontWeight: 900, fontSize: '2.2rem', color: C.ink, margin: 0, letterSpacing: '-0.01em', lineHeight: 1, fontVariant: 'small-caps' }}>
                Dev Academy
              </h1>
              <span style={{ fontFamily: F.deck, fontSize: '0.78rem', color: C.muted, fontStyle: 'italic', fontWeight: 400 }}>Daily Progress</span>
            </div>
            <div style={{ height: '1px', flex: 1, background: C.rule }} />
          </div>
          <p style={{ fontFamily: "'Playwrite NZ Guides', cursive", fontSize: '0.8rem', color: C.muted, margin: 0, fontStyle: 'normal', letterSpacing: '0.02em' }}>
            Your learning. Your streak. Your momentum — every single day.
          </p>
        </div>

        {/* Nav toolbar — newspaper section tabs */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: `1px solid ${C.hairline}`, overflowX: 'auto' }}>
          <NavTab icon="🏠" label="Home" onClick={() => {}} active />
          {coursesList.filter(c => !c.parentId && !HIDDEN_COURSE_IDS.includes(c.id)).map(c => (
            <NavTabLogo key={c.id} mascot={c.mascot} courseId={c.id} label={c.title} onClick={() => onNavigate(`course_${c.id}`)} />
          ))}
          <NavTabLogo mascot="typing" courseId="typing" label="Typing" onClick={() => onNavigate('typing')} />
          <NavTabLogo mascot="aptitude" courseId="aptitude" label="Aptitude" onClick={() => onNavigate('aptitude')} />
          {onOpenTaskHub && <NavTabLogo mascot="taskhub" courseId="taskhub" label="Task Hub" onClick={onOpenTaskHub} />}
        </div>
      </header>

      {/* ══════════ ADD TASK MODAL ══════════ */}
      {showAddTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,4,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, backdropFilter: 'blur(3px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowAddTask(false); setNewTaskText(''); setNewTaskDue(''); } }}>
          <div style={{ background: C.column, border: `3px solid ${C.rule}`, boxShadow: `6px 6px 0 ${C.rule}`, width: '440px', maxWidth: '94vw', overflow: 'hidden' }}>
            <div style={{ background: C.rule, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: F.editorial, fontWeight: 700, fontSize: '1.1rem', color: C.accent, letterSpacing: '0.02em' }}>Add New Task</span>
              <button onClick={() => { setShowAddTask(false); setNewTaskText(''); setNewTaskDue(''); }} style={{ background: 'transparent', border: `1.5px solid ${C.accent}`, color: C.accent, width: '26px', height: '26px', cursor: 'pointer', fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: F.body, fontWeight: 700, fontSize: '0.72rem', marginBottom: '6px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Task Description</label>
                <input ref={inputRef} type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={handleAddKeyDown}
                  placeholder="e.g. Watch 2 Cloud videos..." style={{ width: '100%', padding: '10px 12px', border: `2px solid ${C.rule}`, borderRadius: '0', fontSize: '0.88rem', outline: 'none', background: C.paper, boxSizing: 'border-box', fontFamily: F.body }} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: F.body, fontWeight: 700, fontSize: '0.72rem', marginBottom: '6px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Due Date</label>
                <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} min={todayStr()} style={{ width: '100%', padding: '10px 12px', border: `2px solid ${C.rule}`, borderRadius: '0', fontSize: '0.88rem', outline: 'none', background: C.paper, boxSizing: 'border-box', fontFamily: F.body }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button onClick={() => { setShowAddTask(false); setNewTaskText(''); setNewTaskDue(''); }} style={{ padding: '8px 18px', border: `2px solid ${C.rule}`, background: C.paper, fontFamily: F.body, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', color: C.ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cancel</button>
                <button onClick={handleAddTask} disabled={!newTaskText.trim()} style={{ padding: '8px 18px', border: `2px solid ${C.rule}`, background: newTaskText.trim() ? C.accent : C.hairline, color: C.ink, fontFamily: F.body, fontWeight: 700, fontSize: '0.75rem', cursor: newTaskText.trim() ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ NEWSPAPER BODY ══════════ */}
      <main style={{ flex: 1, padding: '0 24px 48px', maxWidth: '1300px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* ── ABOVE THE FOLD: Greeting banner ── */}
        <div style={{
          borderBottom: `2px solid ${C.rule}`,
          padding: '18px 0 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          <div>
            <span style={{ fontFamily: F.times, fontSize: '0.68rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{greeting}</span>
            <h2 style={{ fontFamily: F.jimNightshade, fontWeight: 400, fontSize: '2.8rem', color: C.ink, margin: '0 0 0', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {firstName}
              <span style={{ fontFamily: F.jimNightshade, fontStyle: 'normal', fontWeight: 400, fontSize: '1.6rem', color: C.accentDk, marginLeft: '14px' }}>Developer Student</span>
            </h2>
            <p style={{ fontFamily: F.times, fontSize: '0.8rem', color: C.muted, margin: '4px 0 0' }}>Here's your daily progress overview.</p>
          </div>
          {/* Streak badge — compact horizontal digital counter */}
          <div style={{
            padding: '5px 6px',
            background: C.accent,
            border: `1.5px solid ${C.rule}`,
            boxShadow: `3px 3px 0 ${C.rule}`,
            color: C.ink,
            minWidth: '150px',
            maxWidth: '150px',
            flexShrink: 0,
          }}>
            <div style={{
              fontFamily: F.editorial,
              fontSize: '0.55rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.ink,
              marginBottom: '4px',
            }}>
              Day Streak
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2px',
              marginBottom: '4px',
            }}>
              {(statsLoading ? ['…'] : String(displayStreak).padStart(2, '0').split('')).map((digit, index) => (
                <div key={index} style={{
                  width: '22px',
                  height: '34px',
                  background: '#111',
                  border: `1px solid ${C.rule}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Caesar Dressing", serif',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  color: '#f8e75c',
                  textShadow: '0 0 4px rgba(241,190,62,0.9)',
                  boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.25)',
                  borderRadius: '3px',
                  transition: 'transform 0.14s ease',
                  transform: streak.current === displayStreak ? 'translateY(0)' : 'translateY(-2px)',
                }}>
                  {digit}
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{
                fontFamily: F.body,
                fontSize: '0.64rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: C.ink,
              }}>
                Best {streak.longest}
              </div>
              <div style={{
                fontFamily: F.body,
                fontSize: '0.62rem',
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Keep it moving
              </div>
            </div>
          </div>
        </div>


        {recentActivity && (() => {
          const course = coursesList.find(c => c.id === recentActivity.courseId);
          if (!course) return null;
          return (
            <div style={{
              background: C.rule, padding: '18px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px',
              borderBottom: `2px solid ${C.rule}`, cursor: 'pointer',
            }} onClick={() => onNavigate(`resume_${recentActivity.courseId}_${recentActivity.partId}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <CourseLogoImg mascot={course.mascot} id={course.id} size={44} />
                <div>
                  <p style={{ fontFamily: F.body, fontSize: '0.62rem', fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 3px' }}>CONTINUE WHERE YOU LEFT OFF</p>
                  <h2 style={{ fontFamily: F.tapestry, fontWeight: 900, fontSize: '1.4rem', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>{course.title} · Part {recentActivity.partId}</h2>
                </div>
              </div>
              <div style={{ background: C.accent, color: C.ink, padding: '11px 24px', fontFamily: F.body, fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Resume →</div>
            </div>
          );
        })()}

        {/* ── NEWSPAPER 3-COLUMN GRID ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 260px',
          borderBottom: `2px solid ${C.rule}`,
          marginTop: '0',
        }}>

          {/* ─── LEFT COLUMN: Stats sidebar ─── */}
          <div style={{ borderRight: `2px solid ${C.rule}`, padding: '20px 16px 20px 0' }}>
            {/* Column flag */}
            <div style={{ borderBottom: `2px solid ${C.rule}`, marginBottom: '14px', paddingBottom: '6px' }}>
              <span style={{ fontFamily: F.editorial, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.ink }}>Today's Stats</span>
            </div>

            {/* Stat items — editorial numbered list style */}
            <NewsStat label="Day Streak" value={statsLoading ? '…' : `${streak.current}`} sub={`Best: ${streak.longest} days`} accent={C.accent} />
            <div style={{ borderTop: `1px solid ${C.hairline}`, margin: '10px 0' }} />
            <NewsStat label="Active Days" value={statsLoading ? '…' : `${streak.total}`} sub="Total days logged in" accent="#93c5fd" />
            <div style={{ borderTop: `1px solid ${C.hairline}`, margin: '10px 0' }} />
            <NewsStat label="Tasks Done" value={tasksLoading ? '…' : `${completedTasks}/${tasks.length}`} sub={overdueTasks > 0 ? `${overdueTasks} overdue` : 'On track'} accent="#6ee7b7" />
            <div style={{ borderTop: `1px solid ${C.hairline}`, margin: '10px 0' }} />
            <NewsStat label="Active Today" value={isActiveToday ? 'YES' : 'NO'} sub={isActiveToday ? 'Streak alive 🎉' : 'Log in daily'} accent={isActiveToday ? '#6ee7b7' : C.hairline} />

            {/* Smart planner promo — editorial pull-quote box */}
            {onOpenTaskHub && (
              <div style={{ marginTop: '18px', border: `2px solid ${C.rule}`, background: C.rule, padding: '14px', cursor: 'pointer', boxShadow: `3px 3px 0 ${C.accentDk}` }}
                onClick={onOpenTaskHub}>
                <div style={{ fontFamily: F.body, fontSize: '0.6rem', fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>Smart Planner</div>
                <div style={{ fontFamily: F.editorial, fontWeight: 700, fontSize: '1.05rem', color: '#fff', marginBottom: '6px', lineHeight: 1.2 }}>Open Task Hub</div>
                <p style={{ fontFamily: F.body, fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', margin: '0 0 10px', lineHeight: 1.4 }}>LMS + external resources in one planner.</p>
                <span style={{ fontFamily: F.body, fontSize: '0.68rem', fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>OPEN →</span>
              </div>
            )}

            {/* Quick access grid */}
            <div style={{ marginTop: '16px', borderTop: `2px solid ${C.rule}`, paddingTop: '12px' }}>
              <div style={{ fontFamily: F.editorial, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.ink, marginBottom: '10px' }}>Quick Access</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <QuickCard title="Typing" icon="⌨️" onClick={() => onNavigate('typing')} />
                <QuickCard title="Aptitude" icon="🧠" onClick={() => onNavigate('aptitude')} />
                <QuickCard title="Courses" icon="🎓" onClick={() => onNavigate('academy')} />
                <QuickCard title="Resources" icon="📚" onClick={() => {}} />
              </div>
            </div>
          </div>

          {/* ─── CENTER COLUMN: Daily Tasks ─── */}
          <div style={{ borderRight: `2px solid ${C.rule}`, padding: '20px 20px' }}>
            {/* Column flag */}
            <div style={{ borderBottom: `2px solid ${C.rule}`, marginBottom: '14px', paddingBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: F.editorial, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.ink }}>Daily Tasks</span>
              <button onClick={() => setShowAddTask(true)} style={{
                background: C.accent, color: C.ink, border: 'none',
                padding: '4px 12px', fontFamily: F.body, fontWeight: 800,
                fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>+ Add</button>
            </div>

            {/* Progress bar — thin ink rule */}
            {tasks.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontFamily: F.body, fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <span>Progress</span>
                  <span style={{ fontWeight: 700, color: C.ink }}>{completedTasks}/{tasks.length} — {progressPct}%</span>
                </div>
                <div style={{ height: '4px', background: C.hairline, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? '#16a34a' : C.accent }} />
                </div>
              </div>
            )}

            {/* Tasks list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {tasksLoading && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontFamily: F.body, fontSize: '0.8rem', fontStyle: 'italic' }}>Loading dispatches…</div>
              )}
              {!tasksLoading && tasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 12px', borderTop: `1px solid ${C.hairline}` }}>
                  <div style={{ fontFamily: F.editorial, fontWeight: 700, fontSize: '1.3rem', color: C.ink, marginBottom: '6px' }}>No assignments yet.</div>
                  <div style={{ fontFamily: F.body, fontSize: '0.78rem', color: C.muted, marginBottom: '18px' }}>Add your first task and start building momentum!</div>
                  <button onClick={() => setShowAddTask(true)} style={{ background: C.accent, color: C.ink, border: 'none', padding: '10px 22px', fontFamily: F.body, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    + Add First Task
                  </button>
                </div>
              )}
              {tasks.map((task, idx) => {
                const due = formatDue(task.due_date);
                return (
                  <div key={task.id}
                    style={{ borderTop: idx === 0 ? `1px solid ${C.hairline}` : 'none', borderBottom: `1px solid ${C.hairline}` }}>
                    <div onClick={() => handleToggleTask(task.id)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 4px', cursor: 'pointer', background: task.done ? '#f7f5f0' : C.column }}>
                      {/* Checkbox — newspaper bullet style */}
                      <div style={{
                        width: '16px', height: '16px', flexShrink: 0, marginTop: '1px',
                        border: `2px solid ${task.done ? C.rule : C.hairline}`,
                        background: task.done ? C.rule : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {task.done && <span style={{ color: C.accent, fontSize: '0.6rem', fontWeight: 900 }}>✓</span>}
                      </div>
                      <span style={{ fontFamily: F.body, fontSize: '0.82rem', textDecoration: task.done ? 'line-through' : 'none', color: task.done ? C.muted : C.ink, flex: 1, lineHeight: 1.4 }}>{task.text}</span>
                      {due && <span style={{ fontFamily: F.body, fontSize: '0.62rem', fontWeight: 700, color: due.overdue ? '#dc2626' : C.muted, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{due.label}</span>}
                      <button onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.hairline, fontSize: '0.7rem', flexShrink: 0, padding: '0' }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Course Progress ─── */}
          <div style={{ padding: '20px 0 20px 16px' }}>
            {/* Column flag */}
            <div style={{ borderBottom: `2px solid ${C.rule}`, marginBottom: '14px', paddingBottom: '6px' }}>
              <span style={{ fontFamily: F.editorial, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.ink }}>Course Progress</span>
            </div>

            {/* Course rows — standings table style */}
            {statsLoading
              ? <div style={{ color: C.muted, fontFamily: F.body, fontSize: '0.8rem', fontStyle: 'italic', padding: '10px 0' }}>Loading standings…</div>
              : courseProgress.filter(cp => !HIDDEN_COURSE_IDS.includes(cp.id)).map((cp, idx) => {
                const pct = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
                return (
                  <div key={cp.id}
                    onClick={() => onNavigate(`course_${cp.id}`)}
                    style={{ borderBottom: `1px solid ${C.hairline}`, padding: '11px 0', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontFamily: "'Tapestry', cursive", fontWeight: 900, fontSize: '0.68rem', color: C.muted, minWidth: '16px' }}>#{idx + 1}</span>
                      <CourseLogoImg mascot={undefined} id={cp.id} size={20} />
                      <span style={{ fontFamily: "'Tapestry', cursive", fontWeight: 600, fontSize: '0.82rem', color: C.ink, flex: 1 }}>{cp.label}</span>
                      <span style={{
                        fontFamily: "'Tapestry', cursive", fontWeight: 800, fontSize: '0.7rem',
                        background: pct === 100 ? C.rule : C.accent,
                        color: pct === 100 ? C.accent : C.ink,
                        padding: '2px 7px',
                      }}>{pct}%</span>
                    </div>
                    <div style={{ height: '3px', background: C.hairline, marginLeft: '24px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#16a34a' : C.rule }} />
                    </div>
                  </div>
                );
              })}

            <button onClick={() => onNavigate('academy')} style={{
              width: '100%', marginTop: '14px',
              padding: '9px', border: `2px solid ${C.rule}`,
              background: C.paper, fontFamily: F.body, fontWeight: 700,
              fontSize: '0.75rem', cursor: 'pointer', color: C.ink,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              View All Courses →
            </button>

            {/* Editorial quote box at bottom */}
            <div style={{ marginTop: '20px', borderTop: `3px double ${C.rule}`, borderBottom: `3px double ${C.rule}`, padding: '14px 0', textAlign: 'center' }}>
              <div style={{ fontFamily: F.deck, fontStyle: 'italic', fontSize: '1.1rem', color: C.ink, lineHeight: 1.4, marginBottom: '6px' }}>
                "Consistency is the<br />compound interest<br />of learning."
              </div>
              <div style={{ fontFamily: "'Tapestry', cursive", fontSize: '0.72rem', fontWeight: 700, color: C.muted, letterSpacing: '0.04em' }}>— 1% Dev Academy</div>
            </div>
          </div>

        </div>{/* end 3-col grid */}

      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

// Editorial stat block — large number with label, newspaper sidebar style
function NewsStat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <div style={{ width: '4px', alignSelf: 'stretch', background: accent, flexShrink: 0, minHeight: '36px' }} />
      <div>
        <div style={{ fontFamily: "'Tapestry', cursive", fontWeight: 400, fontSize: '2rem', color: C.ink, lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: "'Tapestry', cursive", fontSize: '0.7rem', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.ink, marginTop: '2px' }}>{label}</div>
        <div style={{ fontFamily: "'Tapestry', cursive", fontSize: '0.65rem', color: C.muted, marginTop: '1px' }}>{sub}</div>
      </div>
    </div>
  );
}

function QuickCard({ title, icon, onClick }: { title: string; icon: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: C.paper, border: `1.5px solid ${C.rule}`,
      padding: '9px 6px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      textAlign: 'center', gap: '4px', fontFamily: 'inherit',
    }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span style={{ fontFamily: "'DM Sans', Inter, sans-serif", fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.ink }}>{title}</span>
    </button>
  );
}

// Newspaper section tab
function NavTab({ icon, label, onClick, active = false }: { icon: string; label: string; onClick: () => void; active?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: active ? C.rule : hover ? C.hairline : 'transparent',
        color: active ? C.accent : C.ink,
        border: 'none', borderRight: `1px solid ${C.hairline}`,
        height: '36px', padding: '0 14px',
        display: 'flex', alignItems: 'center', gap: '5px',
        cursor: 'pointer', fontSize: '0.72rem', flexShrink: 0,
        fontFamily: F.times,
        fontWeight: active ? 700 : 500,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        transition: 'background 100ms',
      }}>
      <span style={{ fontFamily: F.times }}>{icon}</span>
      <span style={{ fontFamily: F.times }}>{label}</span>
    </button>
  );
}

function NavTabLogo({ mascot, courseId, label, onClick }: { mascot?: string; courseId: string; label: string; onClick: () => void }) {
  const [hover, setHover] = React.useState(false);
  const url = getCourseLogoUrl(mascot, courseId);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? C.hairline : 'transparent',
        color: C.ink, border: 'none', borderRight: `1px solid ${C.hairline}`,
        height: '36px', padding: '0 14px',
        display: 'flex', alignItems: 'center', gap: '5px',
        cursor: 'pointer', fontSize: '0.72rem', flexShrink: 0,
        fontFamily: F.times, fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        transition: 'background 100ms',
      }}>
      {url
        ? <img src={url} alt={label} style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 2 }} />
        : <span style={{ fontFamily: F.times }}>{getCourseEmoji(mascot, courseId)}</span>}
      <span style={{ fontFamily: F.times }}>{label}</span>
    </button>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="3" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="#22c55e" />
      <polyline points="7 12 10.5 15.5 17 8.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="#ec4899" stroke="none" />
    </svg>
  );
}

async function fetchModulesAndProgress(courseId: string) {
  try {
    const [mods, prog] = await Promise.all([fetchModules(courseId), fetchProgress(courseId)]);
    return { total: mods.reduce((s, m) => s + m.notes.length, 0), completed: prog.length };
  } catch { return { completed: 0, total: 0 }; }
}
