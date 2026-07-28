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
import { TypingView } from './TypingView';
import { AptitudeView } from './AptitudeView';
import { ErrorBoundary } from './ErrorBoundary';
import { TaskHub } from './TaskHub';

type View = 'login' | 'dashboard' | 'landing' | 'reader' | 'typing' | 'aptitude' | 'taskhub';

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
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const activeCourse = useMemo(() => {
    return courses.find(c => c.id === activeCourseId) || null;
  }, [courses, activeCourseId]);

  // Dynamic Document Title and Meta Description update
  useEffect(() => {
    if (activeCourse) {
      document.title = `1% Dev Academy — ${activeCourse.title}`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `${activeCourse.description} Series by ${activeCourse.author}. Complete notes, code, and video.`);
      }
    } else {
      document.title = '1% Dev Academy';
    }
  }, [activeCourse]);

  const totalParts = modules.reduce((s, m) => s + m.notes.length, 0);
  const completedCount = completedParts.length;
  const progressPct = totalParts > 0 ? Math.round((completedCount / totalParts) * 100) : 0;

  // Sync URL search params
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
    // Log activity + update heartbeat
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

  // ── Periodic heartbeat: keeps online status fresh & tracks current lesson ──
  useEffect(() => {
    if (!user) return;
    // Log login event once per session
    logActivity('login');
    // Send heartbeat every 60 seconds
    const hb = setInterval(() => {
      sendHeartbeat(
        activeCourseId || undefined,
        view === 'reader' ? currentPart : undefined,
      );
    }, 60000);
    // Immediate heartbeat on mount
    sendHeartbeat(activeCourseId || undefined, view === 'reader' ? currentPart : undefined);
    return () => clearInterval(hb);
  }, [user]); // only on login change — avoids re-registering on every render

  useEffect(() => {
    // Wait for Firebase to resolve the persisted session before booting.
    // Without this guard, the boot effect can complete with user=null during
    // the async gap before onAuthStateChanged fires, causing a login flash.
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
    if (!isDone) logActivity('lesson_complete', activeCourseId, part);
    else logActivity('progress_marked', activeCourseId, part);
  }, [activeCourseId, completedParts]);

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

    const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const notesHtml = escapeHtml(noteData.notes).replace(/\n/g, '<br/>');

    const EXPORT_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>__TITLE__ | __COURSE__</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Jim+Nightshade&family=Playwrite+NZ+Guides&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@500;700&display=swap');
      
      :root {
        color-scheme: light;
        --ink: #000000;
        --muted: #222222;
        --line: #000000;
        --surface: #ffffff;
        --accent: #f5b82e;
        --shadow: 4px 4px 0px #000000;
        --shadow-sm: 2px 2px 0px #000000;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
        color: var(--ink);
        background: #ffffff;
        line-height: 1.6;
        font-size: 16px;
        font-weight: 500;
      }

      @page { 
        size: A4; 
        margin: 15mm 15mm 18mm; 
      }

      .export-page {
        max-width: 980px;
        margin: 0 auto;
        padding: 20px 24px 36px;
      }

      /* Newspaper Style Top Masthead Banner */
      .newspaper-masthead {
        text-align: center;
        padding: 16px 0 12px;
        margin-bottom: 28px;
        border-top: 4px solid var(--line);
        border-bottom: 4px double var(--line);
        background: #ffffff;
      }

      .newspaper-top-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 8px;
      }

      .brand-title-group {
        display: inline-flex;
        align-items: center;
        gap: 12px;
      }

      .brand-badge {
        background-color: var(--accent);
        color: var(--ink);
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 0.9rem;
        padding: 3px 8px;
        border: 2px solid var(--line);
        box-shadow: var(--shadow-sm);
        line-height: 1;
      }

      .brand-name {
        font-family: 'Tapestry', cursive;
        font-size: 3rem;
        font-weight: 400;
        letter-spacing: 0.02em;
        line-height: 1;
        color: var(--ink);
      }

      .brand-tagline {
        font-family: 'Playwrite NZ Guides', cursive;
        color: #222222;
        font-size: 1.05rem;
        line-height: 1.8;
        margin-top: 6px;
      }

      .newspaper-dateline {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        padding: 4px 12px;
        margin-top: 12px;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .export-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        padding-bottom: 20px;
        margin-bottom: 24px;
        border-bottom: 3px solid var(--line);
      }

      .export-header h1 {
        margin: 0 0 6px;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        text-transform: uppercase;
      }

      .export-header p {
        margin: 0;
        color: var(--muted);
        font-size: 0.95rem;
        font-weight: 700;
      }

      .export-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border: 2px solid var(--line);
        box-shadow: var(--shadow-sm);
        background: #ffffff;
        color: var(--ink);
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
      }

      .export-hero {
        background: #ffffff;
        color: var(--ink);
        border: 3px solid var(--line);
        border-radius: 0;
        padding: 32px 36px;
        margin-bottom: 24px;
        box-shadow: var(--shadow);
      }

      .export-hero .eyebrow {
        display: inline-block;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.8rem;
        font-weight: 700;
        background: #ffffff;
        color: var(--ink);
        padding: 4px 8px;
        border: 2px solid var(--line);
        box-shadow: var(--shadow-sm);
      }

      .export-hero h1 {
        margin: 0 0 16px;
        font-size: 2.2rem;
        line-height: 1.1;
        letter-spacing: -0.03em;
        text-transform: uppercase;
      }

      .export-hero .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        color: var(--ink);
        font-size: 0.95rem;
        font-weight: 700;
      }

      .export-hero .hero-meta span {
        padding: 6px 10px;
        border: 2px solid var(--line);
        background: #ffffff;
        box-shadow: var(--shadow-sm);
      }

      .export-toc {
        border: 3px solid var(--line);
        border-radius: 0;
        padding: 20px 22px;
        background: #ffffff;
        margin-bottom: 24px;
        box-shadow: var(--shadow);
      }

      .export-toc h2, .export-h2 {
        margin: 0 0 12px;
        font-size: 1.15rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: -0.01em;
      }

      .export-toc ol {
        margin: 0;
        padding-left: 20px;
        color: var(--ink);
        font-weight: 700;
      }

      .export-toc li { margin: 6px 0; }
      .export-toc a { color: var(--ink); text-decoration: none; border-bottom: 2px solid var(--ink); }
      .export-toc a:hover { background: var(--ink); color: #ffffff; }

      .export-block { margin-bottom: 20px; }

      .export-h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 1.8rem 0 0.75rem;
        text-transform: uppercase;
      }

      .export-h2 {
        font-size: 1.25rem;
        margin: 1.8rem 0 0.75rem;
        padding-bottom: 0;
        border-bottom: none;
        text-transform: uppercase;
        background: none;
        padding-left: 0;
        border-left: none;
      }

      .export-h3 {
        font-size: 1.1rem;
        margin: 1.25rem 0 0.45rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      .export-paragraph {
        margin: 0 0 1rem;
        font-size: 1rem;
        color: var(--ink);
      }

      .first-lead::first-letter {
        font-family: var(--font-brand);
        font-size: 3.4rem;
        float: left;
        line-height: 0.75;
        padding-right: 8px;
        padding-top: 2px;
        color: var(--ink);
      }

      .export-list { padding-left: 1.5rem; margin: 0 0 1rem; list-style-type: square; }
      .export-list li { margin-bottom: 0.5rem; font-weight: 500; }

      .export-callout { padding: 1rem 1.2rem; border-radius: 0; border: 3px solid var(--line); border-left: 8px solid var(--line); background: #ffffff; box-shadow: var(--shadow); margin: 1.5rem 0; }
      .export-callout-header { display:flex; align-items:center; gap:8px; font-weight:700; margin-bottom:0.45rem; text-transform:uppercase; font-size:1.05rem }
      .export-callout-icon { font-size:1.1rem }
      .export-callout-body { color:var(--ink); font-weight:500 }

      .export-inline-code { display:inline-block; padding:0px 6px; margin:0 2px; border:1.5px solid var(--line); background:#f4f4f4; font-family:'JetBrains Mono',monospace; font-size:0.88em; font-weight:700; line-height:1.4; vertical-align:middle }

      .export-code-shell { border-radius:0; overflow:hidden; border:3px solid var(--line); background:#ffffff; box-shadow:var(--shadow); margin:1.5rem 0 }
      .export-code-toolbar { display:flex; justify-content:space-between; align-items:center; padding:8px 14px; background:#fff; border-bottom:3px solid var(--line); color:var(--ink); font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em }
      .export-code-block { margin:0; padding:14px; font-family:'JetBrains Mono',monospace; font-size:0.9rem; color:var(--ink); white-space:pre-wrap; word-break:break-all; font-weight:700; background:#fff }

      .export-table-wrap { overflow:hidden; border:3px solid var(--line); box-shadow:var(--shadow); margin:1.5rem 0 }
      .export-table { width:100%; border-collapse:collapse; font-size:0.94rem; background:#fff }
      .export-table th { background:#fff; border-bottom:3px solid var(--line); text-align:left; padding:12px 14px; font-weight:700; text-transform:uppercase; letter-spacing:0.03em }
      .export-table td { padding:12px 14px; border-top:2px solid var(--line); font-weight:500 }

      .export-footer { margin-top:36px; padding-top:16px; border-top:3px solid var(--line); display:flex; justify-content:space-between; align-items:center; color:var(--ink); font-size:0.86rem; font-weight:700 }

      @media print {
        body { background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .export-page { padding: 0; max-width: 100%; }
        .newspaper-masthead, .export-block, .export-toc, .export-hero, .export-code-shell, .export-table-wrap, .export-callout { break-inside: avoid; page-break-inside: avoid }
      }
    </style>
  </head>
  <body>
    <div class="export-page">
      <!-- Upgraded Newspaper Style Header Banner -->
      <div class="newspaper-masthead">
        <div class="newspaper-top-bar">
          <div class="brand-title-group">
            <span class="brand-badge">1%</span>
            <span class="brand-name">Dev Academy</span>
          </div>
        </div>
        <div class="brand-tagline">Your learning. Your streak. Your momentum — every single day.</div>
        <div class="newspaper-dateline">
          <span>Vol. 1 • No. 101</span>
          <span>Daily SQL Discipline</span>
          <span>Data Analytics Edition</span>
        </div>
      </div>

      <header class="export-header">
        <div>
          <div class="export-badge">__COURSE__</div>
          <h1>__TITLE__</h1>
          <p>__MODULE__ • Part ${noteData.part} • ${escapeHtml(noteData.importance || '')}</p>
        </div>
        <div style="text-align:right;">
          <p><strong>Generated:</strong> __GENERATED__</p>
          <p><strong>Version:</strong> 1.0</p>
        </div>
      </header>

      <section class="export-hero">
        <div class="eyebrow">Premium lesson export</div>
        <h1>__TITLE__</h1>
        <div class="hero-meta">
          <span>Course: __COURSE__</span>
          <span>Module: __MODULE__</span>
          <span>Part ${noteData.part}</span>
          <span>Reading time: ${Math.max(1, Math.round((noteData.notes || '').split(/\s+/).length / 200))} min</span>
          <span>Difficulty: ${escapeHtml(noteData.difficulty || noteData.importance || '')}</span>
        </div>
      </section>

      <section class="export-toc">
        <h2 class="export-h2">Table of Contents</h2>
        <ol>
          <li class="toc-level-1"><a href="#${encodeURIComponent(noteData.title)}">__TITLE__</a></li>
          <li class="toc-level-2"><a href="#1.%20What%20is%20it%3F">1. What is it?</a></li>
          <li class="toc-level-2"><a href="#2.%20Definition">2. Definition</a></li>
          <li class="toc-level-2"><a href="#3.%20Why%20do%20we%20need%20it%3F">3. Why do we need it?</a></li>
          <li class="toc-level-2"><a href="#4.%20Real-world%20Analogy">4. Real-world Analogy</a></li>
          <li class="toc-level-2"><a href="#5.%20Mental%20Model">5. Mental Model</a></li>
          <li class="toc-level-2"><a href="#6.%20Basic%20Syntax">6. Basic Syntax</a></li>
          <li class="toc-level-2"><a href="#7.%20Anatomy%20of%20the%20Statement">7. Anatomy of the Statement</a></li>
        </ol>
      </section>

      <!-- lesson content -->
      <div class="export-block">__NOTES__</div>

      <footer class="export-footer">
        <span><strong>__COURSE__</strong> • __MODULE__</span>
        <span>Generated __GENERATED__ • 1% Dev Academy</span>
      </footer>
    </div>
  </body>
</html>`;

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
      // Serve HTML as a .docx container (simple approach)
      downloadFile(`${filename}.docx`, fullHtml, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8');
    } else {
      // PDF/print: open printable HTML
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

  if (authLoading) {
    return (
      <div className="boot-screen" role="status" aria-label="Authenticating">
        <div className="boot-logo"><span aria-hidden="true">1%</span> Dev Academy</div>
        <div className="loader" aria-hidden="true" />
        <p className="boot-text">Authenticating...</p>
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
      {/* Skip to main content — keyboard/screen reader navigation */}
      <a href="#main-content" className="skip-to-main">Skip to main content</a>
      <div className={`app-shell ${(view as string) === 'landing' ? 'landing-view' : ''} ${!sidebarOpen && view === 'reader' ? 'sidebar-collapsed' : ''} ${sidebarOpen && view === 'reader' ? 'mobile-sidebar-open' : ''} ${!activeCourseId ? 'no-active-course' : ''}`}>
        {/* Header */}
        <header className="header" role="banner">
          <div className="header-left">
            {/* Sidebar toggle — only visible in reader (left side now) */}
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

            <div className="header-logo" onClick={handleChangeCourse} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label="Go to course selection" onKeyDown={e => e.key === 'Enter' && handleChangeCourse()}>
              <span className="logo-badge" aria-hidden="true">1%</span>
              <span className="logo-name">Dev Academy</span>
            </div>

            {activeCourseId && (
              <nav className="breadcrumb" aria-label="Page breadcrumb">
                <span className="breadcrumb-sep" aria-hidden="true">/</span>
                <span className="breadcrumb-link" onClick={handleChangeCourse} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleChangeCourse()}>Academy</span>
                {view === 'reader' && noteData ? (
                  <>
                    <span className="breadcrumb-sep" aria-hidden="true">/</span>
                    <span className="breadcrumb-link" onClick={handleGoHome} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleGoHome()}>{activeCourse?.title || 'Course'}</span>
                    <span className="breadcrumb-sep" aria-hidden="true">/</span>
                    <span aria-hidden="true">{noteData.module}</span>
                    <span className="breadcrumb-sep" aria-hidden="true">/</span>
                    <span className="breadcrumb-active" aria-current="page">Part {noteData.part}</span>
                  </>
                ) : activeCourse ? (
                  <>
                    <span className="breadcrumb-sep" aria-hidden="true">/</span>
                    <span className="breadcrumb-active" aria-current="page">{activeCourse?.title}</span>
                  </>
                ) : null}
              </nav>
            )}
          </div>

          <div className="header-right" role="toolbar" aria-label="Reader actions">
            {view === 'reader' && activeCourseId && (
              <>
                    {/* Mark Complete */}
                <button
                  className={`icon-btn${completedParts.includes(currentPart) ? ' active' : ''}`}
                  title={`${completedParts.includes(currentPart) ? 'Mark Incomplete' : 'Mark Complete'} [c]`}
                  aria-label={completedParts.includes(currentPart) ? 'Mark part incomplete' : 'Mark part complete'}
                  aria-pressed={completedParts.includes(currentPart)}
                  onClick={() => handleToggleComplete(currentPart)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>

                {/* Bookmark */}
                <button
                  className={`icon-btn${bookmarkedParts.includes(currentPart) ? ' active' : ''}`}
                  title="Bookmark [b]"
                  aria-label={bookmarkedParts.includes(currentPart) ? 'Remove bookmark' : 'Bookmark this part'}
                  aria-pressed={bookmarkedParts.includes(currentPart)}
                  onClick={() => handleToggleBookmark(currentPart)}
                >
                  <svg viewBox="0 0 24 24" fill={bookmarkedParts.includes(currentPart) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              </>
            )}

            {/* Download menu — only on reader view */}
            {view === 'reader' && activeCourseId && noteData && (
              <div className="download-dropdown" ref={downloadMenuRef}>
                <button
                  className="download-icon-btn"
                  title="Download lesson notes"
                  aria-label="Open download menu"
                  onClick={() => setDownloadMenuOpen(o => !o)}
                  aria-expanded={downloadMenuOpen}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span className="download-caret">▾</span>
                </button>
                {downloadMenuOpen && (
                  <div className="download-menu" role="menu" aria-label="Download options">
                    <div className="download-menu-header">Export</div>
                    <button className="download-menu-item" onClick={() => handleDownloadLesson('pdf')} type="button">
                      <div className="download-menu-item-main">
                        <strong>Print / PDF</strong>
                        <small>Open printable version or save as PDF</small>
                      </div>
                      <span className="download-menu-ext">PDF</span>
                    </button>
                    <button className="download-menu-item" onClick={() => handleDownloadLesson('markdown')} type="button">
                      <div className="download-menu-item-main">
                        <strong>Markdown</strong>
                        <small>Download lesson notes as .md</small>
                      </div>
                      <span className="download-menu-ext">MD</span>
                    </button>
                    <button className="download-menu-item" onClick={() => handleDownloadLesson('docx')} type="button">
                      <div className="download-menu-item-main">
                        <strong>Word Document</strong>
                        <small>Download lesson notes as .docx</small>
                      </div>
                      <span className="download-menu-ext">DOCX</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Home button — always visible in reader/landing view */}
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

        {/* Sidebar - LEFT side, only render when course is selected */}
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
          />
        )}

        {/* Main content */}
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
          ) : (
            <Reader
              noteData={noteData}
              loading={noteLoading}
              activeTab={activeTab}
              isCompleted={completedParts.includes(currentPart)}
              isBookmarked={bookmarkedParts.includes(currentPart)}
              currentIdx={currentIdx}
              totalCount={allParts.length}
              onTabChange={setActiveTab}
              onToggleComplete={() => handleToggleComplete(currentPart)}
              onPrev={currentIdx > 0 ? () => selectPart(allParts[currentIdx - 1].part) : undefined}
              onNext={currentIdx < allParts.length - 1 ? () => selectPart(allParts[currentIdx + 1].part) : undefined}
              onShowShortcuts={() => setShowShortcuts(true)}
              courseId={activeCourseId!}
            />
          )}
        </main>
      </div>

      {/* Mobile sidebar overlay — close when clicking outside */}
      {sidebarOpen && view === 'reader' && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Shortcuts modal */}
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
    </ErrorBoundary>
  );
}
