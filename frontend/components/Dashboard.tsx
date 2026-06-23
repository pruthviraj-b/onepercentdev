'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import {
  fetchTasks, createTask, updateTask, deleteTask,
  fetchStreak, pingStreak,
  Task, StreakInfo,
} from '@/lib/taskApi';
import { fetchProgress, fetchModules } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CourseProgress {
  id: string;
  label: string;
  icon: string;
  completed: number;
  total: number;
}

interface DashboardProps {
  onNavigate: (module: 'course_python' | 'course_cloud' | 'typing' | 'aptitude') => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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

// ── Dashboard Component ────────────────────────────────────────────────────────

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user, logout } = useAuth();

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  // Profile
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Streak & stats
  const [streak, setStreak] = useState<StreakInfo>({ current: 0, longest: 0, total: 0, dates: [] });
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Load tasks from backend ──
  useEffect(() => {
    setTasksLoading(true);
    fetchTasks().then(data => {
      if (data.length === 0) {
        // Seed defaults on first load
        const defaults = [
          'Complete 1 Course Module',
          '15 Minutes Typing Practice',
          'Solve 5 Aptitude Questions',
          'Read 1 Tech Article',
        ];
        Promise.all(defaults.map(t => createTask(t))).then(results => {
          setTasks(results.filter(Boolean) as Task[]);
        });
      } else {
        setTasks(data);
      }
      setTasksLoading(false);
    });
  }, []);

  // ── Load streak & course progress ──
  useEffect(() => {
    setStatsLoading(true);
    pingStreak();
    Promise.all([
      fetchStreak(),
      fetchModulesAndProgress('python'),
      fetchModulesAndProgress('cloud'),
    ]).then(([streakData, pythonProg, cloudProg]) => {
      setStreak(streakData);
      setCourseProgress([
        { id: 'python', label: 'Python', icon: '🐍', ...pythonProg },
        { id: 'cloud', label: 'Cloud', icon: '☁️', ...cloudProg },
      ]);
      setStatsLoading(false);
    });
  }, []);

  // ── Close profile menu on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (showAddTask && inputRef.current) inputRef.current.focus();
  }, [showAddTask]);

  // ── Task actions ──
  const handleToggleTask = useCallback(async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t));
    await updateTask(id, { done: newDone });
    if (newDone) pingStreak();
  }, [tasks]);

  const handleDeleteTask = useCallback(async (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteTask(id);
  }, []);

  const handleAddTask = useCallback(async () => {
    const text = newTaskText.trim();
    if (!text) return;
    const task = await createTask(text, newTaskDue || undefined);
    if (task) setTasks(prev => [...prev, task]);
    setNewTaskText('');
    setNewTaskDue('');
    setShowAddTask(false);
    pingStreak();
  }, [newTaskText, newTaskDue]);

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTask();
    if (e.key === 'Escape') { setShowAddTask(false); setNewTaskText(''); setNewTaskDue(''); }
  };

  // ── Derived values ──
  const completedTasks = tasks.filter(t => t.done).length;
  const progressPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const overdueTasks = tasks.filter(t => !t.done && t.due_date && new Date(t.due_date) < new Date(todayStr())).length;

  const firstName = user?.displayName?.split(' ')[0] || 'Developer';
  const photoURL = user?.photoURL && !imgError ? user.photoURL : null;
  const initials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  // ── Render ──
  return (
    <div style={{ minHeight: '100vh', background: '#f4f1ea', backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 1.5px, transparent 1.5px)', backgroundSize: '16px 16px', fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, minHeight: '54px', background: '#f1be3e', borderBottom: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', boxShadow: '0 3px 0 #000', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.9rem', fontWeight: 800, padding: '3px 10px', background: '#000', color: '#f1be3e', border: '2px solid #000', letterSpacing: '0.05em' }}>1%</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.95rem', fontWeight: 800, color: '#000', textTransform: 'uppercase' }}>Dev Academy</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', fontWeight: 700, color: '#000', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: '4px' }}>/ Home</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="dash-nav-links">
          <NavChip label="Home" onClick={() => {}} active />
          {(['Python','Cloud','Typing','Aptitude'] as const).map(label => {
            const modMap: Record<string,'course_python'|'course_cloud'|'typing'|'aptitude'> = { Python:'course_python', Cloud:'course_cloud', Typing:'typing', Aptitude:'aptitude' };
            return <NavChip key={label} label={label} onClick={() => onNavigate(modMap[label])} />;
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setShowAddTask(true)} aria-label="Add new task" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#000', color: '#f1be3e', border: '2px solid #000', boxShadow: '2px 2px 0 rgba(0,0,0,0.3)', padding: '5px 14px', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
            onMouseDown={e=>{e.currentTarget.style.transform='translate(2px,2px)';e.currentTarget.style.boxShadow='none';}}
            onMouseUp={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='2px 2px 0 rgba(0,0,0,0.3)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='2px 2px 0 rgba(0,0,0,0.3)';}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Task
          </button>
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button onClick={() => setProfileMenuOpen(o => !o)} aria-label={`Profile menu for ${user?.displayName||'user'}`} aria-expanded={profileMenuOpen}
              style={{ display:'flex', alignItems:'center', gap:'8px', background: profileMenuOpen?'#000':'#fff', color: profileMenuOpen?'#f1be3e':'#000', border:'2px solid #000', boxShadow: profileMenuOpen?'none':'2px 2px 0 #000', padding:'4px 10px 4px 4px', cursor:'pointer', fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.82rem', transition:'all 80ms' }}>
              {photoURL ? <img src={photoURL} alt={user?.displayName||'Profile'} onError={()=>setImgError(true)} style={{ width:'28px',height:'28px',border:'2px solid currentColor',objectFit:'cover' }}/> :
                <div style={{ width:'28px',height:'28px',background:profileMenuOpen?'#f1be3e':'#000',color:profileMenuOpen?'#000':'#f1be3e',border:'2px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'0.7rem',flexShrink:0 }}>{initials}</div>}
              <span style={{ maxWidth:'100px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{firstName}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true" style={{ transform:profileMenuOpen?'rotate(180deg)':'none',transition:'transform 120ms' }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {profileMenuOpen && (
              <div role="menu" style={{ position:'absolute',top:'calc(100% + 6px)',right:0,background:'#fff',border:'2px solid #000',boxShadow:'4px 4px 0 #000',minWidth:'220px',zIndex:300 }}>
                <div style={{ padding:'12px 14px',borderBottom:'2px solid #000',background:'#f4f1ea' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
                    {photoURL ? <img src={photoURL} alt="" style={{ width:'36px',height:'36px',border:'2px solid #000',objectFit:'cover' }}/> :
                      <div style={{ width:'36px',height:'36px',background:'#000',color:'#f1be3e',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'0.8rem',border:'2px solid #000' }}>{initials}</div>}
                    <div>
                      <div style={{ fontWeight:800,fontSize:'0.88rem',color:'#000' }}>{user?.displayName||'Developer'}</div>
                      <div style={{ fontSize:'0.72rem',color:'#555',fontFamily:'var(--font-mono)',marginTop:'2px' }}>{user?.email}</div>
                    </div>
                  </div>
                </div>
                <DropdownItem icon="🏠" label="Home" active onClick={()=>setProfileMenuOpen(false)}/>
                <DropdownItem icon="🐍" label="Python Course" onClick={()=>{onNavigate('course_python');setProfileMenuOpen(false);}}/>
                <DropdownItem icon="☁️" label="Cloud Course" onClick={()=>{onNavigate('course_cloud');setProfileMenuOpen(false);}}/>
                <DropdownItem icon="⌨️" label="Typing Practice" onClick={()=>{onNavigate('typing');setProfileMenuOpen(false);}}/>
                <DropdownItem icon="🧠" label="Aptitude Tests" onClick={()=>{onNavigate('aptitude');setProfileMenuOpen(false);}}/>
                <div style={{ borderTop:'2px solid #000',marginTop:'4px' }}>
                  <button role="menuitem" onClick={()=>{logout();setProfileMenuOpen(false);}} style={{ width:'100%',padding:'10px 14px',background:'transparent',border:'none',cursor:'pointer',fontFamily:'var(--font-ui)',fontWeight:700,fontSize:'0.82rem',color:'#000',textAlign:'left',display:'flex',alignItems:'center',gap:'8px' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#ffeeee';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
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
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500 }}
          onClick={e=>{if(e.target===e.currentTarget){setShowAddTask(false);setNewTaskText('');setNewTaskDue('');}}}>
          <div style={{ background:'#fff',border:'3px solid #000',boxShadow:'8px 8px 0 #000',width:'440px',maxWidth:'90vw' }}>
            <div style={{ background:'#f1be3e',borderBottom:'2px solid #000',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <span style={{ fontWeight:800,fontSize:'0.9rem',textTransform:'uppercase',letterSpacing:'0.05em' }}>+ Add New Task</span>
              <button onClick={()=>{setShowAddTask(false);setNewTaskText('');setNewTaskDue('');}} style={{ background:'none',border:'none',cursor:'pointer',fontWeight:900,fontSize:'1rem',color:'#000' }}>✕</button>
            </div>
            <div style={{ padding:'20px',display:'flex',flexDirection:'column',gap:'14px' }}>
              <div>
                <label style={{ display:'block',fontWeight:700,fontSize:'0.82rem',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.04em' }}>Task Description</label>
                <input ref={inputRef} type="text" value={newTaskText} onChange={e=>setNewTaskText(e.target.value)} onKeyDown={handleAddKeyDown}
                  placeholder="e.g. Watch 2 Cloud videos..." style={{ width:'100%',padding:'10px 12px',border:'2px solid #000',fontFamily:'var(--font-ui)',fontSize:'0.9rem',outline:'none',background:'#f4f1ea',boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ display:'block',fontWeight:700,fontSize:'0.82rem',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.04em' }}>Due Date <span style={{ fontWeight:400,opacity:0.6 }}>(optional)</span></label>
                <input type="date" value={newTaskDue} onChange={e=>setNewTaskDue(e.target.value)} min={todayStr()}
                  style={{ width:'100%',padding:'10px 12px',border:'2px solid #000',fontFamily:'var(--font-ui)',fontSize:'0.9rem',outline:'none',background:'#f4f1ea',boxSizing:'border-box' }}/>
              </div>
              <div style={{ display:'flex',gap:'10px',justifyContent:'flex-end' }}>
                <button onClick={()=>{setShowAddTask(false);setNewTaskText('');setNewTaskDue('');}} style={{ padding:'8px 18px',border:'2px solid #000',background:'#f4f1ea',fontFamily:'var(--font-ui)',fontWeight:700,fontSize:'0.82rem',cursor:'pointer',textTransform:'uppercase' }}>Cancel</button>
                <button onClick={handleAddTask} disabled={!newTaskText.trim()} style={{ padding:'8px 18px',border:'2px solid #000',background:newTaskText.trim()?'#000':'#999',color:'#f1be3e',fontFamily:'var(--font-ui)',fontWeight:800,fontSize:'0.82rem',cursor:newTaskText.trim()?'pointer':'not-allowed',textTransform:'uppercase',boxShadow:newTaskText.trim()?'3px 3px 0 #000':'none' }}>Add Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex:1,padding:'32px 24px',maxWidth:'1100px',margin:'0 auto',width:'100%',boxSizing:'border-box' }}>

        {/* Welcome */}
        <div style={{ marginBottom:'28px' }}>
          <p style={{ fontFamily:'var(--font-mono)',fontSize:'0.78rem',color:'#555',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'6px' }}>{greeting} 👋</p>
          <h1 style={{ fontSize:'clamp(1.8rem,5vw,2.4rem)',fontWeight:900,letterSpacing:'-1px',margin:0,lineHeight:1.1 }}>{firstName}<span style={{ color:'#f1be3e' }}>.</span></h1>
          {user?.displayName && user.displayName.split(' ').length > 1 && (
            <p style={{ fontFamily:'var(--font-ui)',fontSize:'0.85rem',color:'#555',marginTop:'4px',fontWeight:600 }}>{user.displayName}</p>
          )}
          <p style={{ fontFamily:'var(--font-content)',color:'#555',marginTop:'6px',fontSize:'0.95rem' }}>Here's your daily progress overview.</p>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'14px',marginBottom:'28px' }}>
          <StatCard emoji="🔥" label="Day Streak" value={statsLoading ? '…' : `${streak.current}`} sub={`Best: ${streak.longest} days`} accent="#f1be3e"/>
          <StatCard emoji="📅" label="Active Days" value={statsLoading ? '…' : `${streak.total}`} sub="Total sessions" accent="#e0e0e0"/>
          <StatCard emoji="✅" label="Tasks Done" value={tasksLoading ? '…' : `${completedTasks}/${tasks.length}`} sub={overdueTasks > 0 ? `${overdueTasks} overdue` : 'On track'} accent={overdueTasks > 0 ? '#ffcccc' : '#e0e0e0'}/>
          <StatCard emoji="🎯" label="Today" value={streak.dates.includes(todayStr()) ? '✓ Active' : '– Not yet'} sub={streak.dates.includes(todayStr()) ? 'Streak alive!' : 'Open app to count'} accent={streak.dates.includes(todayStr()) ? '#ccf7e5' : '#f4f1ea'}/>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'28px',alignItems:'start' }}>

          {/* ── DAILY TASKS PANEL ── */}
          <div style={{ background:'#fff',border:'3px solid #000',boxShadow:'6px 6px 0 #000',display:'flex',flexDirection:'column' }}>
            <div style={{ background:'#f1be3e',borderBottom:'2px solid #000',padding:'12px 18px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <h2 style={{ fontSize:'1rem',fontWeight:900,margin:0,textTransform:'uppercase',letterSpacing:'0.05em' }}>🎯 Daily Tasks</h2>
              <button onClick={()=>setShowAddTask(true)} title="Add task" style={{ background:'#000',color:'#f1be3e',border:'2px solid #000',width:'26px',height:'26px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontWeight:900,fontSize:'1rem',boxShadow:'2px 2px 0 rgba(0,0,0,0.2)' }}>+</button>
            </div>
            <div style={{ padding:'18px' }}>
              {/* Progress bar */}
              <div style={{ marginBottom:'18px' }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'6px',fontSize:'0.8rem',fontWeight:700 }}>
                  <span style={{ textTransform:'uppercase',letterSpacing:'0.04em' }}>Progress</span>
                  <span style={{ fontFamily:'var(--font-mono)' }}>{completedTasks}/{tasks.length} — {progressPct}%</span>
                </div>
                <div style={{ height:'14px',background:'#f4f1ea',border:'2px solid #000',overflow:'hidden' }}>
                  <div style={{ height:'100%',width:`${progressPct}%`,background:progressPct===100?'#00aa44':'#f1be3e',borderRight:progressPct<100?'2px solid #000':'none',transition:'width 0.3s ease' }}/>
                </div>
              </div>
              {/* Task list */}
              <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                {tasksLoading && <div style={{ textAlign:'center',padding:'24px 0',color:'#888',fontFamily:'var(--font-mono)',fontSize:'0.8rem' }}>Loading tasks…</div>}
                {!tasksLoading && tasks.length === 0 && (
                  <div style={{ textAlign:'center',padding:'32px 0',color:'#888',fontFamily:'var(--font-mono)',fontSize:'0.8rem' }}>
                    <div style={{ fontSize:'2rem',marginBottom:'8px' }}>📋</div>
                    <div>No tasks yet.</div>
                    <button onClick={()=>setShowAddTask(true)} style={{ marginTop:'12px',padding:'6px 16px',background:'#000',color:'#f1be3e',border:'2px solid #000',fontFamily:'var(--font-ui)',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',textTransform:'uppercase' }}>+ Add your first task</button>
                  </div>
                )}
                {tasks.map(task => {
                  const due = formatDue(task.due_date);
                  return (
                    <div key={task.id} style={{ display:'flex',alignItems:'flex-start',gap:'10px',padding:'8px 10px',border:'2px solid #000',background:task.done?'#f4f1ea':'#fff',cursor:'pointer',transition:'background 80ms' }} onClick={()=>handleToggleTask(task.id)}>
                      <div style={{ width:'18px',height:'18px',flexShrink:0,border:'2px solid #000',background:task.done?'#000':'#fff',display:'flex',alignItems:'center',justifyContent:'center',marginTop:'2px' }}>
                        {task.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f1be3e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <span style={{ fontFamily:'var(--font-content)',fontSize:'0.88rem',fontWeight:600,textDecoration:task.done?'line-through':'none',color:task.done?'#888':'#000',display:'block' }}>{task.text}</span>
                        {due && <span style={{ fontSize:'0.72rem',fontFamily:'var(--font-mono)',color:due.overdue?'#cc0000':'#888',fontWeight:700,marginTop:'2px',display:'block' }}>{due.label}</span>}
                      </div>
                      <button onClick={e=>{e.stopPropagation();handleDeleteTask(task.id);}} title="Remove task" style={{ background:'transparent',border:'none',cursor:'pointer',color:'#bbb',fontSize:'0.9rem',lineHeight:1,padding:'0 2px',flexShrink:0 }}
                        onMouseEnter={e=>{e.currentTarget.style.color='#cc0000';}} onMouseLeave={e=>{e.currentTarget.style.color='#bbb';}}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display:'flex',flexDirection:'column',gap:'20px' }}>

            {/* Course Progress Cards */}
            <div>
              <h2 style={{ fontSize:'1rem',fontWeight:900,margin:'0 0 14px',textTransform:'uppercase',letterSpacing:'0.05em' }}>📊 Course Progress</h2>
              <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
                {statsLoading ? (
                  <div style={{ color:'#888',fontFamily:'var(--font-mono)',fontSize:'0.8rem',padding:'12px' }}>Loading progress…</div>
                ) : courseProgress.map(cp => {
                  const pct = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
                  const courseId = cp.id === 'python' ? 'course_python' : 'course_cloud';
                  return (
                    <div key={cp.id} onClick={()=>onNavigate(courseId as any)} style={{ background:'#fff',border:'3px solid #000',boxShadow:'4px 4px 0 #000',padding:'14px 18px',cursor:'pointer',transition:'transform 80ms,box-shadow 80ms' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translate(-2px,-2px)';(e.currentTarget as HTMLDivElement).style.boxShadow='6px 6px 0 #000';}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.boxShadow='4px 4px 0 #000';}}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px' }}>
                        <span style={{ fontWeight:900,fontSize:'0.95rem',display:'flex',alignItems:'center',gap:'8px' }}>{cp.icon} {cp.label} Mastery</span>
                        <span style={{ fontFamily:'var(--font-mono)',fontWeight:700,fontSize:'0.82rem',background:'#f1be3e',padding:'2px 8px',border:'1px solid #000' }}>{pct}%</span>
                      </div>
                      <div style={{ height:'12px',background:'#f4f1ea',border:'2px solid #000',overflow:'hidden',marginBottom:'6px' }}>
                        <div style={{ height:'100%',width:`${pct}%`,background:pct===100?'#00aa44':'#f1be3e',transition:'width 0.4s ease' }}/>
                      </div>
                      <div style={{ fontSize:'0.75rem',color:'#555',fontFamily:'var(--font-mono)' }}>{cp.completed} / {cp.total} parts completed · Click to open →</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module shortcut cards */}
            <div>
              <h2 style={{ fontSize:'1rem',fontWeight:900,margin:'0 0 14px',textTransform:'uppercase',letterSpacing:'0.05em' }}>🛠️ Quick Access</h2>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
                <ModuleCard title="Typing Practice" icon="⌨️" accent="#e0e0e0" onClick={()=>onNavigate('typing')}/>
                <ModuleCard title="Aptitude Tests" icon="🧠" accent="#e0e0e0" onClick={()=>onNavigate('aptitude')}/>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div style={{ height:'32px' }}/>
    </div>
  );
}

// ── Helper: fetch modules+progress for a course ───────────────────────────────

async function fetchModulesAndProgress(courseId: string): Promise<{ completed: number; total: number }> {
  try {
    const [mods, prog] = await Promise.all([fetchModules(courseId), fetchProgress(courseId)]);
    const total = mods.reduce((s, m) => s + m.notes.length, 0);
    const completed = prog.length;
    return { completed, total };
  } catch {
    return { completed: 0, total: 0 };
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
  const isHighlighted = active || hover;
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} aria-current={active ? 'page' : undefined}
      style={{ background: isHighlighted ? '#000' : 'transparent', color: isHighlighted ? '#f1be3e' : '#000', borderStyle: 'solid', borderWidth: active ? '2px 2px 3px 2px' : '2px', borderTopColor: isHighlighted ? '#000' : 'transparent', borderRightColor: isHighlighted ? '#000' : 'transparent', borderLeftColor: isHighlighted ? '#000' : 'transparent', borderBottomColor: '#000', padding: '5px 12px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.8rem', cursor: active ? 'default' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'all 80ms' }}>
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
