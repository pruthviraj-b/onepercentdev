'use client';

import { memo, useEffect, useRef, useState, useMemo, useCallback, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { NoteData, Module, PartMeta, isPartComplete } from '@/services/courseService';
import { getVideoIds } from '@/features/video/videos';
import MarkdownRenderer from './MarkdownRenderer';
import { fetchVideoTimestamp, saveVideoTimestamp } from '@/services/courseService';
import { C, CLight, F, R, S, T, L, FS, FONT_IMPORT, CalloutVariant, CALLOUT_MAP } from '@/shared/theme/theme';
import LessonAIMentor from './LessonAIMentor';
import { TextToSpeechPlayer } from './TextToSpeechPlayer';
import { LessonFocusTimer } from './LessonFocusTimer';
import { MilestoneIcon } from '@/components/course/MilestoneIcon';
import { loadTtsPreferences, resetTtsPreferences, TTS_SPEEDS, type TtsSpeed } from '@/services/ttsService';
import { getMilestones, hasMilestoneSystem, isMilestoneComplete, isMilestoneUnlocked, milestoneParts } from '@/features/certificates/milestones';

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
  completionAction?: ReactNode;
}

function MilestoneCurriculum({ courseId, modules, currentPart, completedParts, bookmarkedParts, onSelectPart }: Pick<Props, 'courseId' | 'modules' | 'currentPart' | 'completedParts' | 'bookmarkedParts' | 'onSelectPart'>) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const definitions = getMilestones(courseId);
  const renderNote = (note: PartMeta, nested = false) => {
    const completed = isPartComplete(note, completedParts);
    const active = currentPart === note.part;
    const bookmarked = bookmarkedParts.includes(note.part);
    return <button type="button" title={note.title} key={note.part} className={`rd-lesson-item${active ? ' is-active' : ''}${completed ? ' is-complete' : ''}`} onClick={() => onSelectPart(note.part)}><span className={`rd-lesson-item__state${completed ? ' is-verified' : active ? ' is-current' : ''}`} aria-hidden="true">{completed ? <svg className="rd-done-icon" viewBox="0 0 24 24"><path d="M5 12.5 9.2 17 19 7" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : active ? '→' : ''}</span><span className="rd-lesson-item__title">{nested ? note.title.replace(/^Part\s+\d+(?:\.\d+)?\s*[-–—]?\s*/i, '') : note.title.replace(/^Part\s+\d+(?:\.\d+)?\s*[-–—]?\s*/i, '')}</span>{bookmarked && <span className="rd-lesson-item__bookmark">★</span>}</button>;
  };
  return <div className="rd-milestone-curriculum">{definitions.map((definition, index) => {
    const groupedModules = definition.moduleIds.map(id => modules.find(module => module.id === id)).filter(Boolean) as Module[];
    const parts = milestoneParts(groupedModules, definition);
    const done = parts.filter(part => completedParts.includes(part)).length;
    const complete = isMilestoneComplete(modules, completedParts, definition);
    const open = !collapsed.has(definition.id);
    const previousComplete = isMilestoneUnlocked(courseId, modules, completedParts, definition);
    return <section key={definition.id} className="rd-milestone-group" data-state={definition.locked ? 'locked' : complete ? 'complete' : previousComplete ? 'unlocked' : 'upcoming'}><button type="button" className="rd-milestone-group__header" onClick={() => setCollapsed(value => { const next = new Set(value); next.has(definition.id) ? next.delete(definition.id) : next.add(definition.id); return next; })}><MilestoneIcon index={definition.index} size={24} /><strong>{definition.name}</strong><small>{definition.locked ? 'LOCKED' : `${done}/${parts.length} lessons`}</small><em>{open ? '⌃' : '⌄'}</em></button>{open && <div className="rd-milestone-group__body">{definition.locked ? <div className="rd-milestone-group__lock">Capstone required</div> : groupedModules.map(module => <section key={module.id} className="rd-lesson-module"><div className="rd-lesson-module__header"><span><small>MODULE {module.id}</small><strong>{module.title}</strong></span></div><div className="rd-lesson-module__lessons">{module.notes.map(note => <div key={note.part}>{renderNote(note)}{(note.subtopics || []).map(subtopic => renderNote(subtopic, true))}</div>)}</div></section>)}</div>}</section>;
  })}</div>;
}

function LessonNavigator({ modules, currentPart, completedParts, bookmarkedParts, onSelectPart, onNext, onClose, courseId }: Pick<Props, 'modules' | 'currentPart' | 'completedParts' | 'bookmarkedParts' | 'onSelectPart' | 'courseId'> & { onNext?: () => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const normalized = query.trim().toLowerCase();
  const visibleModules = modules.map(module => ({ ...module, notes: module.notes.filter(note => !normalized || note.title.toLowerCase().includes(normalized)) })).filter(module => !normalized || module.notes.length > 0 || module.title.toLowerCase().includes(normalized));
  return <aside className="rd-lesson-nav" aria-label="Course lessons">
    <div className="rd-lesson-nav__top"><div><span className="rd-lesson-nav__eyebrow">COURSE PROGRESS</span><strong>{completedParts.length} / {modules.reduce((sum, module) => sum + module.notes.length, 0)} lessons</strong></div><span className="rd-lesson-nav__percent">{Math.round((completedParts.length / Math.max(1, modules.reduce((sum, module) => sum + module.notes.length, 0))) * 100)}%</span><button className="rd-panel-close" type="button" onClick={onClose} aria-label="Close lesson navigator" title="Close lesson navigator">‹</button></div>
    <div className="rd-lesson-nav__progress"><span style={{ width: `${(completedParts.length / Math.max(1, modules.reduce((sum, module) => sum + module.notes.length, 0))) * 100}%` }} /></div>
    <label className="rd-lesson-nav__search"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search lessons" aria-label="Search lessons" /></label>
    <div className="rd-lesson-nav__actions"><button type="button" onClick={() => setCollapsed(new Set(visibleModules.map(module => module.id)))}>Collapse all</button><button type="button" onClick={() => setCollapsed(new Set())}>Expand all</button></div>
    {hasMilestoneSystem(courseId) && <MilestoneCurriculum courseId={courseId} modules={visibleModules} currentPart={currentPart} completedParts={completedParts} bookmarkedParts={bookmarkedParts} onSelectPart={onSelectPart} />}
    <div className="rd-lesson-nav__tree">{visibleModules.map(module => { const isCollapsed = collapsed.has(module.id); return <section key={module.id} className="rd-lesson-module"><button type="button" className="rd-lesson-module__header" onClick={() => setCollapsed(previous => { const next = new Set(previous); next.has(module.id) ? next.delete(module.id) : next.add(module.id); return next; })}><span className="rd-lesson-module__chevron">{isCollapsed ? '›' : '⌄'}</span><span><small>MODULE {module.id}</small><strong>{module.title}</strong></span></button>{!isCollapsed && <div className="rd-lesson-module__lessons">{module.notes.map(note => { const completed = completedParts.includes(note.part); const active = currentPart === note.part; const bookmarked = bookmarkedParts.includes(note.part); return <button type="button" title={note.title} key={note.part} className={`rd-lesson-item${active ? ' is-active' : ''}${completed ? ' is-complete' : ''}`} onClick={() => onSelectPart(note.part)}><span className={`rd-lesson-item__state${completed ? ' is-verified' : active ? ' is-current' : ''}`} aria-hidden="true">{completed ? <svg className="rd-done-icon" viewBox="0 0 24 24"><path d="M5 12.5 9.2 17 19 7" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : active ? '→' : ''}</span><span className="rd-lesson-item__title">{note.title.replace(/^Part\s+\d+(?:\.\d+)?\s*[-–—]?\s*/i, '')}</span>{bookmarked && <span className="rd-lesson-item__bookmark">★</span>}</button>; })}</div>}</section>; })}</div>
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
  completionAction,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [readingPct, setReadingPct] = useState(0);
  const [mode, setMode] = useState<ReaderMode>('read');
  const [focusMode, setFocusMode] = useState(false);
  const [lessonFocusActive, setLessonFocusActive] = useState(false);
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
  const [utilityHubOpen, setUtilityHubOpen] = useState(false);
  const [utilityQuery, setUtilityQuery] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [ttsActiveText, setTtsActiveText] = useState('');
  const [ttsActivePosition, setTtsActivePosition] = useState({ index: -1, total: 0 });
  const [ttsRate, setTtsRate] = useState<TtsSpeed>(() => loadTtsPreferences().rate);
  const [ttsVoiceName, setTtsVoiceName] = useState(() => loadTtsPreferences().voiceName);
  const [ttsPitch, setTtsPitch] = useState(() => loadTtsPreferences().pitch);
  const [ttsVolume, setTtsVolume] = useState(() => loadTtsPreferences().volume);
  const [ttsVoices, setTtsVoices] = useState<SpeechSynthesisVoice[]>([]);

  const emitTtsPreference = useCallback((detail: { voiceName?: string; rate?: TtsSpeed; pitch?: number; volume?: number }) => {
    window.dispatchEvent(new CustomEvent('tts-preference-change', { detail }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => setTtsVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);
  const readingPctRef = useRef(0);
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!utilityHubOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setUtilityHubOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [utilityHubOpen]);

  useEffect(() => { setBookmarks(loadBookmarks()); }, []);

  useEffect(() => {
    setHighlights(loadHighlights(courseId, noteData?.part));
    setEraseHighlights(false);
  }, [courseId, noteData?.part]);

  useEffect(() => {
    const article = articleRef.current;
    if (article && mode === 'read' && activeTab === 'notes') paintReaderHighlights(article, highlights);
  }, [highlights, mode, activeTab, noteData?.part]);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    const active = ttsActiveText.replace(/\s+/g, ' ').trim().toLowerCase();
    const elements = Array.from(article.querySelectorAll<HTMLElement>('[data-tts-paragraph]'));
    const positionTarget = ttsActivePosition.index >= 0 && ttsActivePosition.total > 0
      ? Math.min(elements.length - 1, Math.floor((ttsActivePosition.index / ttsActivePosition.total) * elements.length))
      : -1;
    elements.forEach((element, elementIndex) => {
      const text = (element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const isTable = element.classList.contains('rd-table-wrap');
      const isActive = elementIndex === positionTarget || Boolean(active && ((text.includes(active) || active.includes(text)) || (isTable && active.startsWith('table row:'))));
      element.toggleAttribute('data-tts-active', isActive);
      if (isActive) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [ttsActivePosition, ttsActiveText, noteData?.part]);

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

  const handleLessonFocusModeChange = useCallback((active: boolean) => {
    setLessonFocusActive(active);
    setFocusMode(active);
    setLessonNavOpen(!active);
    setUtilityOpen(!active);
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

  /* Keep the outline's active item visible while the notes remain the
     authoritative scroll surface. */
  useEffect(() => {
    if (!activeId || !utilityOpen) return;
    document.querySelector<HTMLElement>('.rd-utility__toc button.is-active')?.scrollIntoView({ block: 'nearest' });
  }, [activeId, utilityOpen]);

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
  const displayNotes = useMemo(() => {
    const raw = noteData?.notes || '';
    return raw.replace(/^\uFEFF?\s*#\s+[^\r\n]*(?:\r?\n){1,2}/, '');
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
    table({ children }: any) { return <div className="rd-table-wrap" data-tts-paragraph><table>{children}</table></div>; },
    img({ src, alt, ...props }: any) {
      return <img {...props} src={src} alt={alt || ''} loading="lazy" decoding="async" />;
    },
    p({ children, ...props }: any) { return <p data-tts-paragraph {...props}>{children}</p>; },
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
    .rd-nav-menu{position:relative;display:flex;align-items:center;}
    .rd-nav-menu__trigger{display:grid;place-items:center;width:52px;height:44px;padding:0;border:2px solid ${th.accent};border-radius:10px;background:${th.surfaceHi};color:${th.accent};box-shadow:3px 3px 0 ${th.accent};cursor:pointer;}
    .rd-nav-menu__trigger:hover,.rd-nav-menu__trigger[aria-expanded="true"]{background:${th.accent};color:${th.surfaceHi};transform:translate(-1px,-1px);box-shadow:4px 4px 0 ${th.border};}
    .rd-nav-menu__icon{display:flex;flex-direction:column;gap:5px;width:22px;}
    .rd-nav-menu__icon i{display:block;height:2px;width:100%;border-radius:2px;background:currentColor;}
    .rd-nav-menu__panel{position:fixed;top:74px;left:18px;z-index:200;display:flex!important;flex-direction:column!important;gap:5px;width:190px;max-width:calc(100vw - 32px);padding:8px;background:${th.surfaceRaised};border:2px solid ${th.border};border-radius:${R.md};box-shadow:5px 5px 0 ${th.border};}
    .rd-nav-menu__item{display:block;width:100%;padding:9px 11px;border:1.5px solid transparent;border-radius:${R.sm};background:transparent;color:${th.textDim};font-family:${F.mono};font-size:${FS.xs};font-weight:800;text-align:left;text-transform:uppercase;cursor:pointer;}
    .rd-nav-menu__item:hover{background:${th.surfaceHover};border-color:${th.border};color:${th.text};}
    .rd-nav-menu__item.active{background:${th.accent};border-color:#1F2937;color:${th.onAccent};box-shadow:2px 2px 0 #1F2937;}
    /* The reader toolbar owns the completion/share actions. Keep the optional
       highlighter hidden here, but leave the right-side action group visible. */
    .rd-toolbar > .rd-highlighter{display:none!important;}
    .rd-mission .rd-toolbar-right{display:none!important;}
    .rd-toolbar-completion{display:flex;align-items:center;flex:0 0 auto;}
    .rd-utility-hub{position:fixed;right:24px;bottom:24px;z-index:120;display:flex;flex-direction:column;align-items:flex-end;gap:12px;font-family:${F.body};}
    .rd-utility-hub__trigger{display:grid;place-items:center;width:62px;height:62px;border:3px solid #1f2937;border-radius:50%;background:${th.accent};box-shadow:5px 5px 0 #1f2937,0 0 0 6px rgba(249,128,18,.16);color:#fff;cursor:pointer;font-size:1.45rem;font-weight:900;transition:transform .22s ease,box-shadow .22s ease,background .22s ease;}
    .rd-utility-hub__trigger:hover,.rd-utility-hub__trigger[aria-expanded="true"]{transform:translate(-2px,-3px) rotate(6deg);background:#ff9f2d;box-shadow:7px 8px 0 #1f2937,0 0 0 9px rgba(249,128,18,.2);}
    .rd-utility-hub__menu{display:grid;gap:12px;width:min(340px,calc(100vw - 32px));max-height:min(70vh,620px);overflow:auto;padding:16px;border:3px solid #1f2937;border-radius:18px;background:#fff;box-shadow:7px 7px 0 #1f2937;animation:rdHubIn .2s cubic-bezier(.22,1,.36,1) both;}
    .rd-utility-hub__header{display:flex;align-items:center;justify-content:space-between;padding:8px 10px 10px;border-bottom:3px solid #1f2937;color:#1f2937;}
    .rd-utility-hub__header strong{font-size:.8rem;letter-spacing:.08em;color:${th.accent};}
    .rd-utility-hub__header span{color:${th.textFaint};font-size:.62rem;}
    .rd-completion-message{margin:0;padding:0 4px;color:${th.textDim};font-size:.72rem;line-height:1.45;}
    .rd-completion-action{padding:4px;}
    .rd-utility-hub__section{display:grid;gap:6px;}
    .rd-utility-hub__section-label{padding:4px;color:${th.textFaint};font-size:.58rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;}
    .rd-utility-hub__actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
    .rd-utility-hub__action{display:flex;align-items:center;gap:8px;min-width:0;padding:10px;border:1px solid rgba(31,41,55,.1);border-radius:12px;background:rgba(255,255,255,.62);color:${th.text};cursor:pointer;font:600 .68rem ${F.body};text-align:left;transition:transform .16s ease,background .16s ease,border-color .16s ease,box-shadow .16s ease;}
    .rd-utility-hub__action:hover{transform:translateY(-2px);border-color:rgba(249,128,18,.38);background:rgba(255,255,255,.96);box-shadow:0 8px 18px rgba(31,41,55,.1);}
    .rd-utility-hub__action i{display:grid;place-items:center;width:24px;height:24px;flex:0 0 24px;border-radius:8px;background:rgba(249,128,18,.12);color:#e66f0a;font-style:normal;font-size:.85rem;}
    .rd-utility-hub__speed{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:2px solid ${th.border};border-radius:10px;background:${th.surface};color:${th.text};font-size:.68rem;font-weight:700;}
    .rd-utility-hub__speed select{min-width:82px;padding:6px 8px;border:1.5px solid ${th.border};border-radius:8px;background:${th.surfaceHi};color:${th.text};font:800 .68rem ${F.mono};}
    .rd-utility-hub__voice-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px;border:2px solid ${th.border};border-radius:10px;background:${th.surface};}
    .rd-utility-hub__voice-grid label{display:grid;gap:4px;color:${th.textDim};font:700 .62rem ${F.mono};}
    .rd-utility-hub__voice-grid label:first-child{grid-column:1/-1;}
    .rd-utility-hub__voice-grid select{min-width:0;padding:6px 8px;border:1.5px solid ${th.border};border-radius:8px;background:${th.surfaceHi};color:${th.text};font:700 .62rem ${F.mono};}
    .rd-utility-hub__voice-grid input[type=range]{width:100%;accent-color:${th.accent};}
    .rd-utility-hub__reset{justify-self:start;padding:7px 9px;border:2px solid ${th.border};border-radius:8px;background:${th.surfaceHi};color:${th.text};font:800 .6rem ${F.mono};cursor:pointer;}
    .rd-utility-hub__reset:hover{background:${th.accent};color:${th.onAccent};}
    .rd-utility-hub__tts{min-width:0;}
    .rd-utility-hub__tts .rd-tts{width:100%;max-width:100%;margin:0;height:auto;min-height:0;display:grid;grid-template-columns:1fr;gap:8px;padding:10px;position:relative;top:auto;box-sizing:border-box;}
    .rd-utility-hub__tts .rd-tts__topline,.rd-utility-hub__tts .rd-tts__progress-row,.rd-utility-hub__tts .rd-tts__controls,.rd-utility-hub__tts .rd-tts__now{position:static;inset:auto;width:auto;height:auto;grid-column:auto;}
    .rd-utility-hub__tts .rd-tts__topline{display:flex;}
    .rd-utility-hub__tts .rd-tts__controls{display:flex;flex-wrap:wrap;}
    .rd-utility-hub__tts .rd-tts__now{display:flex;}
    .rd-utility-hub__progress{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:2px solid #1f2937;border-radius:10px;background:#fff7ed;color:${th.textDim};font-size:.67rem;}
    .rd-utility-hub__progress strong{color:#e66f0a;}
    @keyframes rdHubIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
    @media (prefers-color-scheme:dark){.rd-utility-hub__menu{background:#fff;border-color:#1f2937;}.rd-utility-hub__action{background:#fff;border-color:#1f2937;color:#1f2937;}.rd-utility-hub__action:hover{background:#fff7ed;}.rd-utility-hub__trigger{background:${th.accent};color:#fff;}}
    .rd-highlighter{display:flex;align-items:center;gap:6px;padding:4px 7px;background:${th.bg};border:2px solid ${th.border};border-radius:${R.md};box-shadow:2px 2px 0 ${th.border}}
    .rd-highlighter-label{font-family:${F.mono};font-size:.62rem;font-weight:800;letter-spacing:.05em;color:${th.textDim};text-transform:uppercase;margin-right:2px}
    .rd-color{width:22px;height:22px;padding:0;border:2px solid ${th.border};border-radius:50%;cursor:pointer;box-shadow:1px 1px 0 ${th.border}}
    .rd-color.active{outline:2px solid ${th.text};outline-offset:2px}
    .rd-color:hover{transform:translateY(-1px)}
    .rd-erase{padding:4px 8px;min-height:28px;font-size:.62rem}
    .rd-erase.active{background:${th.text};color:${th.bg};border-color:${th.text}}
    .rd-highlight-count{font-family:${F.mono};font-size:.62rem;color:${th.textFaint};white-space:nowrap}
    .rd-prose [data-reader-highlight]{border-radius:3px;box-shadow:inset 0 -2px rgba(17,24,39,.15);padding:1px 0}
    .rd-prose [data-tts-active]{background:linear-gradient(90deg,rgba(249,128,18,.2),rgba(249,128,18,.06));border-left:4px solid ${th.accent};border-radius:0 ${R.sm} ${R.sm} 0;padding-left:12px;transition:background .2s ease,border-color .2s ease;}
    .rd-tts{position:sticky;top:6px;z-index:8;display:grid;gap:6px;margin:0 0 14px;padding:8px 12px;border:1px solid #333;border-radius:10px;background:#171717;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.18);}
    .rd-tts__topline,.rd-tts__progress-row,.rd-tts__controls{display:flex;align-items:center;gap:10px;}
    .rd-tts__topline{justify-content:space-between;}.rd-tts__topline-actions{display:flex;align-items:center;gap:6px;}.rd-tts__topline strong{display:block;font-size:.78rem;}.rd-tts__eyebrow{display:block;margin-bottom:1px;color:#1db954;font:800 .5rem ${F.mono};letter-spacing:.12em;}.rd-tts__estimate,.rd-tts__status{color:#b3b3b3;font:600 .58rem ${F.mono};}.rd-tts__expert-toggle{padding:4px 7px;border:1px solid #555;border-radius:999px;background:#252525;color:#fff;font:800 .54rem ${F.mono};cursor:pointer;}.rd-tts__expert-toggle.active{background:#1db954;border-color:#1db954;color:#06140a;}.rd-tts__now{display:flex;align-items:center;gap:8px;min-width:0;padding:5px 8px;border-left:3px solid #1db954;background:#252525;border-radius:0 6px 6px 0;}.rd-tts__now span{flex:0 0 auto;color:#1db954;font:800 .5rem ${F.mono};letter-spacing:.12em;}.rd-tts__now strong{min-width:0;overflow:hidden;color:#fff;font-size:.68rem;line-height:1.25;font-weight:650;text-overflow:ellipsis;white-space:nowrap;}.rd-tts__progress-row input{flex:1;accent-color:#1db954;}.rd-tts__progress-row span{min-width:78px;text-align:right;color:#b3b3b3;font:600 .58rem ${F.mono};}
    .rd-tts__controls button{display:inline-flex;align-items:center;justify-content:center;gap:2px;min-width:28px;height:26px;border:0;border-radius:999px;background:transparent;color:#fff;cursor:pointer;font:800 .62rem ${F.mono};}.rd-tts__controls button:hover:not(:disabled){color:#1db954;transform:translateY(-1px);}.rd-tts__controls button:disabled{opacity:.35;cursor:not-allowed;}.rd-tts__controls .rd-tts__play{width:32px;height:32px;border:0;background:#fff;color:#111;border-radius:50%;font-size:.8rem;}.rd-tts__speed{display:flex;align-items:center;gap:4px;margin-left:auto;color:#b3b3b3;font:700 .58rem ${F.mono};}.rd-tts__speed select,.rd-tts__settings-panel select{border:1px solid #555;border-radius:999px;background:#252525;color:#fff;padding:3px 6px;font:700 .6rem ${F.mono};}.rd-tts__settings-panel{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;border-top:1px solid #333;}.rd-tts__settings-panel label{display:grid;gap:4px;color:#b3b3b3;font:700 .58rem ${F.mono};}.rd-tts__settings-panel input[type=range]{accent-color:#1db954;}.rd-tts__reset{grid-column:1/-1;justify-self:start;padding:5px 8px;border:1px solid #777;border-radius:999px;background:#252525;color:#fff;cursor:pointer;font:800 .56rem ${F.mono};}.rd-tts__reset:hover{background:#1db954;border-color:#1db954;color:#06140a;}.rd-tts__settings-panel small{grid-column:1/-1;color:#b3b3b3;font:.58rem ${F.mono};}@media(max-width:640px){.rd-tts{padding:7px 9px;}.rd-tts__controls{flex-wrap:wrap;}.rd-tts__speed{margin-left:0;}.rd-tts__settings-panel{grid-template-columns:1fr;}.rd-tts__settings-panel small{grid-column:auto;}.rd-tts__reset{grid-column:auto;}}
    /* Compact reader bar: keep the player inside the green-box footprint. */
    .rd-tts{width:calc(100% + 160px);max-width:none;margin-left:-80px;height:82px;min-height:82px;box-sizing:border-box;display:block;position:sticky;overflow:visible;background:${th.surface};border:2px solid ${th.border};border-radius:${R.md};color:${th.text};box-shadow:4px 4px 0 ${th.border};}
    .rd-tts__topline{position:absolute;top:8px;left:12px;right:12px;height:18px;}
    .rd-tts__topline strong{color:${th.text};font-family:${F.body};}
    .rd-tts__eyebrow{color:${th.accent};}
    .rd-tts__estimate,.rd-tts__status{color:${th.textFaint};}
    .rd-tts__expert-toggle{border-color:${th.border};background:${th.surfaceHi};color:${th.text};}
    .rd-tts__expert-toggle.active{background:${th.accent};border-color:${th.border};color:${th.onAccent};}
    .rd-tts__progress-row{position:absolute;top:30px;left:12px;right:12px;height:10px;}
    .rd-tts__progress-row input{accent-color:${th.accent};}
    .rd-tts__progress-row span{color:${th.textFaint};}
    .rd-tts__controls{position:absolute;left:12px;right:12px;bottom:8px;height:32px;}
    .rd-tts__controls button{color:${th.text};}
    .rd-tts__controls button:hover:not(:disabled){color:${th.accent};}
    .rd-tts__controls .rd-tts__play{background:${th.accent};color:${th.onAccent};border:2px solid ${th.border};box-shadow:2px 2px 0 ${th.border};}
    .rd-tts__speed{color:${th.textDim};}
    .rd-tts__speed select,.rd-tts__settings-panel select{border-color:${th.border};background:${th.surfaceHi};color:${th.text};}
    .rd-tts__now{position:absolute;left:190px;right:175px;bottom:8px;height:22px;box-sizing:border-box;padding:3px 7px;}
    .rd-tts__now{border-left-color:${th.accent};background:${th.surfaceHi};}
    .rd-tts__now span{color:${th.accent};}
    .rd-tts__now strong{color:${th.text};font-family:${F.body};}
    .rd-tts__status{display:none;}
    .rd-tts__settings-panel{position:absolute;top:calc(100% + 7px);right:0;z-index:30;width:min(520px,calc(100vw - 32px));box-sizing:border-box;background:${th.surface};border:2px solid ${th.border};border-radius:${R.md};box-shadow:5px 5px 0 ${th.border};}
    .rd-tts__settings-panel label{color:${th.textDim};}
    .rd-tts__settings-panel input[type=range]{accent-color:${th.accent};}
    .rd-tts__reset{border-color:${th.border};background:${th.surfaceHi};color:${th.text};}
    .rd-tts__reset:hover{background:${th.accent};border-color:${th.border};color:${th.onAccent};}
    .rd-tts__settings-panel small{color:${th.textFaint};}
    .rd-tts__settings,.rd-tts__settings-panel{display:none!important;}
    @media(max-width:800px){.rd-tts{width:100%;margin-left:0;}.rd-tts__now{left:155px;right:145px;}}
    @media(max-width:640px){.rd-tts{height:88px;min-height:88px;}.rd-tts__now{left:12px;right:12px;bottom:7px;}.rd-tts__controls{bottom:34px;}.rd-tts__settings-panel{right:auto;left:0;width:min(100%,calc(100vw - 32px));}}
    /* Desktop stays on one horizontal line: identity, progress, controls, live text. */
    @media(min-width:801px){
      .rd-tts{height:72px;min-height:72px;display:grid;grid-template-columns:minmax(180px,1.1fr) minmax(220px,1.35fr) minmax(220px,1.3fr) minmax(170px,1fr);align-items:center;gap:12px;padding:9px 13px;}
      .rd-tts__topline,.rd-tts__progress-row,.rd-tts__controls,.rd-tts__now{position:static;inset:auto;width:auto;height:auto;min-width:0;}
      .rd-tts__topline{grid-column:1;}
      .rd-tts__progress-row{grid-column:2;display:flex;}
      .rd-tts__progress-row input{min-width:0;}
      .rd-tts__progress-row span{white-space:nowrap;}
      .rd-tts__controls{grid-column:3;display:flex;gap:6px;white-space:nowrap;}
      .rd-tts__controls button{flex:0 0 auto;}
      .rd-tts__now{grid-column:4;display:flex;}
      .rd-tts__topline-actions{min-width:0;}
      .rd-tts__estimate{white-space:nowrap;}
      .rd-tts__now strong{font-size:.62rem;}
    }

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
    .rd-mission .rd-lesson-nav{display:flex;height:100%;min-height:0;flex-direction:column;overflow-y:auto;overflow-x:hidden;padding:24px 16px 16px;scrollbar-gutter:stable;}
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
    .rd-mission .rd-milestone-curriculum + .rd-lesson-nav__tree{display:none;}
    .rd-milestone-curriculum{display:grid;gap:8px;min-height:0;height:auto;flex:0 0 auto;overflow:visible;padding-right:4px;padding-bottom:12px;}
    .rd-milestone-group{border:1px solid ${th.border};border-radius:10px;background:${th.surface};overflow:hidden;}
    .rd-milestone-group[data-state="complete"]{border-color:#22C55E;}
    .rd-milestone-group[data-state="locked"]{opacity:.8;background:${th.bg};}
    .rd-milestone-group__header{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:7px;width:100%;padding:9px 8px;border:0;background:transparent;color:${th.text};text-align:left;cursor:pointer;}
    .rd-milestone-group__header strong{font-size:.73rem;}.rd-milestone-group__header small{color:${th.textFaint};font:800 .52rem ${F.mono};}.rd-milestone-group__header em{font-style:normal;color:${th.accent};}
    .rd-milestone-group__body{padding:0 7px 7px;border-top:1px solid ${th.border};}.rd-milestone-group__lock{padding:10px;color:${th.textFaint};font-size:.66rem;}
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
    .rd-mission .rd-content{width:min(100%,950px);max-width:950px;margin:0 auto;padding:18px clamp(28px,6vw,96px) 140px;}
    .rd-mission .rd-content::before{display:none;}
    .rd-mission .rd-hero{width:100%;max-width:none;margin:0 0 54px;padding:0 0 28px;border-bottom:1px solid ${th.border};}
    .rd-mission .rd-title{max-width:850px;margin-top:12px;font-size:clamp(1.45rem,2vw,2.15rem);line-height:1.12;letter-spacing:-.035em;}
    .rd-mission .rd-hero::after{display:none;}
    .rd-mission .rd-prose{max-width:850px;margin:0;font-size:calc(.88rem * var(--rd-fs,1));line-height:var(--rd-lh,1.58);}
    .rd-mission .rd-prose h2{margin-top:2.8rem;padding:12px 0 8px;border-top:1px solid ${th.border};border-bottom:0;font-size:1.28rem;line-height:1.2;}
    .rd-mission .rd-prose h2::after{display:none;}
    .rd-mission .rd-prose p{max-width:800px;}
    .rd-mission .rd-footer{max-width:850px;margin-top:56px;}
    .rd-mission .rd-utility{display:flex;flex-direction:column;gap:26px;min-width:0;min-height:0;overflow:hidden;padding:30px 18px;background:${th.surface};border-left:1px solid ${th.border};}
    .rd-mission .rd-utility > .rd-focus-timer{position:relative;z-index:2;flex:0 0 auto;}
    .rd-mission .rd-utility > .rd-utility__section:nth-child(2){display:flex;flex-direction:column;min-height:0;flex:1 1 auto;overflow:hidden;}
    .rd-mission .rd-utility > .rd-utility__section:nth-child(2) .rd-utility__toc{min-height:0;flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain;padding-right:4px;scrollbar-gutter:stable;}
    .rd-focus-timer{display:grid;gap:8px;width:100%;max-width:260px;padding:10px;border:1.5px solid #263243;border-radius:10px;background:#fbf3e8;box-shadow:2px 2px 0 #263243;color:${th.text};}
    .rd-focus-timer__heading{display:flex;align-items:center;justify-content:space-between;font:800 .56rem ${F.mono};letter-spacing:.1em;color:${th.accent};}
    .rd-focus-timer__heading b{padding:3px 6px;border-radius:99px;background:#263243;color:#fff;font-size:.5rem;letter-spacing:.04em;}
    .rd-focus-timer__lesson{margin:0;color:${th.textDim};font-size:.66rem;font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .rd-focus-timer__clock{display:flex;align-items:center;gap:10px;padding:2px 2px 1px;}
    .rd-focus-timer__analog{position:relative;flex:0 0 58px;width:58px;height:58px;border:2px solid #263243;border-radius:50%;background:#f9f1e5;box-shadow:inset 0 0 0 2px #c8a268,1px 1px 0 #263243;}
    .rd-focus-timer__analog:before{content:'';position:absolute;inset:5px;border:1px solid #c8a268;border-radius:50%;background:repeating-conic-gradient(from -2deg,rgba(38,50,67,.6) 0 1deg,transparent 1deg 30deg);mask:radial-gradient(circle,transparent 0 72%,#000 73%);}
    .rd-focus-timer__tick{position:absolute;z-index:1;color:#263243;font:700 .4rem Georgia,serif;line-height:1;}
    .rd-focus-timer__tick--12{top:6px;left:50%;transform:translateX(-50%);}
    .rd-focus-timer__tick--3{top:50%;right:6px;transform:translateY(-50%);}
    .rd-focus-timer__tick--6{bottom:6px;left:50%;transform:translateX(-50%);}
    .rd-focus-timer__tick--9{top:50%;left:6px;transform:translateY(-50%);}
    .rd-focus-timer__hand{position:absolute;z-index:2;bottom:50%;left:50%;display:block;width:2px;border-radius:99px;background:#1f2937;transform-origin:50% 100%;}
    .rd-focus-timer__hand--minute{height:18px;}
    .rd-focus-timer__hand--second{height:22px;width:1px;background:${th.accent};}
    .rd-focus-timer__pin{position:absolute;z-index:3;top:50%;left:50%;width:6px;height:6px;border:1.5px solid #263243;border-radius:50%;background:${th.accent};transform:translate(-50%,-50%);}
    .rd-focus-timer__clock-copy{display:grid;gap:2px;min-width:0;}
    .rd-focus-timer__time{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
    .rd-focus-timer__clock span{color:${th.textFaint};font-size:.56rem;}
    .rd-focus-timer__track{height:5px;overflow:hidden;border-radius:99px;background:#ead4b5;}
    .rd-focus-timer__track i{display:block;height:100%;border-radius:inherit;background:${th.accent};transition:width .4s linear;}
    .rd-focus-timer__presets{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;}
    .rd-focus-timer__presets button,.rd-focus-timer__actions button{min-height:32px;padding:5px 4px;border:1.5px solid ${th.border};border-radius:7px;background:#fff;color:${th.text};font:800 .6rem ${F.mono};cursor:pointer;}
    .rd-focus-timer__presets button.is-selected{border-color:${th.accent};background:${th.accent};color:#fff;}
    .rd-focus-timer__presets button:disabled{cursor:not-allowed;opacity:.55;}
    .rd-focus-timer__actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
    .rd-focus-timer__actions button.primary,.rd-focus-timer__warning button:first-child{border-color:#1f2937;background:#1f2937;color:#fff;}
    .rd-focus-timer__warning{display:grid;gap:7px;padding:10px;border:2px solid ${th.accent};border-radius:10px;background:#fff;color:${th.text};font-size:.68rem;line-height:1.4;}
    .rd-focus-timer__warning span{color:${th.textDim};}
    .rd-focus-timer__warning div{display:flex;gap:6px;}
    .rd-focus-timer__warning button{flex:1;padding:7px 4px;border:1.5px solid ${th.border};border-radius:7px;background:#fff;color:${th.text};font:800 .62rem ${F.mono};cursor:pointer;}
    .rd-focus-timer__sound{display:flex;align-items:center;gap:6px;color:${th.textDim};font-size:.58rem;cursor:pointer;}
    .rd-focus-timer__sound input{accent-color:${th.accent};}
    .rd-focus-timer__hint{color:${th.textFaint};font-size:.52rem;line-height:1.3;}
    .rd-toolbar .rd-focus-timer--header{display:grid;grid-template-columns:auto minmax(160px,1fr);align-items:center;gap:8px;width:min(430px,36vw);max-width:430px;padding:6px 9px;border:1px solid ${th.border};border-radius:9px;background:${th.surface};box-shadow:2px 2px 0 ${th.border};}
    .rd-toolbar .rd-focus-timer--header .rd-focus-timer__heading{display:flex;gap:6px;align-items:center;font-size:.48rem;white-space:nowrap;}
    .rd-toolbar .rd-focus-timer--header .rd-focus-timer__heading b{font-size:.44rem;padding:2px 5px;}
    .rd-toolbar .rd-focus-timer--header .rd-focus-timer__lesson,.rd-toolbar .rd-focus-timer--header .rd-focus-timer__clock,.rd-toolbar .rd-focus-timer--header .rd-focus-timer__track,.rd-toolbar .rd-focus-timer--header .rd-focus-timer__sound{display:none;}
    .rd-toolbar .rd-focus-timer--header .rd-focus-timer__notify{min-width:0;}
    .rd-toolbar .rd-focus-timer--header .rd-focus-timer__notify button{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:28px;padding:4px 8px;border:1px solid ${th.border};border-radius:6px;background:${th.surfaceHi};color:${th.text};cursor:pointer;font:700 .58rem ${F.body};text-align:left;white-space:nowrap;}
    .rd-toolbar .rd-focus-timer--header .rd-focus-timer__notify button:hover{border-color:${th.accent};background:${th.accentDim};}
    .rd-toolbar .rd-focus-timer--header .rd-focus-timer__notify strong{font:800 .72rem ${F.mono};color:${th.accent};}
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
    .rd-top-nav__button{display:inline-flex;align-items:center;justify-content:center;width:34px;height:30px;padding:0;border:1px solid ${th.border};border-radius:${R.md};background:${th.surface};color:${th.textDim};cursor:pointer;font-family:${F.body};font-size:.8rem;font-weight:800;white-space:nowrap;}
    .rd-top-nav__button:hover{border-color:${th.accent};background:${th.accentDim};color:${th.accent};}
    .rd-mission .rd-top-nav__home{width:34px;height:34px;border:0;background:transparent;color:inherit;box-shadow:none;}
    .rd-mission .rd-top-nav__home:hover{border:0;background:transparent;transform:none;}
    .rd-mission .rd-top-nav__home img{display:block;width:25px;height:25px;object-fit:contain;}
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
      .rd-mission .rd-content{padding:18px 28px 100px;}
    }
    @media(max-width:560px){
      .rd-mission .rd-content{padding:18px 18px 90px;}
      .rd-mission .rd-utility{width:calc(100vw - 16px)!important;max-width:none!important;padding:0 16px 28px!important;gap:26px!important;touch-action:pan-y;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}
      .rd-mission .rd-utility > .rd-utility__section{flex:0 0 auto!important;min-height:0!important;overflow:visible!important;}
      .rd-mission .rd-utility > .rd-utility__section:first-child{display:block!important;overflow:visible!important;}
      .rd-mission .rd-utility > .rd-utility__section:first-child .rd-utility__toc{max-height:calc(100dvh - 220px)!important;overflow-y:auto!important;overscroll-behavior:contain;touch-action:pan-y;padding-right:4px;}
      .rd-mission .rd-utility__section{padding-bottom:16px!important;}
      .rd-mission .rd-focus-timer__presets button,.rd-mission .rd-focus-timer__actions button{min-height:40px!important;padding:7px 4px!important;font-size:.64rem!important;}
      .rd-mission .rd-focus-timer__sound{font-size:.62rem!important;}
      .rd-mission .rd-focus-timer__hint{font-size:.58rem!important;line-height:1.4!important;}
      .rd-toolbar .rd-focus-timer--header{order:4;width:100%;max-width:none;grid-template-columns:auto minmax(0,1fr);padding:5px 7px;}
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
      className={`rd rd-root rd-mission${focusMode ? ' is-focus' : ''}${lessonFocusActive ? ' is-lesson-focus' : ''}${lessonNavOpen ? '' : ' lesson-nav-closed'}${utilityOpen ? '' : ' utility-closed'}`}
      style={{
        ['--rd-fs' as any]: prefs.fontScale,
        ['--rd-lh' as any]: prefs.lineHeight,
      }}
    >
      <style>{css}</style>

      {/* ── Toolbar ── */}
      <div className="rd-toolbar" role="toolbar">
        <div className="rd-toolbar-left">
          {!lessonFocusActive && <button type="button" className="rd-top-nav__button rd-top-nav__home" onClick={onGoHome} aria-label="Go to home" title="Go to home"><img src="/logos/home-neo.svg" alt="" width="24" height="24" /></button>}
          {false && <div className="rd-top-nav" aria-label="Course navigation">
            <button type="button" className="rd-top-nav__button" onClick={onGoHome} aria-label="Go to dashboard" title="Go to dashboard"><img src="/logos/home-neo.svg" alt="" width="24" height="24" /><span>Dashboard</span></button>
            <button type="button" className="rd-top-nav__button" onClick={onSwitchCourse} aria-label="Switch course" title="Switch course">⇄ <span>Courses</span></button>
          </div>}
          <button className="rd-reader-back" type="button" onClick={() => window.history.back()} aria-label="Go back">←</button>
          <div className="rd-toolbar-title"><small>{noteData?.module || 'Course lesson'}</small><strong>{cleanTitle}</strong></div>
          {false && <div className="rd-tabs" role="tablist">
            {(['read', 'watch', 'blueprint'] as const).map((m, i) => (
              <button
                key={m} role="tab" aria-selected={mode === m}
                className={`rd-tab${mode === m ? ' active' : ''}`}
                onClick={() => setMode(m)}
              >
                {['Read', 'Watch', 'Blueprint'][i]}
              </button>
            ))}
          </div>}
          {hasFiles && (
            <button
              className={`rd-btn${activeTab === 'files' ? ' primary' : ''}`}
              onClick={() => onTabChange(activeTab === 'files' ? 'notes' : 'files')}
            >
              Files
            </button>
          )}
        </div>

        <div className="rd-toolbar-center" aria-label="Reader word">痴迷</div>

        {completionAction && <div className="rd-toolbar-completion">{completionAction}</div>}
        <LessonFocusTimer key={`${courseId}-${noteData?.part ?? currentPart}`} lessonTitle={cleanTitle} defaultMinutes={readTime} onFocusModeChange={handleLessonFocusModeChange} />

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
          {completionAction}
          <span className="rd-chip" aria-live="polite">{Math.round(readingPct)}%</span>
          <span className="rd-chip">{minutesLeft} MIN</span>
          <span className="rd-chip">{currentIdx + 1} / {totalCount}</span>

          <button className="rd-btn icon" onClick={onShowShortcuts} aria-label="Keyboard shortcuts" title="Shortcuts (?)">?</button>
          <button className="rd-btn" onClick={onPrev} disabled={!onPrev} aria-label="Previous lesson">← Prev</button>
          <button className="rd-btn primary" onClick={onNext} disabled={!onNext} aria-label="Next lesson">Next →</button>
        </div>
      </div>

      {/* ── Stage ── */}
      <div className="rd-utility-hub">
        {utilityHubOpen && (
          <div className="rd-utility-hub__menu" role="dialog" aria-label="Reader utility hub">
            <div className="rd-utility-hub__header"><strong>UTILITY HUB</strong><span>Everything in one place</span></div>
            {completionAction && <section className="rd-utility-hub__section rd-completion-section"><div className="rd-utility-hub__section-label">Module complete</div><p className="rd-completion-message">Nice work. Share this milestone or continue to the next lesson.</p><div className="rd-completion-action">{completionAction}</div></section>}
            <input
              className="rd-utility-hub__filter"
              value={utilityQuery}
              onChange={event => setUtilityQuery(event.target.value)}
              placeholder="Filter tools..."
              aria-label="Filter assistant tools"
            />
            <div className="rd-utility-hub__progress"><span><strong>{Math.round(readingPct)}%</strong> complete</span><span>{minutesLeft} min · {currentIdx + 1}/{totalCount}</span></div>
            <div className="rd-utility-hub__tts"><TextToSpeechPlayer courseId={courseId} part={noteData?.part ?? currentPart} title={cleanTitle} module={noteData?.module} markdown={noteData?.notes || ''} rate={ttsRate} onRateChange={setTtsRate} onNext={onNext} onActiveText={setTtsActiveText} onActivePosition={(index, total) => setTtsActivePosition({ index, total })} /></div>
            <section className="rd-utility-hub__section" hidden={!!utilityQuery && !'view modes'.includes(utilityQuery.toLowerCase())}><div className="rd-utility-hub__section-label">VIEW MODES</div><div className="rd-utility-hub__actions">
              <button className="rd-utility-hub__action" type="button" onClick={() => { onSwitchCourse(); setUtilityHubOpen(false); }}><i>⇄</i><span>Courses</span></button>
              {(['read', 'watch', 'blueprint'] as const).map(m => (
                <button key={m} className="rd-utility-hub__action" type="button" onClick={() => { setMode(m); setUtilityHubOpen(false); }}><i>{m === 'read' ? '▤' : m === 'watch' ? '▶' : '⌘'}</i><span>{m === 'read' ? 'Read' : m === 'watch' ? 'Watch video' : 'Blueprint'}</span></button>
              ))}
            </div></section>
            <section className="rd-utility-hub__section" hidden={!!utilityQuery && !'ai tools'.includes(utilityQuery.toLowerCase())}><div className="rd-utility-hub__section-label">AI tools</div><div className="rd-utility-hub__actions">
              <button className="rd-utility-hub__action" type="button" onClick={() => { setAiOpen(true); setUtilityHubOpen(false); }}><i>✦</i><span>Ask AI</span></button>
              <button className="rd-utility-hub__action" type="button" onClick={() => { onShowShortcuts(); setUtilityHubOpen(false); }}><i>⌘</i><span>Shortcuts</span></button>
            </div></section>
            <section className="rd-utility-hub__section" hidden={!!utilityQuery && !'study tools'.includes(utilityQuery.toLowerCase())}><div className="rd-utility-hub__section-label">Study tools</div><div className="rd-utility-hub__actions">
              <button className="rd-utility-hub__action" type="button" onClick={() => toggleBookmark(`lesson-${noteData?.part ?? currentPart}`)}><i>★</i><span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span></button>
              <button className="rd-utility-hub__action" type="button" onClick={onToggleComplete}><i>✓</i><span>{isCompleted ? 'Completed' : 'Mark complete'}</span></button>
              <button className="rd-utility-hub__action" type="button" onClick={() => { setMode('read'); onTabChange('notes'); setUtilityHubOpen(false); }}><i>✎</i><span>Highlights</span></button>
              <button className="rd-utility-hub__action" type="button" onClick={() => { setUtilityOpen(v => !v); setUtilityHubOpen(false); }}><i>☰</i><span>{utilityOpen ? 'Hide outline' : 'Show outline'}</span></button>
              {HIGHLIGHT_COLORS.map(color => <button className="rd-utility-hub__action" key={color.id} type="button" onClick={() => { setMode('read'); onTabChange('notes'); setHighlightColor(color.id); setEraseHighlights(false); setUtilityHubOpen(false); }}><i style={{ backgroundColor: color.value }}> </i><span>{color.label} highlight</span></button>)}
              <button className="rd-utility-hub__action" type="button" onClick={() => { setEraseHighlights(v => !v); setUtilityHubOpen(false); }}><i>⌫</i><span>{eraseHighlights ? 'Stop erasing' : 'Erase highlights'}</span></button>
              <button className="rd-utility-hub__action" type="button" onClick={() => { clearHighlights(); setUtilityHubOpen(false); }} disabled={highlights.length === 0}><i>⌧</i><span>Clear highlights</span></button>
            </div></section>
            <section className="rd-utility-hub__section rd-voice-reader" hidden={!!utilityQuery && !'voice reader'.includes(utilityQuery.toLowerCase())}><div className="rd-utility-hub__section-label">Voice reader</div><div className="rd-utility-hub__voice-grid"><label>Voice<select value={ttsVoiceName} onChange={event => { const value = event.target.value; setTtsVoiceName(value); emitTtsPreference({ voiceName: value }); }}><option value="">Best available natural voice</option>{ttsVoices.map(voice => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} · {voice.lang}</option>)}</select></label><label>Speed<select value={ttsRate} onChange={event => { const value = Number(event.target.value) as TtsSpeed; setTtsRate(value); emitTtsPreference({ rate: value }); }}>{TTS_SPEEDS.map(speed => <option key={speed} value={speed}>{speed}x</option>)}</select></label><label>Pitch<input aria-label="Voice pitch" type="range" min="0.85" max="1.15" step="0.01" value={ttsPitch} onChange={event => { const value = Number(event.target.value); setTtsPitch(value); emitTtsPreference({ pitch: value }); }} /></label><label>Volume<input aria-label="Voice volume" type="range" min="0" max="1" step="0.05" value={ttsVolume} onChange={event => { const value = Number(event.target.value); setTtsVolume(value); emitTtsPreference({ volume: value }); }} /></label></div><button type="button" className="rd-utility-hub__reset" onClick={() => { const defaults = resetTtsPreferences(); setTtsVoiceName(defaults.voiceName); setTtsRate(defaults.rate); setTtsPitch(defaults.pitch); setTtsVolume(defaults.volume); emitTtsPreference(defaults); }}>RESET VOICE DEFAULTS</button></section>
            <section className="rd-utility-hub__section" hidden={!!utilityQuery && !'utilities'.includes(utilityQuery.toLowerCase())}><div className="rd-utility-hub__section-label">Utilities</div><div className="rd-utility-hub__actions">
              <button className="rd-utility-hub__action" type="button" onClick={() => { onTabChange(activeTab === 'files' ? 'notes' : 'files'); setUtilityHubOpen(false); }}><i>▣</i><span>{activeTab === 'files' ? 'Open notes' : 'Open files'}</span></button>
              <button className="rd-utility-hub__action" type="button" onClick={() => { onPrev?.(); setUtilityHubOpen(false); }} disabled={!onPrev}><i>←</i><span>Previous lesson</span></button>
              <button className="rd-utility-hub__action" type="button" onClick={() => { onNext?.(); setUtilityHubOpen(false); }} disabled={!onNext}><i>→</i><span>Next lesson</span></button>
              <button className="rd-utility-hub__action" type="button" onClick={onGoHome}><img src="/logos/home-neo.svg" alt="" width="22" height="22" /><span>Dashboard</span></button>
            </div></section>
          </div>
        )}
        <button className="rd-utility-hub__trigger" type="button" aria-expanded={utilityHubOpen} aria-label={utilityHubOpen ? 'Close utility hub' : 'Open utility hub'} onClick={() => setUtilityHubOpen(v => !v)}>{utilityHubOpen ? '×' : '✦'}</button>
      </div>

      <div className="rd-stage">
        {!lessonNavOpen && <button className="rd-panel-reopen rd-panel-reopen--left" type="button" onClick={() => setLessonNavOpen(true)} aria-label="Open lesson navigator" title="Open lesson navigator">›</button>}
        {!utilityOpen && <button className="rd-panel-reopen rd-panel-reopen--right" type="button" onClick={() => setUtilityOpen(true)} aria-label="Open reader tools" title="Open reader tools">‹</button>}

        {/* Rail / TOC */}
        <aside
          className={`rd-rail${tocCollapsed ? ' collapsed' : ''}`}
          aria-label="On this page"
          style={{ display: mode === 'read' && activeTab === 'notes' ? undefined : 'none' }}
        >
          <LessonNavigator courseId={courseId} modules={modules} currentPart={currentPart} completedParts={completedParts} bookmarkedParts={bookmarkedParts} onSelectPart={onSelectPart} onNext={onNext} onClose={() => setLessonNavOpen(false)} />
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
                    <div className="rd-hero-heading">
                      <h1 className="rd-title">{cleanTitle}</h1>
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
                    <div className="rd-submeta">
                      <span>{readTime} MIN READ</span>
                      <span className="dot">/</span>
                      <span>{wordCount} WORDS</span>
                      <span className="dot">/</span>
                      <span>{Math.round(readingPct)}% DONE</span>
                    </div>
                  </div>

                  <article ref={articleRef} className="rd-prose" onMouseUp={handleTextSelection} onTouchEnd={handleTextSelection} aria-label="Lesson content">
                    <MarkdownRenderer content={displayNotes} components={markdownComponents} />
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
