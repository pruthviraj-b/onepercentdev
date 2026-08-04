'use client';

import { useState, useMemo, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { Module, PartMeta, isPartComplete } from '@/services/courseService';
import { C, F, R, S, T, L, FS, FONT_IMPORT } from '@/shared/theme/theme';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const RECENT_KEY = 'opd_sidebar_recent_searches';
function loadRecent(): string[] { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } }
function pushRecent(q: string) {
  try {
    const list = loadRecent().filter(r => r.toLowerCase() !== q.toLowerCase());
    list.unshift(q);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
  } catch { }
}

function flattenSidebarNotes(modules: Module[]): PartMeta[] {
  return modules.flatMap(module => module.notes.flatMap(note => [note, ...(note.subtopics || [])]));
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="sb-match">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ─── Props ────────────────────────────────────────────────────────────────── */
interface Props {
  courseId: string;
  modules: Module[];
  currentPart: number;
  completedParts: number[];
  bookmarkedParts: number[];
  searchQuery: string;
  progressPct: number;
  completedCount: number;
  totalParts: number;
  isCurrentCompleted?: boolean;
  onToggleComplete?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  railCollapsed?: boolean;
  onToggleRail?: () => void;
  onSearchChange: (q: string) => void;
  onSelectPart: (part: number) => void;
}

/* ─── Icons ────────────────────────────────────────────────────────────────── */
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   NEO-BRUTALIST & MAXIMALIST SIDEBAR
   ═══════════════════════════════════════════════════════════════════════════ */
export function Sidebar({
  modules, currentPart, completedParts, bookmarkedParts,
  searchQuery, progressPct, completedCount, totalParts,
  isCurrentCompleted, onToggleComplete, onPrev, onNext,
  railCollapsed = false, onToggleRail,
  onSearchChange, onSelectPart,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [recent, setRecent] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const commitTimer = useRef<any>(null);

  useEffect(() => { setRecent(loadRecent()); }, []);

  const toggle = useCallback((id: number) => {
    setCollapsed(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);

  const collapseAll = useCallback(() => setCollapsed(new Set(modules.map(m => m.id))), [modules]);
  const expandAll = useCallback(() => setCollapsed(new Set()), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && !isTyping) {
        e.preventDefault(); searchRef.current?.focus();
      }
      if (e.key === 'Escape' && searchQuery) { onSearchChange(''); searchRef.current?.blur(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchQuery, onSearchChange]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => { pushRecent(searchQuery.trim()); setRecent(loadRecent()); }, 900);
    return () => clearTimeout(commitTimer.current);
  }, [searchQuery]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return flattenSidebarNotes(modules).filter(n => n.title.toLowerCase().includes(q));
  }, [modules, searchQuery]);

  const bookmarkedNotes = useMemo(() =>
    searchQuery.trim() ? [] : flattenSidebarNotes(modules).filter(n => bookmarkedParts.includes(n.part)),
    [modules, bookmarkedParts, searchQuery]);

  const allCollapsed = modules.length > 0 && collapsed.size >= modules.filter(m => m.notes.length > 0).length;

  /* ─── CSS ───────────────────────────────────────────────────────────────── */
  const css = `
    ${FONT_IMPORT}

    .sb{
      width:${L.sidebarWidth};
      height:100%;
      display:flex;
      flex-direction:column;
      background:${C.surface};
      color:${C.text};
      font-family:${F.body};
      border-right:2.5px solid ${C.border};
      overflow:hidden;
      flex-shrink:0;
      font-size:${FS.base};
    }
    .sb *{box-sizing:border-box}
    .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    .sb :focus-visible{outline:2.5px solid ${C.accent};outline-offset:2px;border-radius:${R.sm}}
    @media(prefers-reduced-motion:reduce){.sb *{animation-duration:.001ms!important;transition-duration:.001ms!important}}

    /* Scrollbar */
    .sb ::-webkit-scrollbar{width:6px}
    .sb ::-webkit-scrollbar-track{background:${C.surface}}
    .sb ::-webkit-scrollbar-thumb{background:${C.borderHi};border-radius:${R.sm};border:1px solid ${C.surface}}
    .sb ::-webkit-scrollbar-thumb:hover{background:${C.accent}}
    .sb{scrollbar-width:thin;scrollbar-color:${C.borderHi} ${C.surface}}

    /* Header Brand strip */
    .sb-brand{
      padding:14px 14px 10px;
      border-bottom:2px solid ${C.border};
      background:${C.bg};
      display:flex;align-items:center;justify-content:space-between;
    }
    .sb-brand-title{
      font-family:${F.display};font-weight:800;font-size:0.95rem;
      letter-spacing:-0.02em;color:${C.text};display:flex;align-items:center;gap:8px;
    }
    .sb-collapse-btn{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border:1px solid ${C.border};border-radius:${R.sm};background:${C.surface};color:${C.textDim};cursor:pointer;font-size:1rem;line-height:1;flex-shrink:0}
    .sb-collapse-btn:hover{border-color:${C.accent};color:${C.accent};background:${C.accentDim}}
    .sb-brand-tag{
      font-family:${F.mono};font-weight:800;font-size:0.64rem;
      background:${C.accent};color:${C.onAccent};padding:2px 6px;
      border-radius:${R.sm};border:1.5px solid #1F2937;box-shadow:1.5px 1.5px 0px #1F2937;
      text-transform:uppercase;letter-spacing:0.04em;
    }

    /* Search */
    .sb-search{
      padding:12px 14px;
      border-bottom:2px solid ${C.border};
      background:${C.surface};
      flex-shrink:0;
    }
    .sb-search-wrap{position:relative}
    .sb-search-input{
      width:100%;
      background:${C.surfaceHi};
      border:2px solid ${C.border};
      color:${C.text};
      font-family:${F.mono};
      font-size:${FS.sm};
      font-weight:600;
      padding:9px 62px 9px 36px;
      border-radius:${R.md};
      outline:none;
      box-shadow:2px 2px 0px ${C.border};
      transition:all ${T.fast};
    }
    .sb-search-input::placeholder{color:${C.textFaint};font-weight:500}
    .sb-search-input:focus{
      border-color:${C.accent};
      background:${C.surface};
      box-shadow:3px 3px 0px ${C.accent};
    }
    .sb-search-icon{
      position:absolute;left:11px;top:50%;transform:translateY(-50%);
      color:${C.accent};display:flex;pointer-events:none;
    }
    .sb-search-key{
      position:absolute;right:8px;top:50%;transform:translateY(-50%);
      font-family:${F.mono};font-size:0.6rem;font-weight:800;
      background:${C.bg};color:${C.textDim};border:1.5px solid ${C.border};
      padding:2px 5px;border-radius:${R.sm};pointer-events:none;
    }
    .sb-search-clear{
      position:absolute;right:48px;top:50%;transform:translateY(-50%);
      background:${C.pink};border:1px solid #1F2937;color:#fff;
      cursor:pointer;font-size:0.75rem;line-height:1;padding:2px 5px;
      border-radius:${R.sm};font-weight:800;
      box-shadow:1px 1px 0px #1F2937;
    }
    .sb-search-clear:hover{transform:scale(1.08)}

    /* Recent chips */
    .sb-recent{padding:10px 0 2px;display:flex;flex-wrap:wrap;gap:6px}
    .sb-recent-chip{
      font-family:${F.mono};font-size:0.66rem;font-weight:700;
      color:${C.textDim};background:${C.bg};
      border:1.5px solid ${C.border};
      padding:4px 9px;border-radius:${R.pill};cursor:pointer;
      box-shadow:1.5px 1.5px 0px ${C.border};
      transition:all ${T.fast};
    }
    .sb-recent-chip:hover{
      border-color:${C.cyan};color:${C.cyan};
      transform:translate(-1px, -1px);
      box-shadow:2px 2px 0px ${C.cyan};
    }

    /* Progress Widget */
    .sb-progress{
      padding:14px;
      border-bottom:2px solid ${C.border};
      background:${C.bg};
      flex-shrink:0;
    }
    .sb-progress-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .sb-progress-label{
      font-family:${F.display};font-size:${FS.sm};font-weight:800;
      letter-spacing:0.04em;text-transform:uppercase;color:${C.text};
    }
    .sb-progress-stat{font-family:${F.mono};font-size:${FS.xs};font-weight:700;color:${C.textDim}}
    .sb-progress-pct{
      font-family:${F.mono};font-size:${FS.xs};font-weight:800;
      color:${C.onAccent};background:${C.accent};
      padding:3px 8px;border-radius:${R.sm};border:1.5px solid #1F2937;
      box-shadow:1.5px 1.5px 0px #1F2937;
    }
    .sb-progress-track{
      height:8px;background:${C.surfaceHi};
      border:2px solid ${C.border};border-radius:${R.pill};
      overflow:hidden;position:relative;
    }
    .sb-progress-fill{
      height:100%;border-radius:${R.pill};
      background:linear-gradient(90deg, ${C.accent}, ${C.lime});
      border-right:1.5px solid #1F2937;
      transition:width 400ms ${T.ease};
    }
    .sb-current-actions{display:grid;grid-template-columns:1fr 0.9fr 1fr;gap:6px;margin-top:10px}
    .sb-current-action{min-width:0;padding:7px 3px;border:1px solid ${C.border};border-radius:${R.sm};background:${C.surfaceHi};color:${C.textDim};font-family:${F.mono};font-size:0.58rem;font-weight:800;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .sb-current-action:hover:not(:disabled){border-color:${C.accent};color:${C.accent};background:${C.surfaceHover}}
    .sb-current-action.complete{background:${C.accent};border-color:${C.accent};color:${C.onAccent}}
    .sb-current-action:disabled{opacity:.35;cursor:not-allowed}

    /* Body */
    .sb-body{flex:1;overflow-y:auto;overscroll-behavior:contain;min-width:0;padding:6px 0}

    /* Section Header Label */
    .sb-section-label{
      padding:10px 14px 6px;
      font-family:${F.mono};font-size:${FS.xs};font-weight:800;
      letter-spacing:0.12em;text-transform:uppercase;color:${C.textFaint};
      display:flex;justify-content:space-between;align-items:center;
    }
    .sb-section-actions{display:flex;gap:6px}
    .sb-section-btn{
      background:${C.surfaceHi};border:1.5px solid ${C.border};color:${C.textDim};
      font-family:${F.mono};font-size:0.65rem;font-weight:700;padding:3px 8px;border-radius:${R.sm};
      cursor:pointer;box-shadow:1.5px 1.5px 0px ${C.border};
      transition:all ${T.fast};
    }
    .sb-section-btn:hover:not(:disabled){
      color:${C.text};border-color:${C.accent};
      transform:translate(-1px, -1px);box-shadow:2px 2px 0px ${C.accent};
    }
    .sb-section-btn:disabled{opacity:0.35;pointer-events:none;box-shadow:none}

    /* Pinned Box */
    .sb-pinned{
      margin:8px 10px 14px;
      border:2px solid ${C.accent};
      border-radius:${R.md};
      background:${C.bg};
      box-shadow:3px 3px 0px ${C.accent};
      overflow:hidden;
    }
    .sb-pinned-head{
      background:${C.accent};color:${C.onAccent};
      font-family:${F.mono};font-weight:800;font-size:0.68rem;
      letter-spacing:0.08em;text-transform:uppercase;
      padding:6px 10px;display:flex;align-items:center;gap:6px;
    }

    /* Module Group */
    .sb-module{margin-bottom:8px;border-bottom:1.5px solid ${C.border}}
    .sb-module-header{
      display:flex;justify-content:space-between;align-items:center;
      padding:10px 14px;cursor:pointer;user-select:none;min-height:46px;
      background:${C.surface};border-left:3px solid transparent;
      transition:all ${T.fast};gap:10px;
    }
    .sb-module-header:hover{
      background:${C.surfaceHover};
      border-left-color:${C.accent};
    }
    .sb-module-left{display:flex;align-items:center;gap:10px;min-width:0;flex:1;overflow:hidden}
    .sb-module-num{
      font-family:${F.mono};font-size:0.68rem;font-weight:800;
      color:${C.accent};background:${C.bg};
      border:1.5px solid ${C.border};
      padding:3px 7px;border-radius:${R.sm};
      box-shadow:1.5px 1.5px 0px ${C.border};
      flex-shrink:0;
    }
    .sb-module-name{
      font-family:${F.display};font-size:0.9rem;font-weight:700;color:${C.text};
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    }
    .sb-module-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
    .sb-module-count{
      font-family:${F.mono};font-size:0.68rem;font-weight:700;color:${C.textDim};
      background:${C.surfaceHi};border:1px solid ${C.border};
      padding:3px 8px;border-radius:${R.pill};
    }
    .sb-module-count.done{
      color:${C.onAccent};background:${C.lime};
      border-color:#1F2937;font-weight:800;
      box-shadow:1.5px 1.5px 0px #1F2937;
    }
    .sb-chevron{
      color:${C.textDim};display:flex;flex-shrink:0;
      transition:transform ${T.base} ${T.ease};
    }
    .sb-module-header[aria-expanded="true"] .sb-chevron{transform:rotate(180deg);color:${C.accent}}

    /* Part List */
    .sb-part-list{list-style:none;margin:0;padding:4px 8px 10px;overflow:hidden}
    .sb-part-list.collapsed{display:none}
    .sb-lesson-group{list-style:none;margin:0;padding:0}
    .sb-subtopic-list{list-style:none;margin:0 0 4px;padding:0 0 0 18px;border-left:2px solid ${C.border}}

    /* Part Item (Lesson) */
    .sb-part{
      display:flex;justify-content:space-between;align-items:center;
      padding:9px 10px;font-size:${FS.base};color:${C.textDim};
      cursor:pointer;border-radius:${R.md};min-height:40px;gap:10px;
      border:2px solid transparent;margin-bottom:3px;
      transition:all ${T.fast};
    }
    .sb-part:hover{
      background:${C.surfaceHi};color:${C.text};
      border-color:${C.borderHi};
      transform:translate(-2px, -2px);
      box-shadow:2.5px 2.5px 0px ${C.borderHi};
    }
    .sb-part.active{
      background:${C.bg};color:${C.text};font-weight:700;
      border-color:${C.accent};
      transform:translate(-2px, -2px);
      box-shadow:3.5px 3.5px 0px ${C.accent};
    }
    .sb-part:has(.sb-subtopic-list){display:block;padding-bottom:6px}
    .sb-part:has(.sb-subtopic-list) > .sb-subtopic-list{margin-top:6px}
    .sb-part-left{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
    .sb-part-icon{
      display:flex;flex-shrink:0;width:22px;height:22px;
      align-items:center;justify-content:center;border-radius:${R.sm};
      background:${C.surfaceHi};border:1.5px solid ${C.border};
      color:${C.textDim};font-family:${F.mono};font-size:0.68rem;font-weight:800;
    }
    .sb-part.active .sb-part-icon{
      background:${C.accent};color:${C.onAccent};
      border-color:#1F2937;box-shadow:1px 1px 0px #1F2937;
    }
    .sb-part.done .sb-part-icon{
      background:${C.lime};color:#1F2937;
      border-color:#1F2937;box-shadow:1px 1px 0px #1F2937;
    }
    .sb-part-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:${F.body}}
    .sb-part.active > .sb-part-left .sb-part-name{color:${C.accent}}
    .sb-part.sb-subtopic{min-height:32px;margin:2px 0;padding:6px 8px;border-width:1.5px;background:${C.bg};font-size:${FS.sm}}
    .sb-part.sb-subtopic .sb-part-icon{width:18px;height:18px;border-radius:4px;background:transparent;color:transparent;border:1.5px solid ${C.borderHi};font-size:.72rem}
    .sb-part.sb-subtopic.done .sb-part-icon{background:${C.lime};color:#1F2937;border-color:#1F2937}
    .sb-part.sb-subtopic:hover{background:${C.surfaceHi};border-color:${C.cyan};box-shadow:1.5px 1.5px 0 ${C.cyan}}
    .sb-part.sb-subtopic.active{background:${C.accentDim};border-color:${C.accent};box-shadow:2px 2px 0 ${C.accent}}
    .sb-match{background:${C.pinkDim};color:${C.pink};border-radius:2px;padding:0 2px;font-weight:800}

    .sb-pin{color:${C.accent};display:flex;flex-shrink:0}
    .sb-active-badge{
      font-family:${F.mono};font-size:0.6rem;font-weight:800;
      background:${C.accent};color:${C.onAccent};
      padding:1px 5px;border-radius:${R.sm};border:1px solid #1F2937;
    }

    .sb-empty{padding:24px 16px;text-align:center;color:${C.textFaint};font-size:${FS.sm};font-family:${F.mono}}

    @media(max-width:768px){
      .sb{width:100%;border-right:none;border-bottom:2.5px solid ${C.border}}
    }
  `;

  return (
    <aside className={`sb${railCollapsed ? ' sb-rail-collapsed' : ''}`} aria-label="Course navigation">
      <style>{css}</style>

      {/* ── Brand strip ── */}
      <div className="sb-brand">
        <span className="sb-brand-title">
          <span>COURSE INDEX</span>
        </span>
        <span className="sb-brand-tag">{totalParts} LESSONS</span>
        {onToggleRail && (
          <button
            className="sb-collapse-btn"
            onClick={onToggleRail}
            aria-label={railCollapsed ? 'Expand course navigation' : 'Collapse course navigation to icons'}
            title={railCollapsed ? 'Expand course navigation' : 'Collapse course navigation'}
          >
            {railCollapsed ? '›' : '‹'}
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <div className="sb-search">
        <div className="sb-search-wrap">
          <label htmlFor="sb-search-input" className="sr-only">Search lessons</label>
          <span className="sb-search-icon"><IconSearch /></span>
          <input
            ref={searchRef}
            id="sb-search-input"
            className="sb-search-input"
            type="search"
            placeholder="Search lessons... [⌘K]"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            autoComplete="off"
          />
          <span className="sb-search-key">⌘K</span>
          {searchQuery && (
            <button className="sb-search-clear" onClick={() => onSearchChange('')} aria-label="Clear search">✕</button>
          )}
        </div>
        {searchFocused && !searchQuery && recent.length > 0 && (
          <div className="sb-recent">
            {recent.map(r => (
              <button key={r} className="sb-recent-chip" onMouseDown={e => e.preventDefault()} onClick={() => onSearchChange(r)}>
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Progress ── */}
      <div className="sb-progress">
        <div className="sb-progress-row">
          <span className="sb-progress-label">COMPLETION</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="sb-progress-stat">{completedCount} / {totalParts}</span>
            <span className="sb-progress-pct">{progressPct}%</span>
          </span>
        </div>
        <div
          className="sb-progress-track"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Course progress: ${progressPct}%`}
        >
          <div className="sb-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        {(onPrev || onNext || onToggleComplete) && (
          <div className="sb-current-actions" aria-label="Current lesson controls">
            <button className="sb-current-action" onClick={onPrev} disabled={!onPrev} aria-label="Previous lesson">← PREV</button>
            <button className="sb-current-action complete" onClick={onToggleComplete} disabled={!onToggleComplete} aria-pressed={isCurrentCompleted}>
              {isCurrentCompleted ? '✓ COMPLETED' : 'MARK COMPLETE'}
            </button>
            <button className="sb-current-action" onClick={onNext} disabled={!onNext} aria-label="Next lesson">NEXT →</button>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="sb-body">
        {filtered ? (
          /* Search results */
          <>
            <div className="sb-section-label">RESULTS ({filtered.length})</div>
            {filtered.length === 0 ? (
              <div className="sb-empty">NO LESSONS MATCH "{searchQuery}"</div>
            ) : (
              <ul className="sb-part-list" role="listbox">
                {filtered.map(n => (
                  <PartItem
                    key={n.part} note={n}
                    active={n.part === currentPart}
                    done={isPartComplete(n, completedParts)}
                    bookmarked={bookmarkedParts.includes(n.part)}
                    query={searchQuery}
                    onSelect={onSelectPart}
                  />
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            {/* Pinned / bookmarked */}
            {bookmarkedNotes.length > 0 && (
              <div className="sb-pinned">
                <div className="sb-pinned-head">
                  <IconStar /> <span>PINNED LESSONS ({bookmarkedNotes.length})</span>
                </div>
                <ul className="sb-part-list" role="list">
                  {bookmarkedNotes.map(n => (
                    <PartItem
                      key={n.part} note={n}
                      active={n.part === currentPart}
                      done={isPartComplete(n, completedParts)}
                      bookmarked
                      onSelect={onSelectPart}
                    />
                  ))}
                </ul>
              </div>
            )}

            {/* Course content */}
            <div className="sb-section-label">
              <span>CURRICULUM</span>
              <span className="sb-section-actions">
                <button className="sb-section-btn" onClick={collapseAll} disabled={allCollapsed}>COLLAPSE</button>
                <button className="sb-section-btn" onClick={expandAll} disabled={collapsed.size === 0}>EXPAND</button>
              </span>
            </div>

            {modules.filter(m => m.notes.length > 0).map(mod => {
              const isCollapsed = collapsed.has(mod.id);
              const moduleNotes = mod.notes.flatMap(note => [note, ...(note.subtopics || [])]);
              const doneCount = moduleNotes.filter(n => isPartComplete(n, completedParts)).length;
              const isComplete = doneCount === moduleNotes.length;
              return (
                <div key={mod.id} className="sb-module">
                  <div
                    className="sb-module-header"
                    onClick={() => toggle(mod.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={!isCollapsed}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(mod.id); } }}
                  >
                    <div className="sb-module-left">
                      <span className="sb-module-num">M{mod.id}</span>
                      <span className="sb-module-name">{mod.title}</span>
                    </div>
                    <div className="sb-module-right">
                      <span className={`sb-module-count${isComplete ? ' done' : ''}`}>{doneCount}/{moduleNotes.length}</span>
                      <span className="sb-chevron"><IconChevron /></span>
                    </div>
                  </div>
                  <ul className={`sb-part-list${isCollapsed ? ' collapsed' : ''}`} role="list">
                    {mod.notes.map(n => (
                      <PartItem
                        key={n.part}
                        note={n}
                        active={n.part === currentPart}
                        done={isPartComplete(n, completedParts)}
                        bookmarked={bookmarkedParts.includes(n.part)}
                        onSelect={onSelectPart}
                      >
                        {n.subtopics && n.subtopics.length > 0 && (
                          <ul className="sb-subtopic-list" role="list">
                            {n.subtopics.map(subtopic => (
                              <PartItem
                                key={subtopic.part}
                                note={subtopic}
                                nested
                                active={subtopic.part === currentPart}
                                done={completedParts.includes(subtopic.part)}
                                bookmarked={bookmarkedParts.includes(subtopic.part)}
                                onSelect={onSelectPart}
                              />
                            ))}
                          </ul>
                        )}
                      </PartItem>
                    ))}
                  </ul>
                </div>
              );
            })}
          </>
        )}
      </div>
    </aside>
  );
}

/* ─── Part Item ─────────────────────────────────────────────────────────────── */
function PartItem({
  note, active, done, bookmarked, query, nested, onSelect, children,
}: {
  note: PartMeta; active: boolean; done: boolean; bookmarked: boolean; query?: string; nested?: boolean; onSelect: (p: number) => void; children?: ReactNode;
}) {
  const shortTitle = note.title.replace(/^Part\s+\d+[\s—\-]+/i, '').trim();
  return (
    <li
      className={`sb-part${nested ? ' sb-subtopic' : ''}${active ? ' active' : ''}${done ? ' done' : ''}`}
      onClick={() => onSelect(note.part)}
      role="option"
      aria-selected={active}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(note.part); } }}
    >
      <div className="sb-part-left">
        <span className={`sb-part-icon${nested ? ' sb-subtopic-check' : ''}`} aria-hidden="true">
          {done ? <IconCheck /> : nested ? null : note.part}
        </span>
        <span className="sb-part-name">{query ? highlightMatch(shortTitle, query) : shortTitle}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {bookmarked && <span className="sb-pin" aria-label="Pinned"><IconStar /></span>}
        {active && <span className="sb-active-badge">NOW</span>}
      </div>
      {children}
    </li>
  );
}
