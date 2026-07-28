'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Course, Module, fetchStreak, StreakData, fetchProgress, fetchModules } from '@/lib/api';
import { useAuth } from './AuthProvider';

// ── Typography ───────────────────────────────────────────────────────────────
const F = {
  // Luxury (VIEW 1 catalog)
  coldiac: "'Cormorant Garamond', 'Georgia', serif",
  roxie:   "'Cormorant', 'Palatino Linotype', serif",
  molani:  "'DM Sans', 'Inter', sans-serif",
  // Newspaper broadsheet (VIEW 2 course page)
  masthead:  "'Manufacturing Consent', 'Playfair Display', serif",
  editorial: "'Playfair Display', 'Georgia', serif",
  deck:      "'Cormorant Garamond', 'Georgia', serif",
  body:      "'DM Sans', 'Inter', sans-serif",
  tapestry:  "'Tapestry', cursive",
};

// Newspaper colour tokens
const N = {
  paper:   '#f4f1ea',
  ink:     '#1a1705',
  rule:    '#2a2410',
  hairline:'#d4c9a8',
  accent:  '#f1be3e',
  accentDk:'#c9952a',
  muted:   '#6b6347',
  column:  '#ede8db',
};

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

function CourseLogoImg({ mascot, id, size = 32 }: { mascot?: string; id?: string; size?: number }) {
  const url = getCourseLogoUrl(mascot, id);
  if (url) {
    return <img src={url} alt="" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }} />;
  }
  return <span style={{ fontSize: size * 0.8, lineHeight: 1 }}>{getCourseEmoji(mascot, id)}</span>;
}

const HIDDEN_COURSE_IDS = ['data-analyst', 'data-analyst-en'];

function isHiddenCourse(courseId: string) {
  return HIDDEN_COURSE_IDS.includes(courseId);
}

function shouldShowAsRootCourse(course: Course) {
  return !isHiddenCourse(course.id) && (!course.parentId || isHiddenCourse(course.parentId));
}

interface Props {
  courses: Course[];
  activeCourseId: string | null;
  onSelectCourse: (courseId: string) => void;
  onChangeCourse: () => void;
  onGoHome: () => void;
  modules: Module[];
  completedParts: number[];
  progressPct: number;
  completedCount: number;
  totalParts: number;
  booting: boolean;
  onLaunch: () => void;
  onSelectPart: (part: number) => void;
}

export function Landing({
  courses,
  activeCourseId,
  onSelectCourse,
  onChangeCourse,
  onGoHome,
  modules,
  completedParts,
  progressPct,
  completedCount,
  totalParts,
  booting,
  onLaunch,
  onSelectPart,
}: Props) {
  const { user, logout } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, totalActiveDays: 0, current: 0, longest: 0, total: 0, dates: [] });
  const [courseStats, setCourseStats] = useState<Record<string, { completed: number; total: number }>>({});
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStreak().then(sd => setStreak(sd)).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all(
      courses.filter(c => !isHiddenCourse(c.id)).map(async c => {
        try {
          const [mods, prog] = await Promise.all([fetchModules(c.id), fetchProgress(c.id)]);
          const total = mods.reduce((s, m) => s + m.notes.length, 0);
          return { id: c.id, completed: prog.length, total };
        } catch {
          return { id: c.id, completed: 0, total: c.totalParts || 0 };
        }
      })
    ).then(res => {
      const map: Record<string, { completed: number; total: number }> = {};
      res.forEach(r => { map[r.id] = { completed: r.completed, total: r.total }; });
      setCourseStats(map);
    });
  }, [courses]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Expand all modules by default when modules populates
  useEffect(() => {
    if (modules.length > 0) {
      setExpandedModules(new Set(modules.map(m => m.id)));
    }
  }, [modules]);

  const toggleModule = (id: number) => {
    setExpandedModules(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const displayName = user?.displayName || '1%';
  const firstName = displayName.split(' ')[0];
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '1%';

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: COURSE CATALOG (No activeCourseId) — LUXURY THEME
  // ═══════════════════════════════════════════════════════════════════════════
  if (!activeCourseId) {
    const displayCourses = selectedGroup
      ? courses.filter(c => c.parentId === selectedGroup && !isHiddenCourse(c.id))
      : courses.filter(shouldShowAsRootCourse);

    return (
      <div style={{
        minHeight: '100vh',
        background: '#f7f5f0',
        fontFamily: F.molani,
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Topbar */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          height: '48px', background: 'var(--win-bg)',
          borderBottom: `1px solid var(--border)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{ fontWeight: 900, fontSize: '0.8rem', padding: '3px 8px', background: '#1a1a1a', color: '#f1be3e', borderRadius: '4px', letterSpacing: '0.05em' }}>1%</span>
            <span style={{ fontFamily: F.tapestry, fontWeight: 700, fontSize: '0.98rem', color: '#1a1a1a', letterSpacing: '0.04em' }}>DEV ACADEMY</span>
          </div>

          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <IconNavBtn icon="🏠" label="Dev Home" onClick={onGoHome} />
            {courses.filter(c => !c.parentId && !isHiddenCourse(c.id)).map(c => (
              <IconNavBtnLogo key={c.id} mascot={c.mascot} courseId={c.id} label={c.title} onClick={() => onSelectCourse(c.id)} />
            ))}
            <IconNavBtnLogo mascot="typing" courseId="typing" label="Typing" onClick={() => {}} />
            <IconNavBtnLogo mascot="aptitude" courseId="aptitude" label="Aptitude" onClick={() => {}} />
            <IconNavBtnLogo mascot="taskhub" courseId="taskhub" label="Tasks" onClick={() => {}} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button aria-label="Notifications" style={{ background: 'transparent', border: '2px solid var(--border)', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '0.95rem' }}>🔔</button>
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button onClick={() => setProfileMenuOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: profileMenuOpen ? '#1a1a1a' : 'rgba(0,0,0,0.12)', color: profileMenuOpen ? '#f1be3e' : '#1a1a1a', border: 'none', borderRadius: '20px', padding: '3px 8px 3px 3px', cursor: 'pointer', fontFamily: F.molani, fontSize: '0.78rem' }}>
                <div style={{ width: '24px', height: '24px', background: profileMenuOpen ? '#f1be3e' : '#1a1a1a', color: profileMenuOpen ? '#1a1a1a' : '#f1be3e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.6rem' }}>{initials}</div>
                <span>{firstName}</span>
              </button>
              {profileMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#ffffff', border: '1px solid #e8e2d8', borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.14)', minWidth: '200px', zIndex: 400, padding: '6px' }}>
                  <button onClick={() => { logout(); setProfileMenuOpen(false); }} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: F.molani, fontWeight: 600, fontSize: '0.8rem', color: '#c0392b', textAlign: 'left' }}>Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main style={{
          flex: 1, padding: '24px 24px 48px', maxWidth: '1280px', margin: '0 auto', width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Newspaper-style Masthead Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px', fontFamily: F.body }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ background: '#f1be3e', color: '#000', fontWeight: 700, fontSize: '0.9rem', padding: '4px 10px', border: '2px solid #000', boxShadow: '2px 2px 0 #000' }}>1%</span>
                <span style={{ fontFamily: F.tapestry, fontSize: '2.8rem', lineHeight: 1, color: '#000' }}>Dev Academy</span>
              </div>
            </div>
            <div style={{ fontFamily: "'Playwrite NZ Guides', cursive", color: '#222', fontSize: '1.02rem', lineHeight: 1.6, marginTop: 6 }}>Your learning. Your streak. Your momentum — every single day.</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span>Vol. 1 • No. 101</span>
              <span>All Courses</span>
              <span>Catalogue</span>
            </div>
          </div>

          {/* Summary Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #ede8df', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#fff9e6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', border: '1px solid #f5e8c0' }}>🔥</div>
                <div>
                  <div style={{ fontFamily: F.molani, fontSize: '0.6rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>DAY STREAK</div>
                  <div style={{ fontFamily: F.roxie, fontWeight: 600, fontSize: '1.5rem', color: '#1a1a1a', lineHeight: 1.1 }}>{streak.current} Days</div>
                  <div style={{ fontFamily: F.molani, fontSize: '0.7rem', color: '#bbb' }}>Keep it up! Consistency builds mastery.</div>
                </div>
              </div>
              <svg width="100" height="32" viewBox="0 0 100 32" fill="none"><path d="M0 24 C 20 8, 40 28, 60 12 C 80 -4, 90 20, 100 16" stroke="#f1be3e" strokeWidth="2.5" strokeLinecap="round" /></svg>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #ede8df', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#f0f4ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', border: '1px solid #cce0ff' }}>🎯</div>
                <div>
                  <div style={{ fontFamily: F.molani, fontSize: '0.6rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>ACTIVE DAYS</div>
                  <div style={{ fontFamily: F.roxie, fontWeight: 600, fontSize: '1.5rem', color: '#1a1a1a', lineHeight: 1.1 }}>{streak.total} Days</div>
                  <div style={{ fontFamily: F.molani, fontSize: '0.7rem', color: '#bbb' }}>Days logged in this month.</div>
                </div>
              </div>
              <svg width="100" height="32" viewBox="0 0 100 32" fill="none"><path d="M0 20 C 25 30, 45 10, 65 22 C 85 30, 95 10, 100 14" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" /></svg>
            </div>
          </div>

          {/* Course Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {displayCourses.map((course, idx) => {
              const icon = getCourseIcon(course.mascot, course.id);
              const stats = courseStats[course.id] || { completed: 0, total: course.totalParts || 0 };
              const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              const hasChildren = !!(course.children && course.children.length > 0);

              const tag1 = idx === 0 ? { label: '⭐ Popular', bg: '#fff7ed', color: '#c9952a' }
                : idx === 1 ? { label: '✨ New', bg: '#eff6ff', color: '#2563eb' }
                : { label: '🔥 Trending', bg: '#f0fdf4', color: '#16a34a' };

              return (
                <div key={course.id}
                  onClick={() => { if (hasChildren) setSelectedGroup(course.id); else onSelectCourse(course.id); }}
                  style={{
                    background: '#fff', borderRadius: '16px', border: '1px solid #ede8df',
                    padding: '18px 20px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    transition: 'all 150ms'
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)'; }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, background: tag1.bg, color: tag1.color, padding: '3px 9px', borderRadius: '6px', fontFamily: F.molani }}>{tag1.label}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#888', fontFamily: F.molani }}>{course.totalParts} Modules</span>
                  </div>

                  <div style={{ textAlign: 'center', margin: '6px 0 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                      <CourseLogoImg mascot={course.mascot} id={course.id} size={64} />
                    </div>
                    <h2 style={{ fontFamily: F.tapestry, fontWeight: 600, fontSize: '1.25rem', color: '#1a1a1a', margin: '0 0 6px', lineHeight: 1.1 }}>{course.title}</h2>
                    <p style={{ fontFamily: F.molani, fontSize: '0.78rem', color: '#777', margin: 0, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.description}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', fontFamily: F.molani, fontSize: '0.7rem', color: '#888', marginBottom: '10px' }}>
                      <span>📚 {course.totalParts} Modules</span>
                      <span>⏱️ 16+ Hours</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#aaa', marginBottom: '3px', fontFamily: F.molani }}>
                          <span>{pct}% Completed</span>
                        </div>
                        <div style={{ height: '4px', background: '#f0ece4', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg,#f1be3e,#e8a800)', borderRadius: '2px' }} />
                        </div>
                      </div>
                      <button style={{ background: '#fff', color: '#1a1a1a', border: '1px solid #e0dcd4', borderRadius: '7px', padding: '6px 14px', fontFamily: F.tapestry, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}>
                        {pct > 0 ? 'Continue →' : 'Start →'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: INDIVIDUAL COURSE DETAILS PAGE — NEWSPAPER BROADSHEET STYLE
  // ═══════════════════════════════════════════════════════════════════════════
  const activeCourse = courses.find(c => c.id === activeCourseId);
  const displayTotalParts = totalParts || activeCourse?.totalParts || modules.reduce((s, m) => s + m.notes.length, 0);

  // Broadsheet date line
  const now = new Date();
  const broadsheetDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden', background: N.paper, fontFamily: F.body, display: 'flex', flexDirection: 'column' }}>

      {/* ── TOP DATELINE STRIP ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 24px', borderBottom: `1px solid ${N.rule}`,
        background: N.paper, fontFamily: F.body, fontSize: '0.65rem',
        color: N.muted, letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>
        <span>{broadsheetDate}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>VOL. I &nbsp;·&nbsp; COURSE EDITION</span>
          <button aria-label="Notifications" style={{ background: 'none', border: `1.5px solid ${N.rule}`, borderRadius: '4px', width: '26px', height: '26px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</button>
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button onClick={() => setProfileMenuOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: profileMenuOpen ? N.rule : 'transparent',
              color: profileMenuOpen ? N.accent : N.ink,
              border: `1.5px solid ${N.rule}`, borderRadius: '4px',
              padding: '3px 10px 3px 4px', cursor: 'pointer', fontFamily: F.body, fontSize: '0.68rem', fontWeight: 600,
            }}>
              <div style={{ width: '18px', height: '18px', background: profileMenuOpen ? N.accent : N.ink, color: profileMenuOpen ? N.ink : N.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.5rem' }}>{initials}</div>
              <span style={{ fontFamily: "'Geologica', sans-serif" }}>{firstName}</span>
            </button>
            {profileMenuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: N.paper, border: `2px solid ${N.rule}`, boxShadow: `3px 3px 0 ${N.rule}`, minWidth: '150px', zIndex: 400 }}>
                <button onClick={() => { logout(); setProfileMenuOpen(false); }} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: F.body, fontWeight: 700, fontSize: '0.75rem', color: '#c0392b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── NEWSPAPER MASTHEAD ── */}
      <header style={{ background: N.paper, borderBottom: `3px solid ${N.rule}` }}>

        {/* Broadsheet nameplate */}
        <div style={{ textAlign: 'center', padding: '14px 24px 10px', borderBottom: `1px solid ${N.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '4px' }}>
            <div style={{ height: '1px', flex: 1, background: N.rule }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontFamily: F.tapestry, fontWeight: 900, fontSize: '0.7rem', padding: '3px 9px', background: N.accent, color: N.ink, letterSpacing: '0.1em', textTransform: 'uppercase' }}>1%</span>
              <h1 style={{ fontFamily: F.tapestry, fontWeight: 900, fontSize: '2.2rem', color: N.ink, margin: 0, letterSpacing: '-0.01em', lineHeight: 1, fontVariant: 'small-caps' }}>
                Dev Academy
              </h1>
              <span style={{ fontFamily: F.deck, fontSize: '0.85rem', color: N.muted, fontStyle: 'italic', fontWeight: 400 }}>Course Curriculum</span>
            </div>
            <div style={{ height: '1px', flex: 1, background: N.rule }} />
          </div>
          <p style={{ fontFamily: "'Playwrite NZ Guides', cursive", fontSize: '0.75rem', color: N.muted, margin: 0, letterSpacing: '0.02em' }}>
            Your learning. Your streak. Your momentum — every single day.
          </p>
        </div>

        {/* Nav toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: `1px solid ${N.hairline}`, overflowX: 'auto', background: N.paper }}>
          <PaperNavTab icon="🏠" label="Home" onClick={onGoHome} />
          {courses.filter(c => !c.parentId && !isHiddenCourse(c.id)).map(c => (
            <PaperNavTabLogo key={c.id} mascot={c.mascot} courseId={c.id} label={c.title}
              active={c.id === activeCourseId}
              onClick={() => onSelectCourse(c.id)} />
          ))}
          <PaperNavTabLogo mascot="typing" courseId="typing" label="Typing" onClick={() => {}} />
          <PaperNavTabLogo mascot="aptitude" courseId="aptitude" label="Aptitude" onClick={() => {}} />
          <PaperNavTab icon="🎯" label="Task Hub" onClick={() => {}} />
        </div>

        {/* Course headline section */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `3px double ${N.rule}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', flex: 1 }}>
            <div style={{ flexShrink: 0 }}>
              <CourseLogoImg mascot={activeCourse?.mascot} id={activeCourse?.id} size={64} />
            </div>
            <div>
              <p style={{ fontFamily: F.body, fontSize: '0.6rem', fontWeight: 700, color: N.accentDk, textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 4px' }}>
                ACADEMY · COURSE CURRICULUM
              </p>
              <h2 style={{ fontFamily: F.tapestry, fontWeight: 900, fontSize: '2.6rem', color: N.ink, margin: '0 0 6px', lineHeight: 1, fontVariant: 'small-caps' }}>
                {activeCourse?.title}
              </h2>
              <p style={{ fontFamily: F.deck, fontSize: '0.95rem', color: N.muted, margin: '0 0 10px', fontStyle: 'italic', lineHeight: 1.5, maxWidth: '600px' }}>
                {activeCourse?.description}
              </p>
              <div style={{ display: 'flex', gap: '16px', fontFamily: F.tapestry, fontSize: '0.75rem', color: N.muted }}>
                <span>By <strong style={{ color: N.ink }}>{activeCourse?.author || 'shyamiscoding'}</strong></span>
                <span style={{ color: N.hairline }}>|</span>
                <span><strong style={{ color: N.ink }}>{displayTotalParts}</strong> Lessons</span>
                <span style={{ color: N.hairline }}>|</span>
                <span><strong style={{ color: N.accentDk }}>{progressPct}%</strong> Completed</span>
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button onClick={onLaunch} style={{
              background: N.accent, color: N.ink, border: `2px solid ${N.rule}`,
              padding: '11px 28px', fontFamily: F.body, fontWeight: 800,
              fontSize: '0.82rem', cursor: 'pointer', textTransform: 'uppercase',
              letterSpacing: '0.08em', boxShadow: `3px 3px 0 ${N.rule}`,
            }}>
              {completedCount > 0 ? '▶ Resume Learning' : '▶ Start Learning'}
            </button>
            {/* Progress bar */}
            <div style={{ width: '180px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.body, fontSize: '0.58rem', color: N.muted, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span>Progress</span><span>{progressPct}%</span>
              </div>
              <div style={{ height: '6px', background: N.column, border: `1px solid ${N.hairline}` }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? '#16a34a' : N.rule }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── BROADSHEET BODY ── */}
      <main style={{ flex: 1, minHeight: 0, width: '100%', padding: '0 24px 0', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '0', alignItems: 'start', borderTop: `2px solid ${N.rule}`, flex: 1, minHeight: 0 }}>

          {/* ─── LEFT: TABLE OF CONTENTS / MODULE ACCORDION ─── */}
          <div style={{ borderRight: `2px solid ${N.rule}`, paddingRight: '20px', paddingTop: '18px', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

            {/* Section flag */}
            <div style={{ borderBottom: `1px solid ${N.hairline}`, marginBottom: '14px', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexShrink: 0 }}>
              <span style={{ fontFamily: F.editorial, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: N.muted }}>Course Curriculum</span>
              <span style={{ fontFamily: F.tapestry, fontSize: '0.7rem', color: N.muted }}>{completedCount} / {displayTotalParts} lessons completed</span>
            </div>

            {/* Scrollable module list */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: '20px', scrollbarWidth: 'none' }}>
            {modules.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ borderBottom: `1px solid ${N.hairline}`, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ height: '14px', background: N.column, width: '40%' }} />
                    <div style={{ height: '10px', background: N.column, width: '65%', opacity: 0.5 }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {modules.map((mod, modIdx) => {
                  const isExpanded = expandedModules.has(mod.id);
                  const modDone = mod.notes.filter(n => completedParts.includes(n.part)).length;
                  return (
                    <div key={mod.id} style={{ borderBottom: `1px solid ${N.hairline}` }}>
                      {/* Module header — broadsheet section title */}
                      <div onClick={() => toggleModule(mod.id)}
                        style={{ padding: '12px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontFamily: F.tapestry, fontWeight: 900, fontSize: '1.1rem', color: N.accentDk, minWidth: '24px', lineHeight: 1 }}>{modIdx + 1}</span>
                          <div style={{ width: '1px', height: '28px', background: N.accentDk }} />
                          <h3 style={{ fontFamily: F.editorial, fontWeight: 700, fontSize: '1rem', color: N.ink, margin: 0, lineHeight: 1.2 }}>{mod.title}</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontFamily: F.tapestry, fontSize: '0.68rem', color: N.muted }}>{modDone}/{mod.notes.length}</span>
                          <span style={{ fontFamily: F.body, fontSize: '0.65rem', color: N.muted, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', display: 'inline-block' }}>▼</span>
                        </div>
                      </div>

                      {/* Lesson rows */}
                      {isExpanded && (
                        <div style={{ paddingBottom: '8px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                          {mod.notes.map((note, noteIdx) => {
                            const isDone = completedParts.includes(note.part);
                            const shortTitle = note.title.replace(/^Part\s+\d+[\s—\-]+/i, '');
                            return (
                              <div key={note.part}
                                onClick={() => onSelectPart(note.part)}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '9px 0 9px 34px',
                                  borderTop: `1px solid ${N.hairline}`,
                                  cursor: 'pointer', background: 'transparent',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = N.column; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {/* Part number badge */}
                                  <div style={{
                                    width: '22px', height: '22px', flexShrink: 0,
                                    background: isDone ? N.rule : 'transparent',
                                    border: `2px solid ${isDone ? N.rule : N.hairline}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: F.tapestry, fontSize: '0.6rem', fontWeight: 900,
                                    color: isDone ? N.accent : N.muted,
                                  }}>
                                    {isDone ? '✓' : note.part}
                                  </div>
                                  <div>
                                    <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: '0.82rem', color: isDone ? N.muted : N.ink, textDecoration: isDone ? 'line-through' : 'none' }}>
                                      Part {note.part} — {shortTitle}
                                    </div>
                                    <div style={{ fontFamily: F.tapestry, fontSize: '0.62rem', color: N.muted, marginTop: '1px' }}>
                                      {note.wordCount} words · {Math.max(1, Math.round(note.wordCount / 200))} min read
                                    </div>
                                  </div>
                                </div>
                                <button style={{
                                  background: isDone ? 'transparent' : N.accent,
                                  color: isDone ? N.muted : N.ink,
                                  border: `2px solid ${isDone ? N.hairline : N.rule}`,
                                  padding: '4px 12px', fontFamily: F.body, fontWeight: 800,
                                  fontSize: '0.65rem', cursor: 'pointer', textTransform: 'uppercase',
                                  letterSpacing: '0.06em', flexShrink: 0,
                                }}>
                                  {isDone ? 'Review' : 'Read →'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>{/* end scrollable */}
          </div>

          {/* ─── RIGHT: EDITORIAL SIDEBAR ─── */}
          <div style={{ paddingLeft: '20px', paddingTop: '18px', display: 'flex', flexDirection: 'column', gap: '0', height: '100%', overflowY: 'auto', minHeight: 0, scrollbarWidth: 'none' }}>

            {/* Course Facts box */}
            <div style={{ borderBottom: `2px solid ${N.rule}`, paddingBottom: '14px', marginBottom: '14px' }}>
              <div style={{ borderBottom: `2px solid ${N.rule}`, marginBottom: '10px', paddingBottom: '4px' }}>
                <span style={{ fontFamily: F.editorial, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: N.ink }}>Course Facts</span>
              </div>
              {[
                { label: 'Instructor', value: activeCourse?.author || 'shyamiscoding' },
                { label: 'Modules', value: String(modules.length || '—') },
                { label: 'Total Lessons', value: String(displayTotalParts) },
                { label: 'Completed', value: `${completedCount} (${progressPct}%)` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${N.hairline}`, padding: '7px 0' }}>
                  <span style={{ fontFamily: F.body, fontSize: '0.72rem', color: N.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  <strong style={{ fontFamily: F.tapestry, fontSize: '0.82rem', color: N.ink }}>{value}</strong>
                </div>
              ))}

              {/* CTA */}
              <button onClick={onLaunch} style={{
                width: '100%', marginTop: '14px',
                background: N.accent, color: N.ink,
                border: `2px solid ${N.rule}`,
                padding: '10px', fontFamily: F.body, fontWeight: 800,
                fontSize: '0.78rem', cursor: 'pointer', textTransform: 'uppercase',
                letterSpacing: '0.08em', boxShadow: `3px 3px 0 ${N.rule}`,
              }}>
                {completedCount > 0 ? '▶ Resume Learning' : '▶ Start Learning'}
              </button>
            </div>

            {/* Pull-quote */}
            <div style={{ borderTop: `3px double ${N.rule}`, borderBottom: `3px double ${N.rule}`, padding: '14px 0', textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontFamily: F.deck, fontStyle: 'italic', fontSize: '1rem', color: N.ink, lineHeight: 1.5, marginBottom: '6px' }}>
                "Consistency is the<br />compound interest<br />of learning."
              </div>
              <div style={{ fontFamily: F.tapestry, fontSize: '0.8rem', fontWeight: 700, color: N.muted, letterSpacing: '0.04em' }}>— 1% Dev Academy</div>
            </div>

            {/* Progress meter */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ borderBottom: `2px solid ${N.rule}`, marginBottom: '10px', paddingBottom: '4px' }}>
                <span style={{ fontFamily: F.editorial, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: N.ink }}>Your Progress</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '10px', background: N.column, border: `1px solid ${N.hairline}` }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? '#16a34a' : N.rule, transition: 'width 600ms ease' }} />
                </div>
                <span style={{ fontFamily: F.tapestry, fontWeight: 900, fontSize: '0.9rem', color: N.ink, flexShrink: 0 }}>{progressPct}%</span>
              </div>
            </div>

            {/* Back to courses */}
            <button onClick={onGoHome} style={{
              background: 'transparent', color: N.ink,
              border: `2px solid ${N.rule}`,
              padding: '8px', fontFamily: F.body, fontWeight: 700,
              fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase',
              letterSpacing: '0.08em', width: '100%',
            }}>
              ← All Courses
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

// ── Newspaper nav tab (VIEW 2) ───────────────────────────────────────────────
function PaperNavTab({ icon, label, onClick, active = false }: { icon: string; label: string; onClick: () => void; active?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? N.hairline : 'transparent',
        color: N.ink,
        border: 'none', borderRight: `1px solid ${N.hairline}`,
        height: '36px', padding: '0 14px',
        display: 'flex', alignItems: 'center', gap: '5px',
        cursor: 'pointer', fontSize: '0.72rem', flexShrink: 0,
        fontFamily: F.tapestry,
        fontWeight: active ? 700 : 400,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        transition: 'background 100ms',
        borderBottom: active ? `2px solid ${N.rule}` : '2px solid transparent',
      }}>
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function PaperNavTabLogo({ mascot, courseId, label, active = false, onClick }: { mascot?: string; courseId: string; label: string; active?: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const url = getCourseLogoUrl(mascot, courseId);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? N.hairline : 'transparent',
        color: N.ink,
        border: 'none', borderRight: `1px solid ${N.hairline}`,
        height: '36px', padding: '0 14px',
        display: 'flex', alignItems: 'center', gap: '5px',
        cursor: 'pointer', fontSize: '0.72rem', flexShrink: 0,
        fontFamily: F.tapestry, fontWeight: active ? 700 : 400,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        transition: 'background 100ms',
        borderBottom: active ? `2px solid ${N.rule}` : '2px solid transparent',
      }}>
      {url
        ? <img src={url} alt={label} style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 2 }} />
        : <span>{getCourseEmoji(mascot, courseId)}</span>}
      <span>{label}</span>
    </button>
  );
}

// ── Luxury nav button (VIEW 1 catalog) ───────────────────────────────────────
function IconNavBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} title={label}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'rgba(0,0,0,0.12)' : 'transparent',
        color: '#1a1a1a',
        border: 'none', borderRadius: '7px', height: '32px', padding: '0 8px',
        display: 'flex', alignItems: 'center', gap: '4px',
        cursor: 'pointer', fontSize: '0.95rem', flexShrink: 0,
        fontFamily: F.molani, fontWeight: 500,
        transition: 'all 120ms'
      }}>
      <span>{icon}</span>
      {hover && <span style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', fontWeight: 600 }}>{label}</span>}
    </button>
  );
}

function IconNavBtnLogo({ mascot, courseId, label, onClick }: { mascot?: string; courseId: string; label: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const url = getCourseLogoUrl(mascot, courseId);
  return (
    <button onClick={onClick} title={label}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'rgba(0,0,0,0.12)' : 'transparent',
        color: '#1a1a1a',
        border: 'none', borderRadius: '7px', height: '32px', padding: '0 8px',
        display: 'flex', alignItems: 'center', gap: '4px',
        cursor: 'pointer', fontSize: '0.95rem', flexShrink: 0,
        fontFamily: F.molani, fontWeight: 500,
        transition: 'all 120ms'
      }}>
      {url
        ? <img src={url} alt={label} style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 3 }} />
        : <span>{getCourseEmoji(mascot, courseId)}</span>}
      {hover && <span style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', fontWeight: 600 }}>{label}</span>}
    </button>
  );
}
