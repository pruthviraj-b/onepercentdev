'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchCourses, fetchModules, fetchNote, fetchProgress, fetchBookmarks,
  toggleProgress, toggleBookmark,
  Course, Module, PartMeta, NoteData,
} from '@/lib/api';
import { initVideos } from '@/lib/videos';
import { Sidebar } from './Sidebar';
import { Reader } from './Reader';
import { Landing } from './Landing';
import { ShortcutsModal } from './ShortcutsModal';
import { useAuth } from './AuthProvider';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { TypingView } from './TypingView';
import { AptitudeView } from './AptitudeView';
import { ErrorBoundary } from './ErrorBoundary';

type View = 'login' | 'dashboard' | 'landing' | 'reader' | 'typing' | 'aptitude';

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
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [videoPlaygroundMode, setVideoPlaygroundMode] = useState(false);

  const activeCourse = useMemo(() => {
    return courses.find(c => c.id === activeCourseId) || null;
  }, [courses, activeCourseId]);

  // Dynamic Document Title and Meta Description update
  useEffect(() => {
    if (activeCourse) {
      document.title = `1% Developer Academy — ${activeCourse.title}`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `${activeCourse.description} Series by ${activeCourse.author}. Complete notes, code, and video.`);
      }
    } else {
      document.title = '1% Developer Academy';
    }
  }, [activeCourse]);

  const totalParts = modules.reduce((s, m) => s + m.notes.length, 0);
  const completedCount = completedParts.length;
  const progressPct = totalParts > 0 ? Math.round((completedCount / totalParts) * 100) : 0;

  // Sync URL search params
  const updateURL = useCallback((courseId: string | null, part: number | null) => {
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
    const search = params.toString();
    const newPath = search ? `?${search}` : window.location.pathname;
    window.history.pushState(null, '', newPath);
  }, []);

  // Handle course selection
  const handleSelectCourse = useCallback(async (courseId: string, shouldUpdateURL = true) => {
    setActiveCourseId(courseId);
    localStorage.setItem('opd_active_course', courseId);
    setBooting(true);

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

      // Determine initial part
      const allPartsMeta = mods.flatMap(m => m.notes);
      let initialPart = allPartsMeta[0]?.part || 1;
      if (savedPart) {
        const parsed = parseFloat(savedPart);
        if (allPartsMeta.some(p => p.part === parsed)) {
          initialPart = parsed;
        }
      }
      setCurrentPart(initialPart);
      setNoteData(null); // Reset note details when changing courses
      setView('landing');
      if (shouldUpdateURL) {
        updateURL(courseId, null);
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
    updateURL(null, null);
  }, [updateURL]);

  const selectPart = useCallback(async (part: number, tab: 'notes' | 'files' = 'notes', shouldUpdateURL = true) => {
    if (!activeCourseId) return;
    setCurrentPart(part);
    setActiveTab(tab);
    setView('reader');
    setNoteLoading(true);
    localStorage.setItem(`opd_last_part_${activeCourseId}`, String(part));
    if (shouldUpdateURL) {
      updateURL(activeCourseId, part);
    }
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
    setView('dashboard');
    setNoteData(null);
    updateURL(null, null);
  }, [updateURL]);

  useEffect(() => {

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
              setNoteData(null);
              setView('dashboard');
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

  // popstate event listener for browser navigation sync
  useEffect(() => {
    const handlePopState = async () => {
      const params = new URLSearchParams(window.location.search);
      const courseParam = params.get('course');
      const partParam = params.get('part');

      if (courseParam) {
        if (courseParam !== activeCourseId) {
          // Changed course
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
              setNoteData(null);
              setView('landing');
            }
          } catch (err) {
            console.error(err);
          } finally {
            setBooting(false);
          }
        } else {
          // Same course, different view/part
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
        // No course, go back to pathways selection
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
  }, [activeCourseId, completedParts]);

  const handleToggleBookmark = useCallback(async (part: number) => {
    if (!activeCourseId) return;
    const isPinned = bookmarkedParts.includes(part);
    setBookmarkedParts(prev => isPinned ? prev.filter(p => p !== part) : [...prev, part]);
    await toggleBookmark(activeCourseId, part, !isPinned);
  }, [activeCourseId, bookmarkedParts]);



  const handleLaunch = () => {
    if (noteData) setView('reader');
    else selectPart(currentPart);
  };

  // Keyboard shortcuts
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
      if (e.key === 'v' && view === 'reader') {
        setVideoPlaygroundMode(prev => !prev);
        setNotesExpanded(false);
      }
      if (e.key === 'b' && view === 'reader') handleToggleBookmark(currentPart);
      if (e.key === 'c' && view === 'reader') handleToggleComplete(currentPart);
      if (e.key === 'Escape') {
        if (view === 'reader' && !showShortcuts) handleGoHome();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, currentPart, showShortcuts, handleToggleBookmark, handleToggleComplete, notesExpanded]);

  const allParts: PartMeta[] = modules.flatMap(m => m.notes);
  const currentIdx = allParts.findIndex(p => p.part === currentPart);

  if (authLoading) {
    return (
      <div className="boot-screen">
        <div className="loader" />
        <p className="boot-text">AUTHENTICATING...</p>
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
              if (mod === 'course_python') {
                const course = courses.find(c => c.id.includes('python'));
                if (course) handleSelectCourse(course.id, true);
              } else if (mod === 'course_cloud') {
                const course = courses.find(c => c.id.includes('cloud'));
                if (course) handleSelectCourse(course.id, true);
              } else if (mod === 'typing') {
                setView('typing');
                setActiveCourseId(null);
                updateURL(null, null);
              } else if (mod === 'aptitude') {
                setView('aptitude');
                setActiveCourseId(null);
                updateURL(null, null);
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

  if (view === 'aptitude') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 0 }}>
        <ErrorBoundary name="Aptitude Tests">
          <AptitudeView onBack={() => setView('dashboard')} />
        </ErrorBoundary>
      </div>
    );
  }

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="loader" />
      </div>
    );
  }

  return (
    <ErrorBoundary name="Course Reader">
    <>
      <div className={`app-shell ${view === 'landing' ? 'landing-view' : ''} ${!sidebarOpen && view === 'reader' ? 'sidebar-collapsed' : ''} ${!activeCourseId ? 'no-active-course' : ''}`}>
        {/* Header */}
        <header className="header">
          <div className="header-left">
            {/* Left panel (Video & Playground) toggle — only in reader */}
            {view === 'reader' && (
              <button
                className={`icon-btn left-panel-toggle-btn${notesExpanded ? ' active' : ''}`}
                title={notesExpanded ? 'Show Video & Playground' : 'Hide Video & Playground'}
                onClick={() => setNotesExpanded(prev => !prev)}
              >
                {notesExpanded ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <polyline points="12 9 15 12 12 15"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <polyline points="6 9 3 12 6 15"/>
                  </svg>
                )}
              </button>
            )}

            <div className="header-logo" onClick={handleChangeCourse} style={{ cursor: 'pointer' }}>
              <span className="logo-badge">1%</span>
              <span className="logo-name">Dev Academy</span>
            </div>

            {activeCourseId && (
              <nav className="breadcrumb">
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-link" onClick={handleChangeCourse}>Academy</span>
                {view === 'reader' && noteData ? (
                  <>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-link" onClick={handleGoHome}>{activeCourse?.title || 'Course'}</span>
                    <span className="breadcrumb-sep">/</span>
                    <span>{noteData.module}</span>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-active">Part {noteData.part}</span>
                  </>
                ) : activeCourse ? (
                  <>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-active">{activeCourse?.title}</span>
                  </>
                ) : null}
              </nav>
            )}
          </div>

          <div className="header-right">
            {view === 'reader' && activeCourseId && (
              <>
                <button
                  className={`icon-btn${completedParts.includes(currentPart) ? ' active' : ''}`}
                  title={`${completedParts.includes(currentPart) ? 'Mark Incomplete' : 'Mark Complete'} [c]`}
                  onClick={() => handleToggleComplete(currentPart)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
                <button
                  className={`icon-btn${bookmarkedParts.includes(currentPart) ? ' active' : ''}`}
                  title="Bookmark [b]"
                  onClick={() => handleToggleBookmark(currentPart)}
                >
                  <svg viewBox="0 0 24 24" fill={bookmarkedParts.includes(currentPart) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
                <button
                  className={`icon-btn${sidebarOpen ? ' active' : ''}`}
                  title={sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
                  onClick={() => setSidebarOpen(o => !o)}
                >
                  {sidebarOpen ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="15" y1="3" x2="15" y2="21"/>
                      <polyline points="18 9 21 12 18 15"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="15" y1="3" x2="15" y2="21"/>
                      <polyline points="12 9 9 12 12 15"/>
                    </svg>
                  )}
                </button>
                <button
                  className={`icon-btn${videoPlaygroundMode ? ' active' : ''}`}
                  title={videoPlaygroundMode ? 'Show Notes' : 'Split Video & Playground [v]'}
                  onClick={() => {
                    setVideoPlaygroundMode(prev => !prev);
                    if (notesExpanded) setNotesExpanded(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="3" x2="12" y2="21" />
                    <polygon points="7 9 10 12 7 15" fill="currentColor" />
                    <path d="M15 8l2 2-2 2" />
                    <line x1="15" y1="14" x2="19" y2="14" />
                  </svg>
                </button>
              </>
            )}

            {/* Home button — always visible in reader/landing view */}
            {(view === 'reader' || view === 'landing') && (
              <button
                className="icon-btn"
                title="Go to Dashboard [Esc]"
                onClick={handleGoHome}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </button>
            )}

            <button
              className="icon-btn"
              title="Keyboard Shortcuts [?]"
              onClick={() => setShowShortcuts(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Sidebar - only render if course selected */}
        {activeCourseId && (
          <Sidebar
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
          />
        )}

        {/* Main */}
        <main className="main">
          {view === 'landing' ? (
            <Landing
              courses={courses}
              activeCourseId={activeCourseId}
              onSelectCourse={handleSelectCourse}
              onChangeCourse={handleChangeCourse}
              modules={modules}
              completedParts={completedParts}
              progressPct={progressPct}
              completedCount={completedCount}
              totalParts={totalParts}
              booting={booting}
              onLaunch={handleLaunch}
              onSelectPart={selectPart}
            />
          ) : (
            <Reader
              noteData={noteData}
              loading={noteLoading}
              activeTab={activeTab}
              isCompleted={completedParts.includes(currentPart)}
              isBookmarked={bookmarkedParts.includes(currentPart)}
              currentIdx={currentIdx}
              totalCount={allParts.length}
              notesExpanded={notesExpanded}
              onToggleExpand={() => {
                setNotesExpanded(e => !e);
                setVideoPlaygroundMode(false);
              }}
              onTabChange={setActiveTab}
              onToggleComplete={() => handleToggleComplete(currentPart)}
              onPrev={currentIdx > 0 ? () => selectPart(allParts[currentIdx - 1].part) : undefined}
              onNext={currentIdx < allParts.length - 1 ? () => selectPart(allParts[currentIdx + 1].part) : undefined}
              videoPlaygroundMode={videoPlaygroundMode}
              onToggleVideoPlayground={() => {
                setVideoPlaygroundMode(prev => !prev);
                setNotesExpanded(false);
              }}
              onShowShortcuts={() => setShowShortcuts(true)}
              courseId={activeCourseId!}
            />
          )}
        </main>
      </div>

      {/* Shortcuts modal */}
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
    </ErrorBoundary>
  );
}
