'use client';

import { memo, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { NoteData, Module } from '@/services/courseService';
import { getVideoIds } from '@/features/video/videos';
import MarkdownRenderer from './MarkdownRenderer';
import { fetchVideoTimestamp, saveVideoTimestamp } from '@/services/courseService';
import { C, CLight, F, R, S, T, L, FS, FONT_IMPORT, CalloutVariant, CALLOUT_MAP } from '@/shared/theme/theme';
import LessonAIMentor from './LessonAIMentor';

const InteractiveBlueprint = dynamic(
  () => import('@/components/lesson/InteractiveBlueprint').then(m => m.InteractiveBlueprint),
  { ssr: false },
);

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type ReaderMode = 'read' | 'watch' | 'blueprint';
type ReaderTheme = 'dark' | 'light';
type ContentWidth = 'narrow' | 'normal' | 'wide';

type ReaderPrefs = {
  fontScale: number;
  lineHeight: number;
  width: ContentWidth;
  theme: ReaderTheme;
};

type HighlightColor = 'yellow' | 'purple' | 'blue' | 'pink' | 'green';
type ReaderHighlight = { id: string; start: number; end: number; color: HighlightColor };

const HIGHLIGHT_COLORS: Array<{ id: HighlightColor; label: string; value: string }> = [
  { id: 'yellow', label: 'Yellow', value: '#facc15' },
  { id: 'purple', label: 'Purple', value: '#c4b5fd' },
  { id: 'blue', label: 'Blue', value: '#93c5fd' },
  { id: 'pink', label: 'Pink', value: '#f9a8d4' },
  { id: 'green', label: 'Green', value: '#86efac' },
];

const PREFS_KEY = 'ds_reader_prefs';
const SCROLL_KEY = 'ds_reader_scroll_positions';
const BOOKMARKS_KEY = 'ds_reader_bookmarks';
const DEFAULT_PREFS: ReaderPrefs = { fontScale: 1, lineHeight: 1.7, width: 'normal', theme: 'light' };
const WIDTH_MAP: Record<ContentWidth, number> = { narrow: 640, normal: 760, wide: 920 };

function highlightsKey(courseId: string, part: number) { return `ds_reader_highlights_${courseId}_${part}`; }
function loadHighlights(courseId: string, part?: number): ReaderHighlight[] {
  if (!part) return [];
  try {
    const raw = localStorage.getItem(highlightsKey(courseId, part));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveHighlights(courseId: string, part: number, highlights: ReaderHighlight[]) {
  try { localStorage.setItem(highlightsKey(courseId, part), JSON.stringify(highlights)); } catch { }
}

function loadPrefs(): ReaderPrefs {
  try { const raw = localStorage.getItem(PREFS_KEY); return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw), theme: 'light' } : DEFAULT_PREFS; }
  catch { return DEFAULT_PREFS; }
}
function savePrefs(p: ReaderPrefs) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { } }
function loadScrollPosition(courseId: string, part?: number) {
  if (!part) return 0;
  try {
    const positions = JSON.parse(localStorage.getItem(SCROLL_KEY) || '{}');
    return Math.max(0, Number(positions[`${courseId}:${part}`]) || 0);
  } catch { return 0; }
}
function saveScrollPosition(courseId: string, part: number, top: number) {
  try {
    const positions = JSON.parse(localStorage.getItem(SCROLL_KEY) || '{}');
    positions[`${courseId}:${part}`] = Math.max(0, Math.round(top));
    localStorage.setItem(SCROLL_KEY, JSON.stringify(positions));
  } catch { }
}
function loadBookmarks(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw.filter((value): value is string => typeof value === 'string') : []);
  } catch { return new Set(); }
}
function saveBookmarks(bookmarks: Set<string>) {
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(bookmarks))); } catch { }
}
function unwrapReaderHighlights(root: HTMLElement) {
  root.querySelectorAll('span[data-reader-highlight]').forEach(span => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
  });
  root.normalize();
}

function textNodes(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  return nodes;
}

function textOffset(root: HTMLElement, target: Node, offset: number) {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(target, offset);
  return range.toString().length;
}

function paintReaderHighlights(root: HTMLElement, highlights: ReaderHighlight[]) {
  unwrapReaderHighlights(root);
  const colorMap = Object.fromEntries(HIGHLIGHT_COLORS.map(c => [c.id, c.value]));
  highlights.forEach(highlight => {
    textNodes(root).forEach(node => {
      const nodeStart = textOffset(root, node, 0);
      const nodeEnd = nodeStart + node.data.length;
      const start = Math.max(highlight.start, nodeStart);
      const end = Math.min(highlight.end, nodeEnd);
      if (start >= end) return;
      const from = start - nodeStart;
      const to = end - nodeStart;
      const range = document.createRange();
      range.setStart(node, from);
      range.setEnd(node, to);
      const mark = document.createElement('span');
      mark.dataset.readerHighlight = highlight.id;
      mark.style.backgroundColor = colorMap[highlight.color] || colorMap.yellow;
      mark.style.color = '#111827';
      mark.title = `${highlight.color} highlight — select it and use Erase to remove`;
      range.surroundContents(mark);
    });
  });
}

/* ─── Utilities ─────────────────────────────────────────────────────────────── */
const downloadFile = (filename: string, content: string, type = 'text/plain;charset=utf-8') => {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

/* ─── YouTube resumable ─────────────────────────────────────────────────────── */
const LS_VTS = 'ds_video_ts';
const getLocalTs = (cid: string, p: number) => { try { return parseFloat(localStorage.getItem(`${LS_VTS}_${cid}_${p}`) || '0') || 0; } catch { return 0; } };
const setLocalTs = (cid: string, p: number, t: number) => { try { localStorage.setItem(`${LS_VTS}_${cid}_${p}`, String(t)); } catch { } };
let ytApiPromise: Promise<void> | null = null;
function loadYTApi(): Promise<void> {
  if ((window as any).YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>(resolve => {
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(); };
    const tag = document.createElement('script'); tag.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(tag);
  });
  return ytApiPromise;
}

function YouTubeResumable({ videoId, courseId, part }: { videoId: string; courseId: string; part: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const backendTimerRef = useRef<any>(null);
  useEffect(() => {
    let dead = false;
    const localTs = getLocalTs(courseId, part);
    const boot = async () => {
      await loadYTApi();
      if (dead || !hostRef.current) return;
      const id = `yt-${courseId}-${part}-${Date.now()}`;
      const el = document.createElement('div'); el.id = id; hostRef.current!.appendChild(el);
      playerRef.current = new (window as any).YT.Player(id, {
        videoId, width: '100%', height: '100%',
        playerVars: { rel: 0, modestbranding: 1, color: 'white', start: Math.floor(localTs), enablejsapi: 1, origin: window.location.origin },
        events: {
          onReady: () => { fetchVideoTimestamp(courseId, part).then(s => { if (!dead && s > localTs + 5) { playerRef.current?.seekTo(s, true); setLocalTs(courseId, part, s); } }).catch(() => { }); },
          onStateChange: (ev: any) => {
            const YT = (window as any).YT;
            if (ev.data === YT.PlayerState.PLAYING) {
              timerRef.current = setInterval(() => { try { const t = playerRef.current?.getCurrentTime?.(); if (t > 0) setLocalTs(courseId, part, t); } catch { } }, 5000);
              backendTimerRef.current = setInterval(() => { try { const t = playerRef.current?.getCurrentTime?.(); if (t > 0) saveVideoTimestamp(courseId, part, t); } catch { } }, 30000);
            } else {
              clearInterval(timerRef.current); clearInterval(backendTimerRef.current);
              try { const t = playerRef.current?.getCurrentTime?.(); if (t > 0) { setLocalTs(courseId, part, t); saveVideoTimestamp(courseId, part, t); } } catch { }
            }
          },
        },
      });
    };
    boot();
    return () => { dead = true; clearInterval(timerRef.current); clearInterval(backendTimerRef.current); try { playerRef.current?.destroy?.(); } catch { } if (hostRef.current) hostRef.current.innerHTML = ''; };
  }, [videoId, courseId, part]);
  return <div ref={hostRef} className="rd-video-host" />;
}

const MultiVideoPlayer = memo(function MultiVideoPlayer({ videoIds, courseId, part, loading }: { videoIds: string[]; courseId: string; part: number; title: string; loading: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const pointerStartRef = useRef<number | null>(null);
  useEffect(() => { setActiveIdx(0); }, [part]);
  if (loading) return <div className="rd-skeleton" style={{ aspectRatio: '16/9' }} />;
  if (videoIds.length === 0) return <div className="rd-video-empty">Recording not published yet — check back soon.</div>;
  const safeIdx = Math.min(activeIdx, videoIds.length - 1);
  const selectVideo = (index: number) => setActiveIdx(Math.max(0, Math.min(videoIds.length - 1, index)));
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => { pointerStartRef.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); };
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => { if (pointerStartRef.current === null) return; const delta = event.clientX - pointerStartRef.current; if (Math.abs(delta) > 48) selectVideo(safeIdx + (delta < 0 ? 1 : -1)); pointerStartRef.current = null; event.currentTarget.releasePointerCapture?.(event.pointerId); };
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => { const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0; if (Math.abs(delta) < 24) return; event.preventDefault(); selectVideo(safeIdx + (delta > 0 ? 1 : -1)); };
  return (
    <div>
      {videoIds.length > 1 && (
        <div className="rd-video-tabs" role="tablist">
          {videoIds.map((_, i) => (
            <button key={i} role="tab" aria-selected={safeIdx === i} onClick={() => selectVideo(i)}
              className={`rd-video-tab${safeIdx === i ? ' active' : ''}`}>
              REEL {i + 1}
            </button>
          ))}
        </div>
      )}
      <div className="rd-slider-viewport" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onWheel={handleWheel} onKeyDown={event => { if (event.key === 'ArrowLeft') selectVideo(safeIdx - 1); if (event.key === 'ArrowRight') selectVideo(safeIdx + 1); }} tabIndex={0} role="region" aria-roledescription="carousel" aria-label={`Recording ${safeIdx + 1} of ${videoIds.length}`}>
        <button className="rd-slider-arrow prev" type="button" aria-label="Previous recording" disabled={safeIdx === 0} onClick={() => selectVideo(safeIdx - 1)}>←</button>
        <div className="rd-video-frame">
        <YouTubeResumable key={`${courseId}-${part}-${safeIdx}`} videoId={videoIds[safeIdx]} courseId={courseId} part={part} />
        </div>
        <button className="rd-slider-arrow next" type="button" aria-label="Next recording" disabled={safeIdx === videoIds.length - 1} onClick={() => selectVideo(safeIdx + 1)}>→</button>
      </div>
      {videoIds.length > 1 && <div className="rd-slider-meta"><span>Recording {safeIdx + 1} of {videoIds.length}</span><div className="rd-slider-dots" role="tablist" aria-label="Recording positions">{videoIds.map((_, i) => <button key={i} type="button" role="tab" aria-label={`Go to recording ${i + 1}`} aria-selected={safeIdx === i} className={safeIdx === i ? 'active' : ''} onClick={() => selectVideo(i)} />)}</div><span className="rd-slider-hint">Swipe or use ← →</span></div>}
    </div>
  );
});

/* ─── Callout (Neo-Brutalist Stamp Badge) ─────────────────────────────────── */
export function Callout({ variant, title, children }: { variant: CalloutVariant; title?: string; children: React.ReactNode }) {
  const meta = CALLOUT_MAP[variant];
  return (
    <div
      className="rd-callout"
      style={{ ['--ca' as any]: meta.accent, ['--ca-dim' as any]: meta.accentDim }}
      role="note"
      aria-label={meta.label}
    >
      <div className="rd-callout-stamp">{title || meta.label}</div>
      <div className="rd-callout-body">{children}</div>
    </div>
  );
}

/* ─── Reader Props ───────────────────────────────────────────────────────────── */
interface Props {
  noteData: NoteData | null;
  loading: boolean;
  activeTab: 'notes' | 'files';
  isCompleted: boolean;
  currentIdx: number;
  totalCount: number;
  onTabChange: (tab: 'notes' | 'files') => void;
  onToggleComplete: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onShowShortcuts: () => void;
  onGoHome: () => void;
  onSwitchCourse: () => void;
  courseId: string;
  modules: Module[];
  currentPart: number;
  completedParts: number[];
  bookmarkedParts: number[];
  onSelectPart: (part: number) => void;
}

function LessonNavigator({ modules, currentPart, completedParts, bookmarkedParts, onSelectPart, onNext, onClose }: Pick<Props, 'modules' | 'currentPart' | 'completedParts' | 'bookmarkedParts' | 'onSelectPart'> & { onNext?: () => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const normalized = query.trim().toLowerCase();
  const visibleModules = modules.map(module => ({ ...module, notes: module.notes.filter(note => !normalized || note.title.toLowerCase().includes(normalized)) })).filter(module => !normalized || module.notes.length > 0 || module.title.toLowerCase().includes(normalized));
  return <aside className="rd-lesson-nav" aria-label="Course lessons">
    <div className="rd-lesson-nav__top"><div><span className="rd-lesson-nav__eyebrow">COURSE PROGRESS</span><strong>{completedParts.length} / {modules.reduce((sum, module) => sum + module.notes.length, 0)} lessons</strong></div><span className="rd-lesson-nav__percent">{Math.round((completedParts.length / Math.max(1, modules.reduce((sum, module) => sum + module.notes.length, 0))) * 100)}%</span><button className="rd-panel-close" type="button" onClick={onClose} aria-label="Close lesson navigator" title="Close lesson navigator">‹</button></div>
    <div className="rd-lesson-nav__progress"><span style={{ width: `${(completedParts.length / Math.max(1, modules.reduce((sum, module) => sum + module.notes.length, 0))) * 100}%` }} /></div>
    <label className="rd-lesson-nav__search"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search lessons" aria-label="Search lessons" /></label>
    <div className="rd-lesson-nav__actions"><button type="button" onClick={() => setCollapsed(new Set(visibleModules.map(module => module.id)))}>Collapse all</button><button type="button" onClick={() => setCollapsed(new Set())}>Expand all</button></div>
    <div className="rd-lesson-nav__tree">{visibleModules.map(module => { const isCollapsed = collapsed.has(module.id); return <section key={module.id} className="rd-lesson-module"><button type="button" className="rd-lesson-module__header" onClick={() => setCollapsed(previous => { const next = new Set(previous); next.has(module.id) ? next.delete(module.id) : next.add(module.id); return next; })}><span className="rd-lesson-module__chevron">{isCollapsed ? '›' : '⌄'}</span><span><small>MODULE {module.id}</small><strong>{module.title}</strong></span></button>{!isCollapsed && <div className="rd-lesson-module__lessons">{module.notes.map(note => { const completed = completedParts.includes(note.part); const active = currentPart === note.part; const bookmarked = bookmarkedParts.includes(note.part); return <button type="button" title={note.title} key={note.part} className={`rd-lesson-item${active ? ' is-active' : ''}${completed ? ' is-complete' : ''}`} onClick={() => onSelectPart(note.part)}><span className={`rd-lesson-item__state${completed ? ' is-verified' : active ? ' is-current' : ''}`} aria-hidden="true">{completed ? '✓' : active ? '→' : ''}</span><span className="rd-lesson-item__title">{note.title.replace(/^Part\s+\d+(?:\.\d+)?\s*[-–—]?\s*/i, '')}</span>{bookmarked && <span className="rd-lesson-item__bookmark">★</span>}</button>; })}</div>}</section>; })}</div>
    {onNext && <button type="button" className="rd-lesson-nav__continue" onClick={onNext}>Continue learning <span>→</span></button>}
  </aside>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   NEO-BRUTALIST & MAXIMALIST READER
   ═══════════════════════════════════════════════════════════════════════════ */
export function Reader({
  noteData, loading, activeTab, isCompleted, currentIdx, totalCount,
  onTabChange, onToggleComplete, onPrev, onNext, onShowShortcuts, onGoHome, onSwitchCourse, courseId,
  modules, currentPart, completedParts, bookmarkedParts, onSelectPart,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [readingPct, setReadingPct] = useState(0);
  const [mode, setMode] = useState<ReaderMode>('read');
  const [focusMode, setFocusMode] = useState(false);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState('');
  const [tocQuery, setTocQuery] = useState('');
  const [tocCollapsed, setTocCollapsed] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_PREFS);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const [highlightColor, setHighlightColor] = useState<HighlightColor>('yellow');
  const [eraseHighlights, setEraseHighlights] = useState(false);
  const [highlights, setHighlights] = useState<ReaderHighlight[]>([]);
  const [lessonNavOpen, setLessonNavOpen] = useState(true);
  const [utilityOpen, setUtilityOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const readingPctRef = useRef(0);
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setBookmarks(loadBookmarks()); }, []);

  useEffect(() => {
    setHighlights(loadHighlights(courseId, noteData?.part));
    setEraseHighlights(false);
  }, [courseId, noteData?.part]);

  useEffect(() => {
    const article = articleRef.current;
    if (article && mode === 'read' && activeTab === 'notes') paintReaderHighlights(article, highlights);
  }, [highlights, mode, activeTab, noteData?.part]);

  const commitHighlights = useCallback((next: ReaderHighlight[]) => {
    setHighlights(next);
    if (noteData) saveHighlights(courseId, noteData.part, next);
  }, [courseId, noteData]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const article = articleRef.current;
    if (!selection || !article || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!article.contains(range.commonAncestorContainer)) return;
    const start = textOffset(article, range.startContainer, range.startOffset);
    const end = textOffset(article, range.endContainer, range.endOffset);
    const [from, to] = start <= end ? [start, end] : [end, start];
    if (to - from < 2) return;

    if (eraseHighlights) {
      commitHighlights(highlights.filter(h => h.end <= from || h.start >= to));
    } else {
      const next = highlights.filter(h => h.end <= from || h.start >= to);
      next.push({ id: `highlight-${Date.now()}`, start: from, end: to, color: highlightColor });
      commitHighlights(next.sort((a, b) => a.start - b.start));
    }
    selection.removeAllRanges();
  }, [commitHighlights, eraseHighlights, highlightColor, highlights]);

  const clearHighlights = useCallback(() => commitHighlights([]), [commitHighlights]);

  useEffect(() => { setPrefs(loadPrefs()); }, []);
  const updatePrefs = useCallback((patch: Partial<ReaderPrefs>) => {
    setPrefs(prev => { const next = { ...prev, ...patch }; savePrefs(next); return next; });
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveBookmarks(next);
      return next;
    });
  }, []);

  /* Theme tokens */
  const th = CLight;

  const videoIds = useMemo(() => noteData ? getVideoIds(courseId, noteData.part) : [], [courseId, noteData?.part]);
  const cleanTitle = noteData?.title.replace(/^Part\s+\d+(?:\.\d+)?\s*[-–—]?\s*/i, '') || 'Lesson';
  const hasFiles = !!noteData?.files.length;

  /* Scroll / reading progress */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current; if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const next = max <= 0 ? 0 : Math.min(100, Math.max(0, (el.scrollTop / max) * 100));
    if (Math.round(next) !== Math.round(readingPctRef.current)) {
      readingPctRef.current = next;
      setReadingPct(next);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        handleScroll();
        if (noteData?.part) {
          if (scrollSaveTimerRef.current !== null) clearTimeout(scrollSaveTimerRef.current);
          scrollSaveTimerRef.current = setTimeout(() => {
            saveScrollPosition(courseId, noteData.part as number, el.scrollTop);
            scrollSaveTimerRef.current = null;
          }, 200);
        }
        ticking = false;
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (scrollSaveTimerRef.current !== null) clearTimeout(scrollSaveTimerRef.current);
      scrollSaveTimerRef.current = null;
    };
  }, [courseId, handleScroll, noteData?.part]);

  /* Table of contents */
  useEffect(() => {
    if (!noteData || mode !== 'read') return;
    const t = setTimeout(() => {
      const root = scrollRef.current; if (!root) return;
      const hs = Array.from(root.querySelectorAll('h2, h3')) as HTMLElement[];
      setToc(hs.map((h, i) => { const id = h.id || `sec-${i}`; h.id = id; return { id, text: h.innerText, level: h.tagName === 'H2' ? 2 : 3 }; }));
    }, 100);
    return () => clearTimeout(t);
  }, [noteData?.notes, mode]);

  useEffect(() => {
    const root = scrollRef.current; if (!root || toc.length === 0) return;
    const obs = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveId(visible[0].target.id);
    }, { root, rootMargin: '-10% 0px -70% 0px' });
    toc.forEach(t => { const el = document.getElementById(t.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [toc]);

  useEffect(() => {
    setMode('read');
    readingPctRef.current = 0;
    setReadingPct(0);
    if (!noteData?.part || loading) return;
    const frame = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = loadScrollPosition(courseId, noteData.part);
      handleScroll();
    });
    return () => cancelAnimationFrame(frame);
  }, [courseId, handleScroll, loading, noteData?.part]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') setMode('read');
      if (e.key === '2') setMode('watch');
      if (e.key === '3') setMode('blueprint');
      if (e.key === 'ArrowLeft' && onPrev) { e.preventDefault(); onPrev(); }
      if (e.key === 'ArrowRight' && onNext) { e.preventDefault(); onNext(); }
      if (e.key === 'Escape' && focusMode) setFocusMode(false);
      if (e.key === '?') onShowShortcuts?.();
      if (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setFocusMode(v => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode, onShowShortcuts]);

  const readingStats = useMemo(() => {
    const wordCount = noteData ? noteData.notes.trim().split(/\s+/).filter(Boolean).length : 0;
    return { wordCount, readTime: wordCount ? Math.max(1, Math.round(wordCount / 200)) : 0 };
  }, [noteData?.notes]);
  const readTime = readingStats.readTime;
  const wordCount = readingStats.wordCount;
  const minutesLeft = Math.max(0, Math.round(readTime * (1 - readingPct / 100)));
  const filteredToc = useMemo(() =>
    tocQuery.trim() ? toc.filter(t => t.text.toLowerCase().includes(tocQuery.toLowerCase())) : toc,
    [toc, tocQuery]);
  const contentMaxWidth = WIDTH_MAP[prefs.width];
  const isBookmarked = noteData ? bookmarks.has(`lesson-${noteData.part}`) : false;
  const markdownComponents = useMemo(() => ({
    code(props: any) {
      const { className, children, ...rest } = props;
      const m = /language-(\w+)/.exec(className || '');
      const lang = m ? m[1] : 'text';
      const txt = String(children ?? '').replace(/\n$/, '');
      const isBlock = !!m || txt.includes('\n');
      if (isBlock) return <CodeBlock lang={lang} code={txt} />;
      return <code className={className} {...rest}>{children}</code>;
    },
    pre({ children }: any) { return <>{children}</>; },
    table({ children }: any) { return <div className="rd-table-wrap"><table>{children}</table></div>; },
    img({ src, alt, ...props }: any) {
      return <img {...props} src={src} alt={alt || ''} loading="lazy" decoding="async" />;
    },
  }), []);

  /* ─── CSS ─────────────────────────────────────────────────────────────────── */
  const css = `
    ${FONT_IMPORT}

    /* Root */
    .rd{
      display:flex;flex-direction:column;height:100%;
      background:${th.bg};color:${th.text};
      font-family:${F.body};font-size:${FS.base};
      overflow:hidden;position:relative;
    }
    .rd *{box-sizing:border-box}
    .rd :focus-visible{outline:3px solid ${th.accent};outline-offset:2px;border-radius:${R.sm}}
    @media(prefers-reduced-motion:reduce){.rd *{animation-duration:.001ms!important;transition-duration:.001ms!important}}

    /* Scrollbar */
    .rd ::-webkit-scrollbar{width:7px;height:7px}
    .rd ::-webkit-scrollbar-track{background:${th.bg}}
    .rd ::-webkit-scrollbar-thumb{background:${th.borderHi};border-radius:${R.sm};border:1.5px solid ${th.bg}}
    .rd ::-webkit-scrollbar-thumb:hover{background:${th.accent}}

    /* ── Sticky Toolbar ── */
    .rd-toolbar{
      display:flex;align-items:center;justify-content:space-between;gap:10px;
      padding:0 18px;height:${L.toolbarHeight};flex-shrink:0;
      border-bottom:2.5px solid ${th.border};background:${th.surface};
      position:relative;z-index:10;flex-wrap:wrap;
    }
    .rd-toolbar-left{display:flex;align-items:center;gap:10px}
    .rd-toolbar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .rd-highlighter{display:flex;align-items:center;gap:6px;padding:4px 7px;background:${th.bg};border:2px solid ${th.border};border-radius:${R.md};box-shadow:2px 2px 0 ${th.border}}
    .rd-highlighter-label{font-family:${F.mono};font-size:.62rem;font-weight:800;letter-spacing:.05em;color:${th.textDim};text-transform:uppercase;margin-right:2px}
    .rd-color{width:22px;height:22px;padding:0;border:2px solid ${th.border};border-radius:50%;cursor:pointer;box-shadow:1px 1px 0 ${th.border}}
    .rd-color.active{outline:2px solid ${th.text};outline-offset:2px}
    .rd-color:hover{transform:translateY(-1px)}
    .rd-erase{padding:4px 8px;min-height:28px;font-size:.62rem}
    .rd-erase.active{background:${th.text};color:${th.bg};border-color:${th.text}}
    .rd-highlight-count{font-family:${F.mono};font-size:.62rem;color:${th.textFaint};white-space:nowrap}
    .rd-prose [data-reader-highlight]{border-radius:3px;box-shadow:inset 0 -2px rgba(17,24,39,.15);padding:1px 0}

    /* Mode tabs */
    .rd-tabs{display:flex;gap:4px;background:${th.bg};padding:3px;border-radius:${R.md};border:2px solid ${th.border}}
    .rd-tab{
      border:1.5px solid transparent;background:transparent;color:${th.textDim};
      font-family:${F.mono};font-size:${FS.xs};font-weight:800;
      padding:5px 13px;border-radius:${R.sm};cursor:pointer;
      text-transform:uppercase;letter-spacing:0.04em;
      transition:all ${T.fast};
    }
    .rd-tab.active{
      background:${th.accent};color:${th.onAccent};
      border-color:#1F2937;box-shadow:2px 2px 0px #1F2937;
    }
    .rd-tab:hover:not(.active){
      background:${th.surfaceHover};color:${th.text};
    }

    /* Tactile Buttons */
    .rd-btn{
      border:2px solid ${th.border};background:${th.surfaceHi};color:${th.text};
      font-family:${F.mono};font-size:${FS.xs};font-weight:800;
      padding:6px 13px;border-radius:${R.md};cursor:pointer;
      min-height:34px;box-shadow:2px 2px 0px ${th.border};
      text-transform:uppercase;letter-spacing:0.03em;
      transition:all ${T.fast};
    }
    .rd-btn:hover{
      border-color:${th.accent};color:${th.accent};
      transform:translate(-1.5px, -1.5px);
      box-shadow:3px 3px 0px ${th.accent};
    }
    .rd-btn:active{
      transform:translate(0px, 0px);
      box-shadow:1px 1px 0px ${th.accent};
    }
    .rd-btn:disabled{opacity:0.35;pointer-events:none;box-shadow:none}
    .rd-btn.primary{
      background:${th.accent};color:${th.onAccent};border-color:#1F2937;
      box-shadow:2.5px 2.5px 0px #1F2937;
    }
    .rd-btn.primary:hover{
      background:${th.accent};color:${th.onAccent};
      box-shadow:3.5px 3.5px 0px #1F2937;
    }
    .rd-btn.done{
      background:${th.lime};color:#1F2937;border-color:#1F2937;
      box-shadow:2.5px 2.5px 0px #1F2937;
    }
    .rd-btn.icon{padding:6px 10px;font-family:${F.mono};font-size:${FS.xs}}

    /* Meta Chips */
    .rd-chip{
      font-family:${F.mono};font-size:0.68rem;font-weight:800;
      color:${th.textDim};background:${th.bg};
      padding:4px 9px;border:1.5px solid ${th.border};border-radius:${R.sm};
      box-shadow:1.5px 1.5px 0px ${th.border};
    }

    /* Prefs Popover */
    .rd-prefs{
      position:absolute;top:calc(${L.toolbarHeight} + 6px);right:18px;z-index:60;
      background:${th.surfaceRaised};border:2.5px solid ${th.border};border-radius:${R.lg};
      padding:16px;box-shadow:${S.raised};width:250px;
      display:flex;flex-direction:column;gap:14px;
    }
    .rd-prefs-row{display:flex;flex-direction:column;gap:6px}
    .rd-prefs-label{
      font-family:${F.mono};font-size:0.65rem;font-weight:800;color:${th.textFaint};
      display:flex;justify-content:space-between;letter-spacing:0.08em;text-transform:uppercase;
    }
    .rd-prefs-btns{display:flex;gap:4px}
    .rd-prefs-btn{
      flex:1;border:1.5px solid ${th.border};background:${th.bg};color:${th.textDim};
      border-radius:${R.sm};padding:6px 0;font-size:0.72rem;font-family:${F.mono};font-weight:800;
      cursor:pointer;transition:all ${T.fast};
    }
    .rd-prefs-btn.active{
      background:${th.accent};color:${th.onAccent};border-color:#1F2937;
      box-shadow:1.5px 1.5px 0px #1F2937;
    }
    .rd-prefs-slider{width:100%;accent-color:${th.accent}}

    /* ── Stage ── */
    .rd-stage{flex:1;display:flex;min-height:0;overflow:hidden;position:relative}

    /* ── Rail (TOC) ── */
    .rd-rail{
      width:${L.railWidth};flex-shrink:0;
      background:${th.surface};border-right:2.5px solid ${th.border};
      overflow-y:auto;position:relative;
      transition:width ${T.slow} ${T.ease};
    }
    .rd-rail.collapsed{width:${L.railCollapsedWidth};overflow:hidden}
    .rd-root.is-focus .rd-rail{width:0;border:none;overflow:hidden}
    .rd-rail-inner{padding:16px 14px}
    .rd-rail.collapsed .rd-rail-inner{padding:14px 4px}

    .rd-rail-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    .rd-rail-heading{
      font-family:${F.mono};font-size:0.68rem;color:${th.textFaint};
      font-weight:800;letter-spacing:0.12em;text-transform:uppercase;
    }
    .rd-rail-toggle{
      background:${th.surfaceHi};border:1.5px solid ${th.border};color:${th.textDim};
      border-radius:${R.sm};width:24px;height:24px;cursor:pointer;font-size:0.75rem;
      display:flex;align-items:center;justify-content:center;font-weight:800;
      box-shadow:1.5px 1.5px 0px ${th.border};
      transition:all ${T.fast};
    }
    .rd-rail-toggle:hover{
      border-color:${th.accent};color:${th.accent};
      transform:translate(-1px, -1px);box-shadow:2px 2px 0px ${th.accent};
    }

    .rd-rail-search{
      width:100%;background:${th.bg};border:2px solid ${th.border};
      border-radius:${R.md};padding:7px 10px;color:${th.text};
      font-size:${FS.sm};font-family:${F.mono};font-weight:600;margin-bottom:10px;outline:none;
      box-shadow:1.5px 1.5px 0px ${th.border};
      transition:all ${T.fast};
    }
    .rd-rail-search::placeholder{color:${th.textFaint}}
    .rd-rail-search:focus{border-color:${th.accent};box-shadow:2.5px 2.5px 0px ${th.accent}}

    .rd-toc-item{
      display:flex;align-items:center;gap:8px;padding:7px 8px;
      border-radius:${R.sm};margin-bottom:3px;cursor:pointer;
      border:1.5px solid transparent;
      text-decoration:none;transition:all ${T.fast};
    }
    .rd-toc-item:hover{
      background:${th.surfaceHover};
      border-color:${th.border};
    }
    .rd-toc-item.active{
      background:${th.bg};border-color:${th.accent};
      transform:translate(-1.5px, -1.5px);
      box-shadow:2px 2px 0px ${th.accent};
    }
    .rd-toc-item.lvl-3{padding-left:20px}
    .rd-toc-num{
      font-family:${F.mono};font-size:0.65rem;font-weight:800;
      color:${th.textFaint};width:18px;flex-shrink:0;text-align:right;
    }
    .rd-toc-item.active .rd-toc-num{color:${th.accent}}
    .rd-toc-text{font-size:${FS.sm};color:${th.textDim};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .rd-toc-item.active .rd-toc-text{color:${th.text};font-weight:700}
    .rd-toc-empty{font-size:${FS.sm};color:${th.textFaint};font-family:${F.mono};padding:6px 2px}

    .rd-rail-divider{height:2px;background:${th.border};margin:14px 0}
    .rd-rail-progress-track{
      height:6px;background:${th.bg};border:1.5px solid ${th.border};
      border-radius:${R.pill};overflow:hidden;
    }
    .rd-rail-progress-fill{height:100%;background:${th.accent};transition:width ${T.base} ${T.ease}}
    .rd-rail-progress-label{font-family:${F.mono};font-size:0.64rem;font-weight:700;color:${th.textFaint};margin-top:6px}

    /* ── Main Canvas ── */
    .rd-main{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;position:relative}
    .rd-scroll{flex:1;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scrollbar-gutter:stable}
    .rd-content{
      max-width:none;width:100%;margin:0;
      padding:44px 36px 120px;
    }

    /* Scroll to top button */
    .rd-scroll-top{
      position:absolute;bottom:26px;right:24px;width:42px;height:42px;
      border-radius:${R.md};background:${th.accent};color:${th.onAccent};
      border:2px solid #1F2937;display:flex;align-items:center;justify-content:center;
      cursor:pointer;opacity:0;pointer-events:none;
      box-shadow:3px 3px 0px #1F2937;
      transition:all ${T.base};z-index:20;font-size:1.1rem;font-weight:800;
    }
    .rd-scroll-top.visible{opacity:1;pointer-events:auto}
    .rd-scroll-top:hover{transform:translate(-2px, -2px);box-shadow:4px 4px 0px #1F2937}

    /* Focus Mode Bar */
    .rd-focus-bar{position:absolute;top:14px;right:18px;z-index:40;display:none;gap:8px}
    .rd-root.is-focus .rd-focus-bar{display:flex}
    .rd-focus-pill{
      background:${th.accent};border:2px solid #1F2937;color:${th.onAccent};
      padding:7px 14px;border-radius:${R.pill};font-size:${FS.sm};font-family:${F.mono};font-weight:800;
      cursor:pointer;box-shadow:3px 3px 0px #1F2937;
    }

    /* ── Reading Hero Section ── */
    .rd-hero{
      margin-bottom:36px;padding:26px 28px 28px;
      border-bottom:3px solid ${th.border};
    }
    .rd-kicker{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center;min-width:0}

    /* Maximalist Badges */
    .rd-badge{
      font-family:${F.mono};font-weight:800;font-size:0.68rem;
      letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;
      border-radius:${R.sm};background:${th.surfaceHi};color:${th.text};white-space:nowrap;
      border:2px solid ${th.border};box-shadow:2px 2px 0px ${th.border};
    }
    .rd-kicker .rd-badge.accent,.rd-kicker .rd-badge.pink,.rd-kicker .rd-badge.lime{flex:0 0 auto}
    .rd-badge.dark-fill{background:${th.text};color:${th.bg};border-color:${th.text};box-shadow:2px 2px 0px ${th.border}}
    .rd-badge.accent{background:${th.accent};color:${th.onAccent};border-color:#1F2937;box-shadow:2px 2px 0px #1F2937}
    .rd-badge.cyan{background:${th.cyan};color:#1F2937;border-color:#1F2937;box-shadow:2px 2px 0px #1F2937}
    .rd-badge.pink{background:${th.pink};color:#fff;border-color:#1F2937;box-shadow:2px 2px 0px #1F2937}
    .rd-badge.lime{background:${th.lime};color:#1F2937;border-color:#1F2937;box-shadow:2px 2px 0px #1F2937}
    .rd-kicker .rd-badge.cyan{min-width:0;max-width:min(100%, 520px);overflow:hidden;text-overflow:ellipsis}

    .rd-title{
      font-family:${F.display};font-weight:800;
      font-size:clamp(1.75rem,3.4vw,2.4rem);
      line-height:1.15;letter-spacing:-0.03em;
      margin:0 0 16px;color:${th.text};
    }
    .rd-submeta{
      display:flex;gap:10px;flex-wrap:wrap;
      font-family:${F.mono};font-size:0.75rem;font-weight:700;
      color:${th.textDim};align-items:center;
    }
    .rd-submeta .dot{color:${th.accent};font-weight:800}

    /* ── Prose Content Styling ── */
    .rd-prose{font-size:calc(1rem * var(--rd-fs,1));line-height:var(--rd-lh,1.7);color:${th.text}}
    .rd-prose h2{
      font-family:${F.display};font-weight:800;font-size:1.45rem;
      margin:2.4rem 0 0.8rem;scroll-margin-top:24px;color:${th.text};
      display:flex;align-items:center;gap:10px;
    }
    .rd-prose h2::before{
      content:'';display:inline-block;width:6px;height:1.2em;
      background:${th.accent};flex-shrink:0;border-radius:${R.sm};
      border:1px solid #1F2937;box-shadow:1.5px 1.5px 0px #1F2937;
    }
    .rd-prose h3{
      font-family:${F.display};font-weight:800;font-size:1.2rem;
      margin:2rem 0 0.6rem;scroll-margin-top:24px;color:${th.text};
    }
    .rd-prose p{margin:0 0 1.25rem;color:${th.textDim}}
    .rd-prose strong{color:${th.text};font-weight:800}
    .rd-prose a{
      color:${th.accent};font-weight:700;
      text-decoration:underline;text-underline-offset:4px;
      text-decoration-thickness:2px;
    }
    .rd-prose ul,.rd-prose ol{padding-left:1.4rem;margin:0 0 1.25rem;color:${th.textDim}}
    .rd-prose li{margin-bottom:0.5rem}
    .rd-prose li::marker{color:${th.accent};font-weight:800}
    .rd-prose blockquote{
      margin:1.6rem 0;padding:8px 0 8px 18px;
      border-left:4px solid ${th.accent};
      color:${th.text};font-style:italic;font-weight:500;
      background:${th.surfaceHi};border-radius:0 ${R.md} ${R.md} 0;
    }
    .rd-prose code{
      font-family:${F.mono};font-weight:700;
      background:${th.surfaceHi};border:1.5px solid ${th.border};
      padding:2px 6px;border-radius:${R.sm};font-size:0.85em;color:${th.cyan};
    }
    .rd-prose hr{border:none;border-top:2.5px solid ${th.border};margin:2.4rem 0}

    /* Maximalist Tables */
    .rd-table-wrap{
      margin:1.8rem 0;border:2.5px solid ${th.border};
      border-radius:${R.md};overflow:auto;max-height:500px;
      box-shadow:3.5px 3.5px 0px ${th.border};
    }
    .rd-prose table{width:100%;border-collapse:collapse;font-size:${FS.sm}}
    .rd-prose th{
      position:sticky;top:0;text-align:left;padding:10px 14px;
      background:${th.bg};color:${th.accent};border-bottom:2px solid ${th.border};
      font-family:${F.mono};font-size:0.72rem;font-weight:800;
      letter-spacing:0.08em;text-transform:uppercase;z-index:1;
    }
    .rd-prose td{padding:10px 14px;border-bottom:1.5px solid ${th.border};color:${th.textDim}}
    .rd-prose tbody tr:last-child td{border-bottom:none}
    .rd-prose tbody tr:hover{background:${th.surfaceHover}}

    /* Footer */
    .rd-footer{
      display:flex;gap:12px;margin-top:44px;padding-top:24px;
      border-top:3px solid ${th.border};flex-wrap:wrap;
    }

    /* ── Neo-Brutalist Callout (Margin Stamp Badge) ── */
    .rd-callout{
      position:relative;margin:2rem 0;
      border:2.5px solid var(--ca);
      border-radius:${R.md};padding:22px 18px 16px;
      background:var(--ca-dim);
      box-shadow:4px 4px 0px var(--ca);
    }
    .rd-callout-stamp{
      position:absolute;top:-13px;left:14px;
      background:var(--ca);color:#1F2937;
      font-family:${F.mono};font-weight:800;font-size:0.65rem;
      letter-spacing:0.08em;text-transform:uppercase;
      padding:3px 10px;border-radius:${R.sm};
      border:1.5px solid #1F2937;box-shadow:1.5px 1.5px 0px #1F2937;
    }
    .rd-callout-body{font-size:${FS.md};color:${th.text};line-height:1.68;margin-top:2px}
    .rd-callout-body > *:last-child{margin-bottom:0}

    /* ── Maximalist Code Blocks ── */
    .rd-code{
      margin:1.8rem 0;border-radius:${R.md};overflow:hidden;
      border:1px solid ${C.border};background:#fff;
      box-shadow:0 8px 24px rgba(29,43,56,.08);
    }
    .rd-code.fullscreen{position:fixed;inset:14px;z-index:200;margin:0;box-shadow:${S.raised}}
    .rd-code-head{
      display:flex;justify-content:space-between;align-items:center;
      padding:10px 14px;background:#fff;border-bottom:1px solid ${C.border};
    }
    .rd-code-lang{
      font-family:${F.mono};font-size:0.68rem;font-weight:800;
      color:#fff;background:${C.accent};border:1px solid ${C.accent};
      padding:2px 7px;border-radius:${R.sm};text-transform:uppercase;
    }
    .rd-code-file{font-family:${F.mono};font-size:${FS.sm};font-weight:700;color:${C.textDim};margin-left:10px}
    .rd-code-actions{display:flex;gap:6px;align-items:center}
    .rd-code-btn{
      background:#fff;border:1px solid ${C.border};color:${C.textDim};
      font-family:${F.mono};font-size:0.65rem;font-weight:800;padding:3px 9px;
      border-radius:${R.sm};cursor:pointer;box-shadow:1.5px 1.5px 0px ${C.border};
      transition:all ${T.fast};
    }
    .rd-code-btn:hover{
      background:${C.accentDim};color:${C.accent};border-color:${C.accent};
      transform:translateY(-1px);box-shadow:none;
    }
    .rd-code-btn.on{background:${C.accent};color:${C.onAccent};border-color:${C.accent};box-shadow:none}
    .rd-code-body{padding:16px;overflow-x:auto;display:flex;gap:14px;background:#fff}
    .rd-code.fullscreen .rd-code-body{overflow-y:auto;max-height:calc(100vh - 90px)}
    .rd-code-linenos{
      font-family:${F.mono};font-size:0.84rem;line-height:1.68;
      color:#9aa4ad;text-align:right;user-select:none;flex-shrink:0;
      padding-right:10px;border-right:1px solid ${C.border};
    }
    .rd-code-body pre{margin:0;font-family:${F.mono};font-size:0.84rem;line-height:1.68;color:${C.text};flex:1;min-width:0}
    .rd-code-body pre code{padding:0;border:0;background:transparent;color:${C.text};font-family:inherit;font-size:inherit}
    .rd-code-body pre.wrap{white-space:pre-wrap;word-break:break-word}
    .rd-code-collapsed{padding:10px 16px;font-family:${F.mono};font-size:${FS.xs};color:${C.textFaint}}
    .rd-code-output{border-top:1px solid ${C.border};padding:12px 16px;font-family:${F.mono};font-size:0.82rem;color:${C.text};background:${C.surfaceHi}}
    .rd-code-output-label{font-size:0.62rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${C.textFaint};margin-bottom:6px}

    /* ── Files Grid ── */
    .rd-files{display:flex;flex-direction:column;gap:14px}
    .rd-file-card{
      border:2.5px solid ${th.border};border-radius:${R.md};
      overflow:hidden;background:${th.surface};box-shadow:3.5px 3.5px 0px ${th.border};
    }
    .rd-file-head{
      display:flex;justify-content:space-between;align-items:center;
      padding:10px 14px;background:${th.bg};border-bottom:2px solid ${th.border};
    }
    .rd-file-name{font-family:${F.mono};font-size:${FS.sm};font-weight:700;color:${th.text}}
    .rd-file-code{margin:0;padding:14px 16px;font-family:${F.mono};font-size:0.84rem;color:${th.textDim};overflow-x:auto;line-height:1.68}

    /* ── Video ── */
    .rd-video-tabs{
      display:flex;gap:4px;padding:10px 10px 0;
      background:${th.surface};border:2.5px solid ${th.border};
      border-bottom:none;border-radius:${R.md} ${R.md} 0 0;
    }
    .rd-video-tab{
      padding:6px 14px;font-size:${FS.xs};font-family:${F.mono};font-weight:800;
      border:1.5px solid ${th.border};border-radius:${R.sm};
      cursor:pointer;background:${th.bg};color:${th.textDim};
      transition:all ${T.fast};
    }
    .rd-video-tab.active{
      background:${th.accent};color:${th.onAccent};
      border-color:#1F2937;box-shadow:2px 2px 0px #1F2937;
    }
    .rd-video-frame,.rd-video-host{
      position:relative;width:100%;padding-bottom:56.25%;height:0;
      background:#1F2937;border-radius:${R.md};overflow:hidden;border:2.5px solid ${th.border};
    }
    .rd-video-host>div{position:absolute;inset:0}
    .rd-video-empty{
      aspect-ratio:16/9;background:${th.surfaceHi};border-radius:${R.md};
      display:flex;align-items:center;justify-content:center;
      color:${th.textFaint};font-size:${FS.sm};font-family:${F.mono};
      text-align:center;padding:24px;border:2.5px solid ${th.border};
    }

    /* Skeleton Loading */
    .rd-skeleton{
      background:linear-gradient(90deg,${th.surfaceHi} 25%,${th.border} 37%,${th.surfaceHi} 63%);
      background-size:400% 100%;animation:rd-shimmer 1.4s ease infinite;border-radius:${R.md};
    }
    @keyframes rd-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}

    /* Responsive */
    @media(max-width:860px){
      .rd-rail{position:absolute;left:0;top:0;bottom:0;z-index:30;box-shadow:${S.raised}}
      .rd-content{padding:28px 18px 90px}
      .rd-toolbar-right .rd-chip{display:none}
    }
    @media(max-width:480px){
      .rd-tabs .rd-tab{padding:5px 9px;font-size:0.65rem}
      .rd-title{font-size:1.4rem}
      .rd-content{padding:20px 14px 80px}
    }

    /* Premium reader composition: brand tokens retained, structure refined. */
    .rd{background:${th.bg};}
    .rd-toolbar{min-height:${L.toolbarHeight};height:auto;padding:10px 22px;background:${th.surface};border-bottom:1px solid ${th.border};box-shadow:0 4px 18px rgba(31,41,55,.06);flex-wrap:nowrap;}
    .rd-toolbar-left{min-width:0;flex:1 1 auto;overflow:hidden;}
    .rd-toolbar-right{min-width:0;flex:0 0 auto;margin-left:auto;}
    .rd-chip{background:${th.surface};border-radius:${R.pill};padding:5px 10px;}
    .rd-stage{display:grid;grid-template-columns:260px minmax(0,1fr);min-height:0;flex:1;}
    .rd-rail{position:relative;inset:auto;width:auto;background:${th.surface};border-right:1px solid ${th.border};box-shadow:none;}
    .rd-rail-inner{padding:22px 16px;}
    .rd-rail-head{position:sticky;top:0;background:${th.surface};padding-bottom:12px;z-index:2;}
    .rd-rail-search{width:100%;border:1px solid ${th.border};border-radius:${R.md};background:${th.bg};padding:9px 10px;color:${th.text};font-family:${F.body};outline:none;}
    .rd-rail-search:focus{border-color:${th.accent};box-shadow:0 0 0 3px ${th.accentDim};}
    .rd-toc-item{border-left:2px solid transparent;border-radius:0 ${R.sm} ${R.sm} 0;margin:2px 0;padding:9px 8px;text-decoration:none;transition:background ${T.fast},border-color ${T.fast},color ${T.fast};}
    .rd-toc-item:hover,.rd-toc-item.active{background:${th.accentDim};border-left-color:${th.accent};}
    .rd-main{background:${th.bg};}
    .rd-content{max-width:1100px;padding:34px clamp(20px,5vw,80px) 120px;margin:0 auto;}
    .rd-hero{width:min(100%,760px);max-width:760px;margin:0 auto 38px;padding:26px 0 24px;border-bottom:1px solid ${th.border};overflow:visible;background:transparent!important;border-radius:0!important;box-shadow:none!important;}
    .rd-title{font-size:clamp(2rem,4vw,3.25rem);line-height:1.08;max-width:760px;}
    .rd-prose{max-width:760px;margin:0 auto;font-size:calc(1.04rem * var(--rd-fs,1));}
    .rd-prose p{line-height:var(--rd-lh,1.75);}
    .rd-prose h2{margin-top:3rem;}
    .rd-footer{width:min(100%,760px);max-width:760px;margin:52px auto 0;padding-top:24px;justify-content:space-between;}
    .rd-scroll{scroll-behavior:auto;}
    .rd-scroll-top{right:28px;bottom:28px;border-radius:50%;}
    .rd-slider-viewport{position:relative;outline:none;touch-action:pan-y;}
    .rd-slider-viewport:focus-visible{outline:3px solid ${th.accent};outline-offset:5px;border-radius:${R.md};}
    .rd-slider-arrow{position:absolute;top:50%;z-index:3;transform:translateY(-50%);width:42px;height:42px;border:1px solid rgba(255,255,255,.28);border-radius:50%;background:rgba(31,41,55,.72);color:#fff;font-size:1.2rem;cursor:pointer;opacity:0;transition:opacity ${T.fast},transform ${T.fast},background ${T.fast};}
    .rd-slider-viewport:hover .rd-slider-arrow,.rd-slider-viewport:focus-within .rd-slider-arrow{opacity:1;}
    .rd-slider-arrow:hover:not(:disabled){background:${th.accent};transform:translateY(-50%) scale(1.05);}
    .rd-slider-arrow:disabled{cursor:default;opacity:.25;}
    .rd-slider-arrow.prev{left:14px}.rd-slider-arrow.next{right:14px}
    .rd-slider-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 4px;color:${th.textDim};font-family:${F.mono};font-size:.68rem;}
    .rd-slider-dots{display:flex;gap:6px;align-items:center;}
    .rd-slider-dots button{width:7px;height:7px;padding:0;border:0;border-radius:50%;background:${th.borderHi};cursor:pointer;transition:transform ${T.fast},background ${T.fast};}
    .rd-slider-dots button.active{background:${th.accent};transform:scale(1.5);}
    .rd-slider-hint{color:${th.textFaint};}
    .rd-video-frame{transition:box-shadow ${T.base},transform ${T.base};}
    .rd-video-frame:hover{box-shadow:0 16px 36px rgba(31,41,55,.16);}
    .rd-table-wrap{box-shadow:0 8px 24px rgba(31,41,55,.08);}
    @media(max-width:860px){
      .rd-stage{display:block;position:relative;}
      .rd-rail{position:absolute;left:0;top:0;bottom:0;width:min(300px,88vw);z-index:30;box-shadow:${S.raised};}
      .rd-content{padding:28px 22px 90px;}
      .rd-hero,.rd-prose,.rd-footer{max-width:none;}
      .rd-toolbar{padding:9px 14px;}
      .rd-slider-arrow{opacity:1;}
    }
    @media(max-width:560px){
      .rd-toolbar{align-items:stretch;flex-direction:column;}
      .rd-toolbar-left,.rd-toolbar-right{width:100%;}
      .rd-toolbar-right{justify-content:space-between;margin-left:0;}
      .rd-highlighter{overflow-x:auto;max-width:100%;}
      .rd-content{padding:20px 16px 80px;}
      .rd-hero{padding-top:12px;}
      .rd-title{font-size:1.8rem;}
      .rd-prose{font-size:calc(1rem * var(--rd-fs,1));}
      .rd-footer{flex-direction:column;}
      .rd-footer .rd-btn{width:100%;}
      .rd-slider-meta{flex-wrap:wrap;justify-content:center;}
      .rd-slider-hint{display:none;}
    }

    /* Canvas Reader: chapters become connected knowledge zones. */
    .rd-canvas .rd-stage{background:${th.bg};}
    .rd-canvas .rd-rail{background:${th.bg};border-right:1px solid ${th.border};}
    .rd-canvas .rd-rail-inner{position:relative;padding:28px 18px;}
    .rd-canvas .rd-rail-inner::before{content:'';position:absolute;left:29px;top:78px;bottom:74px;width:1px;background:linear-gradient(180deg,${th.accent},${th.border} 75%,transparent);opacity:.7;}
    .rd-canvas .rd-rail-heading{letter-spacing:.16em;}
    .rd-canvas .rd-toc-item{position:relative;z-index:1;margin:8px 0;padding:10px 8px 10px 7px;border:0;border-radius:${R.md};background:transparent;}
    .rd-canvas .rd-toc-item::before{content:'';width:11px;height:11px;flex:0 0 11px;border:2px solid ${th.borderHi};border-radius:50%;background:${th.bg};transition:background ${T.fast},border-color ${T.fast},transform ${T.fast};}
    .rd-canvas .rd-toc-item.active::before{background:${th.accent};border-color:${th.accent};transform:scale(1.25);}
    .rd-canvas .rd-toc-item.active,.rd-canvas .rd-toc-item:hover{border:0;background:${th.accentDim};box-shadow:none;transform:none;}
    .rd-canvas .rd-toc-num{display:none;}
    .rd-canvas .rd-toc-text{font-size:.78rem;}
    .rd-canvas .rd-main{background-image:linear-gradient(${th.border} 1px,transparent 1px),linear-gradient(90deg,${th.border} 1px,transparent 1px);background-size:48px 48px;background-position:24px 24px;}
    .rd-canvas .rd-scroll{background:radial-gradient(circle at 50% 0%,${th.surface} 0%,${th.bg} 54%);}
    .rd-canvas .rd-content{position:relative;}
    .rd-canvas .rd-content::before{content:'KNOWLEDGE CANVAS';display:block;width:max-content;margin:0 auto 18px;color:${th.textFaint};font-family:${F.mono};font-size:.62rem;font-weight:800;letter-spacing:.18em;}
    .rd-canvas .rd-hero{position:relative;margin-bottom:42px;padding-top:14px;border-bottom:0;}
    .rd-canvas .rd-hero::after{content:'';display:block;width:72px;height:3px;margin-top:24px;border-radius:99px;background:${th.accent};}
    .rd-canvas .rd-kicker{gap:8px;}
    .rd-canvas .rd-title{font-size:clamp(2.2rem,5vw,4.2rem);max-width:850px;letter-spacing:-.055em;}
    .rd-canvas .rd-prose{position:relative;}
    .rd-canvas .rd-prose h2{position:relative;margin-top:4.5rem;padding-top:14px;border-top:1px solid ${th.border};}
    .rd-canvas .rd-prose h2::before{position:absolute;left:-18px;top:15px;width:7px;height:28px;}
    .rd-canvas .rd-prose h2::after{content:'ZONE';position:absolute;right:0;top:18px;color:${th.textFaint};font-family:${F.mono};font-size:.58rem;letter-spacing:.14em;}
    .rd-canvas .rd-prose h3{margin-top:2.6rem;padding-left:14px;border-left:2px solid ${th.accent};}
    .rd-canvas .rd-callout{margin:2.8rem -24px;padding:20px 24px;background:${th.surfaceHi};}
    .rd-canvas .rd-table-wrap,.rd-canvas .rd-code{margin-left:-24px;margin-right:-24px;}
    .rd-canvas .rd-footer{position:relative;margin-top:64px;padding-top:32px;}
    .rd-canvas .rd-footer::before{content:'NEXT KNOWLEDGE ZONE';position:absolute;top:-9px;left:0;padding-right:10px;background:${th.bg};color:${th.textFaint};font-family:${F.mono};font-size:.58rem;font-weight:800;letter-spacing:.16em;}
    .rd-canvas .rd-slider{padding:12px 0 4px;}
    .rd-canvas .rd-slider-viewport{border-radius:${R.lg};box-shadow:0 18px 42px rgba(31,41,55,.14);}
    .rd-canvas .rd-slider-meta{padding:14px 8px;color:${th.textDim};}
    .rd-canvas .rd-video-tabs{border:0;background:transparent;padding:0 0 12px;}
    .rd-canvas .rd-video-tab{border-radius:${R.pill};padding:7px 13px;}
    @media(max-width:860px){
      .rd-canvas .rd-main{background-size:32px 32px;background-position:16px 16px;}
      .rd-canvas .rd-content::before{margin-top:8px;}
      .rd-canvas .rd-callout,.rd-canvas .rd-table-wrap,.rd-canvas .rd-code{margin-left:0;margin-right:0;}
      .rd-canvas .rd-prose h2::after{display:none;}
    }
    @media(max-width:560px){
      .rd-canvas .rd-title{font-size:2.15rem;}
      .rd-canvas .rd-content::before{font-size:.55rem;}
      .rd-canvas .rd-prose h2{margin-top:3.5rem;}
    }

    /* Mission Control Reader: progress and checkpoints drive the experience. */
    .rd-mission .rd-stage{background:${th.bg};}
    .rd-mission .rd-main{background:${th.bg};}
    .rd-mission .rd-mission-strip{display:flex;align-items:center;gap:18px;min-height:54px;padding:9px 28px;border-bottom:1px solid ${th.border};background:${th.surface};}
    .rd-mission .rd-mission-strip__label{display:flex;flex-direction:column;min-width:155px;gap:2px;}
    .rd-mission .rd-mission-strip__label span{color:${th.accent};font-family:${F.mono};font-size:.68rem;font-weight:800;letter-spacing:.12em;}
    .rd-mission .rd-mission-strip__label small{color:${th.textFaint};font-size:.68rem;}
    .rd-mission .rd-mission-strip__track{height:7px;flex:1;overflow:hidden;border-radius:99px;background:${th.border};}
    .rd-mission .rd-mission-strip__track span{display:block;height:100%;border-radius:inherit;background:${th.accent};transition:width ${T.base} ${T.ease};}
    .rd-mission .rd-mission-strip__status{min-width:138px;color:${th.textDim};font-family:${F.mono};font-size:.62rem;font-weight:800;text-align:right;letter-spacing:.05em;}
    .rd-mission .rd-rail{background:${th.surface};border-right:1px solid ${th.border};}
    .rd-mission .rd-rail-inner{position:relative;padding:24px 16px;}
    .rd-mission .rd-rail-heading{color:${th.text};letter-spacing:.14em;}
    .rd-mission .rd-rail-inner::before{content:'';position:absolute;left:28px;top:70px;bottom:80px;width:2px;background:${th.border};}
    .rd-mission .rd-toc-item{position:relative;z-index:1;gap:9px;margin:5px 0;padding:9px 7px;border:1px solid transparent;border-radius:${R.md};background:transparent;}
    .rd-mission .rd-toc-item::before{content:'';width:13px;height:13px;flex:0 0 13px;border:2px solid ${th.borderHi};border-radius:50%;background:${th.surface};transition:background ${T.fast},border-color ${T.fast},box-shadow ${T.fast};}
    .rd-mission .rd-toc-item.active::before{background:${th.accent};border-color:${th.accent};box-shadow:0 0 0 4px ${th.accentDim};}
    .rd-mission .rd-toc-item.active{border-color:${th.accent};background:${th.accentDim};box-shadow:none;transform:none;}
    .rd-mission .rd-toc-item:hover{border-color:${th.border};background:${th.surfaceHi};transform:none;box-shadow:none;}
    .rd-mission .rd-toc-num{display:none;}
    .rd-mission .rd-toc-text{font-size:.79rem;}
    .rd-mission .rd-content{max-width:980px;padding:34px clamp(20px,5vw,72px) 120px;}
    .rd-mission .rd-content::before{content:'LEARNING MISSION';display:block;margin:0 auto 18px;color:${th.textFaint};font-family:${F.mono};font-size:.62rem;font-weight:800;letter-spacing:.18em;text-align:center;}
    .rd-mission .rd-hero{width:100%;max-width:none;margin:0 auto 38px;padding:18px 0 24px;background:transparent!important;border-bottom:1px solid ${th.border};box-shadow:none!important;border-radius:0!important;}
    .rd-mission .rd-title{font-size:clamp(2rem,4.5vw,3.6rem);max-width:900px;letter-spacing:-.045em;}
    .rd-mission .rd-hero::after{content:'CURRENT CHECKPOINT';display:block;margin-top:22px;color:${th.accent};font-family:${F.mono};font-size:.6rem;font-weight:800;letter-spacing:.15em;}
    .rd-mission .rd-prose{max-width:780px;margin:0;}
    .rd-mission .rd-prose h2{position:relative;margin-top:3.5rem;padding:16px 0 12px;border-top:1px solid ${th.border};border-bottom:1px solid ${th.border};}
    .rd-mission .rd-prose h2::before{left:-16px;top:16px;height:25px;}
    .rd-mission .rd-prose h2::after{content:'CHECKPOINT';position:absolute;right:0;top:20px;color:${th.textFaint};font-family:${F.mono};font-size:.57rem;letter-spacing:.12em;}
    .rd-mission .rd-footer{position:relative;max-width:780px;margin:54px 0 0;padding:24px 0 0;}
    .rd-mission .rd-footer::before{content:'MISSION CONTROL';position:absolute;top:-9px;left:0;padding-right:10px;background:${th.bg};color:${th.textFaint};font-family:${F.mono};font-size:.58rem;font-weight:800;letter-spacing:.16em;}
    .rd-mission .rd-slider{max-width:900px;background:${th.bg};}
    .rd-mission .rd-video-empty{background:${th.bg};}
    .rd-mission .rd-slider-viewport{border-radius:${R.lg};box-shadow:0 12px 30px rgba(31,41,55,.12);}
    @media(max-width:860px){
      .rd-mission .rd-mission-strip{padding:9px 16px;gap:10px;}
      .rd-mission .rd-mission-strip__label{min-width:125px;}
      .rd-mission .rd-mission-strip__status{min-width:auto;font-size:.56rem;}
      .rd-mission .rd-content{padding:28px 22px 90px;}
      .rd-mission .rd-prose{max-width:none;}
    }
    @media(max-width:560px){
      .rd-mission .rd-mission-strip{align-items:flex-start;flex-wrap:wrap;}
      .rd-mission .rd-mission-strip__track{order:3;flex-basis:100%;}
      .rd-mission .rd-mission-strip__status{margin-left:auto;}
      .rd-mission .rd-content{padding:20px 16px 80px;}
      .rd-mission .rd-title{font-size:2.1rem;}
      .rd-mission .rd-prose h2::after{display:none;}
    }

    /* Final Reader architecture: compact lesson tree, spacious article, utility rail. */
    .rd-mission{height:100%;min-height:0;display:flex;flex-direction:column;background:${th.bg};}
    .rd-mission .rd-stage{display:grid;grid-template-columns:280px minmax(0,1fr) 270px;height:0;min-height:0;flex:1 1 auto;overflow:hidden;background:${th.bg};}
    .rd-mission .rd-rail{display:block!important;position:relative;inset:auto;width:auto;min-width:0;overflow:hidden;background:${th.surface};border-right:1px solid ${th.border};box-shadow:none;}
    .rd-mission .rd-rail-inner{display:none;}
    .rd-mission .rd-lesson-nav{display:flex;height:100%;flex-direction:column;overflow:hidden;padding:24px 16px 16px;}
    .rd-mission .rd-lesson-nav__top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px;}
    .rd-mission .rd-lesson-nav__eyebrow{display:block;margin-bottom:5px;color:${th.textFaint};font-family:${F.mono};font-size:.58rem;font-weight:800;letter-spacing:.13em;}
    .rd-mission .rd-lesson-nav__top strong{display:block;color:${th.text};font-size:.84rem;}
    .rd-mission .rd-lesson-nav__percent{color:${th.accent};font-family:${F.mono};font-size:.78rem;font-weight:800;}
    .rd-mission .rd-lesson-nav__progress{height:5px;margin-bottom:18px;overflow:hidden;border-radius:99px;background:${th.border};}
    .rd-mission .rd-lesson-nav__progress span{display:block;height:100%;border-radius:inherit;background:${th.accent};transition:width ${T.base} ${T.ease};}
    .rd-mission .rd-lesson-nav__search{display:flex;align-items:center;gap:8px;height:38px;margin-bottom:10px;padding:0 10px;border:1px solid ${th.border};border-radius:${R.md};background:${th.bg};color:${th.textFaint};}
    .rd-mission .rd-lesson-nav__search input{min-width:0;width:100%;border:0!important;outline:0!important;background:transparent!important;box-shadow:none!important;font-family:${F.body};font-size:.78rem;}
    .rd-mission .rd-lesson-nav__actions{display:flex;justify-content:space-between;margin-bottom:10px;}
    .rd-mission .rd-lesson-nav__actions button{border:0;background:transparent;color:${th.textFaint};cursor:pointer;font-size:.65rem;}
    .rd-mission .rd-lesson-nav__actions button:hover{color:${th.accent};}
    .rd-mission .rd-lesson-nav__tree{min-height:0;overflow:auto;padding-right:4px;}
    .rd-mission .rd-lesson-module{margin-bottom:12px;}
    .rd-mission .rd-lesson-module__header{display:flex;align-items:flex-start;gap:7px;width:100%;padding:8px 4px;border:0;background:transparent;color:${th.text};cursor:pointer;text-align:left;}
    .rd-mission .rd-lesson-module__chevron{width:14px;color:${th.accent};font-size:1rem;line-height:1;}
    .rd-mission .rd-lesson-module__header small{display:block;margin-bottom:3px;color:${th.textFaint};font-family:${F.mono};font-size:.57rem;font-weight:800;letter-spacing:.1em;}
    .rd-mission .rd-lesson-module__header strong{display:block;min-width:0;overflow-wrap:anywhere;font-size:.78rem;line-height:1.28;}
    .rd-mission .rd-lesson-module__lessons{display:grid;gap:3px;margin-left:20px;padding-left:10px;border-left:1px solid ${th.border};}
    .rd-mission .rd-lesson-item{display:flex;align-items:flex-start;gap:7px;min-height:34px;width:100%;padding:6px 8px;border:1px solid transparent;border-radius:${R.md};background:transparent;color:${th.textDim};cursor:pointer;text-align:left;}
    .rd-mission .rd-lesson-item:hover{background:${th.accentDim};color:${th.text};}
    .rd-mission .rd-lesson-item.is-active{border-color:${th.accent};background:${th.accentDim};color:${th.text};}
    .rd-mission .rd-lesson-item.is-complete{color:${th.success};}
    .rd-mission .rd-lesson-item__state{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;flex:0 0 17px;margin-top:1px;border:1px solid ${th.borderHi};border-radius:50%;color:${th.textFaint};font-size:.62rem;font-weight:800;line-height:1;text-align:center;}
    .rd-mission .rd-lesson-item__state.is-verified{border-color:${th.success};background:${th.success};color:#fff;}
    .rd-mission .rd-lesson-item__state.is-current{border-color:${th.accent};color:${th.accent};font-size:.72rem;}
    .rd-mission .rd-lesson-item__title{display:-webkit-box;min-width:0;flex:1;overflow:hidden;font-size:.74rem;line-height:1.3;overflow-wrap:anywhere;-webkit-box-orient:vertical;-webkit-line-clamp:2;}
    .rd-mission .rd-lesson-item__bookmark{margin-left:auto;color:${th.accent};font-size:.65rem;}
    .rd-mission .rd-lesson-nav__continue{display:flex;align-items:center;justify-content:space-between;min-height:42px;margin-top:12px;padding:0 12px;border:1px solid ${th.accent};border-radius:${R.md};background:${th.accent};color:${th.onAccent};cursor:pointer;font-size:.75rem;font-weight:800;}
    .rd-mission .rd-lesson-nav__continue span{font-size:1.1rem;}
    .rd-mission .rd-mission-strip{display:none;}
    .rd-mission .rd-main{display:flex;height:100%;min-width:0;min-height:0;overflow:hidden;background:${th.bg};}
    .rd-mission .rd-scroll{height:100%;min-height:0;background:${th.bg};}
    .rd-mission .rd-content{width:min(100%,950px);max-width:950px;margin:0 auto;padding:52px clamp(28px,6vw,96px) 140px;}
    .rd-mission .rd-content::before{display:none;}
    .rd-mission .rd-hero{width:100%;max-width:none;margin:0 0 54px;padding:0 0 28px;border-bottom:1px solid ${th.border};}
    .rd-mission .rd-title{max-width:850px;margin-top:12px;font-size:clamp(1.45rem,2vw,2.15rem);line-height:1.12;letter-spacing:-.035em;}
    .rd-mission .rd-hero::after{display:none;}
    .rd-mission .rd-prose{max-width:850px;margin:0;font-size:calc(.88rem * var(--rd-fs,1));line-height:var(--rd-lh,1.58);}
    .rd-mission .rd-prose h2{margin-top:2.8rem;padding:12px 0 8px;border-top:1px solid ${th.border};border-bottom:0;font-size:1.28rem;line-height:1.2;}
    .rd-mission .rd-prose h2::after{display:none;}
    .rd-mission .rd-prose p{max-width:800px;}
    .rd-mission .rd-footer{max-width:850px;margin-top:56px;}
    .rd-mission .rd-utility{display:flex;flex-direction:column;gap:26px;min-width:0;overflow:auto;padding:30px 18px;background:${th.surface};border-left:1px solid ${th.border};}
    .rd-mission .rd-utility__section{padding-bottom:22px;border-bottom:1px solid ${th.border};}
    .rd-mission .rd-utility__section:last-child{border-bottom:0;}
    .rd-mission .rd-utility__heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;color:${th.text};font-family:${F.mono};font-size:.62rem;font-weight:800;letter-spacing:.1em;}
    .rd-mission .rd-utility__heading small,.rd-mission .rd-utility__heading strong{color:${th.accent};font-size:.68rem;letter-spacing:0;}
    .rd-mission .rd-utility__toc{display:grid;gap:3px;}
    .rd-mission .rd-utility__toc button{display:flex;align-items:flex-start;gap:8px;width:100%;padding:7px 6px;border:0;border-left:2px solid transparent;border-radius:0;background:transparent;color:${th.textDim};cursor:pointer;font-size:.73rem;line-height:1.35;text-align:left;}
    .rd-mission .rd-utility__toc button i{width:5px;height:5px;flex:0 0 5px;margin-top:5px;border-radius:50%;background:${th.borderHi};}
    .rd-mission .rd-utility__toc button:hover,.rd-mission .rd-utility__toc button.is-active{border-left-color:${th.accent};background:${th.accentDim};color:${th.text};}
    .rd-mission .rd-utility__toc button.is-active i{background:${th.accent};}
    .rd-mission .rd-utility__empty,.rd-mission .rd-utility__muted{color:${th.textFaint};font-size:.72rem;}
    .rd-mission .rd-utility__progress{height:7px;margin-bottom:8px;overflow:hidden;border-radius:99px;background:${th.border};}
    .rd-mission .rd-utility__progress span{display:block;height:100%;border-radius:inherit;background:${th.accent};transition:width ${T.base} ${T.ease};}
    .rd-mission .rd-utility__quick{display:grid;gap:6px;}
    .rd-mission .rd-utility__quick .rd-utility__heading{margin-bottom:4px;}
    .rd-mission .rd-utility__quick button{padding:8px 0;border:0;background:transparent;color:${th.textDim};cursor:pointer;font-size:.75rem;text-align:left;}
    .rd-mission .rd-utility__quick button:hover{color:${th.accent};}
    .rd-mission .rd-utility__quick .rd-utility__ai{margin-top:6px;padding:10px;border:1px solid ${th.accent};border-radius:${R.md};color:${th.accent};font-weight:800;}
    .rd-mission .rd-panel-close{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;padding:0;border:1px solid ${th.border};border-radius:50%;background:${th.bg};color:${th.textDim};cursor:pointer;font-family:${F.body};font-size:1rem;line-height:1;}
    .rd-mission .rd-panel-close:hover{border-color:${th.accent};background:${th.accentDim};color:${th.accent};}
    .rd-mission .rd-lesson-nav__top .rd-panel-close{margin-left:auto;}
    .rd-mission .rd-lesson-nav__tree{overflow-x:hidden;}
    .rd-mission .rd-lesson-item__title{min-width:0;flex:1;overflow:hidden;}
    .rd-mission.lesson-nav-closed .rd-stage{grid-template-columns:0 minmax(0,1fr) 270px;}
    .rd-mission.utility-closed .rd-stage{grid-template-columns:280px minmax(0,1fr) 0;}
    .rd-mission.lesson-nav-closed.utility-closed .rd-stage{grid-template-columns:0 minmax(0,1fr) 0;}
    .rd-mission.lesson-nav-closed .rd-rail,.rd-mission.utility-closed .rd-utility{visibility:hidden;pointer-events:none;overflow:hidden;}
    .rd-mission.utility-closed .rd-utility{padding:0;border-left:0;}
    .rd-mission .rd-panel-reopen{position:absolute;top:18px;z-index:20;display:flex;align-items:center;justify-content:center;width:30px;height:42px;border:1px solid ${th.border};background:${th.surface};color:${th.accent};cursor:pointer;font-size:1.2rem;box-shadow:0 4px 14px rgba(31,41,55,.12);}
    .rd-mission .rd-panel-reopen--left{left:0;border-left:0;border-radius:0 ${R.md} ${R.md} 0;}
    .rd-mission .rd-panel-reopen--right{right:0;border-right:0;border-radius:${R.md} 0 0 ${R.md};}
    .rd-mission .rd-toolbar,.rd-mission .rd-stage,.rd-mission .rd-main,.rd-mission .rd-scroll,.rd-mission .rd-content,.rd-mission .rd-rail,.rd-mission .rd-utility,.rd-mission .rd-lesson-nav{background:${th.bg}!important;}
    .rd-mission .rd-toolbar{height:58px;min-height:58px;border-bottom:0!important;box-shadow:none!important;}
    .rd-mission .rd-stage{border-top:0;}
    .rd-mission .rd-highlighter{position:absolute;left:50%;transform:translateX(-50%);}
    .reader-layout{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important;}
    .reader-layout .main{height:100%;min-width:0;min-height:0;overflow:hidden;}
    .reader-layout .rd{height:100%;}
    .reader-layout .header{display:none!important;}
    .rd-reader-back{width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:${th.textDim};cursor:pointer;font-size:1.15rem;}
    .rd-reader-back:hover{background:${th.accentDim};color:${th.accent};}
    .rd-toolbar-title{display:flex;min-width:130px;max-width:240px;flex:0 1 220px;flex-direction:column;gap:2px;margin-right:8px;}
    .rd-top-nav{display:flex;align-items:center;gap:4px;flex:0 0 auto;}
    .rd-top-nav__button{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 8px;border:1px solid ${th.border};border-radius:${R.md};background:${th.surface};color:${th.textDim};cursor:pointer;font-family:${F.body};font-size:.68rem;font-weight:800;white-space:nowrap;}
    .rd-top-nav__button:hover{border-color:${th.accent};background:${th.accentDim};color:${th.accent};}
    .rd-mission .rd-reader-back,.rd-mission .rd-toolbar-title{display:none!important;}
    .rd-toolbar-title small{overflow:hidden;color:${th.textFaint};font-family:${F.mono};font-size:.56rem;font-weight:800;letter-spacing:.1em;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap;}
    .rd-toolbar-title strong{overflow:hidden;color:${th.text};font-size:.78rem;text-overflow:ellipsis;white-space:nowrap;}
    @media(max-width:1100px){
      .rd-mission .rd-stage{grid-template-columns:260px minmax(0,1fr) 220px;}
      .rd-mission .rd-content{padding-left:48px;padding-right:48px;}
      .rd-mission .rd-utility{padding-left:14px;padding-right:14px;}
      .rd-mission .rd-highlighter{position:static;transform:none;}
      .rd-mission.lesson-nav-closed .rd-stage{grid-template-columns:0 minmax(0,1fr) 220px;}
      .rd-mission.utility-closed .rd-stage{grid-template-columns:260px minmax(0,1fr) 0;}
    }
    @media(max-width:860px){
      .rd-mission .rd-stage{display:block;overflow:auto;}
      .rd-mission .rd-rail{position:relative;left:auto;top:auto;bottom:auto;width:100%;max-height:360px;z-index:1;transform:none;box-shadow:none;}
      .rd-mission .rd-rail.is-open{transform:translateX(0);}
      .rd-mission .rd-utility{display:none;}
      .rd-mission .rd-content{padding:36px 28px 100px;}
    }
    @media(max-width:560px){
      .rd-mission .rd-content{padding:28px 18px 90px;}
      .rd-mission .rd-title{font-size:2.35rem;}
      .rd-mission .rd-prose{font-size:calc(1rem * var(--rd-fs,1));}
      .rd-mission .rd-toolbar-left{overflow:hidden;}
      .rd-mission .rd-toolbar-right .rd-chip{display:none;}
      .rd-toolbar-title{min-width:0;max-width:145px;flex-basis:145px;margin-right:4px;}
      .rd-toolbar-title strong{font-size:.7rem;}
      .rd-top-nav__button span{display:none;}
      .rd-mission .rd-tabs .rd-tab{padding-inline:8px;}
    }
  `;

  return (
    <div
      className={`rd rd-root rd-mission${focusMode ? ' is-focus' : ''}${lessonNavOpen ? '' : ' lesson-nav-closed'}${utilityOpen ? '' : ' utility-closed'}`}
      style={{
        ['--rd-fs' as any]: prefs.fontScale,
        ['--rd-lh' as any]: prefs.lineHeight,
      }}
    >
      <style>{css}</style>

      {/* ── Toolbar ── */}
      <div className="rd-toolbar" role="toolbar">
        <div className="rd-toolbar-left">
          <div className="rd-top-nav" aria-label="Course navigation">
            <button type="button" className="rd-top-nav__button" onClick={onGoHome} aria-label="Go to dashboard" title="Go to dashboard">⌂ <span>Dashboard</span></button>
            <button type="button" className="rd-top-nav__button" onClick={onSwitchCourse} aria-label="Switch course" title="Switch course">⇄ <span>Courses</span></button>
          </div>
          <button className="rd-reader-back" type="button" onClick={() => window.history.back()} aria-label="Go back">←</button>
          <div className="rd-toolbar-title"><small>{noteData?.module || 'Course lesson'}</small><strong>{cleanTitle}</strong></div>
          {/* Mode tabs */}
          <div className="rd-tabs" role="tablist">
            {(['read', 'watch', 'blueprint'] as const).map((m, i) => (
              <button
                key={m} role="tab" aria-selected={mode === m}
                className={`rd-tab${mode === m ? ' active' : ''}`}
                onClick={() => setMode(m)}
              >
                {['Read', 'Watch', 'Blueprint'][i]}
              </button>
            ))}
          </div>
          {hasFiles && (
            <button
              className={`rd-btn${activeTab === 'files' ? ' primary' : ''}`}
              onClick={() => onTabChange(activeTab === 'files' ? 'notes' : 'files')}
            >
              Files
            </button>
          )}
        </div>

        {mode === 'read' && activeTab === 'notes' && (
          <div className="rd-highlighter" role="toolbar" aria-label="Text highlighter">
            <span className="rd-highlighter-label">Highlight</span>
            {HIGHLIGHT_COLORS.map(color => (
              <button
                key={color.id}
                type="button"
                className={`rd-color${highlightColor === color.id && !eraseHighlights ? ' active' : ''}`}
                style={{ backgroundColor: color.value }}
                onClick={() => { setHighlightColor(color.id); setEraseHighlights(false); }}
                aria-label={`Use ${color.label} highlighter`}
                aria-pressed={highlightColor === color.id && !eraseHighlights}
                title={`${color.label} highlighter`}
              />
            ))}
            <button
              type="button"
              className={`rd-btn rd-erase${eraseHighlights ? ' active' : ''}`}
              onClick={() => setEraseHighlights(v => !v)}
              aria-pressed={eraseHighlights}
              title="Select highlighted text to erase it"
            >
              {eraseHighlights ? 'ERASING' : 'ERASER'}
            </button>
            <button
              type="button"
              className="rd-btn rd-erase"
              onClick={clearHighlights}
              disabled={highlights.length === 0}
              title="Remove every highlight in this lesson"
            >
              CLEAR <span className="rd-highlight-count">{highlights.length}</span>
            </button>
          </div>
        )}
        <div className="rd-toolbar-right">
          <span className="rd-chip" aria-live="polite">{Math.round(readingPct)}%</span>
          <span className="rd-chip">{minutesLeft} MIN</span>
          <span className="rd-chip">{currentIdx + 1} / {totalCount}</span>

          <button className="rd-btn icon" onClick={onShowShortcuts} aria-label="Keyboard shortcuts" title="Shortcuts (?)">?</button>
          <button className="rd-btn" onClick={onPrev} disabled={!onPrev} aria-label="Previous lesson">← Prev</button>
          <button className="rd-btn primary" onClick={onNext} disabled={!onNext} aria-label="Next lesson">Next →</button>
        </div>
      </div>

      {/* ── Stage ── */}
      <div className="rd-stage">
        {!lessonNavOpen && <button className="rd-panel-reopen rd-panel-reopen--left" type="button" onClick={() => setLessonNavOpen(true)} aria-label="Open lesson navigator" title="Open lesson navigator">›</button>}
        {!utilityOpen && <button className="rd-panel-reopen rd-panel-reopen--right" type="button" onClick={() => setUtilityOpen(true)} aria-label="Open reader tools" title="Open reader tools">‹</button>}

        {/* Rail / TOC */}
        <aside
          className={`rd-rail${tocCollapsed ? ' collapsed' : ''}`}
          aria-label="On this page"
          style={{ display: mode === 'read' && activeTab === 'notes' ? undefined : 'none' }}
        >
          <LessonNavigator modules={modules} currentPart={currentPart} completedParts={completedParts} bookmarkedParts={bookmarkedParts} onSelectPart={onSelectPart} onNext={onNext} onClose={() => setLessonNavOpen(false)} />
          {modules.find(module => module.notes.some(note => note.part === currentPart))?.moduleNote && (
            <div className="rd-module-note" aria-label="Module notes">
              <strong>MODULE NOTES</strong>
              <MarkdownRenderer content={modules.find(module => module.notes.some(note => note.part === currentPart))?.moduleNote?.notes || ''} />
            </div>
          )}
          <div className="rd-rail-inner">
            <div className="rd-rail-head">
              {!tocCollapsed && <span className="rd-rail-heading">CONTENTS</span>}
              <button
                className="rd-rail-toggle"
                onClick={() => setTocCollapsed(v => !v)}
                aria-label={tocCollapsed ? 'Expand outline' : 'Collapse outline'}
              >
                {tocCollapsed ? '›' : '‹'}
              </button>
            </div>

            {!tocCollapsed && (
              <>
                <input
                  className="rd-rail-search"
                  placeholder="Filter sections..."
                  value={tocQuery}
                  onChange={e => setTocQuery(e.target.value)}
                  aria-label="Filter table of contents"
                />
                {filteredToc.length === 0
                  ? <div className="rd-toc-empty">{toc.length === 0 ? 'No headings' : 'No matches'}</div>
                  : filteredToc.map((t, i) => (
                    <a
                      key={t.id}
                      href={`#${t.id}`}
                      className={`rd-toc-item lvl-${t.level}${activeId === t.id ? ' active' : ''}`}
                      onClick={e => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                    >
                      <span className="rd-toc-num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="rd-toc-text">{t.text}</span>
                    </a>
                  ))
                }

                <div className="rd-rail-divider" />
                <div className="rd-rail-progress-track">
                  <div className="rd-rail-progress-fill" style={{ width: `${((currentIdx + 1) / totalCount) * 100}%` }} />
                </div>
                <div className="rd-rail-progress-label">LESSON {currentIdx + 1} OF {totalCount}</div>
              </>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="rd-main">
          <div className="rd-mission-strip" aria-label="Lesson mission progress">
            <div className="rd-mission-strip__label"><span>MISSION {String(currentIdx + 1).padStart(2, '0')}</span><small>{currentIdx + 1} of {totalCount} checkpoints</small></div>
            <div className="rd-mission-strip__track" role="progressbar" aria-valuemin={0} aria-valuemax={totalCount} aria-valuenow={currentIdx + 1}><span style={{ width: `${totalCount ? ((currentIdx + 1) / totalCount) * 100 : 0}%` }} /></div>
            <div className="rd-mission-strip__status">{isCompleted ? 'CHECKPOINT CLEARED' : `${Math.round(readingPct)}% IN PROGRESS`}</div>
          </div>
          <div className="rd-scroll" ref={scrollRef} id="main-content">
            <div className="rd-content">

              {/* Loading skeleton */}
              {loading && (
                <div style={{ padding: '8px 0' }}>
                  <div className="rd-skeleton" style={{ height: 24, width: '45%', marginBottom: 18 }} />
                  <div className="rd-skeleton" style={{ height: 16, marginBottom: 10 }} />
                  <div className="rd-skeleton" style={{ height: 16, width: '92%', marginBottom: 10 }} />
                  <div className="rd-skeleton" style={{ height: 16, width: '75%' }} />
                </div>
              )}

              {/* Files tab */}
              {!loading && activeTab === 'files' && noteData && (
                <div className="rd-files">
                  {noteData.files.length === 0
                    ? <div style={{ padding: 40, textAlign: 'center', color: th.textFaint, fontFamily: F.mono }}>No files attached to this lesson</div>
                    : noteData.files.map(f => <FileCard key={f.path} file={f} />)
                  }
                </div>
              )}

              {/* Read Mode */}
              {!loading && activeTab === 'notes' && mode === 'read' && noteData && (
                <>
                  <div className="rd-hero">
                    <div className="rd-kicker">
                      <span className="rd-badge accent">PART {noteData.part}</span>
                      <span className={`rd-badge ${noteData.importance === 'critical' ? 'pink' : noteData.importance === 'medium' ? 'accent' : 'lime'}`}>
                        {noteData.importance}
                      </span>
                      <span className="rd-badge cyan">{noteData.module}</span>
                      <button
                        className={`rd-btn icon${isBookmarked ? ' primary' : ''}`}
                        style={{ marginLeft: 'auto', padding: '4px 10px' }}
                        onClick={() => toggleBookmark(`lesson-${noteData.part}`)}
                        aria-pressed={isBookmarked}
                        title="Bookmark this lesson"
                      >
                        {isBookmarked ? '★ PINNED' : '☆ PIN'}
                      </button>
                    </div>
                    <h1 className="rd-title">{cleanTitle}</h1>
                    <div className="rd-submeta">
                      <span>{readTime} MIN READ</span>
                      <span className="dot">/</span>
                      <span>{wordCount} WORDS</span>
                      <span className="dot">/</span>
                      <span>{Math.round(readingPct)}% DONE</span>
                    </div>
                  </div>

                  <article ref={articleRef} className="rd-prose" onMouseUp={handleTextSelection} onTouchEnd={handleTextSelection} aria-label="Lesson content">
                    <MarkdownRenderer content={noteData.notes} components={markdownComponents} />
                  </article>

                  <div className="rd-footer">
                    <button
                      className={`rd-btn${isCompleted ? ' done' : ' primary'}`}
                      onClick={onToggleComplete}
                      aria-pressed={isCompleted}
                    >
                      {isCompleted ? '✓ MARKED COMPLETE' : `MARK COMPLETE · ${Math.round(readingPct)}% READ`}
                    </button>
                    {onNext && <button className="rd-btn" onClick={onNext}>CONTINUE TO NEXT →</button>}
                  </div>
                </>
              )}

              {/* Watch Mode */}
              {!loading && activeTab === 'notes' && mode === 'watch' && (
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                  <MultiVideoPlayer videoIds={videoIds} courseId={courseId} part={noteData?.part ?? 0} title={cleanTitle} loading={loading} />
                </div>
              )}

              {/* Blueprint Mode */}
              {!loading && activeTab === 'notes' && mode === 'blueprint' && (
                <div style={{ height: '70vh' }}>
                  <InteractiveBlueprint courseId={courseId} part={noteData?.part ?? 1} />
                </div>
              )}
            </div>
          </div>

          {/* Scroll to Top */}
          <button
            className={`rd-scroll-top${readingPct > 12 ? ' visible' : ''}`}
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
          >
            ↑
          </button>
        </main>
        <aside className="rd-utility" aria-label="Reader tools">
          <section className="rd-utility__section"><div className="rd-utility__heading"><span>ON THIS PAGE</span><small>{toc.length} sections</small><button className="rd-panel-close" type="button" onClick={() => setUtilityOpen(false)} aria-label="Close reader tools" title="Close reader tools">›</button></div><div className="rd-utility__toc">{toc.length === 0 ? <span className="rd-utility__empty">Headings appear here</span> : toc.map(item => <button type="button" key={item.id} className={activeId === item.id ? 'is-active' : ''} onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><i />{item.text}</button>)}</div></section>
          <section className="rd-utility__section"><div className="rd-utility__heading"><span>READING PROGRESS</span><strong>{Math.round(readingPct)}%</strong></div><div className="rd-utility__progress"><span style={{ width: `${readingPct}%` }} /></div><small className="rd-utility__muted">{minutesLeft} minutes remaining</small></section>
          <section className="rd-utility__section rd-utility__quick"><div className="rd-utility__heading"><span>QUICK ACTIONS</span></div><button type="button" onClick={() => toggleBookmark(`lesson-${noteData?.part ?? currentPart}`)}>★ {isBookmarked ? 'Bookmarked' : 'Bookmark lesson'}</button><button type="button" onClick={onShowShortcuts}>⌘ Keyboard shortcuts</button><button type="button" onClick={onToggleComplete}>{isCompleted ? '✓ Checkpoint complete' : '○ Mark checkpoint complete'}</button><button type="button" className="rd-utility__ai" onClick={() => setAiOpen(true)}>✦ Ask AI about this lesson</button></section>
        </aside>
      </div>
      <LessonAIMentor open={aiOpen} onClose={() => setAiOpen(false)} lesson={{ course: courseId, module: noteData?.module || 'Current module', title: cleanTitle, notes: noteData?.notes || '', progress: Math.round(readingPct) }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CODE BLOCK
   ═══════════════════════════════════════════════════════════════════════════ */
function CodeBlock({ lang, code, fileName, output }: { lang: string; code: string; fileName?: string; output?: string }) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showLineNos, setShowLineNos] = useState(true);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copy = useCallback(async () => {
    try {
      await copyText(code);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch { setCopied(false); }
  }, [code]);
  const lines = useMemo(() => code.split('\n'), [code]);
  const isLong = lines.length > 24;

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);

  return (
    <div className={`rd-code${fullscreen ? ' fullscreen' : ''}`}>
      <div className="rd-code-head">
        <span>
          <span className="rd-code-lang">{lang}</span>
          {fileName && <span className="rd-code-file">{fileName}</span>}
        </span>
        <div className="rd-code-actions">
          {isLong && <button className="rd-code-btn" onClick={() => setCollapsed(v => !v)} aria-expanded={!collapsed}>{collapsed ? 'EXPAND' : 'COLLAPSE'}</button>}
          <button className={`rd-code-btn${showLineNos ? ' on' : ''}`} onClick={() => setShowLineNos(v => !v)} aria-pressed={showLineNos} title="Toggle line numbers">#</button>
          <button className={`rd-code-btn${wrap ? ' on' : ''}`} onClick={() => setWrap(v => !v)} aria-pressed={wrap} title="Toggle wrap">WRAP</button>
          <button className="rd-code-btn" onClick={() => setFullscreen(v => !v)} aria-pressed={fullscreen}>{fullscreen ? 'EXIT' : 'FULL'}</button>
          <button className="rd-code-btn" onClick={copy}>{copied ? '✓ COPIED' : 'COPY'}</button>
          <button className="rd-code-btn" onClick={() => downloadFile(fileName || `snippet.${lang}`, code)}>SAVE</button>
        </div>
      </div>
      {!collapsed && (
        <div className="rd-code-body">
          {showLineNos && (
            <div className="rd-code-linenos" aria-hidden="true">
              {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
          )}
          <pre className={wrap ? 'wrap' : ''}><code>{code}</code></pre>
        </div>
      )}
      {collapsed && <div className="rd-code-collapsed">{lines.length} lines hidden</div>}
      {output && !collapsed && (
        <div className="rd-code-output">
          <div className="rd-code-output-label">OUTPUT</div>
          <pre style={{ margin: 0 }}>{output}</pre>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FILE CARD
   ═══════════════════════════════════════════════════════════════════════════ */
function FileCard({ file }: { file: { path: string; content: string | null; isBinary?: boolean; url?: string } }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rd-file-card">
      <div className="rd-file-head">
        <span className="rd-file-name">{file.path}</span>
        <button
          className="rd-code-btn"
          onClick={() => { if (file.content) { navigator.clipboard.writeText(file.content); setCopied(true); setTimeout(() => setCopied(false), 1200); } }}
          disabled={!file.content}
        >
          {copied ? '✓ COPIED' : 'COPY'}
        </button>
      </div>
      {!file.isBinary && <pre className="rd-file-code">{file.content}</pre>}
    </div>
  );
}
