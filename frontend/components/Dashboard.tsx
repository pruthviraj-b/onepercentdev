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
  todayStr as smartTodayStr,
} from '@/lib/smartTaskApi';
import { fetchProgress, fetchModules, fetchCourses, Course, fetchRecentActivity } from '@/lib/api';

const HIDDEN_COURSE_IDS = ['data-analyst', 'data-analyst-en'];

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

export function Dashboard({ onNavigate, onOpenTaskHub }: DashboardProps) {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [smartTasks, setSmartTasks] = useState<SmartTask[]>([]);
  const [smartTasksLoading, setSmartTasksLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [streak, setStreak] = useState<StreakInfo>({ current: 0, longest: 0, total: 0, dates: [] });
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<{ courseId: string; partId: number } | null>(null);

  // ── Load tasks (no defaults) ──
  useEffect(() => {
    setTasksLoading(true);
    fetchLegacyTasks().then(data => { setTasks(data); setTasksLoading(false); });
  }, []);

  // ── Load smart tasks ──
  useEffect(() => {
    setSmartTasksLoading(true);
    fetchSmartTasks({ pageSize: 100 }).then(r => { setSmartTasks(r.tasks || []); setSmartTasksLoading(false); }).catch(() => setSmartTasksLoading(false));
  }, []);

  // ── Load streak & course progress ──
  useEffect(() => {
    setStatsLoading(true);
    pingStreak();
    Promise.all([fetchStreak(), fetchCourses(), fetchRecentActivity()]).then(async ([sd, courses, recent]) => {
      setStreak(sd); setCoursesList(courses); setRecentActivity(recent);
      const results = await Promise.all(courses.map(c => fetchModulesAndProgress(c.id)));
      setCourseProgress(courses.map((c, i) => ({ id: c.id, label: c.title, icon: c.mascot || '📘', ...results[i] })));
      setStatsLoading(false);
    });
  }, []);

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
  const firstName = user?.displayName?.split(' ')[0] || 'Developer';
  const photoURL = user?.photoURL && !imgError ? user.photoURL : null;
  const initials = user?.displayName ? user.displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
  const greeting = (() => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; })();

  return (
    <div className="dash-shell" style={{ minHeight: '100vh', background: '#f4f1ea', backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 1.5px, transparent 1.5px)', backgroundSize: '16px 16px', fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* ── NAV ── */}
      <nav className="dash-topbar" style={{ position: 'sticky', top: 0, zIndex: 200, minHeight: '54px', background: '#f1be3e', borderBottom: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', boxShadow: '0 3px 0 #000', flexWrap: 'wrap', gap: '8px' }} role="navigation" aria-label="Main navigation">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.9rem', fontWeight: 800, padding: '3px 10px', background: '#000', color: '#f1be3e', border: '2px solid #000', letterSpacing: '0.05em' }}>1%</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.95rem', fontWeight: 800, color: '#000', textTransform: 'uppercase' }}>Dev Academy</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', fontWeight: 700, color: '#000', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: '4px' }}>/ Home</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="dash-nav-links">
          <NavChip label="Home" onClick={() => {}} active />
          {coursesList.filter(c => !c.parentId && !HIDDEN_COURSE_IDS.includes(c.id)).map(c => (
            <NavChip key={c.id} label={c.title} onClick={() => onNavigate(`course_${c.id}`)} />
          ))}
          <NavChip label="⌨️ Typing" onClick={() => onNavigate('typing')} />
          <NavChip label="🧠 Aptitude" onClick={() => onNavigate('aptitude')} />
          {onOpenTaskHub && <NavChip label="🎯 Tasks" onClick={onOpenTaskHub} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button onClick={() => setProfileMenuOpen(o => !o)} aria-label={`Profile menu for ${user?.displayName || 'user'}`} aria-expanded={profileMenuOpen} aria-haspopup="true"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: profileMenuOpen ? '#000' : '#fff', color: profileMenuOpen ? '#f1be3e' : '#000', border: '2px solid #000', boxShadow: profileMenuOpen ? 'none' : '2px 2px 0 #000', padding: '4px 10px 4px 4px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.82rem', transition: 'all 80ms' }}>
              {photoURL ? <img src={photoURL} alt={user?.displayName || 'Profile'} onError={() => setImgError(true)} style={{ width: '28px', height: '28px', border: '2px solid currentColor', objectFit: 'cover', borderRadius: '50%' }} /> :
                <div style={{ width: '28px', height: '28px', background: profileMenuOpen ? '#f1be3e' : '#000', color: profileMenuOpen ? '#000' : '#f1be3e', border: '2px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>{initials}</div>}
              <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: profileMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {profileMenuOpen && (
              <div role="menu" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: '2px solid #000', boxShadow: '4px 4px 0 #000', minWidth: '220px', zIndex: 300 }}>
                <div style={{ padding: '12px 14px', borderBottom: '2px solid #000', background: '#f4f1ea' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {photoURL ? <img src={photoURL} alt="" style={{ width: '36px', height: '36px', border: '2px solid #000', objectFit: 'cover', borderRadius: '50%' }} /> :
                      <div style={{ width: '36px', height: '36px', background: '#000', color: '#f1be3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', border: '2px solid #000' }}>{initials}</div>}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#000' }}>{user?.displayName || 'Developer'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#555', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{user?.email}</div>
                    </div>
                  </div>
                </div>
                <DropdownItem icon="🏠" label="Home" active onClick={() => setProfileMenuOpen(false)} />
                {coursesList.filter(c => !c.parentId && !HIDDEN_COURSE_IDS.includes(c.id)).map(c => (
                  <DropdownItem key={c.id} icon={c.mascot || '📘'} label={c.title} onClick={() => { onNavigate(`course_${c.id}`); setProfileMenuOpen(false); }} />
                ))}
                <DropdownItem icon="⌨️" label="Typing Practice" onClick={() => { onNavigate('typing'); setProfileMenuOpen(false); }} />
                <DropdownItem icon="🧠" label="Aptitude Tests" onClick={() => { onNavigate('aptitude'); setProfileMenuOpen(false); }} />
                {onOpenTaskHub && <DropdownItem icon="🎯" label="Task Hub" onClick={() => { onOpenTaskHub(); setProfileMenuOpen(false); }} />}
                <div style={{ borderTop: '2px solid #000', marginTop: '4px' }}>
                  <button role="menuitem" onClick={() => { logout(); setProfileMenuOpen(false); }} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.82rem', color: '#cc0000', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── ADD TASK MODAL ── */}
      {showAddTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowAddTask(false); setNewTaskText(''); setNewTaskDue(''); } }}
          role="dialog" aria-modal="true" aria-labelledby="add-task-title">
          <div style={{ background: '#fff', border: '3px solid #000', boxShadow: '8px 8px 0 #000', width: '440px', maxWidth: '90vw' }}>
            <div style={{ background: '#f1be3e', borderBottom: '2px solid #000', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span id="add-task-title" style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>+ Add New Task</span>
              <button onClick={() => { setShowAddTask(false); setNewTaskText(''); setNewTaskDue(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '1rem', color: '#000' }} aria-label="Close">✕</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="task-text-input" style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Task Description</label>
                <input id="task-text-input" ref={inputRef} type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={handleAddKeyDown}
                  placeholder="e.g. Watch 2 Cloud videos..." aria-required="true" autoComplete="off"
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontSize: '0.9rem', outline: 'none', background: '#f4f1ea', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label htmlFor="task-due-input" style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Due Date <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
                <input id="task-due-input" type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} min={todayStr()}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontSize: '0.9rem', outline: 'none', background: '#f4f1ea', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowAddTask(false); setNewTaskText(''); setNewTaskDue(''); }} style={{ padding: '8px 18px', border: '2px solid #000', background: '#f4f1ea', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'uppercase' }}>Cancel</button>
                <button onClick={handleAddTask} disabled={!newTaskText.trim()}
                  style={{ padding: '8px 18px', border: '2px solid #000', background: newTaskText.trim() ? '#000' : '#999', color: '#f1be3e', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.82rem', cursor: newTaskText.trim() ? 'pointer' : 'not-allowed', textTransform: 'uppercase', boxShadow: newTaskText.trim() ? '3px 3px 0 #000' : 'none' }}
                  aria-disabled={!newTaskText.trim()}>Add Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="dash-main" style={{ flex: 1, padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }} id="main-content">

        {/* Welcome */}
        <div className="dash-welcome" style={{ marginBottom: '24px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{greeting} 👋</p>
          <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.4rem)', fontWeight: 900, letterSpacing: '-1px', margin: 0, lineHeight: 1.1 }}>{firstName}<span style={{ color: '#f1be3e' }}>.</span></h1>
          {user?.displayName && user.displayName.split(' ').length > 1 && (
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: '#555', marginTop: '4px', fontWeight: 600 }}>{user.displayName}</p>
          )}
          <p style={{ fontFamily: 'var(--font-content)', color: '#555', marginTop: '6px', fontSize: '0.95rem' }}>Here's your daily progress overview.</p>
        </div>

        {/* Jump Back In */}
        {!statsLoading && !recentActivity && coursesList.length > 0 && (
          <div className="dash-start-card-wrap" style={{ marginBottom: '28px' }}>
            <div style={{ background: '#f4f1ea', border: '3px solid #000', boxShadow: '6px 6px 0 #000', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', opacity: 0.6, margin: '0 0 4px' }}>READY TO BEGIN?</p>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🎓 Start Your First Course</h2>
                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, fontFamily: 'var(--font-ui)', color: '#555' }}>Pick a course below and begin learning today.</p>
              </div>
              <div onClick={() => onNavigate('academy')}
                style={{ background: '#000', color: '#f1be3e', padding: '12px 20px', fontWeight: 900, fontSize: '0.9rem', border: '2px solid #000', boxShadow: '2px 2px 0 rgba(255,255,255,0.4)', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer' }}>
                BROWSE →
              </div>
            </div>
          </div>
        )}
        {recentActivity && (() => {
          const course = coursesList.find(c => c.id === recentActivity.courseId);
          if (!course) return null;
          return (
            <div style={{ marginBottom: '28px' }}>
              <div onClick={() => onNavigate(`resume_${recentActivity.courseId}_${recentActivity.partId}`)}
                style={{ background: '#a0c8ff', border: '3px solid #000', boxShadow: '6px 6px 0 #000', padding: '20px 24px', cursor: 'pointer', transition: 'transform 80ms, box-shadow 80ms', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}
                role="button" tabIndex={0} aria-label={`Resume ${course.title}, Part ${recentActivity.partId}`}
                onKeyDown={e => e.key === 'Enter' && onNavigate(`resume_${recentActivity.courseId}_${recentActivity.partId}`)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '8px 8px 0 #000'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '6px 6px 0 #000'; }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', opacity: 0.7, margin: '0 0 4px' }}>CONTINUE WHERE YOU LEFT OFF</p>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🚀 Jump Back In</h2>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-ui)', color: '#333' }}>{course.mascot} {course.title} · Part {recentActivity.partId}</p>
                </div>
                <div style={{ background: '#000', color: '#fff', padding: '12px 20px', fontWeight: 900, fontSize: '0.9rem', border: '2px solid #000', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>RESUME →</div>
              </div>
            </div>
          );
        })()}

        {/* Stats Row */}
        <div className="dash-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '28px' }} role="region" aria-label="Learning statistics">
          <StatCard emoji="🔥" label="Day Streak" value={statsLoading ? '…' : `${streak.current}`} sub={`Best: ${streak.longest} days`} accent="#f1be3e" />
          <StatCard emoji="📅" label="Active Days" value={statsLoading ? '…' : `${streak.total}`} sub="Days you've logged in" accent="#e0e0e0" />
          <StatCard emoji="✅" label="Tasks Done" value={tasksLoading ? '…' : `${completedTasks}/${tasks.length}`} sub={overdueTasks > 0 ? `${overdueTasks} overdue` : 'On track'} accent={overdueTasks > 0 ? '#ffcccc' : '#e0e0e0'} />
          <StatCard emoji="🎯" label="Today" value={streak.dates.includes(todayStr()) ? '✓ Active' : '– Not yet'} sub={streak.dates.includes(todayStr()) ? 'Streak alive!' : 'Log in daily'} accent={streak.dates.includes(todayStr()) ? '#ccf7e5' : '#f4f1ea'} />
        </div>

        {/* Main Grid */}
        <div className="dash-content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '28px', alignItems: 'start' }}>

          {/* Task Hub Banner */}
          {onOpenTaskHub && (
            <div className="dash-taskhub-card" style={{ marginBottom: '20px' }}>
              <div onClick={onOpenTaskHub}
                style={{ background: '#000', border: '3px solid #000', boxShadow: '6px 6px 0 #f1be3e', padding: '16px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'transform 80ms,box-shadow 80ms' }}
                role="button" tabIndex={0} aria-label="Open Smart Task Hub"
                onKeyDown={e => e.key === 'Enter' && onOpenTaskHub?.()}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '8px 8px 0 #f1be3e'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '6px 6px 0 #f1be3e'; }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f1be3e', opacity: 0.8, margin: '0 0 4px' }}>SMART LEARNING PLANNER</p>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#f1be3e' }}>🎯 Open Task Hub</h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,0.7)' }}>Your personal learning planner — LMS + external resources.</p>
                </div>
                <div style={{ background: '#f1be3e', color: '#000', padding: '10px 18px', fontWeight: 900, fontSize: '0.85rem', border: '2px solid #f1be3e', flexShrink: 0, textTransform: 'uppercase' }}>OPEN →</div>
              </div>
              {!smartTasksLoading && smartTasks.length > 0 && (() => {
                const today = smartTodayStr();
                const dueToday = smartTasks.filter(t => t.due_date === today && !t.is_archived).length;
                const overdue  = smartTasks.filter(t => t.due_date && t.due_date < today && t.status !== 'completed' && t.status !== 'skipped' && !t.is_archived).length;
                const pinned   = smartTasks.filter(t => t.is_pinned && !t.is_archived).length;
                const highPri  = smartTasks.filter(t => (t.priority === 'high' || t.priority === 'critical') && t.status !== 'completed' && !t.is_archived).length;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '2px solid #000', borderTop: 'none', background: '#fff' }}>
                    {[{ label: 'Today', value: dueToday, color: '#e67e22', icon: '📅' }, { label: 'Overdue', value: overdue, color: overdue > 0 ? '#cc0000' : '#888', icon: '⚠️' }, { label: 'Pinned', value: pinned, color: '#f1be3e', icon: '📌' }, { label: 'High Pri', value: highPri, color: highPri > 0 ? '#e67e22' : '#888', icon: '🔥' }].map((s, i) => (
                      <div key={s.label} onClick={onOpenTaskHub} style={{ padding: '10px 14px', borderRight: i < 3 ? '1px solid #e0e0e0' : 'none', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem' }}>{s.icon}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#555' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div className="dash-left-quick-panel" role="region" aria-label="Quick access">
                <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Access</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <ModuleCard title="Typing Practice" icon="⌨️" accent="#e0e0e0" onClick={() => onNavigate('typing')} />
                  <ModuleCard title="Aptitude Tests" icon="🧠" accent="#e0e0e0" onClick={() => onNavigate('aptitude')} />
                </div>
              </div>
            </div>
          )}

          {/* Daily Tasks */}
          <div className="dash-task-panel" style={{ background: '#fff', border: '3px solid #000', boxShadow: '6px 6px 0 #000', display: 'flex', flexDirection: 'column' }} role="region" aria-label="Daily tasks">
            <div style={{ background: '#f1be3e', borderBottom: '2px solid #000', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 Daily Tasks</h2>
              <button onClick={() => setShowAddTask(true)} aria-label="Add new task"
                style={{ background: '#000', color: '#f1be3e', border: '2px solid #000', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, fontSize: '1.2rem', boxShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}>+</button>
            </div>
            <div className="dash-task-body" style={{ padding: '18px' }}>
              {tasks.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Today's Progress</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{completedTasks}/{tasks.length} — {progressPct}%</span>
                  </div>
                  <div style={{ height: '14px', background: '#f4f1ea', border: '2px solid #000', overflow: 'hidden' }}
                    role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                    <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? '#00aa44' : '#f1be3e', borderRight: progressPct < 100 ? '2px solid #000' : 'none', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}
              <div className={`dash-task-list${tasks.length === 0 ? ' empty' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="list">
                {tasksLoading && <div style={{ textAlign: 'center', padding: '24px 0', color: '#888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Loading tasks…</div>}
                {!tasksLoading && tasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                    <div>No tasks yet.</div>
                    <button onClick={() => setShowAddTask(true)} style={{ marginTop: '12px', padding: '6px 16px', background: '#000', color: '#f1be3e', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', textTransform: 'uppercase' }}>+ Add your first task</button>
                  </div>
                )}
                {tasks.map(task => {
                  const due = formatDue(task.due_date);
                  return (
                    <div key={task.id} onClick={() => handleToggleTask(task.id)} role="listitem" tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && handleToggleTask(task.id)}
                      aria-label={`${task.text}. ${task.done ? 'Completed.' : 'Not done.'} Click to toggle.`}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', border: '2px solid #000', background: task.done ? '#f4f1ea' : '#fff', cursor: 'pointer', transition: 'background 80ms' }}>
                      <div style={{ width: '20px', height: '20px', flexShrink: 0, border: '2px solid #000', background: task.done ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                        {task.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f1be3e" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: 'var(--font-content)', fontSize: '0.88rem', fontWeight: 600, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? '#888' : '#000', display: 'block' }}>{task.text}</span>
                        {due && <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: due.overdue ? '#cc0000' : '#888', fontWeight: 700, marginTop: '2px', display: 'block' }}>{due.label}</span>}
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }} aria-label={`Delete: ${task.text}`}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '0.9rem', padding: '4px', flexShrink: 0, minWidth: '24px', minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#cc0000'; }} onMouseLeave={e => { e.currentTarget.style.color = '#bbb'; }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="dash-side-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="dash-course-panel" role="region" aria-label="Course progress">
              <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📊 Course Progress</h2>
              <div className="dash-course-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {statsLoading ? <div style={{ color: '#888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '12px' }}>Loading progress…</div>
                  : courseProgress.filter(cp => !HIDDEN_COURSE_IDS.includes(cp.id)).map(cp => {
                    const pct = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
                    return (
                      <div key={cp.id} onClick={() => onNavigate(`course_${cp.id}`)} role="button" tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && onNavigate(`course_${cp.id}`)}
                        aria-label={`${cp.label}: ${pct}% complete`}
                        style={{ background: '#fff', border: '3px solid #000', boxShadow: '4px 4px 0 #000', padding: '14px 18px', cursor: 'pointer', transition: 'transform 80ms,box-shadow 80ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '6px 6px 0 #000'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '4px 4px 0 #000'; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontWeight: 900, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>{cp.icon} {cp.label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', background: '#f1be3e', padding: '2px 8px', border: '1px solid #000' }}>{pct}%</span>
                        </div>
                        <div style={{ height: '12px', background: '#f4f1ea', border: '2px solid #000', overflow: 'hidden', marginBottom: '6px' }}
                          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#00aa44' : '#f1be3e', transition: 'width 0.4s ease' }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#555', fontFamily: 'var(--font-mono)' }}>{cp.completed} / {cp.total} parts · Click to open →</div>
                      </div>
                    );
                  })}
              </div>
            </div>
            <div className="dash-quick-panel" role="region" aria-label="Quick access">
              <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🛠️ Quick Access</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ModuleCard title="Typing Practice" icon="⌨️" accent="#e0e0e0" onClick={() => onNavigate('typing')} />
                <ModuleCard title="Aptitude Tests" icon="🧠" accent="#e0e0e0" onClick={() => onNavigate('aptitude')} />
              </div>
            </div>
          </div>

        </div>
        <div style={{ height: '32px' }} />
      </main>
    </div>
  );
}

async function fetchModulesAndProgress(courseId: string): Promise<{ completed: number; total: number }> {
  try {
    const [mods, prog] = await Promise.all([fetchModules(courseId), fetchProgress(courseId)]);
    return { total: mods.reduce((s, m) => s + m.notes.length, 0), completed: prog.length };
  } catch { return { completed: 0, total: 0 }; }
}

function StatCard({ emoji, label, value, sub, accent }: { emoji: string; label: string; value: string; sub: string; accent: string }) {
  return (
    <div style={{ background: accent, border: '2px solid #000', boxShadow: '3px 3px 0 #000', padding: '14px 16px' }}>
      <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{emoji}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 900, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>{label}</div>
      <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>{sub}</div>
    </div>
  );
}

function NavChip({ label, onClick, active = false }: { label: string; onClick: () => void; active?: boolean }) {
  const [hover, setHover] = useState(false);
  const hi = active || hover;
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} aria-current={active ? 'page' : undefined}
      style={{ background: hi ? '#000' : 'transparent', color: hi ? '#f1be3e' : '#000', borderStyle: 'solid', borderWidth: active ? '2px 2px 3px 2px' : '2px', borderTopColor: hi ? '#000' : 'transparent', borderRightColor: hi ? '#000' : 'transparent', borderLeftColor: hi ? '#000' : 'transparent', borderBottomColor: '#000', padding: '5px 12px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.8rem', cursor: active ? 'default' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'all 80ms' }}>
      {label}
    </button>
  );
}

function DropdownItem({ icon, label, onClick, active = false }: { icon: string; label: string; onClick: () => void; active?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button role="menuitem" onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ width: '100%', padding: '9px 14px', background: active ? '#f1be3e' : hover ? '#f4f1ea' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: active ? 800 : 600, fontSize: '0.82rem', color: '#000', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{icon}</span>{label}{active && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.6 }}>● ACTIVE</span>}
    </button>
  );
}

function ModuleCard({ title, icon, accent, onClick }: { title: string; icon: string; accent: string; onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div onClick={onClick} onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      style={{ background: accent, border: '3px solid #000', boxShadow: pressed ? '0 0 0 #000' : '4px 4px 0 #000', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center', transform: pressed ? 'translate(4px,4px)' : 'none', transition: 'transform 80ms, box-shadow 80ms', minHeight: '90px' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: '8px', lineHeight: 1 }}>{icon}</div>
      <h3 style={{ fontSize: '0.82rem', fontWeight: 900, margin: 0, lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</h3>
    </div>
  );
}
