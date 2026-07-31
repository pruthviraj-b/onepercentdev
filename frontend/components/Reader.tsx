'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { NoteData } from '@/lib/api';
import { getVideoIds } from '@/lib/videos';
import MarkdownRenderer from './MarkdownRenderer';
import { fetchVideoTimestamp, saveVideoTimestamp } from '@/lib/api';
import { C, CLight, F, R, S, T, L, FS, FONT_IMPORT, CalloutVariant, CALLOUT_MAP } from '@/lib/theme';

const InteractiveBlueprint = dynamic(
  () => import('./InteractiveBlueprint').then(m => m.InteractiveBlueprint),
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

const PREFS_KEY = 'ds_reader_prefs';
const DEFAULT_PREFS: ReaderPrefs = { fontScale: 1, lineHeight: 1.7, width: 'normal', theme: 'dark' };
const WIDTH_MAP: Record<ContentWidth, number> = { narrow: 640, normal: 760, wide: 920 };

function loadPrefs(): ReaderPrefs {
  try { const raw = localStorage.getItem(PREFS_KEY); return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS; }
  catch { return DEFAULT_PREFS; }
}
function savePrefs(p: ReaderPrefs) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { } }

/* ─── Utilities ─────────────────────────────────────────────────────────────── */
const downloadFile = (filename: string, content: string, type = 'text/plain;charset=utf-8') => {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

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

function MultiVideoPlayer({ videoIds, courseId, part, loading }: { videoIds: string[]; courseId: string; part: number; title: string; loading: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => { setActiveIdx(0); }, [part]);
  if (loading) return <div className="rd-skeleton" style={{ aspectRatio: '16/9' }} />;
  if (videoIds.length === 0) return <div className="rd-video-empty">Recording not published yet — check back soon.</div>;
  const safeIdx = Math.min(activeIdx, videoIds.length - 1);
  return (
    <div>
      {videoIds.length > 1 && (
        <div className="rd-video-tabs" role="tablist">
          {videoIds.map((_, i) => (
            <button key={i} role="tab" aria-selected={safeIdx === i} onClick={() => setActiveIdx(i)}
              className={`rd-video-tab${safeIdx === i ? ' active' : ''}`}>
              REEL {i + 1}
            </button>
          ))}
        </div>
      )}
      <div className="rd-video-frame">
        <YouTubeResumable key={`${courseId}-${part}-${safeIdx}`} videoId={videoIds[safeIdx]} courseId={courseId} part={part} />
      </div>
    </div>
  );
}

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
  courseId: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   NEO-BRUTALIST & MAXIMALIST READER
   ═══════════════════════════════════════════════════════════════════════════ */
export function Reader({
  noteData, loading, activeTab, isCompleted, currentIdx, totalCount,
  onTabChange, onToggleComplete, onPrev, onNext, onShowShortcuts, courseId,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [readingPct, setReadingPct] = useState(0);
  const [mode, setMode] = useState<ReaderMode>('read');
  const [focusMode, setFocusMode] = useState(false);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState('');
  const [tocQuery, setTocQuery] = useState('');
  const [tocCollapsed, setTocCollapsed] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_PREFS);
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => { setPrefs(loadPrefs()); }, []);
  const updatePrefs = useCallback((patch: Partial<ReaderPrefs>) => {
    setPrefs(prev => { const next = { ...prev, ...patch }; savePrefs(next); return next; });
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);

  /* Theme tokens */
  const th = prefs.theme === 'light' ? CLight : C;

  const videoIds = noteData ? getVideoIds(courseId, noteData.part) : [];
  const cleanTitle = noteData?.title.replace(/^Part\s+\d+(?:\.\d+)?\s*[-–—]?\s*/i, '') || 'Lesson';
  const hasFiles = !!noteData?.files.length;

  /* Scroll / reading progress */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current; if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) { setReadingPct(0); return; }
    setReadingPct(Math.min(100, Math.max(0, (el.scrollTop / max) * 100)));
  }, []);

  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    let ticking = false;
    const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { handleScroll(); ticking = false; }); };
    el.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [handleScroll, noteData, mode]);

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

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; setReadingPct(0); setMode('read'); }, [noteData?.part]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') setMode('read');
      if (e.key === '2') setMode('watch');
      if (e.key === '3') setMode('blueprint');
      if (e.key === 'Escape' && focusMode) setFocusMode(false);
      if (e.key === '?') onShowShortcuts?.();
      if (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setFocusMode(v => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode, onShowShortcuts]);

  const readTime = useMemo(() => noteData ? Math.max(1, Math.round(noteData.notes.split(/\s+/).length / 200)) : 0, [noteData]);
  const wordCount = useMemo(() => noteData ? noteData.notes.split(/\s+/).length : 0, [noteData]);
  const minutesLeft = Math.max(0, Math.round(readTime * (1 - readingPct / 100)));
  const filteredToc = useMemo(() =>
    tocQuery.trim() ? toc.filter(t => t.text.toLowerCase().includes(tocQuery.toLowerCase())) : toc,
    [toc, tocQuery]);
  const contentMaxWidth = WIDTH_MAP[prefs.width];
  const isBookmarked = noteData ? bookmarks.has(`lesson-${noteData.part}`) : false;

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

    /* Top Reading Progress Bar */
    .rd-progress{position:absolute;top:0;left:0;right:0;height:4px;background:${th.border};z-index:50}
    .rd-progress-fill{
      height:100%;background:${th.accent};
      box-shadow:0 0 8px ${th.accent};
      transform-origin:left;transition:transform 80ms linear;
    }

    /* ── Sticky Toolbar ── */
    .rd-toolbar{
      display:flex;align-items:center;justify-content:space-between;gap:10px;
      padding:0 18px;height:${L.toolbarHeight};flex-shrink:0;
      border-bottom:2.5px solid ${th.border};background:${th.surface};
      position:relative;z-index:10;flex-wrap:wrap;
    }
    .rd-toolbar-left{display:flex;align-items:center;gap:10px}
    .rd-toolbar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

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
      border-color:#000;box-shadow:2px 2px 0px #000;
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
      background:${th.accent};color:${th.onAccent};border-color:#000;
      box-shadow:2.5px 2.5px 0px #000;
    }
    .rd-btn.primary:hover{
      background:${th.accent};color:${th.onAccent};
      box-shadow:3.5px 3.5px 0px #000;
    }
    .rd-btn.done{
      background:${th.lime};color:#000;border-color:#000;
      box-shadow:2.5px 2.5px 0px #000;
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
      background:${th.accent};color:${th.onAccent};border-color:#000;
      box-shadow:1.5px 1.5px 0px #000;
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
    .rd-scroll{flex:1;overflow-y:auto;overflow-x:hidden}
    .rd-content{
      max-width:${contentMaxWidth}px;width:100%;margin:0 auto;
      padding:44px 36px 120px;
    }

    /* Scroll to top button */
    .rd-scroll-top{
      position:absolute;bottom:26px;right:24px;width:42px;height:42px;
      border-radius:${R.md};background:${th.accent};color:${th.onAccent};
      border:2px solid #000;display:flex;align-items:center;justify-content:center;
      cursor:pointer;opacity:0;pointer-events:none;
      box-shadow:3px 3px 0px #000;
      transition:all ${T.base};z-index:20;font-size:1.1rem;font-weight:800;
    }
    .rd-scroll-top.visible{opacity:1;pointer-events:auto}
    .rd-scroll-top:hover{transform:translate(-2px, -2px);box-shadow:4px 4px 0px #000}

    /* Focus Mode Bar */
    .rd-focus-bar{position:absolute;top:14px;right:18px;z-index:40;display:none;gap:8px}
    .rd-root.is-focus .rd-focus-bar{display:flex}
    .rd-focus-pill{
      background:${th.accent};border:2px solid #000;color:${th.onAccent};
      padding:7px 14px;border-radius:${R.pill};font-size:${FS.sm};font-family:${F.mono};font-weight:800;
      cursor:pointer;box-shadow:3px 3px 0px #000;
    }

    /* ── Reading Hero Section ── */
    .rd-hero{
      margin-bottom:36px;padding-bottom:28px;
      border-bottom:3px solid ${th.border};
    }
    .rd-kicker{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center}

    /* Maximalist Badges */
    .rd-badge{
      font-family:${F.mono};font-weight:800;font-size:0.68rem;
      letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;
      border-radius:${R.sm};background:${th.surfaceHi};color:${th.text};
      border:2px solid ${th.border};box-shadow:2px 2px 0px ${th.border};
    }
    .rd-badge.dark-fill{background:${th.text};color:${th.bg};border-color:${th.text};box-shadow:2px 2px 0px ${th.border}}
    .rd-badge.accent{background:${th.accent};color:${th.onAccent};border-color:#000;box-shadow:2px 2px 0px #000}
    .rd-badge.cyan{background:${th.cyan};color:#000;border-color:#000;box-shadow:2px 2px 0px #000}
    .rd-badge.pink{background:${th.pink};color:#fff;border-color:#000;box-shadow:2px 2px 0px #000}
    .rd-badge.lime{background:${th.lime};color:#000;border-color:#000;box-shadow:2px 2px 0px #000}

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
      border:1px solid #000;box-shadow:1.5px 1.5px 0px #000;
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
      background:var(--ca);color:#000;
      font-family:${F.mono};font-weight:800;font-size:0.65rem;
      letter-spacing:0.08em;text-transform:uppercase;
      padding:3px 10px;border-radius:${R.sm};
      border:1.5px solid #000;box-shadow:1.5px 1.5px 0px #000;
    }
    .rd-callout-body{font-size:${FS.md};color:${th.text};line-height:1.68;margin-top:2px}
    .rd-callout-body > *:last-child{margin-bottom:0}

    /* ── Maximalist Code Blocks ── */
    .rd-code{
      margin:1.8rem 0;border-radius:${R.md};overflow:hidden;
      border:2.5px solid ${C.border};background:#0B0E14;
      box-shadow:4px 4px 0px ${C.border};
    }
    .rd-code.fullscreen{position:fixed;inset:14px;z-index:200;margin:0;box-shadow:${S.raised}}
    .rd-code-head{
      display:flex;justify-content:space-between;align-items:center;
      padding:10px 14px;background:#121620;border-bottom:2px solid #202636;
    }
    .rd-code-lang{
      font-family:${F.mono};font-size:0.68rem;font-weight:800;
      color:${C.accent};background:${C.bg};border:1.5px solid #000;
      padding:2px 7px;border-radius:${R.sm};text-transform:uppercase;
    }
    .rd-code-file{font-family:${F.mono};font-size:${FS.sm};font-weight:700;color:${C.textDim};margin-left:10px}
    .rd-code-actions{display:flex;gap:6px;align-items:center}
    .rd-code-btn{
      background:${C.bg};border:1.5px solid ${C.border};color:${C.textDim};
      font-family:${F.mono};font-size:0.65rem;font-weight:800;padding:3px 9px;
      border-radius:${R.sm};cursor:pointer;box-shadow:1.5px 1.5px 0px ${C.border};
      transition:all ${T.fast};
    }
    .rd-code-btn:hover{
      background:${C.accent};color:${C.onAccent};border-color:#000;
      transform:translate(-1px, -1px);box-shadow:2px 2px 0px #000;
    }
    .rd-code-btn.on{background:${C.accent};color:${C.onAccent};border-color:#000;box-shadow:1.5px 1.5px 0px #000}
    .rd-code-body{padding:16px;overflow-x:auto;display:flex;gap:14px}
    .rd-code.fullscreen .rd-code-body{overflow-y:auto;max-height:calc(100vh - 90px)}
    .rd-code-linenos{
      font-family:${F.mono};font-size:0.84rem;line-height:1.68;
      color:#4A566E;text-align:right;user-select:none;flex-shrink:0;
      padding-right:10px;border-right:2px solid #202636;
    }
    .rd-code-body pre{margin:0;font-family:${F.mono};font-size:0.84rem;line-height:1.68;color:#F0F4FC;flex:1;min-width:0}
    .rd-code-body pre.wrap{white-space:pre-wrap;word-break:break-word}
    .rd-code-collapsed{padding:10px 16px;font-family:${F.mono};font-size:${FS.xs};color:${C.textFaint}}
    .rd-code-output{border-top:2px solid #202636;padding:12px 16px;font-family:${F.mono};font-size:0.82rem;color:${C.lime};background:#07090D}
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
      border-color:#000;box-shadow:2px 2px 0px #000;
    }
    .rd-video-frame,.rd-video-host{
      position:relative;width:100%;padding-bottom:56.25%;height:0;
      background:#000;border-radius:${R.md};overflow:hidden;border:2.5px solid ${th.border};
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
  `;

  return (
    <div
      className={`rd rd-root${focusMode ? ' is-focus' : ''}`}
      style={{
        ['--rd-fs' as any]: prefs.fontScale,
        ['--rd-lh' as any]: prefs.lineHeight,
      }}
    >
      <style>{css}</style>

      {/* Progress bar */}
      <div className="rd-progress" aria-hidden="true">
        <div className="rd-progress-fill" style={{ transform: `scaleX(${readingPct / 100})` }} />
      </div>

      {/* ── Toolbar ── */}
      <div className="rd-toolbar" role="toolbar">
        <div className="rd-toolbar-left">
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

        {/* Rail / TOC */}
        <aside
          className={`rd-rail${tocCollapsed ? ' collapsed' : ''}`}
          aria-label="On this page"
          style={{ display: mode === 'read' && activeTab === 'notes' ? undefined : 'none' }}
        >
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

                  <article className="rd-prose">
                    <MarkdownRenderer content={noteData.notes} components={{
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
                    }} />
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
      </div>
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

  const copy = useCallback(() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }, [code]);
  const lines = useMemo(() => code.split('\n'), [code]);
  const isLong = lines.length > 24;

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

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