'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Course, Module, PartMeta, fetchStreak, StreakData, fetchProgress, fetchModules, isPartComplete } from '@/services/courseService';
import { useAuth } from '@/features/authentication/AuthProvider';

// ── Type system (matches Dashboard) ───────────────────────────────────────
const F = {
  display: "'Google Sans Flex', sans-serif",
  body:    "'Google Sans Flex', sans-serif",
  mono:    "'Google Sans Flex', sans-serif",
};

// ── Signal-deck token system (matches Dashboard) ──────────────────────────
const C = {
  bg:        '#FFFFFF',
  surface:   '#FFFFFF',
  surfaceHi: '#FFFFFF',
  border:    '#E5E7EB',
  borderHi:  '#1F2937',
  text:      '#1F2937',
  textDim:   '#6B7280',
  textFaint: '#9CA3AF',
  cyan:      '#F98012',
  cyanDim:   'rgba(255,104,66,0.13)',
  violet:    '#776C86',
  violetDim: 'rgba(119,108,134,0.12)',
  green:     '#22C55E',
  amber:     '#F59E0B',
  red:       '#EF4444',
  onAccent:  '#FFFFFF',
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
    return <img src={url} alt="" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />;
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

function RingProgress({ pct, size = 56, stroke = 5, color }: { pct: number; size?: number; stroke?: number; color: string }) {
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

function CurriculumRow({ note, isDone, nested = false, onSelectPart }: { note: PartMeta; isDone: boolean; nested?: boolean; onSelectPart: (part: number) => void }) {
  const shortTitle = note.title.replace(/^Part\s+\d+[\s—\-]+/i, '');
  return (
    <div
      onClick={() => onSelectPart(note.part)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: nested ? '7px 18px 7px 72px' : '10px 18px 10px 46px', cursor: 'pointer', background: nested ? C.surfaceHi : 'transparent' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = C.surfaceHi; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = nested ? C.surfaceHi : 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div style={{ width: nested ? '18px' : '20px', height: nested ? '18px' : '20px', flexShrink: 0, borderRadius: nested ? '4px' : '6px', background: isDone ? C.green : 'transparent', border: `1.5px solid ${isDone ? C.green : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontSize: '0.58rem', fontWeight: 700, color: isDone ? C.onAccent : C.textFaint }}>
          {isDone ? '✓' : nested ? '' : note.part}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.body, fontWeight: nested ? 500 : 600, fontSize: nested ? '0.76rem' : '0.8rem', color: isDone ? C.textFaint : C.text, textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nested ? shortTitle : `Part ${note.part} — ${shortTitle}`}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: '0.62rem', color: C.textFaint, marginTop: '1px' }}>
            {note.wordCount} words · {Math.max(1, Math.round(note.wordCount / 200))} min
          </div>
        </div>
      </div>
      <span style={{ fontFamily: F.mono, fontSize: '0.66rem', fontWeight: 700, color: isDone ? C.textFaint : C.cyan, flexShrink: 0 }}>
        {isDone ? 'Review' : 'Read →'}
      </span>
    </div>
  );
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
          const total = mods.reduce((s, m) => s + m.notes.reduce((n, note) => n + 1 + (note.subtopics?.length || 0), 0), 0);
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
  const ringColors = [C.cyan, C.violet, C.green, C.amber];

  const ProfileMenu = () => (
    <div ref={profileRef} style={{ position: 'relative' }}>
      <button onClick={() => setProfileMenuOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: profileMenuOpen ? C.surfaceHi : C.surface,
        border: `1px solid ${C.border}`, borderRadius: '8px',
        padding: '5px 10px 5px 5px', cursor: 'pointer', fontFamily: F.body, fontSize: '0.78rem', fontWeight: 600, color: C.text,
      }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: C.cyanDim, color: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.62rem', fontFamily: F.display }}>{initials}</div>
        <span>{firstName}</span>
      </button>
      {profileMenuOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: '10px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', minWidth: '160px', zIndex: 400, overflow: 'hidden' }}>
          <button onClick={() => { logout(); setProfileMenuOpen(false); }} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: F.body, fontWeight: 600, fontSize: '0.78rem', color: C.red, textAlign: 'left' }}>Sign out</button>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // VIEW 1: COURSE CATALOG
  // ═══════════════════════════════════════════════════════════════════════
  if (!activeCourseId) {
    const displayCourses = selectedGroup
      ? courses.filter(c => c.parentId === selectedGroup && !isHiddenCourse(c.id))
      : courses.filter(shouldShowAsRootCourse);

    return (
      <div className="course-catalog-shell" style={{ minHeight: '100vh', background: C.bg, fontFamily: F.body, display: 'flex', color: C.text }}>
        <style>{`
::-webkit-scrollbar { height: 8px; width: 8px; }
          ::-webkit-scrollbar-thumb { background: ${C.borderHi}; border-radius: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
        `}</style>

        {/* Sidebar */}
        <aside className="catalog-sidebar" style={{ width: '224px', flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
          <div style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `linear-gradient(135deg, ${C.cyan}, ${C.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: '0.8rem', color: C.onAccent }}>1%</div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: '0.92rem', letterSpacing: '-0.01em', lineHeight: 1.1 }}>Dev Academy</div>
              <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.textFaint }}>~/courses</div>
            </div>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
            <SideBtn icon="🏠" label="Dev Home" onClick={onGoHome} />
            <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 12px 6px' }}>Courses</div>
            {courses.filter(c => !c.parentId && !isHiddenCourse(c.id)).map(c => (
              <SideBtnLogo key={c.id} mascot={c.mascot} courseId={c.id} label={c.title} active={c.id === selectedGroup} onClick={() => onSelectCourse(c.id)} />
            ))}
            <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 12px 6px' }}>Training</div>
            <SideBtnLogo mascot="typing" courseId="typing" label="Typing" onClick={() => {}} />
            <SideBtnLogo mascot="aptitude" courseId="aptitude" label="Aptitude" onClick={() => {}} />
            <SideBtnLogo mascot="taskhub" courseId="taskhub" label="Task Hub" onClick={() => {}} />
          </nav>
        </aside>

        {/* Main */}
        <div className="catalog-workspace" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <header className="catalog-topbar" style={{ height: '58px', flexShrink: 0, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
            <span style={{ fontFamily: F.mono, fontSize: '0.72rem', color: C.textDim }}>{selectedGroup ? 'Course group' : 'All courses'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button aria-label="Notifications" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '7px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '0.85rem' }}>🔔</button>
              <ProfileMenu />
            </div>
          </header>

          <main className="catalog-main" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 60px' }}>

            {/* Hero */}
            <div className="catalog-hero" style={{
              background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceHi})`, border: `1px solid ${C.border}`,
              borderRadius: '14px', padding: '24px 28px', marginBottom: '20px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: '-40%', right: '-8%', width: '240px', height: '240px', borderRadius: '50%', background: `radial-gradient(circle, ${C.cyanDim}, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ fontFamily: F.mono, fontSize: '0.7rem', color: C.cyan, letterSpacing: '0.06em', marginBottom: '6px' }}>COURSE CATALOG</div>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.7rem', letterSpacing: '-0.02em', margin: '0 0 8px', color: C.text }}>
                {firstName}<span style={{ color: C.textFaint }}>, keep building.</span>
              </h1>
              <p style={{ fontFamily: F.body, fontSize: '0.85rem', color: C.textDim, margin: 0, maxWidth: '480px' }}>
                Pick up a track or start something new — every lesson logged here counts toward your streak.
              </p>
            </div>

            {/* Stats row */}
            <div className="catalog-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '22px' }}>
              <StatCard label="Day streak" value={streak.current ?? 0} sub={`Best ${streak.longest ?? 0}`} color={C.amber} icon="🔥" />
              <StatCard label="Active days" value={streak.total ?? 0} sub="all time" color={C.cyan} icon="🎯" />
            </div>

            {selectedGroup && (
              <button onClick={() => setSelectedGroup(null)} style={{
                background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '8px', color: C.textDim,
                padding: '7px 14px', fontFamily: F.body, fontWeight: 600, fontSize: '0.76rem', cursor: 'pointer', marginBottom: '16px',
              }}>← All courses</button>
            )}

            {/* Course grid */}
            <div className="catalog-course-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
              {displayCourses.map((course, idx) => {
                const stats = courseStats[course.id] || { completed: 0, total: course.totalParts || 0 };
                const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                const hasChildren = !!(course.children && course.children.length > 0);
                const ring = ringColors[idx % ringColors.length];
                const tag = idx % 3 === 0 ? { label: 'Popular', color: C.violet } : idx % 3 === 1 ? { label: 'New', color: C.green } : { label: 'Trending', color: C.amber };

                return (
                  <div key={course.id}
                    className="catalog-course-card"
                    onClick={() => { if (hasChildren) setSelectedGroup(course.id); else onSelectCourse(course.id); }}
                    style={{
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: '13px',
                      padding: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px',
                      transition: 'border-color 150ms, background 150ms',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = ring; (e.currentTarget as HTMLDivElement).style.background = C.surfaceHi; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.background = C.surface; }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: F.mono, fontSize: '0.6rem', fontWeight: 700, color: tag.color, background: `${tag.color}1F`, padding: '3px 8px', borderRadius: '5px' }}>{tag.label}</span>
                      <span style={{ fontFamily: F.mono, fontSize: '0.62rem', color: C.textFaint }}>{course.totalParts} modules</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
                        <RingProgress pct={pct} size={52} stroke={4} color={ring} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CourseLogoImg mascot={course.mascot} id={course.id} size={22} />
                        </div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1rem', color: C.text, lineHeight: 1.2 }}>{course.title}</div>
                        <div style={{ fontFamily: F.mono, fontSize: '0.66rem', color: ring, marginTop: '2px' }}>{pct}% complete</div>
                      </div>
                    </div>

                    <p style={{ fontFamily: F.body, fontSize: '0.74rem', color: C.textDim, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.description}
                    </p>

                    <button className="catalog-course-cta" style={{
                      background: 'transparent', color: ring, border: `1px solid ${ring}55`, borderRadius: '7px',
                      padding: '7px 0', fontFamily: F.body, fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer', marginTop: '2px',
                    }}>
                      {pct > 0 ? 'Continue →' : 'Start →'}
                    </button>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VIEW 2: COURSE DETAIL
  // ═══════════════════════════════════════════════════════════════════════
  const activeCourse = courses.find(c => c.id === activeCourseId);
  const displayTotalParts = totalParts || activeCourse?.totalParts || modules.reduce((s, m) => s + m.notes.reduce((n, note) => n + 1 + (note.subtopics?.length || 0), 0), 0);

  return (
    <div className="course-detail-shell" style={{ minHeight: '100vh', background: C.bg, fontFamily: F.body, display: 'flex', color: C.text }}>
      <style>{`
::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.borderHi}; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* Sidebar */}
      <aside className="course-detail-sidebar" style={{ width: '224px', flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `linear-gradient(135deg, ${C.cyan}, ${C.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: '0.8rem', color: C.onAccent }}>1%</div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: '0.92rem', letterSpacing: '-0.01em', lineHeight: 1.1 }}>Dev Academy</div>
            <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.textFaint }}>~/course</div>
          </div>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
          <SideBtn icon="🏠" label="Dev Home" onClick={onGoHome} />
          <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 12px 6px' }}>Courses</div>
          {courses.filter(c => !c.parentId && !isHiddenCourse(c.id)).map(c => (
            <SideBtnLogo key={c.id} mascot={c.mascot} courseId={c.id} label={c.title} active={c.id === activeCourseId} onClick={() => onSelectCourse(c.id)} />
          ))}
          <div style={{ fontFamily: F.mono, fontSize: '0.6rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 12px 6px' }}>Training</div>
          <SideBtnLogo mascot="typing" courseId="typing" label="Typing" onClick={() => {}} />
          <SideBtnLogo mascot="aptitude" courseId="aptitude" label="Aptitude" onClick={() => {}} />
          <SideBtnLogo mascot="taskhub" courseId="taskhub" label="Task Hub" onClick={() => {}} />
        </nav>
      </aside>

      {/* Main */}
      <div className="course-detail-workspace" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="course-detail-topbar" style={{ height: '58px', flexShrink: 0, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <button onClick={onGoHome} style={{ background: 'transparent', border: 'none', color: C.textDim, fontFamily: F.body, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>← All courses</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button aria-label="Notifications" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '7px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '0.85rem' }}>🔔</button>
            <ProfileMenu />
          </div>
        </header>

        <main className="course-detail-main" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 60px' }}>

          {/* Course hero */}
          <section className="course-detail-hero" style={{
            background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceHi})`, border: `1px solid ${C.border}`,
            borderRadius: '14px', padding: '24px 28px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-40%', right: '-6%', width: '260px', height: '260px', borderRadius: '50%', background: `radial-gradient(circle, ${C.cyanDim}, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', flex: 1, minWidth: 0 }}>
              <div style={{ width: '58px', height: '58px', borderRadius: '12px', background: C.surfaceHi, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CourseLogoImg mascot={activeCourse?.mascot} id={activeCourse?.id} size={34} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: F.mono, fontSize: '0.64rem', color: C.cyan, letterSpacing: '0.1em', marginBottom: '5px' }}>COURSE CURRICULUM</div>
                <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.6rem', color: C.text, margin: '0 0 6px', letterSpacing: '-0.01em' }}>{activeCourse?.title}</h1>
                <p style={{ fontFamily: F.body, fontSize: '0.82rem', color: C.textDim, margin: '0 0 10px', maxWidth: '520px', lineHeight: 1.5 }}>{activeCourse?.description}</p>
                <div style={{ display: 'flex', gap: '14px', fontFamily: F.mono, fontSize: '0.7rem', color: C.textFaint }}>
                  {activeCourse?.author ? (
                    <>
                      <span>By <strong style={{ color: C.textDim }}>{activeCourse.author}</strong></span>
                      <span>·</span>
                    </>
                  ) : null}
                  <span><strong style={{ color: C.cyan }}>{displayTotalParts}</strong> lessons</span>
                  <span>·</span>
                  <span><strong style={{ color: C.green }}>{progressPct}%</strong> complete</span>
                </div>
              </div>
            </div>
            <button onClick={onLaunch} style={{
              background: C.cyan, color: C.onAccent, border: 'none', borderRadius: '9px',
              padding: '11px 24px', fontFamily: F.body, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', flexShrink: 0,
            }}>
              {completedCount > 0 ? 'Resume →' : 'Start →'}
            </button>
          </section>

          <div className="course-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: '20px' }}>

            {/* Curriculum list */}
            <div className="course-curriculum-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
              <div className="course-curriculum-header" style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: '0.9rem', color: C.text }}>Curriculum</span>
                <span style={{ fontFamily: F.mono, fontSize: '0.68rem', color: C.textDim }}>{completedCount}/{displayTotalParts} done</span>
              </div>

              {modules.length === 0 ? (
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '38px', background: C.surfaceHi, borderRadius: '8px', opacity: 0.5 }} />
                  ))}
                </div>
              ) : (
                <div className="course-curriculum-list">
                  {modules.map((mod, modIdx) => {
                    const isExpanded = expandedModules.has(mod.id);
                    const moduleNotes = mod.notes.flatMap(note => [note, ...(note.subtopics || [])]);
                    const modDone = moduleNotes.filter(n => isPartComplete(n, completedParts)).length;
                    return (
                      <div key={mod.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <div className="course-module-header" onClick={() => toggleModule(mod.id)} style={{ padding: '13px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: '0.9rem', color: C.violet, minWidth: '20px' }}>{String(modIdx + 1).padStart(2, '0')}</span>
                            <h3 style={{ fontFamily: F.display, fontWeight: 600, fontSize: '0.9rem', color: C.text, margin: 0 }}>{mod.title}</h3>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontFamily: F.mono, fontSize: '0.68rem', color: C.textDim }}>{modDone}/{moduleNotes.length}</span>
                            <span style={{ color: C.textFaint, fontSize: '0.65rem', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', display: 'inline-block' }}>▼</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div>
                            {mod.notes.map(note => {
                              const shortTitle = note.title.replace(/^Part\s+\d+[\s—\-]+/i, '');
                              return (
                                <div key={note.part}>
                                  <CurriculumRow note={note} isDone={isPartComplete(note, completedParts)} onSelectPart={onSelectPart} />
                                  {(note.subtopics || []).map(subtopic => (
                                    <CurriculumRow key={subtopic.part} note={subtopic} isDone={completedParts.includes(subtopic.part)} nested onSelectPart={onSelectPart} />
                                  ))}
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
            </div>

            {/* Right rail */}
            <div className="course-detail-rail" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontFamily: F.mono, fontSize: '0.64rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Course facts</div>
                {[
                  ...(activeCourse?.author ? [{ label: 'Instructor', value: activeCourse.author }] : []),
                  { label: 'Modules', value: String(modules.length || '—') },
                  { label: 'Lessons', value: String(displayTotalParts) },
                  { label: 'Completed', value: `${completedCount} (${progressPct}%)` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: F.body, fontSize: '0.74rem', color: C.textDim }}>{label}</span>
                    <strong style={{ fontFamily: F.mono, fontSize: '0.78rem', color: C.text }}>{value}</strong>
                  </div>
                ))}
                <button onClick={onLaunch} style={{ width: '100%', marginTop: '14px', background: C.cyan, color: C.onAccent, border: 'none', borderRadius: '8px', padding: '10px', fontFamily: F.body, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                  {completedCount > 0 ? 'Resume learning' : 'Start learning'}
                </button>
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontFamily: F.mono, fontSize: '0.64rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Your progress</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                    <RingProgress pct={progressPct} size={56} stroke={5} color={progressPct === 100 ? C.green : C.cyan} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: '0.72rem', color: C.text }}>{progressPct}%</div>
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: '0.76rem', color: C.textDim }}>{completedCount} of {displayTotalParts} lessons done</div>
                </div>
              </div>

              <div style={{ background: `linear-gradient(160deg, ${C.violetDim}, ${C.surface})`, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
                <div style={{ fontFamily: F.display, fontStyle: 'italic', fontSize: '0.9rem', color: C.text, lineHeight: 1.5, marginBottom: '8px' }}>
                  "Consistency is the compound interest of learning."
                </div>
                <div style={{ fontFamily: F.mono, fontSize: '0.64rem', color: C.textFaint }}>— 1% Dev Academy</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub: string; color: string; icon: string }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontFamily: F.mono, fontSize: '0.64rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontSize: '0.9rem' }}>{icon}</span>
      </div>
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.6rem', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: F.mono, fontSize: '0.66rem', color: C.textDim, marginTop: '4px' }}>{sub}</div>
    </div>
  );
}

function SideBtn({ icon, label, onClick, active = false }: { icon: string; label: string; onClick: () => void; active?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
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

function SideBtnLogo({ mascot, courseId, label, active = false, onClick }: { mascot?: string; courseId: string; label: string; active?: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const url = getCourseLogoUrl(mascot, courseId);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        background: active ? C.cyanDim : hover ? C.surfaceHi : 'transparent',
        color: active ? C.cyan : C.textDim,
        border: 'none', borderRadius: '8px', padding: '8px 12px', marginBottom: '2px',
        cursor: 'pointer', fontSize: '0.82rem', fontFamily: F.body, fontWeight: active ? 700 : 500,
      }}>
      {url
        ? <img src={url} alt={label} style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} />
        : <span>{getCourseEmoji(mascot, courseId)}</span>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}
