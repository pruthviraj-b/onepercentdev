'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchModules, fetchNote, fetchProgress, fetchBookmarks,
  toggleProgress, toggleBookmark,
  Module, PartMeta, NoteData,
} from '@/lib/api';
import { Sidebar } from './Sidebar';
import { Reader } from './Reader';
import { Landing } from './Landing';
import { ShortcutsModal } from './ShortcutsModal';

type View = 'landing' | 'reader';

export function Academy() {
  const [view, setView] = useState<View>('landing');
  const [modules, setModules] = useState<Module[]>([]);
  const [completedParts, setCompletedParts] = useState<number[]>([]);
  const [bookmarkedParts, setBookmarkedParts] = useState<number[]>([]);
  const [currentPart, setCurrentPart] = useState<number>(2);
  const [noteData, setNoteData] = useState<NoteData | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'files'>('notes');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [booting, setBooting] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [videoPlaygroundMode, setVideoPlaygroundMode] = useState(false);

  const totalParts = modules.reduce((s, m) => s + m.notes.length, 0);
  const completedCount = completedParts.length;
  const progressPct = totalParts > 0 ? Math.round((completedCount / totalParts) * 100) : 0;

  // Bootstrap
  useEffect(() => {
    const savedTheme = localStorage.getItem('opd_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    const savedPart = localStorage.getItem('opd_last_part');
    if (savedPart) setCurrentPart(parseInt(savedPart, 10));

    Promise.all([fetchModules(), fetchProgress(), fetchBookmarks()])
      .then(([mods, prog, bkm]) => {
        setModules(mods);
        setCompletedParts(prog);
        setBookmarkedParts(bkm);
      })
      .catch(console.error)
      .finally(() => setBooting(false));
  }, []);

  const selectPart = useCallback(async (part: number, tab: 'notes' | 'files' = 'notes') => {
    setCurrentPart(part);
    setActiveTab(tab);
    setView('reader');
    setNoteLoading(true);
    localStorage.setItem('opd_last_part', String(part));
    try {
      const data = await fetchNote(part);
      setNoteData(data);
    } catch {
      setNoteData(null);
    } finally {
      setNoteLoading(false);
    }
  }, []);

  const handleToggleComplete = useCallback(async (part: number) => {
    const isDone = completedParts.includes(part);
    setCompletedParts(prev => isDone ? prev.filter(p => p !== part) : [...prev, part]);
    await toggleProgress(part, !isDone);
  }, [completedParts]);

  const handleToggleBookmark = useCallback(async (part: number) => {
    const isPinned = bookmarkedParts.includes(part);
    setBookmarkedParts(prev => isPinned ? prev.filter(p => p !== part) : [...prev, part]);
    await toggleBookmark(part, !isPinned);
  }, [bookmarkedParts]);

  const handleToggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('opd_theme', next);
  }, [theme]);

  const handleGoHome = () => setView('landing');

  const handleLaunch = () => {
    if (noteData) setView('reader');
    else selectPart(currentPart || 2);
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
        if (view === 'reader') handleGoHome();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, currentPart, showShortcuts, handleToggleBookmark, handleToggleComplete, notesExpanded]);

  const allParts: PartMeta[] = modules.flatMap(m => m.notes);
  const currentIdx = allParts.findIndex(p => p.part === currentPart);

  const noteModule = noteData
    ? modules.find(m => m.id === noteData.module_id)
    : null;

  return (
    <>
      <div className={`app-shell ${view === 'landing' ? 'landing-view' : ''} ${!sidebarOpen && view === 'reader' ? 'sidebar-collapsed' : ''}`}>
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

            <div className="header-logo" onClick={handleGoHome}>
              <span className="logo-badge">1%</span>
              <span className="logo-name">Developer Academy</span>
            </div>

            {view === 'reader' && noteData && (
              <nav className="breadcrumb">
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-link" onClick={handleGoHome}>Academy</span>
                <span className="breadcrumb-sep">/</span>
                <span>{noteData.module}</span>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-active">Part {noteData.part}</span>
              </nav>
            )}
          </div>

          <div className="header-right">
            {view === 'reader' && (
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

        {/* Sidebar */}
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

        {/* Main */}
        <main className="main">
          {view === 'landing' ? (
            <Landing
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
            />
          )}
        </main>
      </div>

      {/* Shortcuts modal */}
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}
