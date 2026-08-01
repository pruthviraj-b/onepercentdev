'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  fetchCourses, fetchModules, fetchNote, fetchProgress, fetchBookmarks,
  toggleProgress, toggleBookmark,
  Course, Module, PartMeta, NoteData,
} from '@/lib/api';
import { initVideos } from '@/lib/videos';
import { logActivity, sendHeartbeat } from '@/lib/studentAnalyticsApi';
import { Sidebar } from './Sidebar';
import { Reader } from './Reader';
import { Landing } from './Landing';
import { ShortcutsModal } from './ShortcutsModal';
import { useAuth } from './AuthProvider';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { TargetRoom } from './TargetRoom';
import { TypingView } from './TypingView';
import { AptitudeView } from './AptitudeView';
import { ErrorBoundary } from './ErrorBoundary';
import { TaskHub } from './TaskHub';
import { AchievementShare } from './AchievementShare';

type View = 'login' | 'dashboard' | 'landing' | 'reader' | 'typing' | 'aptitude' | 'taskhub' | 'targetroom';

function escapeHtml(str: string): string {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ── Signal-deck tokens (matches Dashboard / Landing) ───────────────────────
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
};
const F = {
  display: "'Google Sans Flex', sans-serif",
  body:    "'Google Sans Flex', sans-serif",
  mono:    "'JetBrains Mono', 'Fira Code', monospace",
};

// ── Pro Navbar Dropdown ────────────────────────────────────────────────────
function NavDropdown({
  label, icon, items, align = 'left',
}: {
  label: string;
  icon?: React.ReactNode;
  align?: 'left' | 'right';
  items: { label: string; sublabel?: string; onClick: () => void; icon?: React.ReactNode }[];
}) {
  const [open, setOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px',
          background: open ? C.surfaceHi : 'transparent',
          border: `1px solid ${open ? C.borderHi : 'transparent'}`,
          borderRadius: 9, color: open ? C.cyan : C.text,
          fontFamily: F.body, fontWeight: 600, fontSize: '0.86rem',
          cursor: 'pointer', transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
      >
        {icon}
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease', opacity: 0.7 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', [align]: 0, minWidth: 250,
            background: `linear-gradient(180deg, ${C.surfaceHi}, ${C.surface})`,
            border: `1px solid ${C.borderHi}`, borderRadius: 14,
            boxShadow: `0 16px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(76,216,224,0.06)`,
            padding: 7, zIndex: 200,
            animation: 'navDropIn 140ms ease',
          }}
        >
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              onClick={() => { it.onClick(); setOpen(false); }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '10px 12px 10px 16px', background: hoverIdx === i ? C.surface : 'transparent',
                border: 'none', borderRadius: 9,
                color: C.text, cursor: 'pointer', fontFamily: F.body,
                transition: 'background 120ms ease',
              }}
            >
              <span
                style={{
                  position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 3, borderRadius: 3,
                  background: C.cyan, opacity: hoverIdx === i ? 1 : 0,
                  transition: 'opacity 120ms ease',
                }}
              />
              {it.icon && (
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: hoverIdx === i ? C.cyanDim : C.bg,
                  color: hoverIdx === i ? C.cyan : C.textDim,
                  transition: 'background 120ms ease, color 120ms ease',
                }}>
                  {it.icon}
                </span>
              )}
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: hoverIdx === i ? C.cyan : C.text, transition: 'color 120ms ease' }}>
                  {it.label}
                </div>
                {it.sublabel && <div style={{ fontSize: '0.72rem', color: C.textDim, marginTop: 1 }}>{it.sublabel}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cinematic chapter title card (shown above the reader) ─────────────────
function ChapterHero({
  courseTitle, moduleName, partLabel, title, isCompleted,
}: { courseTitle: string; moduleName: string; partLabel: string; title: string; isCompleted: boolean }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', padding: '28px 32px 22px',
      background: `radial-gradient(1100px 260px at 15% 0%, ${C.cyanDim}, transparent 60%), radial-gradient(900px 220px at 90% 10%, ${C.violetDim}, transparent 65%), ${C.bg}`,
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{
          fontFamily: F.mono, fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em',
          color: C.onAccent, background: isCompleted ? C.green : C.cyan, padding: '4px 9px', borderRadius: '5px',
        }}>{partLabel}</span>
        <span style={{ fontFamily: F.mono, fontSize: '0.66rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{moduleName}</span>
        {isCompleted && <span style={{ fontFamily: F.mono, fontSize: '0.64rem', color: C.green }}>✓ completed</span>}
      </div>
      <h1 style={{
        fontFamily: F.display, fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
        letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.1,
      }}>{title}</h1>
      <div style={{ height: '3px', width: '64px', borderRadius: '2px', background: `linear-gradient(90deg, ${C.cyan}, ${C.violet})`, margin: '14px 0 8px' }} />
      <div style={{ fontFamily: F.mono, fontSize: '0.68rem', color: C.textFaint, letterSpacing: '0.04em' }}>{courseTitle}</div>
    </div>
  );
}

// ── Chapter-complete celebration overlay ───────────────────────────────────
function ChapterCompleteCelebration({ title, onDone }: { title: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(4,6,9,0.55)', backdropFilter: 'blur(6px)', animation: 'celebFadeIn 220ms ease',
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes celebFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes celebFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes celebPop { 0% { transform: scale(0.85); opacity: 0; } 60% { transform: scale(1.03); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes celebRing { 0% { transform: scale(0.6); opacity: 0.9; } 100% { transform: scale(2.4); opacity: 0; } }
        @keyframes celebCheck { 0% { stroke-dashoffset: 40; } 100% { stroke-dashoffset: 0; } }
      `}</style>
      <div style={{
        position: 'relative', textAlign: 'center', animation: 'celebPop 480ms cubic-bezier(0.2,0.8,0.2,1)',
      }}>
        <div style={{ position: 'relative', width: '84px', height: '84px', margin: '0 auto 18px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${C.green}`, animation: 'celebRing 1s ease-out' }} />
          <div style={{
            width: '84px', height: '84px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 40px ${C.greenDim}`,
          }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={C.onAccent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 40, animation: 'celebCheck 420ms 200ms ease-out both' }} />
            </svg>
          </div>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: '0.68rem', color: C.green, letterSpacing: '0.14em', marginBottom: '6px' }}>CHAPTER COMPLETE</div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.3rem', color: C.text, maxWidth: '420px', padding: '0 20px' }}>{title}</div>
      </div>
    </div>
  );
}

export function Academy() {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>('login');
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [completedParts, setCompletedParts] = useState<number[]>([]);
  const [bookmarkedParts, setBookmarkedParts] = useState<number[]>([]);
  const [currentPart, setCurrentPart] = useState<number>(1);
  const [noteData, setNoteData] = useState<NoteData | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'files'>('notes');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [booting, setBooting] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);

  const activeCourse = useMemo(() => {
    return courses.find(c => c.id === activeCourseId) || null;
  }, [courses, activeCourseId]);

  useEffect(() => {
    if (activeCourse) {
      document.title = `1% Dev Academy — ${activeCourse.title}`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', activeCourse.author ? `${activeCourse.description} Series by ${activeCourse.author}. Complete notes, code, and video.` : `${activeCourse.description}. Complete notes and code.`);
      }
    } else {
      document.title = '1% Dev Academy';
    }
  }, [activeCourse]);

  const totalParts = modules.reduce((s, m) => s + m.notes.length, 0);
  const completedCount = completedParts.length;
  const progressPct = totalParts > 0 ? Math.round((completedCount / totalParts) * 100) : 0;

  const updateURL = useCallback((courseId: string | null, part: number | null, viewParam?: string | null) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (courseId) {
      params.set('course', courseId);
      if (part !== null) {
        params.set('part', String(part));
      } else {
        params.delete('part');
      }
    } else {
      params.delete('course');
      params.delete('part');
    }
    if (viewParam) {
      params.set('view', viewParam);
    } else {
      params.delete('view');
    }
    const search = params.toString();
    const newPath = search ? `?${search}` : window.location.pathname;
    window.history.pushState({ view: viewParam || null, course: courseId || null, part: part || null }, '', newPath);
  }, []);

  const handleSelectCourse = useCallback(async (courseId: string, shouldUpdateURL = true) => {
    setActiveCourseId(courseId);
    localStorage.setItem('opd_active_course', courseId);
    setBooting(true);
    logActivity('course_open', courseId);
    sendHeartbeat(courseId);

    const savedPart = localStorage.getItem(`opd_last_part_${courseId}`);

    try {
      const [mods, prog, bkm] = await Promise.all([
        fetchModules(courseId),
        fetchProgress(courseId),
        fetchBookmarks(courseId)
      ]);
      setModules(mods);
      setCompletedParts(prog);
      setBookmarkedParts(bkm);

      const allPartsMeta = mods.flatMap(m => m.notes);
      let initialPart = allPartsMeta[0]?.part || 1;
      if (savedPart) {
        const parsed = parseFloat(savedPart);
        if (allPartsMeta.some(p => p.part === parsed)) {
          initialPart = parsed;
        }
      }
      setCurrentPart(initialPart);
      setView('landing');
      if (shouldUpdateURL) {
        updateURL(courseId, null, 'landing');
      }
    } catch (err) {
      console.error(`Error loading course ${courseId}:`, err);
    } finally {
      setBooting(false);
    }
  }, [updateURL]);

  const handleChangeCourse = useCallback(() => {
    setActiveCourseId(null);
    localStorage.removeItem('opd_active_course');
    setModules([]);
    setCompletedParts([]);
    setBookmarkedParts([]);
    setNoteData(null);
    setView('landing');
    updateURL(null, null, 'landing');
  }, [updateURL]);

  const selectPart = useCallback(async (part: number, tab: 'notes' | 'files' = 'notes', shouldUpdateURL = true) => {
    if (!activeCourseId) return;
    setCurrentPart(part);
    setActiveTab(tab);
    setView('reader');
    setNoteLoading(true);
    localStorage.setItem(`opd_last_part_${activeCourseId}`, String(part));
    if (shouldUpdateURL) {
      updateURL(activeCourseId, part, 'reader');
    }
    logActivity('lesson_start', activeCourseId, part);
    sendHeartbeat(activeCourseId, part);
    try {
      const data = await fetchNote(activeCourseId, part);
      setNoteData(data);
    } catch {
      setNoteData(null);
    } finally {
      setNoteLoading(false);
    }
  }, [activeCourseId, updateURL]);

  const handleGoHome = useCallback(() => {
    setActiveCourseId(null);
    localStorage.removeItem('opd_active_course');
    setView('dashboard');
    setNoteData(null);
    updateURL(null, null, 'dashboard');
  }, [updateURL]);

  const heartbeatCourseRef = useRef<string | null>(null);
  const heartbeatPartRef = useRef<number>(1);
  const heartbeatViewRef = useRef<string>('dashboard');
  heartbeatCourseRef.current = activeCourseId;
  heartbeatPartRef.current = currentPart;
  heartbeatViewRef.current = view;

  useEffect(() => {
    if (!user) return;
    logActivity('login');
    const hb = setInterval(() => {
      sendHeartbeat(
        heartbeatCourseRef.current || undefined,
        heartbeatViewRef.current === 'reader' ? heartbeatPartRef.current : undefined,
      );
    }, 60000);
    sendHeartbeat(heartbeatCourseRef.current || undefined, heartbeatViewRef.current === 'reader' ? heartbeatPartRef.current : undefined);
    return () => clearInterval(hb);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    Promise.all([fetchCourses(), initVideos()])
      .then(([fetchedCourses]) => {
        setCourses(fetchedCourses);
        const params = new URLSearchParams(window.location.search);
        const courseParam = params.get('course');
        const partParam = params.get('part');

        if (courseParam && fetchedCourses.some(c => c.id === courseParam)) {
          setActiveCourseId(courseParam);
          Promise.all([
            fetchModules(courseParam),
            fetchProgress(courseParam),
            fetchBookmarks(courseParam)
          ]).then(async ([mods, prog, bkm]) => {
            setModules(mods);
            setCompletedParts(prog);
            setBookmarkedParts(bkm);
            logActivity('course_open', courseParam);
            sendHeartbeat(courseParam);

            if (partParam) {
              const partNum = parseFloat(partParam);
              setCurrentPart(partNum);
              setView('reader');
              setNoteLoading(true);
              try {
                const data = await fetchNote(courseParam, partNum);
                setNoteData(data);
              } catch {
                setNoteData(null);
              } finally {
                setNoteLoading(false);
              }
            } else {
              const allPartsMeta = mods.flatMap(m => m.notes);
              const savedPart = localStorage.getItem(`opd_last_part_${courseParam}`);
              let initialPart = allPartsMeta[0]?.part || 1;
              if (savedPart) {
                const parsed = parseFloat(savedPart);
                if (allPartsMeta.some(p => p.part === parsed)) {
                  initialPart = parsed;
                }
              }
              setCurrentPart(initialPart);
              setView('reader');
              setNoteLoading(true);
              try {
                const data = await fetchNote(courseParam, initialPart);
                setNoteData(data);
              } catch {
                setNoteData(null);
              } finally {
                setNoteLoading(false);
              }
            }
            setBooting(false);
          }).catch(() => setBooting(false));
          } else {
            setView('dashboard');
            setBooting(false);
          }
        })
        .catch(err => {
          console.error('Failed to boot Academy:', err);
          setBooting(false);
        });
  }, [handleSelectCourse, user, authLoading]);

  useEffect(() => {
    const handlePopState = async () => {
      const params = new URLSearchParams(window.location.search);
      const courseParam = params.get('course');
      const partParam = params.get('part');

      if (courseParam) {
        if (courseParam !== activeCourseId) {
          setActiveCourseId(courseParam);
          setBooting(true);
          try {
            const [mods, prog, bkm] = await Promise.all([
              fetchModules(courseParam),
              fetchProgress(courseParam),
              fetchBookmarks(courseParam)
            ]);
            setModules(mods);
            setCompletedParts(prog);
            setBookmarkedParts(bkm);

            if (partParam) {
              const partNum = parseFloat(partParam);
              setCurrentPart(partNum);
              setView('reader');
              setNoteLoading(true);
              const data = await fetchNote(courseParam, partNum);
              setNoteData(data);
              setNoteLoading(false);
            } else {
              const allPartsMeta = mods.flatMap(m => m.notes);
              const savedPart = localStorage.getItem(`opd_last_part_${courseParam}`);
              let initialPart = allPartsMeta[0]?.part || 1;
              if (savedPart) {
                const parsed = parseFloat(savedPart);
                if (allPartsMeta.some(p => p.part === parsed)) {
                  initialPart = parsed;
                }
              }
              setCurrentPart(initialPart);
              setView('reader');
              setNoteLoading(true);
              try {
                const data = await fetchNote(courseParam, initialPart);
                setNoteData(data);
              } catch {
                setNoteData(null);
              } finally {
                setNoteLoading(false);
              }
            }
          } catch (err) {
            console.error(err);
          } finally {
            setBooting(false);
          }
        } else {
          if (partParam) {
            const partNum = parseFloat(partParam);
            setCurrentPart(partNum);
            setView('reader');
            setNoteLoading(true);
            try {
              const data = await fetchNote(courseParam, partNum);
              setNoteData(data);
            } catch {
              setNoteData(null);
            } finally {
              setNoteLoading(false);
            }
          } else {
            setNoteData(null);
            setView('landing');
          }
        }
      } else {
        setActiveCourseId(null);
        setModules([]);
        setCompletedParts([]);
        setBookmarkedParts([]);
        setNoteData(null);
        setView('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeCourseId]);

  const handleToggleComplete = useCallback(async (part: number) => {
    if (!activeCourseId) return;
    const isDone = completedParts.includes(part);
    setCompletedParts(prev => isDone ? prev.filter(p => p !== part) : [...prev, part]);
    await toggleProgress(activeCourseId, part, !isDone);
    if (!isDone) {
      logActivity('lesson_complete', activeCourseId, part);
      // Fire the chapter-complete celebration only when moving TO completed
      const title = noteData && noteData.part === part ? noteData.title : `Part ${part}`;
      setCelebration(title);
    } else {
      logActivity('progress_marked', activeCourseId, part);
    }
  }, [activeCourseId, completedParts, noteData]);

  const handleToggleBookmark = useCallback(async (part: number) => {
    if (!activeCourseId) return;
    const isPinned = bookmarkedParts.includes(part);
    setBookmarkedParts(prev => isPinned ? prev.filter(p => p !== part) : [...prev, part]);
    await toggleBookmark(activeCourseId, part, !isPinned);
    if (!isPinned) logActivity('bookmark_added', activeCourseId, part);
  }, [activeCourseId, bookmarkedParts]);

  const downloadFile = (filename: string, content: string, type = 'text/plain;charset=utf-8') => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLesson = useCallback((format: 'pdf' | 'markdown' | 'docx') => {
    if (!noteData) return;
    const safeTitle = noteData.title.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
    const filename = `Part-${noteData.part}-${safeTitle || 'lesson'}`;

    const generatedAt = new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });

    const EXPORT_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>__TITLE__ | __COURSE__</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');
      :root {
        color-scheme: light;
        --ink: #1a1d23; --muted: #565d6b; --line: #1a1d23; --accent: #7c5cff;
        --accent-soft: #f1edff; --hair: #dcdfe4; --surface: #ffffff; --surface-alt: #f8f8fa;
        --shadow-sm: 0 1px 2px rgba(20,22,30,0.06), 0 1px 1px rgba(20,22,30,0.04);
        --shadow-md: 0 4px 14px rgba(20,22,30,0.08), 0 2px 4px rgba(20,22,30,0.05);
      }
      * { box-sizing: border-box; }
      html { counter-reset: page; }
      body {
        margin: 0; font-family: 'Inter', -apple-system, sans-serif;
        color: var(--ink); background: #f2f2f5; line-height: 1.7; font-size: 15.5px;
        -webkit-font-smoothing: antialiased;
      }
      @page {
        size: A4; margin: 22mm 18mm 24mm;
        @bottom-center { content: "Page " counter(page) " of " counter(pages); font-family: 'JetBrains Mono', monospace; font-size: 8.5px; color: #8a8f9a; letter-spacing: 0.05em; }
      }
      .doc-page { max-width: 960px; margin: 0 auto; padding: 44px 48px 56px; background: var(--surface); box-shadow: var(--shadow-md); }

      .letterhead {
        display: flex; align-items: center; gap: 16px; padding-bottom: 22px; margin-bottom: 28px;
        border-bottom: 2px solid var(--ink);
      }
      .letterhead-seal {
        width: 46px; height: 46px; border-radius: 10px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Fraunces', serif; font-weight: 700; font-size: 1rem; color: #fff;
        background: linear-gradient(145deg, var(--accent), #5b3fd6); box-shadow: var(--shadow-sm);
      }
      .letterhead-text { flex: 1; }
      .letterhead-org {
        font-family: 'Fraunces', serif; font-weight: 600; font-size: 1.15rem;
        letter-spacing: -0.01em; margin: 0; color: var(--ink);
      }
      .letterhead-dept {
        font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase;
        color: var(--muted); margin-top: 2px; font-weight: 500;
      }
      .letterhead-ref {
        text-align: right; font-family: 'JetBrains Mono', monospace;
        font-size: 0.65rem; letter-spacing: 0.02em; color: var(--muted); line-height: 1.6;
      }
      .letterhead-ref strong { color: var(--ink); }

      .doc-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        gap: 24px; padding-bottom: 20px; margin-bottom: 28px; border-bottom: 1px solid var(--hair);
      }
      .doc-badge {
        display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem;
        font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
        background: var(--accent-soft); color: var(--accent); padding: 5px 11px; border-radius: 5px; margin-bottom: 10px;
      }
      .doc-header h1 {
        margin: 0 0 6px; font-family: 'Fraunces', serif; font-weight: 600;
        font-size: 1.25rem; letter-spacing: -0.01em;
      }
      .doc-header p { margin: 0; color: var(--muted); font-size: 0.85rem; }
      .doc-meta-right { text-align: right; font-size: 0.8rem; color: var(--muted); }
      .doc-meta-right p { margin: 0 0 4px; }
      .doc-meta-right strong { color: var(--ink); font-weight: 600; }

      .doc-title-block {
        text-align: center; padding: 32px 28px; margin-bottom: 30px;
        border-radius: 14px; position: relative; overflow: hidden;
        background: linear-gradient(180deg, var(--surface-alt), var(--surface));
        border: 1px solid var(--hair); box-shadow: var(--shadow-sm);
      }
      .doc-title-block::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
        background: linear-gradient(90deg, var(--accent), #5b3fd6);
      }
      .doc-eyebrow {
        display: block; font-size: 0.68rem; letter-spacing: 0.16em; text-transform: uppercase;
        color: var(--accent); font-weight: 600; margin-bottom: 12px;
      }
      .doc-title-block h1 {
        margin: 0 0 18px; font-family: 'Fraunces', serif; font-weight: 600;
        font-size: 2rem; line-height: 1.25; letter-spacing: -0.015em; color: var(--ink);
      }
      .doc-meta-row {
        display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 16px;
        font-size: 0.8rem; color: var(--muted);
      }
      .doc-meta-row span {
        background: var(--surface); border: 1px solid var(--hair); border-radius: 20px;
        padding: 5px 13px;
      }
      .doc-meta-row span strong { color: var(--ink); font-weight: 600; }

      .doc-toc {
        margin-bottom: 32px; padding: 24px 28px; border-radius: 14px;
        background: var(--surface-alt); border: 1px solid var(--hair);
      }
      .doc-toc-title {
        font-family: 'Fraunces', serif; font-weight: 600; font-size: 1rem;
        margin: 0 0 14px; display: flex; align-items: center; gap: 9px; color: var(--ink);
      }
      .doc-toc-title::before {
        content: ''; width: 18px; height: 3px; background: var(--accent); border-radius: 2px; display: inline-block;
      }
      .doc-toc-list { list-style: none; margin: 0; padding: 0; counter-reset: toc; }
      .doc-toc-list li {
        counter-increment: toc; display: flex; align-items: baseline; gap: 10px;
        font-size: 0.88rem; padding: 7px 0; color: var(--ink);
      }
      .doc-toc-list li::before {
        content: counter(toc, decimal-leading-zero); font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem; color: var(--accent); font-weight: 600; flex-shrink: 0;
      }
      .doc-toc-list li::after {
        content: ''; flex: 1; border-bottom: 1px dotted var(--hair); margin: 0 4px; transform: translateY(-3px);
      }
      .doc-toc-list a { color: var(--ink); text-decoration: none; font-weight: 500; }
      .doc-toc-empty { font-size: 0.85rem; color: var(--muted); font-style: italic; }

      .doc-section { margin-bottom: 24px; }
      .export-h1, .export-h2, .export-h3 {
        font-family: 'Fraunces', serif; font-weight: 600; color: var(--ink);
      }
      .export-h1 {
        font-size: 1.5rem; margin: 2.6rem 0 1rem; padding-bottom: 10px;
        border-bottom: 2px solid var(--ink); letter-spacing: -0.01em;
      }
      .export-h2 {
        font-size: 1.2rem; margin: 2.1rem 0 0.8rem; padding-left: 13px;
        border-left: 3px solid var(--accent); letter-spacing: -0.005em;
      }
      .export-h3 { font-size: 1.02rem; margin: 1.6rem 0 0.6rem; font-style: italic; color: var(--muted); }
      .export-paragraph { margin: 0 0 1.1rem; font-size: 0.97rem; color: var(--ink); }
      .export-list { padding-left: 1.5rem; margin: 0 0 1.1rem; }
      .export-list li { margin-bottom: 0.55rem; }

      .export-callout {
        padding: 16px 20px; border-radius: 10px; border: 1px solid var(--hair); border-left: 4px solid var(--accent);
        background: var(--accent-soft); margin: 1.7rem 0; box-shadow: var(--shadow-sm);
      }
      .export-callout-header { display:flex; align-items:center; gap:8px; font-weight:600; margin-bottom:0.5rem; font-family: 'Fraunces', serif; color: var(--ink); }
      .export-callout-icon { font-size:1rem; color: var(--accent); }
      .export-callout-body { color:var(--ink) }

      .export-inline-code {
        display:inline-block; padding:2px 7px; margin:0 1px; border-radius: 5px;
        background:var(--surface-alt); border: 1px solid var(--hair);
        font-family:'JetBrains Mono',monospace; font-size:0.85em; color: #5b3fd6;
      }
      .export-code-shell {
        overflow:hidden; border-radius: 10px; border:1px solid var(--hair);
        background:#1a1d23; margin:1.7rem 0; box-shadow: var(--shadow-md);
      }
      .export-code-toolbar {
        display:flex; justify-content:space-between; align-items:center; padding:9px 16px;
        background:#25282f; border-bottom:1px solid #33363e; color:#9aa0ac;
        font-family:'JetBrains Mono',monospace; font-size:0.68rem; font-weight:600; letter-spacing:0.08em;
      }
      .export-code-toolbar::before {
        content: '● ● ●'; letter-spacing: 2px; color: #4a4e58; font-size: 0.6rem;
      }
      .export-code-block {
        margin:0; padding:16px; font-family:'JetBrains Mono',monospace; font-size:0.83rem;
        color:#e4e6ea; white-space:pre-wrap; word-break:break-word; background:transparent; line-height: 1.6;
      }
      .export-table-wrap {
        overflow:hidden; border-radius: 10px; border:1px solid var(--hair);
        margin:1.7rem 0; box-shadow: var(--shadow-sm);
      }
      .export-table { width:100%; border-collapse:collapse; font-size:0.89rem; background:var(--surface) }
      .export-table th {
        background:var(--ink); color: #fff; text-align:left;
        padding:12px 16px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; font-size:0.72rem;
      }
      .export-table td { padding:11px 16px; border-top:1px solid var(--hair); }
      .export-table tbody tr:nth-child(even) { background: var(--surface-alt); }
      .export-table tbody tr:hover { background: var(--accent-soft); }

      .doc-footer { margin-top: 52px; padding-top: 24px; border-top: 1px solid var(--hair); }
      .doc-cert-line { font-size: 0.82rem; color: var(--muted); font-style: italic; margin-bottom: 26px; }
      .doc-signature-row { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 24px; }
      .doc-signature-block { flex: 1; text-align: center; }
      .doc-signature-line { border-bottom: 1px solid var(--ink); height: 40px; margin-bottom: 6px; }
      .doc-signature-label { font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
      .doc-footer-meta {
        display: flex; justify-content: space-between; align-items: center;
        font-family: 'JetBrains Mono', monospace; font-size: 0.66rem; color: var(--muted);
        letter-spacing: 0.02em; padding-top: 14px; border-top: 1px solid var(--hair);
      }

      @media print {
        html { counter-reset: page; }
        body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .doc-page { padding: 0; max-width: 100%; background: #fff; box-shadow: none; position: relative; }
        .doc-page::before, .doc-page::after {
          content: ''; position: fixed; width: 22px; height: 22px; border-color: var(--hair); border-style: solid; opacity: 0.55;
        }
        .doc-page::before { top: 8mm; left: 8mm; border-width: 1px 0 0 1px; }
        .doc-page::after { bottom: 8mm; right: 8mm; border-width: 0 1px 1px 0; }
        .letterhead, .doc-title-block, .doc-toc, .export-code-shell, .export-table-wrap, .export-callout, .doc-signature-row {
          break-inside: avoid; page-break-inside: avoid;
        }
        .export-table th { background: #2a2d33 !important; }
        .export-code-shell { background: #1f2127 !important; }
      }
    </style>
  </head>
  <body>
    <div class="doc-page">

      <div class="letterhead">
        <div class="letterhead-seal">1%</div>
        <div class="letterhead-text">
          <h1 class="letterhead-org">1% Dev Academy</h1>
          <div class="letterhead-dept">Office of Curriculum &amp; Certified Learning Records</div>
        </div>
        <div class="letterhead-ref">
          <div><strong>Ref.</strong> __COURSE__/${noteData.part}/2026</div>
          <div><strong>Category:</strong> __MODULE__</div>
        </div>
      </div>

      <header class="doc-header">
        <div>
          <div class="doc-badge">__COURSE__</div>
          <h1>__TITLE__</h1>
          <p>__MODULE__ &nbsp;•&nbsp; Part ${noteData.part} &nbsp;•&nbsp; Classification: ${escapeHtml(noteData.importance || 'Standard')}</p>
        </div>
        <div class="doc-meta-right">
          <p><strong>Date Issued:</strong> __GENERATED__</p>
          <p><strong>Document Version:</strong> 1.0</p>
          <p><strong>Authority:</strong> 1% Dev Academy</p>
        </div>
      </header>

      <section class="doc-title-block">
        <span class="doc-eyebrow">Official Lesson Record — For Reference &amp; Certification Purposes</span>
        <h1>__TITLE__</h1>
        <div class="doc-meta-row">
          <span><strong>Course:</strong> __COURSE__</span>
          <span><strong>Module:</strong> __MODULE__</span>
          <span><strong>Part No.:</strong> ${noteData.part}</span>
          <span><strong>Duration:</strong> ${Math.max(1, Math.round((noteData.notes || '').split(/\s+/).length / 200))} min</span>
          <span><strong>Level:</strong> ${escapeHtml(noteData.difficulty || noteData.importance || 'General')}</span>
        </div>
      </section>

      __TOC__

      <div class="doc-section">__NOTES__</div>

      <footer class="doc-footer">
        <p class="doc-cert-line">
          This document is issued as an official transcript of record for the above-referenced lesson,
          certified accurate as of the date of issue by 1% Dev Academy.
        </p>

        <div class="doc-signature-row">
          <div class="doc-signature-block">
            <div class="doc-signature-line"></div>
            <div class="doc-signature-label">Instructor / Author</div>
          </div>
          <div class="doc-signature-block">
            <div class="doc-signature-line"></div>
            <div class="doc-signature-label">Academic Registrar</div>
          </div>
          <div class="doc-signature-block">
            <div class="doc-signature-line"></div>
            <div class="doc-signature-label">Date</div>
          </div>
        </div>

        <div class="doc-footer-meta">
          <span>__COURSE__ • __MODULE__ • Part ${noteData.part}</span>
          <span>Issued __GENERATED__ • 1% Dev Academy — Official Record</span>
        </div>
      </footer>

    </div>
  </body>
</html>`;

    const notesHtml = escapeHtml(noteData.notes || '').replace(/\n/g, '<br/>');

    const fullHtml = EXPORT_TEMPLATE
      .replace(/__TITLE__/g, escapeHtml(noteData.title))
      .replace(/__COURSE__/g, escapeHtml(activeCourse?.id || activeCourseId || 'sql'))
      .replace(/__MODULE__/g, escapeHtml(noteData.module || ''))
      .replace(/__GENERATED__/g, escapeHtml(generatedAt))
      .replace(/__NOTES__/g, notesHtml);

    if (format === 'markdown') {
      const md = `# ${noteData.title}\n\nModule: ${noteData.module}\nPart: ${noteData.part}\nImportance: ${noteData.importance}\nCourse: ${activeCourse?.title || activeCourseId || 'Course'}\n\n---\n\n${noteData.notes}`;
      downloadFile(`${filename}.md`, md, 'text/markdown;charset=utf-8');
    } else if (format === 'docx') {
      downloadFile(`${filename}.docx`, fullHtml, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8');
    } else {
      const popup = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
      if (popup) {
        popup.document.write(fullHtml);
        popup.document.close();
        popup.document.title = `${noteData.title} — Export`;
      } else {
        downloadFile(`${filename}.html`, fullHtml, 'text/html;charset=utf-8');
      }
    }
    setDownloadMenuOpen(false);
  }, [noteData, activeCourse, activeCourseId]);

  const handleLaunch = () => {
    if (noteData) setView('reader');
    else selectPart(currentPart);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts(s => !s);
        return;
      }
      if (showShortcuts) return;
      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        if (view === 'landing') setView('reader');
      }
      if (e.key === 's' && view === 'reader') {
        setSidebarOpen(o => !o);
      }
      if (e.key === 'b' && view === 'reader') handleToggleBookmark(currentPart);
      if (e.key === 'c' && view === 'reader') handleToggleComplete(currentPart);
      if (e.key === 'Escape') {
        if (view === 'reader' && !showShortcuts) handleGoHome();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, currentPart, showShortcuts, handleToggleBookmark, handleToggleComplete]);

  const allParts: PartMeta[] = modules.flatMap(m => m.notes);
  const currentIdx = allParts.findIndex(p => p.part === currentPart);
  const currentModule = modules.find(module => module.notes.some(note => note.part === currentPart)) || null;
  const currentModuleComplete = !!currentModule && currentModule.notes.length > 0 && currentModule.notes.every(note => completedParts.includes(note.part));

  if (authLoading) {
    return (
      <div className="boot-screen" role="status" aria-label="Authenticating">
        <div className="boot-brand-lockup" aria-label="1% Dev Academy">
          <div className="boot-logo-mark" aria-hidden="true">1%</div>
          <div className="boot-logo-name">Dev Academy</div>
        </div>
        <div className="boot-loader-wrap">
          <div className="loader" aria-hidden="true" />
          <span className="boot-loader-glow" aria-hidden="true" />
        </div>
        <p className="boot-text">Authenticating<span className="boot-dots" aria-hidden="true">...</span></p>
        <p className="boot-subtext">Preparing your learning space</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (view === 'dashboard') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 0 }}>
        <ErrorBoundary name="Dashboard">
          <Dashboard 
            onNavigate={(mod) => {
              if (mod.startsWith('resume_')) {
                const parts = mod.split('_');
                const courseId = parts[1];
                const partId = parts[2];
                window.location.href = `/?course=${courseId}&part=${partId}`;
              } else if (mod.startsWith('course_')) {
                const courseId = mod.replace('course_', '');
                const course = courses.find(c => c.id === courseId);
                if (course) handleSelectCourse(course.id, true);
              } else if (mod === 'academy') {
                handleChangeCourse();
              } else if (mod === 'typing') {
                setView('typing');
                setActiveCourseId(null);
                updateURL(null, null);
              } else if (mod === 'aptitude') {
                setView('aptitude');
                setActiveCourseId(null);
                updateURL(null, null);
              } else if (mod === 'targetroom') {
                setView('targetroom');
                setActiveCourseId(null);
                updateURL(null, null);
              }
            }}
            onOpenTaskHub={() => setView('taskhub')}
          />
        </ErrorBoundary>
      </div>
    );
  }

  if (view === 'taskhub') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 0 }}>
        <ErrorBoundary name="Task Hub">
          <TaskHub
            onBack={() => setView('dashboard')}
            courses={courses}
            onNavigateInternal={(target, id) => {
              if (target === 'lesson' || target === 'course') {
                const courseId = target === 'course' ? id : activeCourseId || id;
                if (target === 'lesson') {
                  const partNum = parseFloat(id);
                  if (!isNaN(partNum) && courseId) {
                    window.location.href = `/?course=${courseId}&part=${partNum}`;
                  }
                } else {
                  handleSelectCourse(id, true);
                  setView('landing');
                }
              } else {
                setView('dashboard');
              }
            }}
          />
        </ErrorBoundary>
      </div>
    );
  }

  if (view === 'typing') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 0 }}>
        <ErrorBoundary name="Typing Practice">
          <TypingView onBack={() => setView('dashboard')} />
        </ErrorBoundary>
      </div>
    );
  }

  if (view === 'targetroom') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 0 }}>
        <ErrorBoundary name="Target Room">
          <TargetRoom onBack={() => setView('dashboard')} />
        </ErrorBoundary>
      </div>
    );
  }

  if (view === 'aptitude') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 0 }}>
        <ErrorBoundary name="Aptitude Tests">
          <AptitudeView onBack={() => setView('dashboard')} />
        </ErrorBoundary>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 0 }}>
        <ErrorBoundary name="Course Detail">
          <Landing
            courses={courses}
            activeCourseId={activeCourseId}
            onSelectCourse={handleSelectCourse}
            onChangeCourse={handleChangeCourse}
            onGoHome={handleGoHome}
            modules={modules}
            completedParts={completedParts}
            progressPct={progressPct}
            completedCount={completedCount}
            totalParts={totalParts}
            booting={booting}
            onLaunch={() => {
              const allPartsMeta = modules.flatMap(m => m.notes);
              const nextUncompleted = allPartsMeta.find(p => !completedParts.includes(p.part));
              const targetPart = nextUncompleted ? nextUncompleted.part : (allPartsMeta[0]?.part || 1);
              selectPart(targetPart);
            }}
            onSelectPart={selectPart}
          />
        </ErrorBoundary>
      </div>
    );
  }

  if (booting) {
    return (
      <div className="boot-screen" role="status" aria-label="Loading course">
        <div className="boot-logo"><span aria-hidden="true">1%</span> Dev Academy</div>
        <div className="loader" aria-hidden="true" />
        <p className="boot-text">Loading...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary name="Course Reader">
    <>
      <style>{`
        @keyframes navDropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {celebration && (
        <ChapterCompleteCelebration title={celebration} onDone={() => setCelebration(null)} />
      )}

      <a href="#main-content" className="skip-to-main">Skip to main content</a>
      <div className={`app-shell ${(view as string) === 'landing' ? 'landing-view' : ''} ${view === 'reader' ? 'reader-view' : ''} ${!sidebarOpen && view === 'reader' ? 'sidebar-collapsed' : ''} ${sidebarOpen && view === 'reader' ? 'mobile-sidebar-open' : ''} ${!activeCourseId ? 'no-active-course' : ''}`}>
        <header
          className="header"
          role="banner"
          style={{
            position: 'sticky', top: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px', background: 'rgba(8,11,16,0.85)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {view === 'reader' && activeCourseId && (
              <button
                className={`icon-btn sidebar-toggle-btn${sidebarOpen ? ' active' : ''}`}
                title={sidebarOpen ? 'Close Sidebar [s]' : 'Open Sidebar [s]'}
                aria-label={sidebarOpen ? 'Close course navigation' : 'Open course navigation'}
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(o => !o)}
              >
                {sidebarOpen ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <polyline points="6 9 3 12 6 15"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <polyline points="12 9 15 12 12 15"/>
                  </svg>
                )}
              </button>
            )}

            <nav aria-label="Primary" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <NavDropdown
                label="Menu"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                }
                items={[
                  { label: 'Dashboard', sublabel: 'Home overview', onClick: handleGoHome },
                  { label: 'All Courses', sublabel: 'Browse pathways', onClick: handleChangeCourse },
                  { label: 'Typing Practice', onClick: () => { setView('typing'); setActiveCourseId(null); updateURL(null, null); } },
                  { label: 'Aptitude Tests', onClick: () => { setView('aptitude'); setActiveCourseId(null); updateURL(null, null); } },
                  { label: 'Task Hub', onClick: () => setView('taskhub') },
                ]}
              />

              {activeCourse && (
                <NavDropdown
                  label={activeCourse.title.length > 22 ? activeCourse.title.slice(0, 22) + '…' : activeCourse.title}
                  items={[
                    { label: 'Course Overview', onClick: () => setView('landing') },
                    ...(noteData ? [{ label: `Part ${noteData.part} — ${noteData.module}`, sublabel: 'Current lesson', onClick: () => setView('reader') }] : []),
                    { label: 'Switch Course', onClick: handleChangeCourse },
                  ]}
                />
              )}
            </nav>
          </div>

          <div className="header-right" role="toolbar" aria-label="Reader actions" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {view === 'reader' && activeCourseId && (
              <>
                <button
                  className={`icon-btn${completedParts.includes(currentPart) ? ' active' : ''}`}
                  title={`${completedParts.includes(currentPart) ? 'Mark Incomplete' : 'Mark Complete'} [c]`}
                  aria-label={completedParts.includes(currentPart) ? 'Mark part incomplete' : 'Mark part complete'}
                  aria-pressed={completedParts.includes(currentPart)}
                  onClick={() => handleToggleComplete(currentPart)}
                  style={completedParts.includes(currentPart) ? { color: C.green } : undefined}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>

                <button
                  className={`icon-btn${bookmarkedParts.includes(currentPart) ? ' active' : ''}`}
                  title="Bookmark [b]"
                  aria-label={bookmarkedParts.includes(currentPart) ? 'Remove bookmark' : 'Bookmark this part'}
                  aria-pressed={bookmarkedParts.includes(currentPart)}
                  onClick={() => handleToggleBookmark(currentPart)}
                  style={bookmarkedParts.includes(currentPart) ? { color: C.amber } : undefined}
                >
                  <svg viewBox="0 0 24 24" fill={bookmarkedParts.includes(currentPart) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              </>
            )}

            {view === 'reader' && activeCourseId && noteData && (
              <NavDropdown
                label="Export"
                align="right"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                }
                items={[
                  { label: 'Print / PDF', sublabel: 'Open printable version or save as PDF', onClick: () => handleDownloadLesson('pdf') },
                  { label: 'Markdown', sublabel: 'Download lesson notes as .md', onClick: () => handleDownloadLesson('markdown') },
                  { label: 'Word Document', sublabel: 'Download lesson notes as .docx', onClick: () => handleDownloadLesson('docx') },
                ]}
              />
            )}

            {view === 'reader' && activeCourseId && activeCourse && currentModule && currentModuleComplete && (
              <AchievementShare
                userId={user?.uid}
                courseId={activeCourseId}
                courseTitle={activeCourse.title}
                moduleId={currentModule.id}
                moduleTitle={currentModule.title}
                completedParts={currentModule.notes.map(note => note.part)}
                partTitles={currentModule.notes.map(note => note.title)}
                partNumbers={currentModule.notes.map(note => note.part)}
              />
            )}

            {(view === 'reader' || (view as string) === 'landing') && (
              <button
                className="icon-btn"
                title="Go to Dashboard [Esc]"
                aria-label="Go to Dashboard"
                onClick={handleGoHome}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </button>
            )}

            <button
              className="icon-btn"
              title="Keyboard Shortcuts [?]"
              aria-label="Show keyboard shortcuts"
              onClick={() => setShowShortcuts(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
              </svg>
            </button>
          </div>
        </header>

        {activeCourseId && (
          <Sidebar
            courseId={activeCourseId}
            modules={modules}
            currentPart={currentPart}
            completedParts={completedParts}
            bookmarkedParts={bookmarkedParts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectPart={selectPart}
            progressPct={progressPct}
            completedCount={completedCount}
            totalParts={totalParts}
            isCurrentCompleted={completedParts.includes(currentPart)}
            onToggleComplete={() => handleToggleComplete(currentPart)}
            onPrev={currentIdx > 0 ? () => selectPart(allParts[currentIdx - 1].part) : undefined}
            onNext={currentIdx < allParts.length - 1 ? () => selectPart(allParts[currentIdx + 1].part) : undefined}
          />
        )}

        <main className="main" id="main-content" tabIndex={-1}>
          {(view as string) === 'landing' ? (
            <Landing
              courses={courses}
              activeCourseId={activeCourseId}
              onSelectCourse={handleSelectCourse}
              onChangeCourse={handleChangeCourse}
              onGoHome={handleGoHome}
              modules={modules}
              completedParts={completedParts}
              progressPct={progressPct}
              completedCount={completedCount}
              totalParts={totalParts}
              booting={booting}
              onLaunch={handleLaunch}
              onSelectPart={selectPart}
            />
          ) : activeCourseId ? (
            <Reader
              noteData={noteData}
              loading={noteLoading}
              activeTab={activeTab}
              isCompleted={completedParts.includes(currentPart)}
              currentIdx={currentIdx}
              totalCount={allParts.length}
              onTabChange={setActiveTab}
              onToggleComplete={() => handleToggleComplete(currentPart)}
              onPrev={currentIdx > 0 ? () => selectPart(allParts[currentIdx - 1].part) : undefined}
              onNext={currentIdx < allParts.length - 1 ? () => selectPart(allParts[currentIdx + 1].part) : undefined}
              onShowShortcuts={() => setShowShortcuts(true)}
              courseId={activeCourseId}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No course selected.
            </div>
          )}
        </main>
      </div>

      {sidebarOpen && view === 'reader' && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
    </ErrorBoundary>
  );
}
